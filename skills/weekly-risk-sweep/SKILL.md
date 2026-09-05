---
name: weekly-risk-sweep
description: >-
  Weekly pipeline-risk sweep across six independent surfaces — a commitment ledger, an opportunity
  change log, recurring account-intelligence signals, an account-research digest, a silent-thread
  inbox report, and last week's strategist POV — synthesized into a one-screen brief with
  [high-risk] / [watch] / [noise] confidence labels, citations, and retractions. TRIGGER on
  "weekly risk sweep", "run the risk sweep", "what's slipping this week", or "weekly risk brief".
metadata:
  version: "1.0"
---

# Weekly Risk Sweep

Produce a one-screen weekly risk brief by reading six independent surfaces in parallel, labeling
every finding `[high-risk]` / `[watch]` / `[noise]`, and opening with retractions of anything called
`[high-risk]` last week that didn't hold up.

**Argument (optional):** an account-name filter to scope the sweep to a subset of the portfolio.
Omit it to sweep everything the user has access to.

---

## Why parallel reads matter

The load-bearing design choice is **six independent reads dispatched together, not one after
another**. Reading each surface sequentially serializes six unrelated I/O calls, blows the
wall-clock budget, and buries the synthesis step behind whichever surface is slowest to answer.
Fan the six reads out together — issue all six tool calls (SOQL, Slack search, file reads) in the
same turn rather than waiting on one before starting the next.

**Wall-clock budget: under 90 seconds end-to-end** for the direct read-and-synthesize path below. If
a run misses that bar, the reads are not actually running in parallel — check the dispatch pattern
before tuning anything else.

---

## IO contract

- **Input:** none required. Optional: an account-name filter to scope the sweep.
- **Output:** a one-screen Markdown risk brief, written to a draft file in the project workspace
  (or the user's usual output location — see "Output" below). **Draft only — never auto-send or
  auto-post.** The user reviews and shares it manually.
- **Surfaces read:** six data sources (table below). All reads are read-only — SOQL SELECT, Slack
  search/read, file reads. No writes to any of these systems.

---

## Step 1 — Read six surfaces (in parallel)

Read all six of the following in the same pass — issue every read up front rather than reading one,
waiting, then deciding whether to read the next:

| # | Surface | Where to look | Signal extraction rule | Bullet shape to produce |
|---|---|---|---|---|
| 1 | **Commitment ledger** | A commitments/tasks doc or tracker (configured per-user on first run) | Slipped commitments owed by the user; open lines aging past 14 days; any commitment with exec exposure. | `commitment ID or one-line ref` · `who it's owed to` · `days slipped` · `exec exposure Y/N` · severity hint. |
| 2 | **Opportunity change log** | `my-org` (read-only SOQL) | (a) stage regressions in the last 7 days, (b) close-date slips greater than 14 days, (c) amount drops greater than 20%, (d) opps stalled greater than 21 days in stage. | `opp ID` · `change type` · `delta + date` · `stage` · severity hint. |
| 3 | **Recurring account-intelligence signals** | Account intelligence / transition briefs and `accounts/*/signals.md` + memory logs, plus recent account-summary changelog entries, if those artifacts exist in this install | Recurring "about to go wrong" items appearing in more than one artifact or on more than one date in the past 7–14 days, still unresolved. Single-mention items filtered out. | `item` · `artifacts/dates it appeared in` · `still open Y/N` · severity hint. |
| 4 | **Account-research digest** | Account-research watchlist / digest (e.g. from an `account-research`-style workspace, if installed) | Exec departures, competitor wins, regulatory triggers — only items touching open opps. Carry forward any `[publicly known / inferred / rumored / internal]` confidence label the source already applies. | `event` · `citation with inherited label` · `affected opp(s)` · severity hint. |
| 5 | **Silent-thread inbox report** | Email/inbox surface — threads gone quiet with an open commitment | Customer threads quiet greater than 7 days where a commit is open from the user's side. | `thread ref` · `days quiet` · `open commit one-liner` · severity hint. |
| 6 | **Last week's strategist POV** | Last week's saved strategy/POV file, if one exists | Last week's `[high-confidence]` plays now contradicted by this week's facts. **Retraction-only input** — drives the RETRACTIONS section, not new risk lines. | `prior-week POV line` · `contradicting fact + source` · `proposed downgrade label`. |

**Empty inputs are valid.** If a surface returns nothing (or doesn't exist in this install), note the
gap in the brief — never infer signal from absence, and never pad to make the sweep look fuller than
it is.

*In the source multi-agent design, each of these six reads was owned by a named persona (Tobias,
Dorian, Defoe, Pemberton, Marlow, Sloan respectively) and the synthesis by a persona named Matija —
see `team/matija.md` and the corresponding `team/<name>.md` files if that full roster happens to be
installed alongside this skill. None of that is required: read the six surfaces yourself and
synthesize using the format below.*

### Optional enhancement — scripted workflow fan-out

If this install has a Workflow tool and a `.claude/workflows/weekly-risk-sweep.js` script, prefer it
over the manual six-read path — it enforces the parallel dispatch structurally, adds adversarial
verification of `[high-risk]` candidates before they ship, and caps verification at a documented
number (logging, never silently truncating, anything beyond the cap):

```
Workflow({ name: 'weekly-risk-sweep', args: { runDate: '<YYYY-MM-DD>', accountFilter: '<optional account>' } })
```

`runDate` is required — workflow scripts cannot call `Date.now()` or `new Date()`, so pass today's
date in. If `name` fails to resolve, use `{ scriptPath: '.claude/workflows/weekly-risk-sweep.js', args: {...} }`
instead. This is purely an optional accelerant when the harness machinery is present — the primary
path (read six surfaces directly, synthesize per Step 2) works with nothing installed beyond this
skill file.

---

## Step 2 — Synthesize into the risk brief

Once all six reads are back, synthesize them yourself into the brief below. Enforce these rules
while writing it:

- `[high-risk]` / `[watch]` / `[noise]` confidence labels on **every** line.
- Labeled source citation per item (`[per commitment ledger — ...]`, `[per opp change log — ...]`,
  `[per account intelligence — ...]`, `[per account-research digest — ...]`, `[per inbox — ...]`,
  `[per last week's POV — ...]`).
- Retractions section opens the brief — last week's wrong calls before this week's new ones.
- One screen. If it doesn't fit, it has lost its point.
- Routes, does not solve. Every `[high-risk]` line names an owner and an unblock.

### Output format

```
RISK BRIEF — week of [date]

TOP 3 HIGH-RISK [high-risk]
1. [opp / commit / exec exposure, one line]. [citation]
   Owner: [named team/role, or "the user"]
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
- Last week I called [X] high-risk; [this week's signal] downgrades to [watch / noise]. [citation]
- [...]

ASKS BACK TO USER
- [one or two decisions only the user can make]
```

A populated brief runs roughly one screen. **An empty book is a valid output** —
*"book is quiet this week, no high-risk items, watchlist below"* — and the brief is suppressed
entirely if all six inputs return empty.

---

## Step 3 — Verify before delivering

Before handing the brief to the user, check it against every line below. The brief fails if any of
these are true:

- [ ] **Alarmist verbs present** ("critical," "blowing up," "on fire," "disaster," "burning,"
  "bleeding"). Conviction shows in the `[high-risk]` label, never in volume.
- [ ] **Citation missing on any line.** Every line, every time.
- [ ] **RETRACTIONS section absent.** Even when there is nothing to retract, ship the header with
  "*nothing to retract this week*".
- [ ] **ASKS BACK TO USER section absent.** Even when empty, ship the header with "*no decisions
  waiting on you*".
- [ ] **Padding present when the book is quiet.** "No new high-risk items" is a complete and valid
  full brief — do not pad it.
- [ ] **Rolled-up severity score present.** The labels stand alone. A composite score collapses
  information the reader needs.
- [ ] **`[high-risk]` line missing a named owner.** Routes, does not solve.

If any check fails, rewrite before delivery. Do not silently ship a brief that fails its own checklist.

---

## Anti-patterns this skill forbids

1. **Sequential reads of the six inputs.** Parallel fan-out is the whole point. Reading one surface
   fully before starting the next kills the wall-clock budget and the reason this is worth a
   dedicated skill.
2. **Surfacing the brief without running the Step 3 verification.** The check is a gate, not a
   suggestion.
3. **Auto-sending or auto-posting the brief.** Draft only. The user reviews and shares manually. No
   Slack post, no email, no calendar action without explicit user approval.
4. **Padding empty inputs.** *"No new high-risk items"* is a complete and valid full brief. Suppress
   entirely if all six inputs return empty.

---

## Output

Write the brief to a draft Markdown file in the current project workspace (for example
`weekly-risk-brief-<YYYY-MM-DD>.md`), or wherever this install's convention places dated output —
check for an existing `team/` or `reports/` directory pattern before defaulting to the project root.
Never post or send it automatically.

## Run cadence

On-demand by default — invoke on any of the trigger phrases. A scheduled cadence (e.g. weekly via a
cron/launchd job) is an optional wiring choice per install; this skill's procedure is cadence-agnostic.

## Quality checklist

- [ ] All six surfaces read in parallel, not sequentially.
- [ ] Wall-clock under 90 seconds end-to-end for the direct path (the optional scripted workflow
  trades wall-clock for adversarial verification and is not held to this bar).
- [ ] Unreachable or missing surfaces stated as gaps in the brief, never inferred from absence.
- [ ] Every brief line carries a `[high-risk]` / `[watch]` / `[noise]` label and a citation.
- [ ] RETRACTIONS section present (even if "nothing to retract this week").
- [ ] ASKS BACK TO USER section present (even if empty).
- [ ] Brief fits on one screen.
- [ ] Brief delivered as a draft — no auto-send, no auto-post.
- [ ] Step 3 verification run before delivery; failures fixed, not shipped as-is.
