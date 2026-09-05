---
name: project-plan-build
description: >-
  Build a multi-phase milestone spine for a named account or project, with every milestone naming
  an inline dependency, a labeled citation, and a roadmap horizon covering the next 1-3 quarters
  at low resolution. TRIGGER when the user asks to "build a project plan for [account/project]",
  "draft the [project] plan", "let's plan [demo/build]", or "what's our plan for [account]".
metadata:
  version: "1.0"
---

# Project Plan Build

Builds a phase-by-phase milestone plan for a named account or project: account context,
prioritized plays, technical shape across whatever domains apply, open commitments, and milestone
dates, synthesized into a dependency-named plan with a roadmap horizon.

> In the original multi-agent Rolando design this was owned by the `Calder` persona, with reads
> fanned out to `Pemberton`, `Sloan`, a wide technical pod (`Bob`, `Kaz`, `Aldous`, `Mick`, `Vic`,
> `Richard`, `Bessie`), `Tobias`, and `Eleanor` — see `agents/calder.md` and friends if you have the
> full roster installed, and use them as an **optional** parallel fan-out for speed. This skill
> gathers the same information directly with whatever research tools you have, so it runs
> standalone with no roster required.

**Argument:** account or project name. Optional: a target milestone date.

---

## Step 1 — Gather the inputs (in parallel tool calls where you can)

Pull together each of the following before drafting. Most technical domains below will come back
empty for any given project — that's expected; only report on the ones that apply.

| # | What to gather | Look for | Output shape | Optional persona (if roster installed) |
|---|---|---|---|---|
| 1 | **Account context** | Exec stakeholders, current strategic posture, named priorities touching the project | 3-5 lines, each labeled `[publicly known / inferred / rumored / internal]` | `Pemberton` |
| 2 | **Prioritized plays** for the account/project | Confidence-labeled plays; note any retractions | Bullet list per play: `play` · `confidence label` · `routing target` | `Sloan` |
| 3 | **Technical/solution shape** across whatever domains apply — architecture, Salesforce Core (Apex/LWC/security), integration (e.g. MuleSoft), Agentforce/experience layer, analytics, data & AI architecture, cross-cloud fitness | Solution shape, integration constraints, sizing, technical risk in each lane; leave a lane out entirely if it doesn't apply | 0-5 lines per applicable lane, each cited | `Bob` / `Kaz` / `Aldous` / `Mick` / `Vic` / `Richard` / `Bessie` |
| 4 | **Open commitments** tagged to the project | Commit, who it's owed to, exec exposure Y/N | Bullet list | `Tobias` |
| 5 | **Milestone dates** already on the calendar | Rehearsals, exec touchpoints, demo dates | Bullet list: `date` · `event` · `attendees` | `Eleanor` |

Empty inputs are valid — if a lane returns nothing, note the gap plainly rather than inventing
signal from absence.

---

## Step 2 — Synthesize the plan

Write the plan yourself, applying these hard rules:

- **Dependencies named inline on every milestone.** A plan without inline dependencies is invalid.
- **Labeled source citation per fact** (e.g. `[per account research — ...]`, `[per calendar — ...]`).
- **Roadmap horizon section** at the close — next 1-3 quarters at low resolution.
- **No waterfall vocabulary** ("phase gate sign-off," "frozen scope," Gantt-fetishism).
- **Don't write Salesforce opportunity-record fields, stages, amounts, or close dates into the plan**
  — that belongs in the CRM/opportunity record, not this artifact. Flag it as a separate follow-up
  if it needs updating.

### Output format

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

## Step 3 — Verify before delivering

Run this check before handing the plan to the user. It fails if any of these are true:

- [ ] **Any milestone without an inline dependency.**
- [ ] **Waterfall vocabulary present** ("phase gate sign-off," "frozen scope," Gantt fetishism).
- [ ] **Citation missing on any line.**
- [ ] **Salesforce opportunity-record fields, stages, amounts, or close dates written into the plan.**
- [ ] **Roadmap horizon section absent.**

If any check fails, rewrite before delivering.

---

## Anti-patterns this skill forbids

1. **Sequential research when parallel tool calls are available.**
2. **Plan without inline dependencies on every milestone.**
3. **Waterfall vocabulary that won't survive iteration.**
4. **Auto-publishing the plan.** Draft only — the user reviews and shares it manually.
5. **Writing exec copy or opportunity-record details into this plan.** Exec copy belongs in a
   readout skill (e.g. `stakeholder-readout`); CRM fields belong in the CRM.

---

## Output

Stage the plan as a draft Markdown file (e.g. `team/<slug>/project-plan.md` if you're using that
convention, or wherever you keep project docs). Draft only — no auto-publish.

## Cadence

- Build at kickoff for any new project.
- Update whenever a fact moves — a slip, a new dependency, a retracted play, or a technical-shape
  revision.

## Efficiency note

Gathering inputs and drafting the plan should take well under a couple of minutes of tool time. If
it's taking much longer, batch the research calls into parallel tool calls instead of running them
one at a time.
