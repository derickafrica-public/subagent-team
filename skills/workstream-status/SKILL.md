---
name: workstream-status
description: >-
  Weekly project workstream status — a one-screen brief that surfaces the 1-2 things going wrong
  before the wins, with owner-named action items and a labeled citation on every line. Gathers
  commitment-ledger action items, recurring friction from recent status roll-ups, delivery risks,
  and this week's project meetings before writing. TRIGGER when the user says "workstream status",
  "where are we on [project]", "weekly status for [project/account]", or "what shipped this week
  on [project]".
metadata:
  version: "1.0"
---

# Skill: Workstream Status

**Trigger phrases:**
- "workstream status"
- "where are we on [project]"
- "weekly status for [project/account]"
- "what shipped this week on [project]"

**You get:** a one-screen draft status brief — what's going wrong (named first), what's going
right, owner-named action items, upcoming milestones, and asks back to the user. Draft only; this
skill does not auto-post.

In the original multi-agent design, this skill's inputs were gathered by named personas —
`Tobias` (commitment ledger), `Defoe` (rolled-up status briefs), `Matija` (delivery risks), and
`Eleanor` (calendar) — and composed by `Calder` (see `team/calder.md` if you have the full roster
installed). This skill gathers those inputs and composes the status directly. If your environment
happens to have that roster installed, dispatching each lane below to its named persona **in
parallel, in a single turn** is a valid optional enhancement — it is not required for this skill
to work.

---

## Why this skill separates gathering from composing

The load-bearing design choice is **gathering the four inputs below as independent reads before
composing** — action items, recent status history, delivery risks, and project meetings are
unrelated surfaces, and reading them one after another just delays the write-up behind the slowest
input. Parallel fan-out here is an earned case, not a default habit — apply it because these four
reads genuinely don't depend on each other, not as a reflex.

**If dispatching parallel subagents** for the gathering step, do all four in a single turn — do
not read one teammate's output before dispatching the next. **Wall-clock budget in that mode:
under 120 seconds end-to-end.** If a run misses that bar, the fan-out is not actually running in
parallel — diagnose the dispatch pattern before tuning prompts. If gathering directly yourself
instead (the primary path), there's no fixed budget, but keep the reads efficient.

---

## IO contract

- **Input:** project name. Optional: explicit week-of date (defaults to current week).
- **Output:** the workstream-status document, staged as a draft Markdown file in the project
  workspace. **Draft only** — do not auto-post.
- **Surfaces read:** whatever commitment tracking, status history, risk notes, and calendar/meeting
  records you have access to for the project.
- **Surfaces written:** local filesystem only.

---

## Step 1 — Gather inputs across the following lanes

Gather each lane below yourself from available tracking, notes, and calendar records. Cite the
source of every fact you pull.

| # | Lane | What to extract | Output shape | Original persona (optional fan-out target) |
|---|---|---|---|---|
| 1 | Commitment ledger | Action items closed this week, action items still open, tagged to the project. Owner-named. | Two bullet lists (closed / open). Each: `owner` · `action` · `due date` · `commit ID`. | `Tobias` |
| 2 | Recent status history | Recurring friction items touching the project, flagged across the past 7 days. Single-day mentions filtered out. | Bullet list. Each: `friction item` · `dates seen` · `still open Y/N`. | `Defoe` |
| 3 | Delivery risks | High-risk and watch-level risks affecting the project this week. | Bullet list. Each: `risk` · `high-risk or watch` · `owner` · `unblock`. | `Matija` |
| 4 | Project meetings | Meetings tied to the project this week. Decisions made and deferred. | Bullet list. Each: `meeting date` · `attendees` · `decisions made or deferred`. | `Eleanor` |

Empty inputs are valid — note the gap in the write-up rather than inferring signal from absence.

---

## Step 2 — Compose the status

Once the four lanes above are gathered, compose the status. Enforce these rules while writing:

- **What is going wrong is named first** — surface the 1-2 slips, blockers, or risks before any
  wins. Green-washed status is forbidden.
- **Action items are owner-named.** A status without named owners is a status that did not ship.
- **One screen.** If it doesn't fit, it has lost its point.
- **No padding when the project is on track.** Empty wins are valid; an empty risk list is valid
  only when the write-up explicitly states *"no slip surfaced this week."*
- Labeled source citation on every line.

### Output format

```
STATUS — [project] — week of [date]

WHAT IS GOING WRONG (1-2)
- [slip / blocker]. Owner: [name]. Unblock: [one move]. [citation]
- [slip / blocker]. Owner: [name]. Unblock: [one move]. [citation]

WHAT IS GOING RIGHT
- [win]. [citation]
- [win]. [citation]

ACTION ITEMS (owner-named)
- [name] — [action] — by [date]
- [name] — [action] — by [date]

UPCOMING MILESTONES (next 14 days)
- [date]: [milestone]. Depends on: [...]. [citation]

ASKS BACK TO USER
- [decisions only the user can make]
```

---

## Step 3 — Verification before delivering

Run this check before handing the status to the user. It fails if any of these are true:

- [ ] **WHAT IS GOING WRONG section missing or buried after wins.** Slips first, wins next.
- [ ] **Action items missing a named owner.** Routes, does not solve.
- [ ] **No slip surfaced and no explicit "no slip surfaced this week" line.** Silence is not a
      clean week.
- [ ] **Citation missing on any line.** Every line, every time.
- [ ] **Padding present when the project is on track.** A short status is a valid status.
- [ ] **Brief exceeds one screen.** Trim before delivery.
- [ ] **Alarmist verbs present** ("critical," "blowing up," "on fire," "disaster"). Conviction
      shows in the named slip and named owner — never in volume.

If any check fails, rewrite before delivering. Do not silently ship a failing draft.

---

## Anti-patterns this skill forbids

1. **Sequential reads of the four inputs** when parallel fan-out (direct or via subagents) is
   available. Parallelism is the whole point of Step 1.
2. **Green-washed status.** Slips lead, wins follow.
3. **Status without named owners.** Hard rule.
4. **Padding when the project is on track.** Empty-but-shipped sections are valid.
5. **Auto-posting to Slack or elsewhere.** Draft only. The user reviews and shares manually.

---

## Cadence

- Friday end-of-week default, once the week's action items and meetings have been logged.
- On-demand allowed — the skill runs whenever the trigger phrase fires.

---

## Eval gate (reference, not implemented)

10 fixture project-weeks. ≥6/10 prefer this skill's output to a hand-written baseline. Eval files
are not built yet — build them before shipping prompt edits to this skill's composition rules
without re-confirming the threshold holds.

---

## Routing rule

**Artifact owner routes, synthesizer reports.** This skill owns producing and updating the weekly
workstream-status artifact for a given project. A cross-project daily or account-wide roll-up is a
different job — don't conflate the two.

---

## Quality checklist

- [ ] All four gathering lanes covered — directly, or via parallel fan-out if dispatching subagents.
- [ ] Wall-clock under 120 seconds end-to-end if using parallel subagent fan-out.
- [ ] WHAT IS GOING WRONG section comes before WHAT IS GOING RIGHT.
- [ ] Every action item names an owner.
- [ ] Every line carries a labeled source citation.
- [ ] Status fits on one screen.
- [ ] No padding when the project is on track.
- [ ] Status delivered as a draft — no auto-post.
- [ ] Verification check run before delivery; failures fixed before shipping.
