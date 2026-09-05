---
name: demo-build-runbook
description: >-
  Build a T-minus countdown runbook for a named demo, choreographing account stakeholders,
  technical readiness, calendar dates, and delivery risks into a checklist where every line
  names an owner, a dependency, and the disconfirming signal (roll-back trigger) that would
  stop the demo. TRIGGER when the user asks to "build the [account] demo runbook", "T-minus
  runbook for [project]", "demo choreography for [account]", or "what's the demo plan".
metadata:
  version: "1.0"
---

# Demo-Build Runbook

Builds a T-14d / T-7d / T-3d / T-1d / T-0 checklist for a named demo. Every line names an owner,
an inline dependency, and a **roll-back trigger** — the disconfirming signal that would make you
stop and fix rather than proceed. The roll-back-trigger discipline descends from Atul Gawande's
*Checklist Manifesto*: a runbook line without one pretends nothing can go wrong.

> In the original multi-agent Rolando design this workflow was owned by the `Calder` persona,
> with reads fanned out to `Pemberton`, `Bob`, `Kaz`, `Eleanor`, and `Matija` — see `agents/calder.md`
> and friends if you have the full roster installed, and use them as an **optional** parallel
> fan-out for speed. This skill does the same work directly, using whatever search/query tools
> you have available, so it runs standalone with no roster required.

**Argument:** the demo or account name, plus a T-0 date if known (otherwise ask, or resolve it
from a connected calendar tool).

---

## Step 1 — Gather the five reads (do these in parallel tool calls, not one at a time)

Before drafting the runbook, gather each of the following. If you have Task/subagent dispatch
available and the full teammate roster installed, you may fan these out in parallel to the named
personas noted below — but the default path is to pull each of these yourself with whatever
research tools you have (SOQL/CRM query tool, Slack search, calendar tool, web search, project
notes) and combine the results.

| # | What to gather | Look for | Output shape | Optional persona (if roster installed) |
|---|---|---|---|---|
| 1 | **Account stakeholders** attending the demo | Names, roles, recent posture, sensitivities | Bullet list. Each: `name` · `role` · `posture / sensitivity` · `[publicly known / inferred / rumored / internal]` | `Pemberton` |
| 2 | **Technical readiness** — environment, data, integrations | 0-5 lines with a citation each; leave empty if nothing found | Bullet list, cited | `Bob` |
| 3 | **Salesforce Core readiness** — orgs, permissions, components | 0-5 lines with a citation each; leave empty if nothing found | Bullet list, cited | `Kaz` |
| 4 | **Calendar** — T-0 date confirmed, rehearsals scheduled, attendees, conflicts | Date, event, attendees, conflict Y/N | Bullet list | `Eleanor` |
| 5 | **Delivery risks** affecting T-0 | High-risk and watch-list items only | Bullet list. Each: `risk` · `label` · `owner` · `unblock` | `Matija` |

Empty inputs are valid — if a source turns up nothing for a given lane, note the gap plainly rather
than inventing signal from absence.

---

## Step 2 — Synthesize the runbook

Write the runbook yourself, applying these hard rules:

- **Every T-minus line names a disconfirming signal — the roll-back trigger.** A line without one
  pretends nothing can go wrong.
- **Every line names an owner and an inline dependency.**
- **No "everything will be fine" lines.** Name what could go wrong on every step.
- **No Gantt vocabulary** — this is a checklist, not a chart.
- **Labeled source citation per line.**

### Output format

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

## Step 3 — Verify before delivering

Run this check before handing the runbook to the user. The runbook fails if any of these are true:

- [ ] **Any line missing a roll-back trigger.**
- [ ] **Any line missing a named owner or inline dependency.**
- [ ] **"Everything will be fine" language present.**
- [ ] **Gantt vocabulary present** ("phase gate sign-off," "frozen scope," "critical path chart").
- [ ] **Citation missing on any line.**
- [ ] **POST-DEMO HANDOFF section absent.**

If any check fails, rewrite the affected section before delivering — do not silently ship a
runbook that fails its own checklist.

---

## Anti-patterns this skill forbids

1. **Sequential reads of the five inputs when parallel tool calls are available.**
2. **Runbook line without a roll-back trigger.**
3. **"Everything will be fine" padding.**
4. **Gantt vocabulary.**
5. **Auto-publishing the runbook.** Draft only — the user reviews and shares it manually.

---

## Output

Stage the runbook as a draft Markdown file in your working project notes (e.g. `team/<slug>/demo-runbook.md`
if you're using that convention, or wherever you keep project docs). Draft only — do not auto-publish
or auto-send it anywhere.

## Cadence

- Compose at T-21d for any demo on the calendar.
- Update at every T-minus checkpoint — T-14d, T-7d, T-3d, T-1d, T-0.

## Efficiency note

Gathering the five reads and drafting the runbook should take well under a couple of minutes of
tool time. If it's taking much longer, you're likely making the five research calls sequentially —
batch them into parallel tool calls instead.
