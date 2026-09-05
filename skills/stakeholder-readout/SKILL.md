---
name: stakeholder-readout
description: >-
  Build a one-page exec readout for a named project or stakeholder touchpoint, in three sequential
  passes — lock the project facts first, compose exec voice on top without changing any fact, then
  run a pedagogy and voice gate before delivery. TRIGGER when the user asks for an "exec readout
  for [account/project]", "stakeholder report for [project]", or "[stakeholder] briefing for
  [project]".
metadata:
  version: "1.0"
---

# Stakeholder Readout

Builds a one-page exec readout for a project or stakeholder touchpoint. This is **sequential**
work, not parallel fan-out: voice cannot precede facts, and the quality gate has to run on the
polished draft, not the raw skeleton. Each pass is short, so doing them in order still finishes
quickly.

> In the original multi-agent Rolando design these three passes were split across personas —
> `Calder` (project-facts skeleton), `Abigail` (exec copy), and `Maggie` (pedagogy/voice gate). See
> `agents/calder.md`, `agents/abigail.md`, and `agents/maggie.md` if you have the full roster
> installed and want to dispatch each pass to its persona. This skill performs all three passes
> directly, in order, so it works standalone.

**Argument:** project name, exec touchpoint date, and stakeholder names if you don't already have
them from a project plan.

---

## Step 1 — Draft the project-facts skeleton (facts only, no voice)

Pull from whatever project plan, technical-strategy notes, and risk log you have for this project,
and produce:

- Milestones — status by phase
- Slips since last readout, owner-attributed
- Decisions needed, decider-named, by-date
- Open delivery risks (not deal/account risks — just what's blocking delivery)
- 3-5 non-negotiable project facts the next pass must preserve unchanged

**Hard rule for this step:** facts only. Do not write exec voice or narrative framing yet — that's
the next pass, and mixing them here makes it impossible to check that voice didn't quietly change
a fact.

---

## Step 2 — Compose exec copy on top (voice only, facts frozen)

Write the exec-voice opening and close, and the framing around each fact from Step 1. Voice,
narrative arc, and business-value framing only.

**Hard rule for this step:** do not change any project fact from Step 1 — no slip date, no owner,
no decision date, no risk label. Every fact from the skeleton must survive into this draft
unchanged. If a fact turns out to be wrong, fix it in the skeleton and re-run this step — don't
silently correct it while adding voice.

---

## Step 3 — Run the pedagogy and voice gate yourself before delivering

Before handing the readout to the user, check the polished draft against:

- **Reader takeaway is clear** — someone skimming this once knows what changed and what's needed
  from them.
- **Voice is empirical, with warmth but no hype.**
- **Salesforce CX Style Guide compliance** — active voice, no banned permission verbs ("lets you,"
  "allows you to," "enables users to"), product names spelled correctly, "agent" used only in
  Agentforce context, gender-neutral language.
- **Accessibility** — plain structure, no meaning conveyed by color/formatting alone.
- **One concrete next-iteration suggestion**, even if it's small.

Give this a verdict: **SHIP**, **REWORK** (revise Step 2's voice pass and re-check), or **KILL**
(the facts or ask are broken — go back to Step 1). Don't silently revise and ship anyway — say
which verdict you landed on and why.

---

## Output format

```
STAKEHOLDER READOUT — [project] — [date]

[Exec-voice opening — ~3-4 sentences]

MILESTONES (status by phase)
- [phase]: [on track / slipped <n> days / at risk]. [citation]
- [...]

SLIPS (named, owner-attributed)
- [slip]. Owner: [name]. Recovery move: [one line]. [citation]

DECISIONS NEEDED
- [decision]. Decider: [name]. By: [date].

OPEN RISKS
- [risk] [citation]. Owner: [name]. Unblock: [one move].

[Exec-voice close — ~2-3 sentences with the ask]
```

The composed doc should read as one continuous exec-register page — facts grounded throughout,
voice elevating them, not replacing them.

---

## Step 4 — Verify before delivering

Run this check before handing the readout to the user. It fails if any of these are true:

- [ ] **Step 2 changed a project fact from Step 1** — a slip date, an owner, a decision date, a
  risk label.
- [ ] **The Step 3 gate returned REWORK or KILL and it wasn't acted on.** Never ship a readout the
  gate flagged — fix it or say so.
- [ ] **Citation missing on any project fact.**
- [ ] **Doc exceeds one page.** Trim before delivery.
- [ ] **Salesforce CX Style Guide violations** — passive voice, banned permission verbs, misspelled
  product names, "agent" used outside Agentforce context.

If any check fails, go back to the relevant step and redo it — do not silently patch the final
draft.

---

## Anti-patterns this skill forbids

1. **Doing the voice pass before the facts are locked.** Sequence matters here.
2. **Changing a project fact during the voice pass.**
3. **Skipping the pedagogy/voice gate.** No exec readout ships without it.
4. **Auto-publishing the readout.** Draft only — the user reviews and shares it manually.

---

## Output

Stage the readout as a draft Markdown file (e.g. `team/<slug>/stakeholder-readout-<date>.md` if
you're using that convention, or wherever you keep project docs). Draft only — no auto-publish.

## Cadence

- Compose ahead of every exec touchpoint you know about.
- Refresh if a fact moves between draft and delivery — redo Step 1, then Step 2, then Step 3, in
  that order.

## Efficiency note

Each of the three passes is short. Done in order, the whole readout should still take well under a
couple of minutes — the discipline here is sequencing, not speed.
