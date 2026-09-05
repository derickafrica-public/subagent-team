---
name: stakeholder-readout
description: One-page exec readout for a named project or stakeholder touchpoint. Triggers on "exec readout for [account/project]", "stakeholder report for [project]", "[stakeholder] briefing for [project]". Sequential orchestration — Calder drafts the project-facts skeleton first, then Abigail drafts exec copy on top, then Maggie runs the pedagogy and voice gate before delivery.
---

# Skill: Stakeholder Readout

**Trigger phrases:**
- "exec readout for [account/project]"
- "stakeholder report for [project]"
- "[stakeholder] briefing for [project]"

**Owners:** Calder (project-facts skeleton), Abigail (exec copy), Maggie (pedagogy and voice gate). Personas, output formats, and anti-patterns live in `team/calder.md`, `team/abigail.md`, and `team/maggie.md`. If this skill and a persona file conflict, the persona wins.

---

## Why this is a skill (not a one-shot prompt)

The load-bearing design choice is **sequential orchestration**, not parallel fan-out. Three reasons:

1. Abigail's exec copy depends on Calder's project facts being locked first — voice cannot precede facts.
2. Maggie's pedagogy and voice gate runs on Abigail's polished output, not on raw skeleton.
3. Each step is short. The pipeline finishes inside the wall-clock budget without parallelism.

This is the **inverse pattern** from `project-plan-build`, `workstream-status`, `demo-build-runbook`, and `technical-strategy` — those four fan out reads in parallel because the inputs are independent. Here the steps depend on each other. Sequential is the right shape.

**Cache-prefix sharing:** the Project Delivery skills share an "account+project context" cached prefix. Pemberton and Sloan grounding cached once per session, reused across `project-plan-build`, `workstream-status`, `demo-build-runbook`, `technical-strategy`, and `stakeholder-readout`. Comment for future maintainers — not a runtime mechanism shipping today.

**Wall-clock budget: under 120 seconds end-to-end** for the full three-step sequence.

---

## IO contract

- **Input:** project name, exec touchpoint date, stakeholder names if not on the project plan.
- **Output:** one-page exec-register doc, staged as a draft Markdown file in the project workspace. **Draft only** — Rolando does not auto-publish.
- **Surfaces read:** Calder's project plan, the technical-strategy doc if one exists, Matija's `[delivery]`-tagged risks, Eleanor's calendar.
- **Surfaces written:** local filesystem only.

---

## Step 1 — Calder drafts the project-facts skeleton (sequential)

Rolando dispatches Calder first. Calder pulls from the project plan, technical-strategy doc, and Matija's risks, and produces:

- Milestones — status by phase
- Slips since last readout, owner-attributed
- Decisions needed, decider-named, by-date
- Open risks from Matija (`[delivery]`-tagged only)
- 3-5 non-negotiable project facts the exec copy must preserve

```
# Single Rolando turn — Calder only
Subagent(Calder, "Build the project-facts skeleton for [project] readout on [date]. Pull from project plan, technical-strategy doc, Matija risks, Eleanor calendar.")
```

**Calder hard rule:** Calder does NOT write exec copy. Skeleton only.

---

## Step 2 — Abigail drafts exec copy on top (sequential)

Once Calder's skeleton is back, Rolando hands it to Abigail. Abigail composes the exec voice and narrative arc on top of the skeleton.

```
# Sequential follow-up — Abigail only, after Calder ships the skeleton
Subagent(Abigail, "Compose exec copy on top of Calder's [project] skeleton. Voice, narrative arc, business-value framing. Do not change project facts.")
```

**Abigail hard rule:** Abigail does NOT change project facts — slips, dates, decisions, risks. Voice and framing only. Every project fact in Calder's skeleton survives into the final draft.

---

## Step 3 — Maggie runs pedagogy and voice gate (sequential)

Once Abigail's polished draft is back, Rolando hands it to Maggie for the pedagogy and voice gate.

```
# Sequential follow-up — Maggie only, after Abigail ships the polished draft
Subagent(Maggie, "Run pedagogy + voice gate on the [project] readout. Reader takeaway, Anthropic voice, Salesforce CX Style Guide compliance, accessibility, one concrete next-iteration suggestion.")
```

**Maggie hard rule:** Maggie BLOCKS the readout if voice or facts drift. She does not silently revise — she returns SHIP, REWORK, or KILL with a one-line reason.

---

## Output format

```
STAKEHOLDER READOUT — [project] — [date]

[Exec-voice opening — Abigail's composition, ~3-4 sentences]

MILESTONES (status by phase)
- [phase]: [on track / slipped <n> days / at risk]. [citation]
- [...]

SLIPS (named, owner-attributed)
- [slip]. Owner: [name]. Recovery move: [one line]. [citation]

DECISIONS NEEDED
- [decision]. Decider: [name]. By: [date].

OPEN RISKS
- [risk] [per Matija — week]. Owner: [name]. Unblock: [one move].

[Exec-voice close — Abigail's composition, ~2-3 sentences with the ask]
```

The composed doc reads as one continuous exec-register page — Calder's facts grounded throughout, Abigail's voice elevating, Maggie's gate clearing pedagogy and CX Style Guide compliance.

---

## Step 4 — Verification before delivering

Run the three-stage anti-pattern check before handing the readout to the user. The readout fails if any of these are true:

- [ ] **Calder wrote exec copy.** Calder's lane is project facts only — escalate.
- [ ] **Abigail changed a project fact** — a slip date, an owner, a decision date, a risk label. Voice only — escalate.
- [ ] **Maggie returned REWORK or KILL.** Block the readout. Do not silently deliver.
- [ ] **Citation missing on any project fact.** Every line, every time.
- [ ] **Doc exceeds one page.** Trim before delivery.
- [ ] **Salesforce CX Style Guide violations** — passive voice, banned permission verbs (see CX Style Guide §voice), product names misspelled, "agent" used outside Agentforce context.

If any check fails, route back to the responsible owner for a rewrite. Do not silently revise.

---

## Anti-patterns this skill forbids

1. **Parallel dispatch of Calder and Abigail.** Sequential is the whole point — voice cannot precede facts.
2. **Calder writing exec copy.** Hard boundary with Abigail.
3. **Abigail changing project facts.** Hard boundary with Calder.
4. **Skipping Maggie's gate.** No exec readout ships without pedagogy and voice gating.
5. **Auto-publishing the readout.** Draft only. The user reviews and shares manually.

---

## Cadence

- Composed in advance of every exec touchpoint Eleanor flags.
- Refreshed if a fact moves between draft and delivery — re-run Calder, then Abigail, then Maggie.

---

## Wall-clock budget

Under 120 seconds end-to-end for the full three-step sequence.

---

## Eval gate (reference, not implemented)

10 fixture readouts. ≥6/10 prefer this skill's output to a hand-written baseline, scored on both factual accuracy and exec-voice quality. Eval files are not built this round — Boris ships the eval after Maggie's pedagogy gate clears. Do not ship prompt edits to this skill, to Calder's, Abigail's, or Maggie's persona, or to the preceding sequential contract without re-running the eval and confirming the threshold holds.

---

## Routing rule citation

**Artifact owner routes, synthesizer reports.** Calder owns the project-facts skeleton. Abigail owns the exec voice. Maggie owns the pedagogy gate. Defoe synthesizes across artifacts when a daily roll-up is asked — Defoe does not author exec readouts.

---

## Quality checklist

- [ ] Calder dispatched first; skeleton landed before Abigail was invoked.
- [ ] Abigail dispatched second; polished draft landed before Maggie was invoked.
- [ ] Maggie ran the pedagogy and voice gate and returned SHIP.
- [ ] Wall-clock under 120 seconds end-to-end.
- [ ] Every project fact carries a labeled source citation.
- [ ] Doc fits on one page.
- [ ] Salesforce CX Style Guide compliance verified.
- [ ] Readout delivered as a draft — no auto-publish.
- [ ] Anti-pattern check run before delivery; failures routed back to the responsible owner for rewrite.
