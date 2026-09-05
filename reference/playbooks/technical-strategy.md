---
name: technical-strategy
description: Composed technical-strategy document for a named account or project. Triggers on "draft the [account] technical strategy", "build technical strategy for [project]", "what's our technical POV on [account]". Fans out account research, prioritized plays, and a 7-way technical pod sweep in parallel, then hands the bundle to Calder for a composed arc — account context, solution shape, demo plan, exec narrative skeleton — that cites upstream and never re-derives.
---

# Skill: Technical Strategy

**Trigger phrases:**
- "draft the [account] technical strategy"
- "build technical strategy for [project]"
- "what's our technical POV on [account]"

**Owner:** Calder (Project Lead / Workstream Choreographer). Persona, output format, and anti-patterns live in `team/calder.md`. If this skill and the persona file conflict, the persona wins.

---

## Why this is a skill (not a one-shot prompt)

The load-bearing design choice is **parallel fan-out across nine independent reads** — Pemberton, Sloan, and the 7-way technical pod (Bob, Kaz, Aldous, Mick, Vic, Richard, Bessie). Sequential reads serialize unrelated I/O and bury Calder's composed arc behind the slowest input. The technical pod sweep is broad on purpose — most teammates return empty on any one project, and that is the expected default.

Calder's job here is **composition, not derivation**. Every line cites Pemberton, Sloan, or one of the technical pod members upstream. Calder does not re-derive their work.

**Cache-prefix sharing:** the Project Delivery skills share an "account+project context" cached prefix. Pemberton and Sloan grounding cached once per session, reused across `project-plan-build`, `workstream-status`, `demo-build-runbook`, `technical-strategy`, and `stakeholder-readout`. Comment for future maintainers — not a runtime mechanism shipping today.

**Wall-clock budget: under 120 seconds end-to-end.** If a run misses that bar, the fan-out is not actually running in parallel — diagnose the dispatch pattern before tuning prompts.

---

## IO contract

- **Input:** account or project name.
- **Output:** Calder's technical-strategy artifact (composed arc with exec narrative skeleton), staged as a draft Markdown file in the project workspace. **Draft only** — Rolando does not auto-publish. If the user wants exec copy on top, the next step routes to Abigail through `stakeholder-readout`.
- **Surfaces read:** the upstream teammates' working artifacts.
- **Surfaces written:** local filesystem only.

---

## Step 1 — Parallel fan-out (the load-bearing step)

Rolando dispatches **all reads in a single turn, in parallel**. Do not chain them.

```
# Single Rolando turn — all Subagent invocations dispatched concurrently
Subagent(Pemberton, "Account research for [account/project] — exec stakeholders, strategic posture, named priorities.")
Subagent(Sloan,     "Prioritized plays for [account/project] — confidence-labeled, with retractions if any.")
Subagent(Bob,       "Solution shape — architecture, integration constraints, sizing, risk. Empty if not your lane.")
Subagent(Kaz,       "Salesforce Core SE shape. Empty if not your lane.")
Subagent(Aldous,    "MuleSoft integration shape. Empty if not your lane.")
Subagent(Mick,      "AXL / Agentforce Experience Layer shape. Empty if not your lane.")
Subagent(Vic,       "Tableau / analytics shape. Empty if not your lane.")
Subagent(Richard,   "Data and AI architecture shape. Empty if not your lane.")
Subagent(Bessie,    "Cross-cloud data and AI fitness gating. Empty if not your lane.")
```

If you find yourself reading one teammate's output before dispatching the next, stop. Re-dispatch the remainder in parallel.

### Fan-out targets — exact contract per teammate

| # | Teammate | Source artifact | Signal extraction rule | Output shape back to Calder |
|---|---|---|---|---|
| 1 | **Pemberton** | Account research digest | Exec stakeholders, current strategic posture, named priorities for [account/project]. | 3-5 lines, each with `[publicly known / inferred / rumored / internal]` label. |
| 2 | **Sloan** | Strategist POV file | Prioritized plays for [account/project], confidence-labeled. Retractions called out if any. | Bullet list per play: `play` · `confidence label` · `routing target`. |
| 3-9 | **Bob / Kaz / Aldous / Mick / Vic / Richard / Bessie** | Each teammate's working notes | Solution shape, integration constraints, sizing, technical risk in their lane. **Returning "empty, not my lane" is the expected default for most of these on most projects.** | 0-5 lines per teammate, each with their own labeled citation. |

Empty inputs are valid. If a teammate returns nothing, Calder notes the gap; they do not infer signal from absence.

---

## Step 2 — Synthesis (Calder)

Once all fan-out outputs are back, Rolando hands the bundle to Calder. Calder enforces:

- **Composition, not derivation.** Every line cites Pemberton, Sloan, or a technical-pod teammate. Calder does not re-derive their work.
- **Composed arc — account context → solution shape → demo plan → exec narrative skeleton.**
- **Exec narrative skeleton names project facts only.** Abigail drafts the exec copy on top in `stakeholder-readout`. Calder does not write exec copy.
- Labeled source citation per line.

### Output format

The canonical version lives in `team/calder.md`. Reproduced here so this skill stands on its own:

```
TECHNICAL STRATEGY — [project] — [date]

ACCOUNT CONTEXT
- [3-5 lines, every one cites Pemberton or Sloan]

SOLUTION SHAPE
- [3-5 lines, every one cites Bob / Kaz / Aldous / Mick / Vic / Richard / Bessie]

DEMO PLAN
- [milestones lifted from project plan, citations preserved]

EXEC NARRATIVE SKELETON
- [project facts only; Abigail drafts the exec copy on top in stakeholder-readout]

OPEN QUESTIONS
- [named gaps, routed back to the upstream owner]
```

---

## Step 3 — Verification before delivering

Run Calder's anti-pattern check before handing the strategy doc to the user. The doc fails if any of these are true:

- [ ] **Any line in ACCOUNT CONTEXT or SOLUTION SHAPE missing an upstream citation.** Composition, not derivation.
- [ ] **EXEC NARRATIVE SKELETON contains exec copy or marketing voice.** Project facts only — Abigail's lane.
- [ ] **DEMO PLAN section invents new milestones not present in the project plan.** Lift, don't invent.
- [ ] **OPEN QUESTIONS section absent.** Even an empty header ships with "*no open questions this pass*".
- [ ] **Citation missing on any line.** Every line, every time.

If any check fails, route back to Calder for a rewrite. Do not silently revise.

---

## Anti-patterns this skill forbids

1. **Sequential reads of the upstream inputs.** Parallel fan-out is the whole point.
2. **Calder re-deriving Pemberton, Sloan, or technical-pod work.** Composition, not derivation.
3. **Calder writing exec copy in EXEC NARRATIVE SKELETON.** Abigail's lane in `stakeholder-readout`.
4. **Inventing milestones in DEMO PLAN.** Lift from the project plan.
5. **Auto-publishing the strategy doc.** Draft only. The user reviews and shares manually.

---

## Cadence

- Composed at kickoff for any new project.
- Revised when Sloan retracts a play or the technical pod revises solution shape.

---

## Wall-clock budget

Under 120 seconds end-to-end. If a run misses that bar, diagnose the dispatch pattern before tuning prompts.

---

## Eval gate (reference, not implemented)

10 fixture projects. ≥6/10 prefer this skill's output to a hand-written baseline. Eval files are not built this round — Boris ships the eval after Maggie's pedagogy gate clears. Do not ship prompt edits to this skill, to Calder's persona, or to the preceding fan-out contract without re-running the eval and confirming the threshold holds.

---

## Routing rule citation

**Artifact owner routes, synthesizer reports.** Calder owns producing and updating this artifact. Defoe synthesizes across artifacts when a status roll-up is asked — Defoe does not author technical strategy.

---

## Quality checklist

- [ ] All upstream reads dispatched in a single Rolando turn (parallel, not sequential).
- [ ] Wall-clock under 120 seconds end-to-end.
- [ ] Every line in ACCOUNT CONTEXT and SOLUTION SHAPE cites an upstream teammate.
- [ ] EXEC NARRATIVE SKELETON contains project facts only — no exec voice.
- [ ] DEMO PLAN milestones lifted from the project plan, not invented.
- [ ] OPEN QUESTIONS section present (even if empty).
- [ ] Strategy doc delivered as a draft — no auto-publish.
- [ ] Anti-pattern check run before delivery; failures routed back to Calder for rewrite.
