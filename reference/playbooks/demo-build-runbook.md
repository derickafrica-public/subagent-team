---
name: demo-build-runbook
description: T-minus countdown runbook for a named demo. Triggers on "build the [account] demo runbook", "T-minus runbook for [project]", "demo choreography for [account]", "what's the demo plan". Fans out account stakeholders, technical readiness, calendar dates, and delivery risks in parallel, then hands the bundle to Calder for a T-14d / T-7d / T-3d / T-1d / T-0 spine where every line names an owner, a dependency, and the disconfirming signal that triggers a roll-back.
---

# Skill: Demo-Build Runbook

**Trigger phrases:**
- "build the [account] demo runbook"
- "T-minus runbook for [project]"
- "demo choreography for [account]"
- "what's the demo plan"

**Owner:** Calder (Project Lead / Workstream Choreographer). Persona, output format, and anti-patterns live in `team/calder.md`. If this skill and the persona file conflict, the persona wins.

---

## Why this is a skill (not a one-shot prompt)

The load-bearing design choice is **parallel fan-out across four independent reads, then a checklist-shaped synthesis with disconfirming signals on every line**. Account stakeholders, technical readiness, calendar dates, and delivery risks are unrelated I/O surfaces. The disconfirming-signal pattern descends from Atul Gawande's *Checklist Manifesto* — a runbook line without a roll-back trigger pretends nothing can go wrong.

**Cache-prefix sharing:** the Project Delivery skills share an "account+project context" cached prefix. Pemberton and Sloan grounding cached once per session, reused across `project-plan-build`, `workstream-status`, `demo-build-runbook`, `technical-strategy`, and `stakeholder-readout`. Comment for future maintainers — not a runtime mechanism shipping today.

**Wall-clock budget: under 120 seconds end-to-end.** If a run misses that bar, the fan-out is not actually running in parallel — diagnose the dispatch pattern before tuning prompts.

---

## IO contract

- **Input:** demo name or account name, plus T-0 date (or pull from Eleanor if not provided).
- **Output:** Calder's T-minus runbook artifact, staged as a draft Markdown file in the project workspace. **Draft only** — Rolando does not auto-publish.
- **Surfaces read:** the four upstream teammates' working artifacts.
- **Surfaces written:** local filesystem only.

---

## Step 1 — Parallel fan-out (the load-bearing step)

Rolando dispatches **all four reads in a single turn, in parallel**. Do not chain them.

```
# Single Rolando turn — four Subagent invocations dispatched concurrently
Subagent(Pemberton, "Account stakeholders attending the [account] demo on [T-0 date]. Roles, recent posture, sensitivities.")
Subagent(Bob,       "Technical readiness for [demo] — environment, data, integrations. Empty if not your lane.")
Subagent(Kaz,       "Salesforce Core SE readiness — orgs, permissions, components. Empty if not your lane.")
Subagent(Eleanor,   "T-0 date confirmed, rehearsals scheduled, attendee list. Conflicts if any.")
Subagent(Matija,    "[delivery]-tagged risks affecting T-0. High-risk and watch only.")
```

If you find yourself reading one teammate's output before dispatching the next, stop. Re-dispatch the remainder in parallel.

### Fan-out targets — exact contract per teammate

| # | Teammate | Source artifact | Signal extraction rule | Output shape back to Calder |
|---|---|---|---|---|
| 1 | **Pemberton** | Account research digest | Stakeholders attending the demo, roles, recent posture, sensitivities. | Bullet list. Each: `name` · `role` · `posture / sensitivity` · `[publicly known / inferred / rumored / internal]`. |
| 2 | **Bob** | Architecture working notes | Environment, data, integrations readiness for demo. Empty if not your lane. | 0-5 lines, each with citation. |
| 3 | **Kaz** | Salesforce Core SE working notes | Orgs, permissions, components readiness. Empty if not your lane. | 0-5 lines, each with citation. |
| 4 | **Eleanor** | Calendar | T-0 date confirmed, rehearsals scheduled, attendees, conflicts. | Bullet list. Each: `date` · `event` · `attendees` · `conflict Y/N`. |
| 5 | **Matija** | Weekly risk brief, `[delivery]`-tagged lines | `[high-risk]` and `[watch]` items affecting T-0. | Bullet list. Each: `risk` · `label` · `owner` · `unblock`. |

Empty inputs are valid. If a teammate returns nothing, Calder notes the gap; they do not infer signal from absence.

---

## Step 2 — Synthesis (Calder)

Once all fan-out outputs are back, Rolando hands the bundle to Calder. Calder enforces:

- **Every T-minus line names a disconfirming signal — the roll-back trigger.** A line without a roll-back trigger pretends nothing can go wrong.
- **Every line names an owner and an inline dependency.**
- **No "everything will be fine" lines.** Calder names what could go wrong on every step.
- **No Gantt vocabulary** — this is a checklist, not a chart.
- Labeled source citation per line.

### Output format

The canonical version lives in `team/calder.md`. Reproduced here so this skill stands on its own:

```
DEMO RUNBOOK — [demo] — [demo date = T-0]

T-14d
- [task]. Owner: [name]. Depends on: [...]. Roll-back trigger: [the disconfirming signal]. [citation]
- [task]. Owner: [name]. Depends on: [...]. Roll-back trigger: [...]. [citation]

T-7d
- [...]

T-3d
- [...]

T-1d
- [...]

T-0
- [...]

POST-DEMO HANDOFF
- [artifact / debrief owner]
```

---

## Step 3 — Verification before delivering

Run Calder's anti-pattern check before handing the runbook to the user. The runbook fails if any of these are true:

- [ ] **Any line missing a roll-back trigger.** A runbook without disconfirming signals is invalid by Calder's hard rules.
- [ ] **Any line missing a named owner or inline dependency.** Routes, does not solve.
- [ ] **"Everything will be fine" language present.** Conviction shows in the named trigger.
- [ ] **Gantt vocabulary present** ("phase gate sign-off," "frozen scope," "critical path chart").
- [ ] **Citation missing on any line.** Every line, every time.
- [ ] **POST-DEMO HANDOFF section absent.** Even a one-liner for the debrief owner ships.

If any check fails, route back to Calder for a rewrite. Do not silently revise.

---

## Anti-patterns this skill forbids

1. **Sequential reads of the upstream inputs.** Parallel fan-out is the whole point.
2. **Runbook line without a roll-back trigger.** Calder hard rule, sourced from Gawande's *Checklist Manifesto*.
3. **"Everything will be fine" lines.** No padding the runbook with confidence — confidence shows in the disconfirming signals.
4. **Gantt vocabulary.** This is a checklist, not a chart.
5. **Auto-publishing the runbook.** Draft only. The user reviews and shares manually.

---

## Cadence

- Composed at T-21d for any demo on the calendar.
- Updated at every T-minus checkpoint — T-14d, T-7d, T-3d, T-1d, T-0.

---

## Wall-clock budget

Under 120 seconds end-to-end. If a run misses that bar, diagnose the dispatch pattern before tuning prompts.

---

## Eval gate (reference, not implemented)

10 fixture demos. ≥6/10 prefer this skill's output to a hand-written baseline. Eval files are not built this round — Boris ships the eval after Maggie's pedagogy gate clears. Do not ship prompt edits to this skill, to Calder's persona, or to the preceding fan-out contract without re-running the eval and confirming the threshold holds.

---

## Routing rule citation

**Artifact owner routes, synthesizer reports.** Calder owns producing and updating this artifact. Defoe synthesizes across artifacts when a status roll-up is asked — Defoe does not author runbooks.

---

## Quality checklist

- [ ] All upstream reads dispatched in a single Rolando turn (parallel, not sequential).
- [ ] Wall-clock under 120 seconds end-to-end.
- [ ] Every T-minus line names a roll-back trigger.
- [ ] Every line names an owner and an inline dependency.
- [ ] Every line carries a labeled source citation.
- [ ] No "everything will be fine" lines.
- [ ] No Gantt vocabulary.
- [ ] POST-DEMO HANDOFF section present.
- [ ] Runbook delivered as a draft — no auto-publish.
- [ ] Anti-pattern check run before delivery; failures routed back to Calder for rewrite.
