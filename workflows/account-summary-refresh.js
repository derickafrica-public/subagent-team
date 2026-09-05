export const meta = {
  name: 'account-summary-refresh',
  description: 'Five-surface parallel research, gated expert POV fan-out, HTML + MD build, Boris/Maggie gates, memory sync',
  whenToUse: 'Weekly or ad-hoc account-summary refresh (Update Mode) or first build. Drives skills/account-summary/SKILL.md. Used by the com.rolando.account-summary-weekly launchd job.',
  phases: [
    { title: 'Baseline', detail: 'read prior artifacts to find the delta boundary' },
    { title: 'Research', detail: 'five source surfaces read in parallel' },
    { title: 'Expert POVs', detail: 'cloud experts, gated on real use case' },
    { title: 'Build', detail: 'condense to a brief, then HTML + MD + memory written concurrently' },
    { title: 'Gates', detail: 'Boris, Maggie, and HTML/MD consistency in parallel' },
  ],
}

// ---------------------------------------------------------------------------
// args: { account, slug, runDate, mode?: 'update'|'build', projectDir }
// runDate, account, slug, and projectDir MUST all be passed in — this script
// ships with no default account and no default machine path. Date.now()/new
// Date() are also unavailable in scripts (would break resume), so runDate is
// always supplied by the caller.
// ---------------------------------------------------------------------------
if (!args || !args.account || !args.slug || !args.runDate || !args.projectDir) {
  return {
    error:
      'Missing required arg(s). This workflow ships with no default account and no default ' +
      'project path — pass { account, slug, runDate, projectDir } explicitly. Example: ' +
      "{ account: 'Acme Corp', slug: 'acme-corp', runDate: '2026-09-02', projectDir: '/path/to/your/project' }",
  }
}
const ACCOUNT = args.account
const SLUG = args.slug
const RUN_DATE = args.runDate
const DIR = args.projectDir
// The skill file is copied by setup.sh (or auto-discovered when the plugin is installed via
// `claude plugin marketplace add`) to `.claude/skills/account-summary/SKILL.md` under the project
// root — never to `team/skills/`, which setup.sh never creates for this skill. DIR is the caller's
// projectDir, so this resolves the same way regardless of install path.
const SKILL = `${DIR}/.claude/skills/account-summary/SKILL.md`
const HTML = `${DIR}/accounts/${SLUG}/${SLUG}-account-summary.html`
const MD = `${DIR}/accounts/${SLUG}/${SLUG}-account-summary.md`

const BASELINE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['mode', 'lastGeneratedDate', 'gmailSinceDate'],
  properties: {
    mode: { type: 'string', enum: ['update', 'build'] },
    lastGeneratedDate: {
      type: 'string',
      description: 'ISO date from the prior artifact footer, or the FY start date on a first build',
    },
    gmailSinceDate: { type: 'string', description: 'Same boundary in Gmail YYYY/MM/DD form' },
    lastPipelineTotals: { type: 'string' },
    existingRedFlags: { type: 'array', items: { type: 'string' } },
    accountTeam: { type: 'array', items: { type: 'string' } },
    priorExpertPOVs: {
      type: 'array',
      items: { type: 'string' },
      description: 'Which expert lenses appeared in the prior MD, so unchanged ones can be left as-is',
    },
  },
}

const SURFACE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['surface', 'reachable', 'findings'],
  properties: {
    surface: { type: 'string' },
    reachable: { type: 'boolean', description: 'false if the surface could not be read — this is itself a finding' },
    reachabilityNote: { type: 'string' },
    findings: { type: 'string', description: 'Dense prose or bullets. Named people, dates, figures, verbatim quotes.' },
    customerQuotes: {
      type: 'array',
      description: 'Gmail and transcript surfaces only. Verbatim, attributed to a named person and date.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['quote', 'speaker', 'date'],
        properties: {
          quote: { type: 'string' },
          speaker: { type: 'string' },
          date: { type: 'string' },
          contradictsCRM: { type: 'boolean' },
        },
      },
    },
    liveOpportunities: {
      type: 'array',
      description: 'SOQL surface only — drives the expert-POV use-case gate.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'stage', 'amount', 'clouds'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          stage: { type: 'string' },
          amount: { type: 'string' },
          closeDate: { type: 'string' },
          clouds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Which Salesforce clouds this opp actually touches',
          },
        },
      },
    },
  },
}

const GATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'findings'],
  properties: {
    verdict: { type: 'string', enum: ['SHIP', 'REWORK', 'KILL'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['issue', 'fix'],
        properties: {
          issue: { type: 'string' },
          fix: { type: 'string' },
          blocking: { type: 'boolean' },
        },
      },
    },
    nextIteration: { type: 'string', description: 'Maggie only — one concrete next-iteration suggestion' },
  },
}

// Lens -> persona file, straight from the skill's fan-out table.
//
// `aliases` are the product terms that count as a real footprint. They are matched
// against BOTH the SOQL cloud tags and the research prose. `tagAliases` are matched
// ONLY against SOQL cloud tags — used where a bare word is too common in prose to
// mean anything (the word "Slack" appears in Slack findings by construction, so it
// cannot be evidence of a Slack *opportunity*).
//
// Do NOT go back to deriving a match key by splitting the lens label. That derived
// 'industries' / 'mulesoft' / 'data quality' and silently never fired for an opp
// tagged Manufacturing, Integration, or AI.
const LENSES = [
  { lens: 'Sales Cloud', file: 'hollis', aliases: ['sales cloud', 'sfa', 'sales elevate', 'forecasting'] },
  { lens: 'Service Cloud', file: 'marisol', aliases: ['service cloud', 'field service', 'case management', 'contact center'] },
  { lens: 'Data Cloud / data architecture', file: 'richard', aliases: ['data cloud', 'zero copy', 'zero-copy', 'lakehouse', 'data architecture', 'cdp'] },
  { lens: 'Data quality / AI fitness', file: 'bessie', aliases: ['data quality', 'ai fitness', 'data readiness', 'data hygiene', 'golden record', 'ai-ready'] },
  { lens: 'Agentforce / AXL', file: 'mick', aliases: ['agentforce', 'axl', 'agentic', 'einstein copilot', 'prompt builder'] },
  { lens: 'Tableau & Analytics', file: 'vic', aliases: ['tableau', 'crm analytics', 'einstein analytics', 'analytics'] },
  { lens: 'Revenue Cloud / CPQ', file: 'tomasz', aliases: ['revenue cloud', 'cpq', 'billing', 'quote-to-cash', 'quote to cash'] },
  { lens: 'Slack', file: 'jules', aliases: ['slack connect', 'slack ai', 'enterprise grid', 'slack canvas', 'sales elevate'], tagAliases: ['slack'] },
  { lens: 'Marketing Cloud', file: 'linnea', aliases: ['marketing cloud', 'pardot', 'mcae', 'journey builder'] },
  { lens: 'MuleSoft / integration', file: 'aldous', aliases: ['mulesoft', 'anypoint', 'api-led', 'api led', 'integration platform', 'middleware'] },
  { lens: 'Industries (Mfg/Auto/Energy)', file: 'pradeep', aliases: ['manufacturing cloud', 'automotive cloud', 'energy & utilities', 'industries cloud', 'rebate management'] },
  { lens: 'Financial Services Cloud', file: 'gretta', aliases: ['financial services cloud', 'fsc', 'wealth management', 'insurance cloud'] },
  { lens: 'Flex Credits / consumption economics', file: 'ciandro', aliases: ['flex credit', 'consumption', 'burn-down', 'burndown', 'usage-based'] },
  { lens: 'Composable CDP', file: 'hugo', aliases: ['composable cdp', 'reverse etl', 'warehouse-native', 'snowflake share', 'databricks share'] },
]

// --- Phase 1: baseline ------------------------------------------------------
// Sequential on purpose: every research surface needs the delta boundary date.
phase('Baseline')
log(`${ACCOUNT} (${SLUG}) — refresh for ${RUN_DATE}`)

const baseline = await agent(
  `Establish the delta boundary for an account-summary refresh of ${ACCOUNT}.

Check whether ${HTML} exists.
- If it exists: this is UPDATE MODE. Read it and extract the generated date from the last slide footer,
  the pipeline stat-row figures, the existing red flags, and the account team names. Also read ${MD} and
  list which expert lenses appear in its "## Expert POVs" section.
- If it does not exist: this is a first BUILD. Set lastGeneratedDate to the current fiscal year start date.

Return gmailSinceDate as the same boundary in YYYY/MM/DD form (Gmail's required format).
Read-only.`,
  { label: 'baseline', phase: 'Baseline', schema: BASELINE_SCHEMA }
)

if (!baseline) {
  return { error: 'Baseline agent failed — cannot establish a delta boundary. No files written.' }
}
const SINCE = baseline.lastGeneratedDate
const MODE = (args && args.mode) || baseline.mode
log(`Mode: ${MODE.toUpperCase()} — delta boundary ${SINCE}`)

// --- Phase 2: five surfaces in parallel -------------------------------------
// Barrier is CORRECT: the shared context brief is cross-surface by construction,
// and the expert-POV gate needs the SOQL opp list before any expert can fire.
phase('Research')

const SURFACES = [
  {
    key: 'soql',
    label: 'research:soql',
    prompt: `Pull the my-org Salesforce picture for ${ACCOUNT}. READ-ONLY: SELECT-only SOQL via
\`sf data query --target-org my-org --json\`. No DML under any circumstance.

Follow section C of ${SKILL} for the exact Account and Opportunity queries. Then summarize:
stage breakdown (count + total ACV per stage), forecast category totals, top 10 opps by amount with
stage/close date/owner, total closed-won vs open pipeline, and any forecast inconsistency (e.g. Commit
category at under 30% probability).

Populate liveOpportunities for every open opp, and for each one tag which Salesforce clouds it actually
touches — read the opp name, Description, and NextStep to decide. This tagging gates a downstream expert
fan-out, so be accurate: do not tag a cloud that has no real presence in the opp.`,
  },
  {
    key: 'slack',
    label: 'research:slack',
    prompt: `Search Slack for ${ACCOUNT} activity since ${SINCE} using
mcp__plugin_slack_slack__slack_search_public_and_private. Follow section A of ${SKILL}.

Queries: "${ACCOUNT} Agentforce Data Cloud", "${ACCOUNT} opportunity pipeline", plus industry keywords.
Use \`after:${SINCE}\` to scope to the delta.

Extract with names, dates, and quotes: key stakeholders, friction points, active engagements, internal
sentiment, CSG/AE activity, named exec relationships, escalations, wins, blockers, deal status changes.
Read-only — do not post.`,
  },
  {
    key: 'web',
    label: 'research:web',
    prompt: `Research ${ACCOUNT} on the public web for news published after ${SINCE}. Follow section B of ${SKILL}.

All web browsing goes through the gstack /browse skill — do NOT use mcp__claude-in-chrome__* tools.

Focus: earnings, executive changes, M&A, restructuring, regulatory issues, product launches, public
statements about Salesforce or AI/data platforms, and industry tailwinds/headwinds that materially affect
THIS company. Specific and sourced — no generic industry boilerplate. Include enough for the
account-specific Industry Trends slide and for wallet/commerce trends tied to their actual revenue streams.`,
  },
  {
    key: 'gmail',
    label: 'research:gmail',
    prompt: `Pull ${ACCOUNT} email activity since ${baseline.gmailSinceDate}. Follow section D of ${SKILL}.

search_gmail_messages with \`(${ACCOUNT} OR <their domain> OR brand keywords) after:${baseline.gmailSinceDate}\`,
then get_gmail_threads_content_batch on distinct thread IDs (batch of 25 max).

Threads are quote-heavy: strip signature blocks, urldefense links, calendar boilerplate, and quoted reply
chains before reading. If the batch spills to a file, slice it with grep/python rather than reading it whole.

Extract, attributed to a named person and date: verbatim customer-voice quotes (the highest-value signal
in this whole skill), escalation and urgency language, new named contacts and titles from signature blocks,
written commitments and whether they held, resolution confirmations, and responsiveness asymmetry.

Separate human threads from machine traffic — report digests, invite notifications, and auto-generated
Gemini notes are NOT account activity. Mine them for numbers, exclude them from the who-said-what read.
Flag any figure that disagrees with the SOQL pull rather than silently picking one.

Populate customerQuotes, marking contradictsCRM true where the customer's words outrun the CRM record.
If Gmail is unreachable, set reachable false and say so — a missing surface is a finding.`,
  },
  {
    key: 'calendar',
    label: 'research:calendar-transcripts',
    prompt: `Pull ${ACCOUNT} calendar and meeting transcripts. Follow section E of ${SKILL}.

Forward calendar: get_events with detailed:true over the next ~3 weeks, filtered to the account. Extract
scheduled meetings, attendee lists (who from the customer actually shows up), recurring cadences, and any
dated decision gate. This turns 30/60/90 from guesswork into a real schedule.

Transcripts: meeting_notes_search with the account name and date_from ${SINCE}. Read Drive docs with
get_doc_as_markdown (include_comments false). Prefer the Decisions / Next steps / Details sections over
the raw transcript body.

Extract: decisions actually made and who aligned, open action items with named owners, constraints the
customer stated (regulatory, security, compliance, org-structure), technical blockers and agreed
workarounds, and who attended vs. who was invited.

Gemini notes are auto-generated and fallible — they misspell names and garble claims. Verify any name,
number, or decision you plan to quote against the transcript body or a second source. Attribute with a
timestamp where available. Populate customerQuotes for stated constraints and decisions.
If unreachable, set reachable false.`,
  },
]

const surfaces = (
  await parallel(
    SURFACES.map((s) => () =>
      agent(s.prompt, { label: s.label, phase: 'Research', schema: SURFACE_SCHEMA })
    )
  )
).map((r, i) => r || { surface: SURFACES[i].key, reachable: false, reachabilityNote: 'agent failed to return', findings: '' })

const S = {}
SURFACES.forEach((s, i) => { S[s.key] = surfaces[i] })

const missingSurfaces = SURFACES
  .filter((s) => !S[s.key].reachable)
  .map((s) => `${s.key}: ${S[s.key].reachabilityNote || 'unreachable'}`)
if (missingSurfaces.length) {
  log(`Surfaces unreachable (stated in artifact, not omitted): ${missingSurfaces.join(' | ')}`)
}

// The shared context brief — built ONCE, passed verbatim to every expert.
// This is the cost discipline the skill's Boris gate requires.
const SHARED_CONTEXT = `=== SHARED ACCOUNT CONTEXT — ${ACCOUNT} (${SLUG}), as of ${RUN_DATE} ===

--- Salesforce pipeline (my-org SOQL) ---
${S.soql.findings}

OPEN OPPORTUNITIES:
${(S.soql.liveOpportunities || [])
  .map((o) => `- ${o.id} · ${o.name} · ${o.stage} · ${o.amount} · close ${o.closeDate || 'n/a'} · clouds: ${o.clouds.join(', ')}`)
  .join('\n') || '(none returned)'}

--- Slack / internal delivery surface ---
${S.slack.findings}

--- Public web / market context ---
${S.web.findings}

--- Email activity ---
${S.gmail.findings}

--- Meetings held + forward calendar ---
${S.calendar.findings}

--- Customer's own words (verbatim, attributed) ---
${[...(S.gmail.customerQuotes || []), ...(S.calendar.customerQuotes || [])]
  .map((q) => `- "${q.quote}" — ${q.speaker}, ${q.date}${q.contradictsCRM ? ' [CONTRADICTS CRM RECORD]' : ''}`)
  .join('\n') || '(none captured this run)'}

--- Surfaces unreachable this run ---
${missingSurfaces.join('\n') || '(all five surfaces read successfully)'}
=== END SHARED CONTEXT ===`

// --- Phase 3: expert POVs, hard-gated on real use case ----------------------
// Only fire an expert whose cloud has real footprint or live pipeline. The
// skill says 5-8 typical, not all 14 — enforced in code, not left to judgment.
phase('Expert POVs')

// SOQL cloud tags, normalized. Empty/whitespace tags are dropped: a blank tag used
// to substring-match every lens and fire all 14.
const cloudTags = (S.soql.liveOpportunities || [])
  .flatMap((o) => o.clouds || [])
  .map((c) => String(c).trim().toLowerCase())
  .filter((c) => c.length > 2)

// Match against RESEARCH FINDINGS ONLY — never against SHARED_CONTEXT, whose section
// headers ("Slack / internal delivery surface") would self-match and fire a lens on
// an account with zero Slack footprint.
const prose = [S.soql.findings, S.slack.findings, S.web.findings, S.gmail.findings, S.calendar.findings]
  .filter(Boolean)
  .join(' ')
  .toLowerCase()

// Prose mentions are only evidence if they ASSERT a footprint. The 2026-07-27 run
// fired MuleSoft, FSC, and Composable CDP on sentences that said the opposite —
// "no Financial Services Cloud", "composable CDP have no monetized presence",
// "route it elsewhere rather than mulesoft proper". Substring matching cannot tell
// an assertion from a denial, so check the ~90 chars of lead-in for a negator.
const NEGATORS = [
  'no ', 'not ', 'zero ', 'none', 'without', 'absent', 'lack', 'never',
  "n't", 'rather than', 'instead of', 'no monetized', 'do not fire', "don't pitch",
  'nothing in', 'nothing on', 'excluded', 'ruled out', 'is no ', 'are no ',
]
// Clip the lead-in at the nearest sentence/clause boundary. A flat 90-char window
// reached back across sentences, so "No MuleSoft yet. They signed Anypoint" read as
// negated — a negation in the PREVIOUS sentence says nothing about this mention.
const isNegatedAt = (text, idx) => {
  let lead = text.slice(Math.max(0, idx - 90), idx)
  const boundary = Math.max(
    lead.lastIndexOf('. '), lead.lastIndexOf('; '), lead.lastIndexOf('\n'),
    lead.lastIndexOf(' — '), lead.lastIndexOf('* '), lead.lastIndexOf('· ')
  )
  if (boundary !== -1) lead = lead.slice(boundary + 1)
  return NEGATORS.some((n) => lead.includes(n))
}
// An alias counts only if it appears at least once UN-negated.
const assertedInProse = (alias) => {
  let i = prose.indexOf(alias)
  while (i !== -1) {
    if (!isNegatedAt(prose, i)) return true
    i = prose.indexOf(alias, i + alias.length)
  }
  return false
}

// One-directional containment only. cloudTag.includes(alias) is the real test;
// alias.includes(cloudTag) let a tag of "Cloud" fire six unrelated lenses.
// Cloud tags come from structured SOQL fields, so they are assertions by nature and
// skip the negation check — but a tag that is itself a disclaimer is not a footprint.
const NON_TAGS = ['unclassified', 'non-product', 'test/demo', 'do not action']
const evidenceFor = (l) => {
  const usableTags = cloudTags.filter((t) => !NON_TAGS.some((n) => t.includes(n)))
  const tagHit = (l.aliases.concat(l.tagAliases || [])).find((a) =>
    usableTags.some((t) => t.includes(a))
  )
  if (tagHit) return `open opp tagged "${tagHit}"`
  const proseHit = l.aliases.find((a) => assertedInProse(a))
  if (proseHit) return `"${proseHit}" asserted in research findings`
  return null
}

const scored = LENSES.map((l) => ({ ...l, evidence: evidenceFor(l) }))
const firing = scored.filter((l) => l.evidence)
const omitted = scored.filter((l) => !l.evidence)

log(`Expert fan-out: ${firing.length}/${LENSES.length} firing — ${firing.map((f) => `${f.file} (${f.evidence})`).join('; ') || 'none'}`)
if (firing.length === 0) {
  log('WARNING: no lens found a real use case. Check that the SOQL surface returned cloud tags — an empty pipeline read looks identical to an account with no footprint.')
}

const povs = (
  await parallel(
    firing.map((l) => () =>
      agent(
        `${SHARED_CONTEXT}

---
You are the ${l.lens} expert. Read ${DIR}/team/${l.file}.md and write in that persona's voice.

Return 150-280 words, no preamble, structured as:
1. A bold one-line headline.
2. What you see in this account through your lens.
3. Your read on the related opportunities — which is real, which is soft, and the sequencing.
4. One cross-cloud coordination flag: where your cloud depends on or feeds another.

Cite specific opportunity Ids and names from the context. If your lens genuinely has no use case here,
say exactly that in one line rather than manufacturing a take.`,
        { label: `pov:${l.file}`, phase: 'Expert POVs' }
      ).then((text) => (text ? { lens: l.lens, expert: l.file, text } : null))
    )
  )
).filter(Boolean)

// --- Phase 4: digest, then build each artifact separately -------------------
// The 2026-07-27 run died here with "Prompt is too long", three times. One agent
// was given ~30k tokens of raw research (70k chars of surface findings + 150
// inlined opps + 13 POVs) and then asked to READ 90KB of existing artifacts and
// WRITE 90KB back — about 75k tokens of context for a single agent. Raw research
// volume scales with the account, so this is a design ceiling, not a bad week.
//
// Fix: condense once into a compact digest, then give each writer only what it
// needs. The digest is genuine cross-surface synthesis, so it earns its barrier.
phase('Build')

const OPP_CAP = 30
const oppsAll = S.soql.liveOpportunities || []
const parseAmt = (a) => Number(String(a).replace(/[^0-9.]/g, '')) || 0
const oppsTop = [...oppsAll].sort((a, b) => parseAmt(b.amount) - parseAmt(a.amount)).slice(0, OPP_CAP)
log(`Digest: inlining top ${oppsTop.length} of ${oppsAll.length} open opps by amount (full list stays in SOQL findings)`)

const digest = await agent(
  `Condense this week's ${ACCOUNT} research into a COMPACT build brief. You are a compression step, not an
analyst — lose no figure, name, date, quote, or opportunity Id that a deck or a written summary would cite,
but drop all hedging, restatement, and process narration.

Hard ceiling: 12,000 characters. Structure it as:
- PIPELINE: totals, stage breakdown, forecast categories, delta vs the prior baseline below.
- TOP OPPORTUNITIES: Id · name · stage · amount · close date, for the material ones.
- WHAT MOVED since ${SINCE}: stage moves, new opps, killed opps, amount changes, close-date slips.
- INTERNAL SIGNAL: named people, quotes, escalations, blockers (from Slack).
- EXTERNAL SIGNAL: dated, sourced public-web items that affect this account.
- CUSTOMER VOICE: verbatim attributed quotes, flagging any that contradict the CRM.
- RED FLAGS: open and newly resolved.
- SURFACES UNREACHABLE: verbatim from the context.

${SHARED_CONTEXT}

=== PRIOR BASELINE (delta reference) ===
Last generated: ${SINCE}
Prior pipeline totals: ${baseline.lastPipelineTotals || 'n/a'}
Prior red flags: ${(baseline.existingRedFlags || []).join(' | ') || 'n/a'}

Return only the brief. No preamble.`,
  { label: 'build:digest', phase: 'Build' }
)

if (!digest) {
  return {
    error: 'Digest agent failed — no compact context to build from. Artifacts left untouched.',
    account: ACCOUNT, runDate: RUN_DATE, mode: MODE,
    unreachableSurfaces: missingSurfaces,
  }
}

const CORE = `=== ${ACCOUNT} (${SLUG}) BUILD BRIEF — as of ${RUN_DATE} ===
${digest}

=== TOP ${oppsTop.length} OPEN OPPORTUNITIES (of ${oppsAll.length} total) ===
${oppsTop.map((o) => `- ${o.id} · ${o.name} · ${o.stage} · ${o.amount} · close ${o.closeDate || 'n/a'} · clouds: ${(o.clouds || []).join(', ')}`).join('\n')}

=== SURFACES UNREACHABLE THIS RUN (must appear in the artifact, not be omitted) ===
${missingSurfaces.join('\n') || '(all five surfaces read successfully)'}

=== PRIOR BASELINE ===
Last generated: ${SINCE} · Prior totals: ${baseline.lastPipelineTotals || 'n/a'}
Prior red flags: ${(baseline.existingRedFlags || []).join(' | ') || 'n/a'}
Account team: ${(baseline.accountTeam || []).join(', ') || 'n/a'}`

const NO_RESEARCH = `All research is done. Do NOT run SOQL, Slack, web, Gmail, or calendar reads — you have
everything below. Do not read the OTHER artifact either; a separate agent owns it.`

// HTML and MD are written concurrently by separate agents so neither has to hold
// the other's 40-50KB in context. Both derive from the same CORE brief, so their
// figures agree by construction; a consistency check follows.
const [htmlResult, mdResult, memResult] = await parallel([
  () =>
    agent(
      `You are executing ${MODE === 'update' ? 'UPDATE MODE' : 'a first BUILD'} of the account-summary deck for
${ACCOUNT}. ${SKILL} is the source of truth for slide structure and design rules — follow it, do not re-derive it.
${NO_RESEARCH}

${CORE}

WRITE ${HTML} — the 8-slide deck. ${MODE === 'update'
        ? 'Update ONLY slides whose data actually changed (the skill\'s Step 3 table). Always update the generated date. Set the last-slide footer to "Salesforce Confidential · Generated <original date> · Updated ' + RUN_DATE + '".'
        : 'Full 8-slide build.'}
Dark theme and palette per the skill. Never hardcode font-family, font-size overrides, or off-palette colors.
Navigation required: prev/next, clickable dots, slide counter with aria-live, keyboard arrows, visible focus
states (WCAG 2.2 AA). Footer page numbers must match the real slide count.

Edit the file in place with targeted edits — do not rewrite it wholesale, and do not read it more than once.

Return a short plain-text summary: which slides changed and why, and the confirmed file path.`,
      { label: 'build:html', phase: 'Build' }
    ),
  () =>
    agent(
      `You are executing ${MODE === 'update' ? 'UPDATE MODE' : 'a first BUILD'} of the account-summary MARKDOWN
companion for ${ACCOUNT}. ${SKILL} is the source of truth for MD structure — follow it, do not re-derive it.
${NO_RESEARCH}

${CORE}

=== EXPERT POVs — paste into "## Expert POVs" VERBATIM, preserving each voice ===
${povs.map((p) => `### ${p.lens} — ${p.expert}\n${p.text}`).join('\n\n')}

EXPERTS OMITTED (record in the "omitted, with reason" note):
${omitted.map((o) => `- ${o.lens} (${o.file}) — gate found no match for any of: ${o.aliases.join(', ')}`).join('\n')}

WRITE ${MD} — the analyst + strategist companion. ${MODE === 'update'
        ? 'PREPEND a new dated changelog entry for ' + RUN_DATE + ' listing exactly what moved (pipeline delta, stage moves, new/killed opps, new/resolved flags). PRESERVE every prior entry verbatim — losing changelog history is a build failure. Update the body sections to reflect now.'
        : 'Changelog entry #1 is the baseline.'}
Required: frontmatter (type, account, slug, sfdc_account_id, companion_deck, cadence: weekly, generated,
last_updated, sources) · interrogability note · ## Weekly changelog · BLUF · Who they are · Pipeline ·
What moved this week · ## Email + meeting activity (threads with verbatim attributed customer quotes,
meetings held with decisions and owned action items, meetings scheduled) plus the "what the customer's own
words tell us" read where signal contradicts or outruns the CRM · SWOT · Where I'd place the bets ·
30/60/90 (real calendar dates) · ## Expert POVs (last content section, closing with a cross-cloud
through-line) · Sources (with Expert POVs, Email, and Meeting transcripts lines).

Any conflict between customer voice and the CRM record MUST be stated explicitly, not smoothed over.
Prefer targeted edits over a wholesale rewrite so prior changelog entries cannot be lost.

Return a short plain-text summary: what changed, new and resolved flags, and the confirmed file path.`,
      { label: 'build:md', phase: 'Build' }
    ),
  () =>
    agent(
      `Sync the account memory for ${ACCOUNT} under ${DIR}/accounts/${SLUG}/ so it does not drift from this
week's summary. ${NO_RESEARCH}

${CORE}

Update profile.md, opportunities.md, signals.md, and swot.md to reflect the current picture, and APPEND a
memory-log.md entry dated ${RUN_DATE} noting what moved. Append — never overwrite the log.

Return a one-paragraph confirmation of which files you touched.`,
      { label: 'build:memory-sync', phase: 'Build' }
    ),
])

const buildResult = [
  `HTML: ${htmlResult || 'FAILED — agent did not return'}`,
  `MD: ${mdResult || 'FAILED — agent did not return'}`,
  `MEMORY: ${memResult || 'FAILED — agent did not return'}`,
].join('\n\n')

// If either writer died the artifacts are in an unknown, mutually inconsistent state
// — which is exactly what the 2026-07-27 run left behind (HTML footer said "Updated
// 07-27" while the MD still said 07-25). Bail loudly rather than spend gate agents
// reviewing a half-written pair.
if (!htmlResult || !mdResult) {
  log('BUILD INCOMPLETE — one artifact did not get written. The pair is inconsistent; do not ship.')
  return {
    error: `Build incomplete — ${!htmlResult ? 'HTML' : ''}${!htmlResult && !mdResult ? ' and ' : ''}${!mdResult ? 'MD' : ''} writer did not return. The two artifacts may now disagree; inspect both before trusting either.`,
    account: ACCOUNT,
    runDate: RUN_DATE,
    mode: MODE,
    artifacts: { html: HTML, md: MD },
    htmlWritten: !!htmlResult,
    mdWritten: !!mdResult,
    runSummary: buildResult,
    expertsFired: firing.map((f) => f.file),
    unreachableSurfaces: missingSurfaces,
    gatesRun: false,
  }
}

// --- Phase 5: standing gates + consistency check, in parallel ---------------
// The consistency check is NOT optional bookkeeping. When one agent wrote both
// artifacts, agreement was incidental; now two agents write independently from a
// shared brief, so drift is a live failure mode and has to be tested for.
phase('Gates')

const PERSONA_NOTE = (name) => `Read ${DIR}/team/${name}.md and run as that reviewer.`

const [boris, maggie, consistency] = await parallel([
  () =>
    agent(
      `${PERSONA_NOTE('boris')}
Run the Boris Anthropic-best-practices gate on this account-summary refresh run.

Check: simplest design that works · the expert fan-out was justified and gated on real use case
(${firing.length} fired, ${omitted.length} omitted) · shared context built once, not re-derived per expert
· no unjustified wrapper · read-only discipline held on my-org (SELECT-only, no DML) · unreachable
surfaces reported as findings rather than omitted.

Artifacts: ${HTML} and ${MD}. Verdict: SHIP / REWORK / KILL.

RUN SUMMARY:
${buildResult}`,
      { label: 'gate:boris', phase: 'Gates', schema: GATE_SCHEMA }
    ),
  () =>
    agent(
      `${PERSONA_NOTE('maggie')}
Run the Maggie pedagogy + voice gate on this account-summary refresh.

Check: clear reader takeaway per slide and per MD section · Anthropic voice (empirical, warmth without
hype) · Salesforce CX Style Guide (Dec 2025) compliance — exact product names (Agentforce, Data Cloud,
Apex, AppExchange, Lightning Experience; no "the" before API names), Title Capitalization on slide titles
and headings, sentence capitalization in body/lists/cells, active voice, never "lets you"/"allows you
to"/"enables users to", they/their only, "preceding/next" not "above/below", "agent" only in Agentforce
context, "bot" not "chatbot", no "a lot" · accessibility WCAG 2.2 AA on the HTML (visible keyboard focus,
aria-live slide counter, contrast).

Read ${HTML} and ${MD} directly. Verdict: SHIP / REWORK / KILL, plus one concrete next-iteration suggestion.`,
      { label: 'gate:maggie', phase: 'Gates', schema: GATE_SCHEMA }
    ),
  () =>
    agent(
      `Cross-artifact consistency check. Two independent agents wrote these files from one shared brief,
so they can disagree. Read both and compare — read-only, do not fix anything.

  DECK: ${HTML}
  COMPANION: ${MD}

Fail on any of these:
- A pipeline figure (total ACV, open-opp count, stage or forecast-category totals) that differs between them.
- A new, killed, or moved opportunity named in one and absent or contradicted in the other.
- A red flag present in one and missing from the other.
- Date drift: the deck footer claims "Updated ${RUN_DATE}" while the MD frontmatter last_updated or its
  newest changelog entry is not ${RUN_DATE}, or vice versa. This is the exact failure the 07-27 run shipped.
- Either artifact omitting a surface listed as unreachable: ${missingSurfaces.join(' | ') || '(none)'}

Report each mismatch as a finding with the two conflicting values quoted verbatim. Verdict SHIP only if the
two artifacts tell the same story with the same numbers.`,
      { label: 'gate:html-md-consistency', phase: 'Gates', schema: GATE_SCHEMA }
    ),
])

const FAILED_GATE = (name) => ({
  verdict: 'REWORK',
  findings: [{ issue: `${name} gate did not return`, fix: 'Re-run the gate manually' }],
})
const verdicts = {
  boris: boris || FAILED_GATE('Boris'),
  maggie: maggie || FAILED_GATE('Maggie'),
  consistency: consistency || FAILED_GATE('HTML/MD consistency'),
}
const blocked = Object.values(verdicts).some((v) => ['REWORK', 'KILL'].includes(v.verdict))
if (blocked) {
  log(`GATE FLAG — Boris: ${verdicts.boris.verdict}, Maggie: ${verdicts.maggie.verdict}, Consistency: ${verdicts.consistency.verdict}. Surface before delivering.`)
}

return {
  account: ACCOUNT,
  slug: SLUG,
  runDate: RUN_DATE,
  mode: MODE,
  deltaBoundary: SINCE,
  artifacts: { html: HTML, md: MD, memory: `${DIR}/accounts/${SLUG}/` },
  runSummary: buildResult,
  expertsFired: firing.map((f) => f.file),
  expertsOmitted: omitted.map((o) => o.file),
  unreachableSurfaces: missingSurfaces,
  gates: verdicts,
  gateFlag: blocked,
}
