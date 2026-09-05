---
name: weekly-risk-sweep
description: Weekly pipeline-risk sweep. Triggers on "weekly risk sweep", "run the risk sweep", "what's slipping this week", or "weekly risk brief". Fans out six teammate reads in parallel — Tobias, Dorian, Defoe, Pemberton, Marlow, Sloan — then hands the consolidated signals to Matija for a one-screen brief with [high-risk] / [watch] / [noise] labels.
---

# Skill: Weekly Risk Sweep

**Trigger phrases:**
- "weekly risk sweep"
- "run the risk sweep"
- "what's slipping this week"
- "weekly risk brief"
- Scheduled cadence is **optional and configured per-user** (Sea Dong owns the launchd wiring; in the account owner's instance the target is Friday 16:00 local, after Pemberton and Sloan ship). The skill body itself is cadence-agnostic.

**Source of truth for the persona, output format, citation labels, and anti-patterns:** `team/matija.md`. This skill is the procedure that drives Matija. If the persona file and this skill conflict, the persona wins.

---

## Execution path — ultracode workflow (preferred)

The fan-out is scripted at **`.claude/workflows/weekly-risk-sweep.js`**. Run it rather than hand-dispatching six subagents:

```
Workflow({ name: 'weekly-risk-sweep', args: { runDate: '<YYYY-MM-DD>', accountFilter: '<optional account>' } })
```

`runDate` is **required** — workflow scripts cannot call `Date.now()` or `new Date()`, so the caller passes today's date in. Omit `accountFilter` to sweep the full portfolio.

If `name` fails to resolve (the registry loads at session start, so a script added mid-session isn't yet registered), use the path form — it always resolves:

```
Workflow({ scriptPath: '.claude/workflows/weekly-risk-sweep.js', args: { runDate: '<YYYY-MM-DD>' } })
```

**Why the script and not a manual fan-out:** the six reads become structured-schema returns instead of prose Rolando has to re-parse, the parallel dispatch is enforced by `parallel()` rather than by discipline (anti-pattern #1 becomes structurally impossible), and it adds a step a manual dispatch never had — **adversarial verification of high-risk candidates**. An unsubstantiated `[high-risk]` line is the failure mode that costs the label its meaning; each candidate now faces an independent skeptic prompted to refute it, and refuted lines are demoted to the NOISE LOG with the refutation reason attached.

**Verify cap:** 16 high-risk candidates (override with `args.verifyCap`), verified in descending evidence order so that if the cap bites, it bites the weakest-evidenced lines. Candidates beyond the cap ship marked `(unverified — over verify cap)` and the workflow logs the count. Silent truncation is forbidden — an unverified line must read as unverified. Matija fills the TOP 3 from verified survivors first.

**Measured cost (2026-07-25 shakedown, full portfolio):** 13 agents, 844k subagent tokens, 267 tool calls, **~28 minutes** wall-clock. The 90-second budget below applies to the manual six-read path only — the workflow deliberately spends wall-clock on verification. That shakedown produced 15 high-risk candidates and **refuted 4 of the first 5 verified**, which is the empirical case for the pass: the majority of prose-plausible high-risk lines did not survive contact with primary surfaces.

**Interactive invocation:** saying `ultracode` alongside a trigger phrase opts the turn into the Workflow tool. Without it, Rolando falls back to the manual six-way `parallel()` dispatch below, which remains a valid — if unverified — path.

---

## Why this is a skill (not a one-shot prompt)

The load-bearing design choice is **parallel fan-out across six independent reads**. A sequential single-pass prompt would serialize six unrelated I/O reads, blow the wall-clock budget, and bury the synthesis step behind the slowest input. Boris's standing review checklist names this exactly: parallel sub-agent fan-out is a tool, not a default — and this is the textbook earned case.

**Wall-clock budget: under 90 seconds end-to-end.** If a run misses that bar, the fan-out is not actually running in parallel — diagnose the dispatch pattern before tuning the prompts.

---

## IO contract

- **Input:** none required. Optional: account-name filter to scope the sweep to a subset of the user's portfolio.
- **Output:** Matija's one-screen weekly risk brief, staged as a draft Markdown file in the project workspace. **Draft only — Rolando does not auto-send or auto-post.** The user reviews and shares manually.
- **Surfaces read:** the six upstream teammates' working artifacts (see fan-out table). Slack search and SOQL reads are issued by the teammates, not by Rolando directly.
- **Surfaces written:** local filesystem only. Optional Slack post to `<configured during first-run>` is **draft, not sent** — the user copies and posts.

---

## Step 1 — Parallel fan-out (the load-bearing step)

Rolando dispatches **all six reads in a single message, in parallel**. Do not chain them.

```
# Single Rolando turn — six Subagent invocations dispatched concurrently
Subagent(Tobias,   "Slipped commitments + exec exposure for the past 7 days...")
Subagent(Dorian,   "Stage regressions, close-date slips, amount drops, stalled stages...")
Subagent(Defoe,    "Intelligence/transition/account-signal artifacts — recurring unresolved 'about to go wrong' items...")
Subagent(Pemberton,"Account research digest — exec departures, competitor wins, regulatory triggers...")
Subagent(Marlow,   "Silent-thread report — customer threads quiet >7 days with open commits...")
Subagent(Sloan,    "Prior-week POV lines — last week's [high-confidence] plays now contradicted...")
```

If you find yourself reading one teammate's output before dispatching the next, stop. Re-dispatch the remainder in parallel. Sequential reads are forbidden (anti-pattern #1 below).

### Fan-out targets — exact contract per teammate

| # | Teammate | Source artifact | Signal extraction rule | Output shape back to Matija |
|---|---|---|---|---|
| 1 | **Tobias** (Tasks) | Commitment ledger Doc (`<configured during first-run>`) | Slipped commitments owed by the user; open lines aging past 14 days; any commitment with exec exposure. | Bullet list. Each bullet: `commitment ID or one-line ref` · `who it's owed to` · `days slipped` · `exec exposure Y/N` · severity hint (high/watch/noise). |
| 2 | **Dorian** (Opp Tracker) | Opp-change log on `my-org` (read-only SOQL) | (a) stage regressions in the last 7 days, (b) close-date slips greater than 14 days, (c) amount drops greater than 20%, (d) opps stalled greater than 21 days in stage. | Bullet list. Each bullet: `opp ID` · `change type` · `delta + date` · `stage` · severity hint. |
| 3 | **Defoe** (Chief of Staff) | `team/intelligence/`, `team/transition/`, `accounts/*/signals.md` + memory-log, recent `*-account-summary.md` changelog entries. **The morning-brief surface was retired 2026-07-24 — do not look for it.** | Recurring "about to go wrong" items appearing in more than one artifact or on more than one date in the past 7–14 days, still unresolved. Single-mention items filtered out. | Bullet list. Each bullet: `item` · `artifacts/dates it appeared in` · `still open Y/N` · severity hint. |
| 4 | **Pemberton** (Account Researcher) | Acme Corp account-research digest + watchlist diff | Exec departures, competitor wins, regulatory triggers — only items touching open opps. Pemberton's `[publicly known / inferred / rumored / internal]` label inherits into the bullet. | Bullet list. Each bullet: `event` · `Pemberton citation with inherited label` · `affected opp(s)` · severity hint. |
| 5 | **Marlow** (Inbox) | Silent-thread report | Customer threads gone quiet greater than 7 days where a commit is open from the user's side. | Bullet list. Each bullet: `thread ref` · `days quiet` · `open commit one-liner` · severity hint. |
| 6 | **Sloan** (Strategy) | Prior-week strategist POV file | Last week's `[high-confidence]` plays now contradicted by this week's facts. **Retraction-only input** — drives the RETRACTIONS section, not new risk lines. | Bullet list. Each bullet: `prior-week POV line` · `contradicting fact + source` · `proposed downgrade label`. |

**Empty inputs are valid.** If a teammate returns nothing, Matija notes the gap in the brief — he does not infer signal from absence (per Matija anti-pattern: "no padding when the book is quiet").

---

## Step 2 — Synthesis (Matija)

Once all six fan-out outputs are back, Rolando hands the full bundle to **Matija** (the Risk Synthesizer persona, `team/matija.md`). Matija enforces:

- `[high-risk]` / `[watch]` / `[noise]` confidence labels on **every** line.
- Labeled source citation per item (`[per Tobias — ...]`, `[per Dorian — ...]`, `[per Defoe — ...]`, `[per Pemberton — ...]`, `[per Marlow — ...]`, `[per Sloan — ...]`).
- Retractions section opens the brief — last week's wrong calls before this week's new ones.
- One screen. If it doesn't fit, it has lost its point.
- Routes, does not solve. Every `[high-risk]` line names an owner and an unblock.

### Output format — reproduced once for skill-reader convenience

The canonical version lives in `team/matija.md`. Reproduced here so this skill stands on its own:

```
RISK BRIEF — week of [date]

TOP 3 HIGH-RISK [high-risk]
1. [opp / commit / exec exposure, one line]. [citation]
   Owner: [Tobias / Dorian / Defoe / Marlow / Pemberton / Sloan / cloud SE / the user]
   Unblock: [one concrete move]
2. [...]
3. [...]

WATCHLIST [watch]
- [signal, one line]. [citation].
  Trigger to escalate: [what makes this high-risk]
- [...]

NOISE LOG (considered, filtered out) [noise]
- [item] — why filtered: [one line]
- [...]

RETRACTIONS
- Last week I called [X] high-risk; [this week's signal] downgrades to [watch / noise]. [per Sloan / per Pemberton citation]
- [...]

ASKS BACK TO USER
- [one or two decisions only the user can make]
```

A populated brief runs roughly one screen. **An empty book is a valid output** — *"book is quiet this week, no high-risk items, watchlist below"* — and the brief is suppressed entirely if all six inputs return empty.

---

## Step 3 — Verification before delivering

Before Rolando hands the brief to the user, run Matija's anti-pattern check (lifted directly from `team/matija.md`, not invented here). The brief fails if any of these are true:

- [ ] **Alarmist verbs present** ("critical," "blowing up," "on fire," "disaster," "burning," "bleeding"). Conviction shows in the `[high-risk]` label, never in volume.
- [ ] **Citation missing on any line.** Every line, every time. A stripped citation escalates to Rolando as a process issue.
- [ ] **RETRACTIONS section absent.** Even when there is nothing to retract, the section header ships with "*nothing to retract this week*".
- [ ] **ASKS BACK TO USER section absent.** Even when empty, the header ships with "*no decisions waiting on you*".
- [ ] **Padding present when the book is quiet.** "No new high-risk items" is a complete and valid full brief — do not pad it.
- [ ] **Rolled-up severity score present.** The labels stand alone. A composite score collapses information the reader needs.
- [ ] **`[high-risk]` line missing a named owner.** Routes, does not solve.

If any check fails, route back to Matija for a rewrite before delivery. Do not silently revise.

---

## Anti-patterns this skill forbids (cited from `team/matija.md`)

1. **Sequential reads of the six inputs.** Parallel fan-out is the whole point. Reading Tobias before dispatching Dorian, etc., kills the wall-clock budget and the architectural justification for this being a skill at all.
2. **Surfacing Matija's brief without running the anti-pattern check.** The check is a gate, not a suggestion.
3. **Auto-sending or auto-posting the brief.** Draft only. The user reviews and shares manually. No Slack post, no email, no calendar action without explicit user approval.
4. **Padding empty inputs.** *"No new high-risk items"* is a complete and valid full brief. Suppress entirely if all six inputs return empty (per Matija anti-pattern #5).

---

## Quality gate — eval reference

A separate task in the build pipeline ships **5 fixture weeks of synthetic data** and runs this skill against them at a **≥70% precision threshold** (correctly labeled `[high-risk]` items / total `[high-risk]` items shipped). Do not ship prompt edits to this skill, to Matija's persona, or to the fan-out contract above without re-running the eval and confirming the threshold holds. If there's no eval pass on a change, it isn't ready.

---

## Quality checklist

- [ ] All six teammate reads dispatched in a single Rolando turn (parallel, not sequential) — or run via `.claude/workflows/weekly-risk-sweep.js`, which enforces this structurally.
- [ ] Wall-clock under 90 seconds end-to-end (manual path only). The workflow path measured ~28 minutes on a full-portfolio run — that is the price of not shipping unsubstantiated `[high-risk]` lines, not a regression. Do not diagnose the workflow against the 90-second bar.
- [ ] Every `[high-risk]` line either passed adversarial verification or is explicitly marked `(unverified — over verify cap)`.
- [ ] Unreachable surfaces stated as gaps in the brief, never inferred from absence.
- [ ] Every brief line carries a `[high-risk]` / `[watch]` / `[noise]` label.
- [ ] Every brief line carries a labeled source citation per Matija's spec.
- [ ] RETRACTIONS section present (even if "nothing to retract this week").
- [ ] ASKS BACK TO USER section present (even if empty).
- [ ] Brief fits on one screen.
- [ ] Brief delivered as a draft — no auto-send, no auto-post.
- [ ] Anti-pattern check run before delivery; failures routed back to Matija for rewrite.
