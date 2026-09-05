export const meta = {
  name: 'weekly-risk-sweep',
  description: 'Six-way parallel teammate read, adversarial verify on high-risk candidates, Matija synthesis, anti-pattern gate',
  whenToUse: 'Weekly risk sweep / "what\'s slipping this week" / weekly risk brief. Drives skills/weekly-risk-sweep/SKILL.md.',
  phases: [
    { title: 'Fan-out', detail: 'six independent teammate reads in parallel' },
    { title: 'Verify', detail: 'one skeptic per high-risk candidate — refute or confirm' },
    { title: 'Synthesize', detail: 'Matija writes the one-screen brief' },
    { title: 'Gate', detail: 'Matija anti-pattern check before delivery' },
  ],
}

// ---------------------------------------------------------------------------
// args: { runDate: 'YYYY-MM-DD', projectDir: string, accountFilter?: string }
// runDate and projectDir MUST both be passed in — this script ships with no
// default machine path. Date.now()/new Date() are also unavailable in
// scripts (would break resume), so runDate is always supplied by the caller.
// ---------------------------------------------------------------------------
if (!args || !args.runDate || !args.projectDir) {
  return {
    error:
      'Missing required arg(s). This workflow ships with no default project path — pass ' +
      "{ runDate, projectDir } explicitly, e.g. { runDate: '2026-09-02', projectDir: '/path/to/your/project' }.",
  }
}
const RUN_DATE = args.runDate
const FILTER = args.accountFilter || null
const DIR = args.projectDir
// The skill file is copied by setup.sh (or auto-discovered when the plugin is installed via
// `claude plugin marketplace add`) to `.claude/skills/weekly-risk-sweep/SKILL.md` under the
// project root — never to `team/skills/`, which setup.sh never creates for this skill. DIR is
// the caller's projectDir, so this resolves the same way regardless of install path.
const SKILL = `${DIR}/.claude/skills/weekly-risk-sweep/SKILL.md`
const SCOPE = FILTER
  ? `\n\nSCOPE FILTER: restrict this read to the account "${FILTER}" only.`
  : ''

const SIGNALS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['teammate', 'signals', 'surfaceReachable'],
  properties: {
    teammate: { type: 'string' },
    surfaceReachable: {
      type: 'boolean',
      description: 'false if the source artifact or surface could not be read at all',
    },
    surfaceNote: {
      type: 'string',
      description: 'If unreachable or partial, say exactly what could not be read. A missing surface is itself a finding.',
    },
    signals: {
      type: 'array',
      description: 'Empty array is valid and expected when the book is quiet. Do not pad.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['ref', 'detail', 'severityHint'],
        properties: {
          ref: { type: 'string', description: 'Opp Id, commitment Id, thread ref, or one-line item ref' },
          detail: { type: 'string', description: 'One line: what changed, delta, dates, who it touches' },
          severityHint: { type: 'string', enum: ['high-risk', 'watch', 'noise'] },
          affectedOpps: { type: 'array', items: { type: 'string' } },
          evidence: { type: 'string', description: 'The concrete quote, field delta, or timestamp this rests on' },
          isRetraction: {
            type: 'boolean',
            description: 'true only for Sloan: a prior-week [high-confidence] play now contradicted',
          },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['refuted', 'reasoning', 'suggestedLabel'],
  properties: {
    refuted: {
      type: 'boolean',
      description: 'true if the high-risk claim does not hold on inspection',
    },
    reasoning: { type: 'string' },
    suggestedLabel: { type: 'string', enum: ['high-risk', 'watch', 'noise'] },
    missingEvidence: { type: 'string' },
  },
}

const GATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['passes', 'failures'],
  properties: {
    passes: { type: 'boolean' },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['check', 'detail'],
        properties: {
          check: { type: 'string' },
          detail: { type: 'string' },
        },
      },
    },
  },
}

const PERSONA = (name) =>
  `Read ${DIR}/team/${name}.md first and work in that persona's voice and discipline.`

const FANOUT = [
  {
    key: 'tobias',
    label: 'read:tobias-commitments',
    prompt: `${PERSONA('tobias')}
You own the commitment ledger. Report slipped commitments owed by the user over the past 7 days.

Extraction rule: slipped commitments owed by the user; open lines aging past 14 days; any commitment with exec exposure.
For each: commitment Id or one-line ref, who it is owed to, days slipped, exec exposure Y/N, severity hint.

Read-only. Do not write files. Empty result is valid — do not invent commitments.${SCOPE}`,
  },
  {
    key: 'dorian',
    label: 'read:dorian-opp-changes',
    prompt: `${PERSONA('dorian')}
Query the my-org opportunity change surface with READ-ONLY SELECT SOQL via \`sf data query --target-org my-org --json\`. No DML, ever.

Report, for the last 7 days: (a) stage regressions, (b) close-date slips greater than 14 days,
(c) amount drops greater than 20%, (d) opps stalled greater than 21 days in stage.
For each: opp Id, change type, delta + date, stage, severity hint.

If a query fails or returns no rows, say so — do not substitute remembered pipeline figures.${SCOPE}`,
  },
  {
    key: 'defoe',
    label: 'read:defoe-recurring-items',
    prompt: `${PERSONA('defoe')}
NOTE — the morning-brief surface this slot used to read was RETIRED 2026-07-24. Do not look for
morning briefs; they do not exist. Read these instead:
  - ${DIR}/team/intelligence/ (account intelligence briefs)
  - ${DIR}/team/transition/ (account overview briefs)
  - ${DIR}/accounts/*/signals.md and memory-log entries
  - the most recent *-account-summary.md weekly changelog entries

Extraction rule: items flagged as "about to go wrong" in MORE THAN ONE artifact or on more than one
date within the past ~7-14 days, that are still unresolved. Filter out single-mention items.
For each: item, which artifacts/dates it appeared in, still open Y/N, severity hint.

If none of those directories exist or are empty, set surfaceReachable false and say which paths were missing.${SCOPE}`,
  },
  {
    key: 'pemberton',
    label: 'read:pemberton-account-events',
    prompt: `${PERSONA('pemberton')}
Report external account events that touch OPEN opportunities only: exec departures, competitor wins,
regulatory triggers. Read the account-research digests under ${DIR}/accounts/ and search Slack and the
public web for the past 7 days.

Carry your standard epistemic label on every item — [publicly known / inferred / rumored / internal].
That label must survive into the output so the synthesizer can inherit it.
For each: event, citation with inherited label, affected opp(s), severity hint.

Do not report events with no open-opp connection.${SCOPE}`,
  },
  {
    key: 'marlow',
    label: 'read:marlow-silent-threads',
    prompt: `${PERSONA('marlow')}
Report customer threads gone quiet more than 7 days where a commit is open from our side.
Search Gmail for account threads and check last-reply direction and date.

For each: thread ref, days quiet, open commit one-liner, severity hint.

If Gmail is unreachable this run, set surfaceReachable false and say so — a missing surface is a
finding, not something to paper over with Slack data.${SCOPE}`,
  },
  {
    key: 'sloan',
    label: 'read:sloan-retractions',
    prompt: `${PERSONA('sloan')}
RETRACTION-ONLY input. Read your prior-week strategist POV artifacts (look under ${DIR}/team/ and
${DIR}/accounts/ for last week's POV lines and account-summary changelog entries).

Report ONLY last week's [high-confidence] plays that THIS week's facts now contradict.
Set isRetraction true on every item you return.
For each: the prior-week POV line, the contradicting fact + source, proposed downgrade label.

Do not generate new risk lines. If nothing is contradicted, return an empty signals array.${SCOPE}`,
  },
]

// --- Phase 1: the load-bearing parallel fan-out -----------------------------
// Barrier is CORRECT here: Matija's synthesis is inherently cross-item, and the
// verify stage needs the deduped high-risk set from all six reads at once.
phase('Fan-out')
log(`Risk sweep for week of ${RUN_DATE}${FILTER ? ` — scoped to ${FILTER}` : ''}`)

const reads = (
  await parallel(
    FANOUT.map((f) => () =>
      agent(f.prompt, { label: f.label, phase: 'Fan-out', schema: SIGNALS_SCHEMA })
    )
  )
).map((r, i) => r || { teammate: FANOUT[i].key, signals: [], surfaceReachable: false, surfaceNote: 'agent failed to return' })

const bySource = {}
FANOUT.forEach((f, i) => { bySource[f.key] = reads[i] })

const unreachable = FANOUT
  .filter((f) => !bySource[f.key].surfaceReachable)
  .map((f) => `${f.key}: ${bySource[f.key].surfaceNote || 'surface unreachable'}`)
if (unreachable.length) log(`Surfaces unreachable — reported as findings: ${unreachable.length}`)

const allSignals = FANOUT.flatMap((f) =>
  (bySource[f.key].signals || []).map((s) => ({ ...s, source: f.key }))
)

// Anti-pattern #4: suppress entirely if all six inputs return empty.
if (allSignals.length === 0) {
  log('All six inputs empty — brief suppressed per Matija anti-pattern #4')
  return {
    runDate: RUN_DATE,
    suppressed: true,
    reason: 'All six fan-out inputs returned empty. Per the skill, the brief is suppressed rather than padded.',
    unreachableSurfaces: unreachable,
  }
}

// --- Phase 2: adversarial verify on high-risk candidates --------------------
// Only [high-risk] lines get attacked — watch/noise lines are cheap to be wrong
// about. The cap exists so a pathological week can't run away, but it is sized
// to cover every high-risk line in a normal week rather than a sample of them:
// the 2026-07-25 shakedown produced 15 candidates and refuted 4 of the first 5,
// so a small cap left the *least*-scrutinized lines leading the brief.
const VERIFY_CAP = (args && args.verifyCap) || 16
const candidates = allSignals.filter((s) => s.severityHint === 'high-risk' && !s.isRetraction)

// Verify in severity-then-evidence order so that if the cap does bite, it bites
// the weakest-evidenced lines rather than whichever teammate returned last.
const ordered = [...candidates].sort((a, b) => (b.evidence || '').length - (a.evidence || '').length)
const toVerify = ordered.slice(0, VERIFY_CAP)
const skipped = candidates.length - toVerify.length
log(`Verify: ${toVerify.length} of ${candidates.length} high-risk candidate(s) under adversarial review`)
if (skipped > 0) {
  log(`NOT VERIFIED: ${skipped} candidate(s) beyond the cap of ${VERIFY_CAP} — they ship explicitly marked unverified`)
}

phase('Verify')
const verdicts = await parallel(
  toVerify.map((s) => () =>
    agent(
      `You are a skeptical risk reviewer. Try to REFUTE this high-risk claim.

CLAIM (from ${s.source}): ${s.ref} — ${s.detail}
EVIDENCE OFFERED: ${s.evidence || '(none supplied)'}
AFFECTED OPPS: ${(s.affectedOpps || []).join(', ') || '(none named)'}

Check the underlying surface yourself — read-only. For opportunity claims use SELECT-only SOQL against
my-org. Ask: is the delta real and current, or stale/misread? Is the stated consequence actually
downstream of it? Would a competent AE call this high-risk, or is it routine motion?

Default to refuted=true when you cannot substantiate it. An unsubstantiated high-risk line is worse
than a missing one — it trains the reader to discount the label.`,
      { label: `verify:${s.ref}`.slice(0, 60), phase: 'Verify', schema: VERDICT_SCHEMA }
    )
  )
)

const verified = toVerify.map((s, i) => {
  const v = verdicts[i]
  return {
    ...s,
    verified: !!v,
    refuted: v ? v.refuted : false,
    finalLabel: v ? v.suggestedLabel : s.severityHint,
    verifyNote: v ? v.reasoning : 'verifier did not return — line ships unverified',
  }
})

const survived = verified.filter((s) => !s.refuted)
const demoted = verified.filter((s) => s.refuted)
log(`Verify: ${survived.length} high-risk survived, ${demoted.length} refuted and demoted`)

// --- Phase 3: Matija synthesis ---------------------------------------------
phase('Synthesize')

const bundle = JSON.stringify(
  {
    runDate: RUN_DATE,
    scope: FILTER || 'full portfolio',
    highRiskSurvived: survived,
    highRiskRefutedByVerifier: demoted,
    highRiskUnverifiedOverCap: ordered.slice(VERIFY_CAP),
    watchAndNoise: allSignals.filter((s) => s.severityHint !== 'high-risk' && !s.isRetraction),
    retractions: allSignals.filter((s) => s.isRetraction),
    unreachableSurfaces: unreachable,
  },
  null,
  2
)

const brief = await agent(
  `${PERSONA('matija')}
You are synthesizing the weekly risk brief. The procedure is ${SKILL};
your persona file is the source of truth for format and anti-patterns. If they conflict, the persona wins.

Write the brief to ${DIR}/team/risk/risk-brief-${RUN_DATE}.md (create the directory if needed).
DRAFT ONLY — do not post to Slack, do not send email, do not touch the calendar.

Six fan-out reads, already adversarially verified where high-risk:

${bundle}

Binding rules:
- Every line carries [high-risk] / [watch] / [noise] AND a labeled citation ([per Tobias — ...] etc.).
- Lines in highRiskRefutedByVerifier were attacked by an independent skeptic and did not hold. Demote them
  to the NOISE LOG with "why filtered: refuted on verification — <the verifier's reasoning>".
- Lines in highRiskUnverifiedOverCap ship with "(unverified — over verify cap)" appended. Do not hide this.
- **Fill the TOP 3 from highRiskSurvived first.** A line that survived an independent refutation attempt
  outranks one that was never examined. Only reach into highRiskUnverifiedOverCap for a top slot when
  highRiskSurvived cannot fill it, and mark any such line "(unverified)" in place.
- Pemberton's [publicly known / inferred / rumored / internal] labels inherit into their lines verbatim.
- RETRACTIONS opens the brief. Ship the header even if empty ("nothing to retract this week").
- ASKS BACK TO USER ships even if empty ("no decisions waiting on you").
- Every [high-risk] line names an owner and one concrete unblock. Route, do not solve.
- unreachableSurfaces are stated in the brief as gaps. Do not infer signal from absence.
- No alarmist verbs. No rolled-up severity score. One screen. No padding.

Return the full brief text as your final output.`,
  { label: 'matija:synthesize', phase: 'Synthesize' }
)

// --- Phase 4: anti-pattern gate --------------------------------------------
phase('Gate')
const gate = await agent(
  `Run the Matija anti-pattern check from ${SKILL} Step 3 against this brief.
This is a gate, not a suggestion. Read-only — do not rewrite the brief.

Fail it if ANY of these are true:
- Alarmist verbs present (critical, blowing up, on fire, disaster, burning, bleeding)
- Any line missing a citation
- RETRACTIONS section absent
- ASKS BACK TO USER section absent
- Padding present when the book is quiet
- A rolled-up severity score present
- Any [high-risk] line missing a named owner
- A refuted line still labeled [high-risk], or an over-cap line missing its "(unverified)" marker

BRIEF:
${brief}`,
  { label: 'gate:anti-pattern', phase: 'Gate', schema: GATE_SCHEMA }
)

return {
  runDate: RUN_DATE,
  scope: FILTER || 'full portfolio',
  briefPath: `${DIR}/team/risk/risk-brief-${RUN_DATE}.md`,
  brief,
  counts: {
    signalsTotal: allSignals.length,
    highRiskSurvived: survived.length,
    highRiskRefuted: demoted.length,
    highRiskUnverifiedOverCap: skipped,
    retractions: allSignals.filter((s) => s.isRetraction).length,
  },
  unreachableSurfaces: unreachable,
  gate: gate || { passes: false, failures: [{ check: 'gate-agent', detail: 'gate agent did not return' }] },
  deliveryNote: 'Draft only. Not posted or sent. User reviews and shares manually.',
}
