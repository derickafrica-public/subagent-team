---
name: project-plan-build
description: Build the multi-phase milestone spine for a named account or project. Triggers on "build a project plan for [account/project]", "draft the [project] plan", "let's plan [demo/build]", "what's our plan for [account]". Fans out account context, plays, technical shape, open commits, and milestone dates in parallel, then hands the bundle to Calder for a dependency-named plan with a roadmap horizon.
---

# Skill: Project Plan Build

**Trigger phrases:**
- "build a project plan for [account/project]"
- "draft the [project] plan"
- "let's plan [demo/build]"
- "what's our plan for [account]"

**Owner:** Calder (Project Lead / Workstream Choreographer). Persona, output format, and anti-patterns live in `team/calder.md`. If this skill and the persona file conflict, the persona wins.

---

## Why this is a skill (not a one-shot prompt)

The load-bearing design choice is **parallel fan-out across three independent reads plus a 7-way technical pod sweep**. Account context, prioritized plays, technical shape, open commits, and milestone dates are all upstream of the plan. Sequential reads serialize unrelated I/O and bury Calder's synthesis behind the slowest input. The technical pod fan-out is broad on purpose — most teammates return empty on any one project, and that is fine.

**Cache-prefix sharing:** the Project Delivery skills share an "account+project context" cached prefix. Pemberton and Sloan grounding cached once per session, reused across `project-plan-build`, `workstream-status`, `demo-build-runbook`, `technical-strategy`, and `stakeholder-readout`. Comment for future maintainers — not a runtime mechanism shipping today.

**Wall-clock budget: under 120 seconds end-to-end.** If a run misses that bar, the fan-out is not actually running in parallel — diagnose the dispatch pattern before tuning prompts.

---

## IO contract

- **Input:** account or project name. Optional: target milestone date.
- **Output:** Calder's project-plan artifact (multi-phase milestone spine + roadmap horizon), staged as a draft Markdown file in the project workspace. **Draft only** — Rolando does not auto-publish.
- **Surfaces read:** the upstream teammates' working artifacts. Slack search and SOQL reads are issued by the teammates, not by Rolando directly.
- **Surfaces written:** local filesystem only.

---

## Step 1 — Parallel fan-out (the load-bearing step)

Rolando dispatches **all reads in a single turn, in parallel**. Do not chain them.

```
# Single Rolando turn — all Subagent invocations dispatched concurrently
Subagent(Pemberton, "Account context — exec stakeholders, current strategic posture, named priorities for [project].")
Subagent(Sloan,     "Prioritized plays for [account/project] — confidence-labeled, with retractions if any.")
Subagent(Bob,       "Solution-shape, integration constraints, sizing for [project]. Empty if not your lane.")
Subagent(Kaz,       "Salesforce Core SE shape — Apex/LWC/security implications. Empty if not your lane.")
Subagent(Aldous,    "MuleSoft integration constraints. Empty if not your lane.")
Subagent(Mick,      "AXL / Agentforce Experience Layer shape. Empty if not your lane.")
Subagent(Vic,       "Tableau / analytics shape. Empty if not your lane.")
Subagent(Richard,   "Data and AI architecture shape. Empty if not your lane.")
Subagent(Bessie,    "Cross-cloud data and AI fitness gating. Empty if not your lane.")
Subagent(Tobias,    "Open commits tagged to [project] with exec exposure flagged.")
Subagent(Eleanor,   "Milestone dates already on the calendar for [project]. Rehearsals, exec touchpoints, demo dates.")
```

Empty inputs are valid. If a teammate returns nothing, Calder notes the gap; they do not infer signal from absence.

### Fan-out targets — exact contract per teammate

| # | Teammate | Source artifact | Signal extraction rule | Output shape back to Calder |
|---|---|---|---|---|
| 1 | **Pemberton** | Account research digest, watchlist diff | Exec stakeholders, current strategic posture, named priorities touching [project]. | 3-5 lines, each with `[publicly known / inferred / rumored / internal]` label. |
| 2 | **Sloan** | Strategist POV file | Prioritized plays for [account/project], confidence-labeled. Retractions called out if any. | Bullet list per play: `play` · `confidence label` · `routing target`. |
| 3-9 | **Bob / Kaz / Aldous / Mick / Vic / Richard / Bessie** | Each teammate's working notes | Solution shape, integration constraints, sizing, technical risk in their lane. **Returning "empty, not my lane" is the expected default for most of these on most projects.** | 0-5 lines per teammate, each with their own labeled citation. |
| 10 | **Tobias** | Commitment ledger | Open commits tagged to [project]. Exec exposure flagged. | Bullet list. Each: `commit ID` · `who it's owed to` · `exec exposure Y/N`. |
| 11 | **Eleanor** | Calendar | Milestone dates on the calendar for [project] — rehearsals, exec touchpoints, demo dates. | Bullet list. Each: `date` · `event` · `attendees`. |

If you find yourself reading one teammate's output before dispatching the next, stop. Re-dispatch the remainder in parallel.

---

## Step 2 — Synthesis (Calder)

Once all fan-out outputs are back, Rolando hands the bundle to Calder. Calder enforces:

- **Dependencies named inline on every milestone.** A plan without inline dependencies is invalid.
- Labeled source citation per fact (`[per Pemberton — ...]`, `[per Sloan — ...]`, `[per Bob — ...]`, etc.).
- **Roadmap horizon section** at the close — next 1-3 quarters at low resolution.
- No waterfall vocabulary ("phase gate sign-off," "frozen scope," Gantt-fetishism).
- Calder does not write Salesforce opportunity-record fields, stages, amounts, or close dates — Dorian's lane.

### Output format

The canonical version lives in `team/calder.md`. Reproduced here so this skill stands on its own:

```
PROJECT PLAN — [project] — [milestone date]

PHASE 1 — [name] — [date range]
- Milestone: [outcome]. Owner: [name]. Depends on: [upstream milestone / artifact / decision]. [citation]
- Milestone: [...]. Owner: [...]. Depends on: [...]. [citation]

PHASE 2 — [name] — [date range]
- [...]

ROADMAP HORIZON (next 1-3 quarters, low resolution)
- Q[n]: [coarse outcome]. [citation or hypothesis label]
- Q[n+1]: [...]
- Q[n+2]: [...]

OPEN DEPENDENCIES
- [dependency] — owner: [name]. Resolves by: [date or trigger]. [citation]

ASKS BACK TO USER
- [decisions only the user can make]
```

---

## Step 3 — Verification before delivering

Run Calder's anti-pattern check before handing the plan to the user. The plan fails if any of these are true:

- [ ] **Any milestone without an inline dependency.** A plan without dependencies named inline is invalid by Calder's hard rules.
- [ ] **Waterfall vocabulary present** ("phase gate sign-off," "frozen scope," Gantt fetishism).
- [ ] **Citation missing on any line.** No fact without a labeled source citation.
- [ ] **Salesforce opportunity-record fields, stages, amounts, or close dates written into the plan.** Dorian's lane — escalate.
- [ ] **Roadmap horizon section absent.** Even a low-resolution two-line forward-look is required.

If any check fails, route back to Calder for a rewrite. Do not silently revise.

---

## Anti-patterns this skill forbids

1. **Sequential reads of the upstream inputs.** Parallel fan-out is the whole point.
2. **Plan without inline dependencies on every milestone.** Calder hard rule.
3. **Waterfall vocabulary that does not survive iteration.** Calder hard rule.
4. **Auto-publishing the plan.** Draft only. The user reviews and shares manually.
5. **Calder writing exec copy or opp-record details.** Routes to Abigail (exec copy) or Dorian (opp record).

---

## Cadence

- Built at kickoff for any new project.
- Updated when a fact moves — a slip, a new dependency, a Sloan retraction, or a technical-pod revision.

---

## Wall-clock budget

Under 120 seconds end-to-end. If a run misses that bar, diagnose the dispatch pattern before tuning prompts.

---

## Eval gate (reference, not implemented)

10 fixture projects. ≥6/10 prefer this skill's output to a hand-written baseline. Eval files are not built this round — Boris ships the eval after Maggie's pedagogy gate clears. Do not ship prompt edits to this skill, to Calder's persona, or to the preceding fan-out contract without re-running the eval and confirming the threshold holds.

---

## Routing rule citation

**Artifact owner routes, synthesizer reports.** Calder owns producing and updating this artifact. Defoe synthesizes across artifacts when a status roll-up is asked — Defoe does not author project plans.

---

## Quality checklist

- [ ] All upstream reads dispatched in a single Rolando turn (parallel, not sequential).
- [ ] Wall-clock under 120 seconds end-to-end.
- [ ] Every milestone names a dependency inline.
- [ ] Every fact carries a labeled source citation.
- [ ] Roadmap horizon section present, even at low resolution.
- [ ] No waterfall vocabulary in the artifact.
- [ ] Plan delivered as a draft — no auto-publish.
- [ ] Anti-pattern check run before delivery; failures routed back to Calder for rewrite.
