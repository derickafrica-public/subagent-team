---
name: technical-strategy
description: >-
  Composed technical-strategy document for a named account or project — account context, solution
  shape, demo plan, and an exec-narrative skeleton, every line cited to its source. Gathers account
  research, prioritized plays, and a technical-domain sweep (architecture, core platform,
  integration, experience layer, analytics, data & AI) before composing, so the strategy never
  outruns its evidence. TRIGGER when the user says "draft the [account] technical strategy",
  "build technical strategy for [project]", "what's our technical POV on [account]", or "technical
  strategy for [account/project]".
metadata:
  version: "1.0"
---

# Skill: Technical Strategy

**Trigger phrases:**
- "draft the [account] technical strategy"
- "build technical strategy for [project]"
- "what's our technical POV on [account]"
- "technical strategy for [account/project]"

**You get:** a draft Markdown technical-strategy document — account context, solution shape, demo
plan, and an exec-narrative skeleton — with a labeled source citation on every line. Draft only;
this skill does not auto-publish.

In the original multi-agent design, this skill's inputs were gathered by named personas —
`Pemberton` (account research), `Sloan` (prioritized plays), and a seven-way technical pod
(`Bob`, `Kaz`, `Aldous`, `Mick`, `Vic`, `Richard`, `Bessie`) — and composed by `Calder` (see
`team/calder.md` if you have the full roster installed). This skill gathers those inputs and
composes the document directly. If your environment happens to have that roster installed,
dispatching each lane below to its named persona **in parallel, in a single turn** is a valid
optional enhancement — it is not required for this skill to work.

---

## Why this skill separates gathering from composing

The load-bearing design choice is **gathering account context, prioritized plays, and technical
solution shape as independent reads before composing** — these are unrelated inputs, and letting
composition start before all of them are in hand produces a strategy that outruns its evidence.
Composition here means **synthesis, not derivation**: every line in the output cites the input it
came from; nothing is re-derived from scratch inside the write-up.

**If dispatching parallel subagents** for the gathering step, do all of it in a single turn — do
not read one teammate's output before dispatching the next. **Wall-clock budget in that mode:
under 120 seconds end-to-end.** If a run misses that bar, the fan-out is not actually running in
parallel — diagnose the dispatch pattern before tuning prompts. If gathering directly yourself
instead (the primary path), there's no fixed budget, but keep the reads efficient and move
straight to composition once you have enough signal.

---

## IO contract

- **Input:** account or project name.
- **Output:** the technical-strategy document, staged as a draft Markdown file in the project
  workspace. **Draft only** — do not auto-publish. If the user wants exec copy layered on top,
  that's a separate follow-on step (in the original design, `stakeholder-readout`, drafted by the
  `Abigail` persona) — this skill stops at the project-facts-only exec-narrative skeleton.
- **Surfaces read:** whatever account/project research, working notes, and technical artifacts you
  have access to (local files, `team/` or `accounts/` workspaces, prior research notes).
- **Surfaces written:** local filesystem only.

---

## Step 1 — Gather inputs across the following lanes

Gather each lane below yourself from available research, notes, and artifacts. Cite the source of
every fact you pull. Most technical-domain lanes are expected to come back **empty** on any given
project — that is the normal case, not a gap to fill by inventing content.

| # | Lane | What to extract | Output shape | Original persona (optional fan-out target) |
|---|---|---|---|---|
| 1 | Account context | Exec stakeholders, current strategic posture, named priorities for the account/project. | 3-5 lines, each labeled `[publicly known / inferred / rumored / internal]`. | `Pemberton` |
| 2 | Prioritized plays | Confidence-labeled plays for the account/project; retractions called out if any. | Bullet list per play: `play` · `confidence label` · `routing target`. | `Sloan` |
| 3 | Architecture / solution shape | Integration constraints, sizing, technical risk. | 0-5 lines, labeled citation. Empty is the expected default. | `Bob` |
| 4 | Core platform shape | Core CRM/platform-layer fit and constraints. | 0-5 lines, labeled citation. | `Kaz` |
| 5 | Integration middleware shape | Cross-system integration constraints. | 0-5 lines, labeled citation. | `Aldous` |
| 6 | Experience / agent layer shape | Agent tooling or experience-layer fit. | 0-5 lines, labeled citation. | `Mick` |
| 7 | Analytics shape | Reporting/analytics fit and constraints. | 0-5 lines, labeled citation. | `Vic` |
| 8 | Data & AI architecture shape | Data model and AI architecture fit. | 0-5 lines, labeled citation. | `Richard` |
| 9 | Cross-cloud data & AI fitness | Gating concerns spanning multiple clouds/products. | 0-5 lines, labeled citation. | `Bessie` |

Empty inputs are valid — note the gap in the write-up rather than inferring signal from absence.

---

## Step 2 — Compose the strategy document

Once the inputs above are gathered, compose the document. Enforce these rules while writing:

- **Composition, not derivation.** Every line in ACCOUNT CONTEXT and SOLUTION SHAPE cites the lane
  it came from. Do not re-derive an input's work from scratch.
- **Composed arc — account context → solution shape → demo plan → exec narrative skeleton.**
- **Exec narrative skeleton names project facts only** — no exec voice, no marketing language.
  That layer is a separate follow-on (`Abigail`'s lane in the original design), not this skill's job.
- Labeled source citation on every line.

### Output format

```
TECHNICAL STRATEGY — [project] — [date]

ACCOUNT CONTEXT
- [3-5 lines, every one cites the account-context or prioritized-plays lane]

SOLUTION SHAPE
- [3-5 lines, every one cites a technical-domain lane]

DEMO PLAN
- [milestones lifted from the project plan, citations preserved]

EXEC NARRATIVE SKELETON
- [project facts only — no exec copy, no marketing voice]

OPEN QUESTIONS
- [named gaps, with a note on who/what should resolve them]
```

---

## Step 3 — Verification before delivering

Run this check before handing the strategy doc to the user. It fails if any of these are true:

- [ ] **Any line in ACCOUNT CONTEXT or SOLUTION SHAPE missing a source citation.** Composition,
      not derivation.
- [ ] **EXEC NARRATIVE SKELETON contains exec copy or marketing voice.** Project facts only.
- [ ] **DEMO PLAN section invents new milestones not present in the project plan.** Lift, don't
      invent.
- [ ] **OPEN QUESTIONS section absent.** Even an empty header ships with
      "*no open questions this pass*".
- [ ] **Citation missing on any line.** Every line, every time.

If any check fails, rewrite before delivering. Do not silently ship a failing draft.

---

## Anti-patterns this skill forbids

1. **Sequential reads of the gathering lanes** when parallel fan-out (direct or via subagents) is
   available. Parallelism is the whole point of Step 1.
2. **Re-deriving an input lane's work** inside the composed document. Composition, not derivation.
3. **Writing exec copy in EXEC NARRATIVE SKELETON.** That's a separate follow-on layer.
4. **Inventing milestones in DEMO PLAN.** Lift from the project plan.
5. **Auto-publishing the strategy doc.** Draft only. The user reviews and shares manually.

---

## Cadence

- Composed at kickoff for any new project.
- Revised when a prioritized play is retracted or a technical-domain lane's solution shape changes.

---

## Eval gate (reference, not implemented)

10 fixture projects. ≥6/10 prefer this skill's output to a hand-written baseline. Eval files are
not built yet — build them before shipping prompt edits to this skill's composition rules without
re-confirming the threshold holds.

---

## Routing rule

**Artifact owner routes, synthesizer reports.** This skill owns producing and updating the
technical-strategy artifact for a given account/project. A cross-artifact status roll-up (e.g.
"what's the status of everything on this account") is a different job — don't conflate the two.

---

## Quality checklist

- [ ] All gathering lanes covered — directly, or via parallel fan-out if dispatching subagents.
- [ ] Wall-clock under 120 seconds end-to-end if using parallel subagent fan-out.
- [ ] Every line in ACCOUNT CONTEXT and SOLUTION SHAPE cites a source.
- [ ] EXEC NARRATIVE SKELETON contains project facts only — no exec voice.
- [ ] DEMO PLAN milestones lifted from the project plan, not invented.
- [ ] OPEN QUESTIONS section present (even if empty).
- [ ] Strategy doc delivered as a draft — no auto-publish.
- [ ] Verification check run before delivery; failures fixed before shipping.
