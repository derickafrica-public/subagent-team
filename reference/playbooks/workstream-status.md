---
name: workstream-status
description: Weekly project workstream status. Triggers on "workstream status", "where are we on [project]", "weekly status for [project/account]", "what shipped this week on [project]". Fans out Tobias, Defoe, Matija, and Eleanor in parallel, then hands the bundle to Calder for a one-screen status that surfaces the 1-2 things going wrong before the wins, with owner-named action items.
---

# Skill: Workstream Status

**Trigger phrases:**
- "workstream status"
- "where are we on [project]"
- "weekly status for [project/account]"
- "what shipped this week on [project]"

**Owner:** Calder (Project Lead / Workstream Choreographer). Persona, output format, and anti-patterns live in `team/calder.md`. If this skill and the persona file conflict, the persona wins.

---

## Why this is a skill (not a one-shot prompt)

The load-bearing design choice is **parallel fan-out across four independent reads**. Action items, daily roll-ups, delivery risks, and project meetings are unrelated I/O surfaces. Sequential reads serialize them and bury Calder's synthesis behind the slowest input. Boris's review checklist names this exactly: parallel fan-out is a tool, not a default — and weekly status is a textbook earned case.

**Cache-prefix sharing:** the Project Delivery skills share an "account+project context" cached prefix. Pemberton and Sloan grounding cached once per session, reused across `project-plan-build`, `workstream-status`, `demo-build-runbook`, `technical-strategy`, and `stakeholder-readout`. Comment for future maintainers — not a runtime mechanism shipping today.

**Wall-clock budget: under 120 seconds end-to-end.** If a run misses that bar, the fan-out is not actually running in parallel — diagnose the dispatch pattern before tuning prompts.

---

## IO contract

- **Input:** project name. Optional: explicit week-of date (defaults to current week).
- **Output:** Calder's workstream-status artifact, staged as a draft Markdown file in the project workspace. **Draft only** — Rolando does not auto-post.
- **Surfaces read:** the four upstream teammates' working artifacts. Slack search and SOQL reads are issued by the teammates, not by Rolando directly.
- **Surfaces written:** local filesystem only.

---

## Step 1 — Parallel fan-out (the load-bearing step)

Rolando dispatches **all four reads in a single turn, in parallel**. Do not chain them.

```
# Single Rolando turn — four Subagent invocations dispatched concurrently
Subagent(Tobias,  "Action items closed this week and open this week, tagged to [project]. Owner-named.")
Subagent(Defoe,   "Rolled-up morning briefs for the past 7 days touching [project]. Recurring friction items.")
Subagent(Matija,  "[delivery]-tagged risks affecting [project] this week. High-risk and watch only.")
Subagent(Eleanor, "Project meetings this week tied to [project]. Decisions made, decisions deferred.")
```

If you find yourself reading one teammate's output before dispatching the next, stop. Re-dispatch the remainder in parallel.

### Fan-out targets — exact contract per teammate

| # | Teammate | Source artifact | Signal extraction rule | Output shape back to Calder |
|---|---|---|---|---|
| 1 | **Tobias** | Commitment ledger | Action items closed this week, action items still open, tagged to [project]. Owner-named. | Two bullet lists (closed / open). Each: `owner` · `action` · `due date` · `commit ID`. |
| 2 | **Defoe** | Rolled-up morning briefs (past 7 days) | Recurring friction items touching [project] flagged across the week. Single-day mentions filtered out. | Bullet list. Each: `friction item` · `morning-brief dates` · `still open Y/N`. |
| 3 | **Matija** | Weekly risk brief, `[delivery]`-tagged lines only | `[high-risk]` and `[watch]` items affecting [project] this week. | Bullet list. Each: `risk` · `[high-risk] or [watch]` · `owner` · `unblock`. |
| 4 | **Eleanor** | Calendar | Project meetings tied to [project] this week. Decisions made and deferred. | Bullet list. Each: `meeting date` · `attendees` · `decisions made or deferred`. |

Empty inputs are valid. If a teammate returns nothing, Calder notes the gap; they do not infer signal from absence.

---

## Step 2 — Synthesis (Calder)

Once all four fan-out outputs are back, Rolando hands the bundle to Calder. Calder enforces:

- **What is going wrong is named first** — surfacing the 1-2 slips, blockers, or risks before any wins. Green-washed status is forbidden.
- **Action items are owner-named.** A status without named owners is a status that did not ship.
- **One screen.** If it doesn't fit, it has lost its point.
- **No padding when the project is on track.** Empty wins are valid; an empty risk list is valid only when Calder explicitly states *"no slip surfaced this week."*
- Labeled source citation per line.

### Output format

The canonical version lives in `team/calder.md`. Reproduced here so this skill stands on its own:

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

Run Calder's anti-pattern check before handing the status to the user. The status fails if any of these are true:

- [ ] **WHAT IS GOING WRONG section missing or buried after wins.** Slips first, wins next.
- [ ] **Action items missing a named owner.** Routes, does not solve.
- [ ] **No slip surfaced and no explicit "no slip surfaced this week" line.** Silence is not a clean week.
- [ ] **Citation missing on any line.** Every line, every time.
- [ ] **Padding present when the project is on track.** A short status is a valid status.
- [ ] **Brief exceeds one screen.** Trim before delivery.
- [ ] **Alarmist verbs present** ("critical," "blowing up," "on fire," "disaster"). Conviction shows in the named slip and named owner — never in volume.

If any check fails, route back to Calder for a rewrite. Do not silently revise.

---

## Anti-patterns this skill forbids

1. **Sequential reads of the four inputs.** Parallel fan-out is the whole point.
2. **Green-washed status.** Slips lead, wins follow.
3. **Status without named owners.** Calder hard rule.
4. **Padding when the project is on track.** Empty-but-shipped sections are valid.
5. **Auto-posting to Slack.** Draft only. The user reviews and shares manually.

---

## Cadence

- Friday end-of-week default, after Tobias and Eleanor have shipped their week.
- On-demand allowed — the skill runs whenever the trigger phrase fires.

---

## Wall-clock budget

Under 120 seconds end-to-end. If a run misses that bar, diagnose the dispatch pattern before tuning prompts.

---

## Eval gate (reference, not implemented)

10 fixture project-weeks. ≥6/10 prefer this skill's output to a hand-written baseline. Eval files are not built this round — Boris ships the eval after Maggie's pedagogy gate clears. Do not ship prompt edits to this skill, to Calder's persona, or to the preceding fan-out contract without re-running the eval and confirming the threshold holds.

---

## Routing rule citation

**Artifact owner routes, synthesizer reports.** Calder owns producing and updating this artifact. Defoe synthesizes across artifacts when a daily or cross-project roll-up is asked — Defoe does not author weekly project status.

---

## Quality checklist

- [ ] All four teammate reads dispatched in a single Rolando turn (parallel, not sequential).
- [ ] Wall-clock under 120 seconds end-to-end.
- [ ] WHAT IS GOING WRONG section comes before WHAT IS GOING RIGHT.
- [ ] Every action item names an owner.
- [ ] Every line carries a labeled source citation.
- [ ] Status fits on one screen.
- [ ] No padding when the project is on track.
- [ ] Status delivered as a draft — no auto-post.
- [ ] Anti-pattern check run before delivery; failures routed back to Calder for rewrite.
