---
name: meeting-notes
description: Post-meeting capture — the inverse of pre-call-prep. Triggers on "capture meeting notes from [meeting]", "process the [meeting] notes", "log the [meeting] decisions". Sylvie processes raw notes or transcript in a single pass — no fan-out — extracting decisions, action items, open questions, and quotes worth preserving. Action items route to Tobias as a side-effect after surfacing to the user.
---

# Skill: Meeting Notes

**Trigger phrases:**
- "capture meeting notes from [meeting]"
- "process the [meeting] notes"
- "log the [meeting] decisions"

**Owner:** Sylvie (Notes, Knowledge & Journaling Specialist). Persona, output formats, and anti-patterns live in `team/sylvie.md`. If this skill and the persona file conflict, the persona wins.

**Pod placement:** Personal Productivity. This skill is the **post-meeting equivalent of `pre-call-prep`** — pre-call prep fans out, meeting capture runs single-pass.

---

## Why this is a skill (not a one-shot prompt)

The load-bearing design choice is **single-pass extraction with strict separation of facts, interpretations, and lessons**. There is no fan-out to dispatch — the input is one artifact (raw notes or a transcript), and Sylvie's discipline is faithful capture, not synthesis across teammates.

The pattern earns its keep through the **routing side-effect to Tobias**: action items extracted from the notes hand to the commitment ledger after the user reviews them. That makes this a skill rather than a one-shot prompt — it integrates with the team's standing infrastructure.

**Wall-clock budget: under 60 seconds end-to-end.** Single-pass extraction; no parallelism needed.

---

## IO contract

- **Input:** raw meeting notes pasted by the user, or a transcript link, or a calendar event ID Eleanor can resolve to a transcript.
- **Output:** Sylvie's one-screen meeting summary, staged as a draft Markdown stub note in the vault. **Draft only** — Rolando does not auto-publish anything outbound.
- **Side-effect:** action items extracted from the notes route to Tobias's ledger **after** the user reviews them. Sylvie does not auto-send action items.
- **Surfaces read:** the user-supplied notes or transcript. Optionally the calendar event for attendees and time anchor.
- **Surfaces written:** local filesystem only.

---

## Step 1 — Sylvie processes the notes (single-pass)

Rolando dispatches Sylvie with the raw input. Sylvie produces the one-screen meeting summary using her standing meeting-note stub format:

```
# Single Rolando turn — Sylvie only
Subagent(Sylvie, "Process the [meeting] notes. Extract decisions, action items with owners and due dates, open questions, and quotes worth preserving. Faithful capture only — no editorializing.")
```

### What Sylvie extracts

| Element | Extraction rule | Output shape |
|---|---|---|
| **Decisions made** | Any commitment, choice, or direction stated by an attendee. | Bullet list. Each: `decision` · `who decided` · `effective date if stated`. |
| **Action items** | Verb-led commitments with an owner and (where stated) a due date. | Bullet list. Each: `[verb-led action]` · `owner` · `due date or "no date stated"`. |
| **Open questions / parked items** | Topics raised but not resolved. | Bullet list. Each: `question` · `who raised it` · `parked-for routing if known`. |
| **Quotes worth preserving** | Verbatim phrasing from a counterparty or the user that captures a posture, decision, or sensitivity. | Bullet list. Each: `"verbatim quote"` · `attributed to whom` · `1-line context`. |

**Faithful capture rule:** Sylvie quotes verbatim. No paraphrase masquerading as a quote. If the user's phrasing is fuzzy, Sylvie marks it as `[paraphrase]`.

---

## Step 2 — Output format

```
MEETING NOTES — [meeting title] — [date]

ATTENDEES
- [canonical names]

ACCOUNT / PROJECT
- [[Account]] / [[Project]]

DECISIONS
- [decision]. Decided by: [name]. Effective: [date if stated].

ACTION ITEMS (pending user review before routing to Tobias)
- [verb-led action] — owner: [name] — due: [date or "no date stated"]

OPEN QUESTIONS / PARKED
- [question]. Raised by: [name]. Parked for: [routing if known].

QUOTES WORTH PRESERVING
- "[verbatim quote]" — [attributed to] — [context]

SOURCE
- Calendar event: [event_id if available]
- Transcript / raw notes: [link or "user-pasted"]
```

The summary fits on one screen. **No padding when the meeting was thin** — a meeting that produced one decision and no action items ships a short note. Sylvie does not invent structure that was not in the input.

---

## Step 3 — Route action items to Tobias (side-effect, user-gated)

After Sylvie's summary is back, Rolando **surfaces the action items to the user first**. The user reviews, edits, or removes any items. Only after user approval does Rolando dispatch the routing call to Tobias:

```
# Sequential follow-up — only after user reviews action items
Subagent(Tobias, "Add the following action items from [meeting] on [date] to the commitment ledger: [user-approved list].")
```

**Sylvie hard rule:** Sylvie does not auto-send action items to Tobias. The user reviews first, every time. Auto-routing is the failure mode.

---

## Step 4 — Verification before delivering

Run Sylvie's anti-pattern check before handing the summary to the user. The summary fails if any of these are true:

- [ ] **Facts, interpretations, and lessons are mixed.** Sylvie hard rule — separation is non-negotiable.
- [ ] **Paraphrase masquerading as a quote.** Verbatim quotes only; paraphrase tagged as `[paraphrase]`.
- [ ] **Editorializing beyond what was said.** Faithful capture — no interpretation Sylvie cannot defend with the input.
- [ ] **Action items auto-routed to Tobias before user review.** Routing is user-gated.
- [ ] **Padding when the meeting was thin.** A short note is a valid note.
- [ ] **Source link missing.** Every meeting note carries a calendar event ID, transcript link, or "user-pasted" tag.

If any check fails, route back to Sylvie for a rewrite. Do not silently revise.

---

## Anti-patterns this skill forbids

1. **Sylvie editorializing or interpreting beyond what was said.** Faithful capture is a moral act in Sylvie's discipline.
2. **Paraphrase masquerading as a quote.** Verbatim only.
3. **Auto-routing action items to Tobias without user review.** Routing is user-gated, every time.
4. **Padding a thin meeting.** Empty-but-shipped sections are valid; invented structure is not.
5. **Auto-publishing outbound.** All Sylvie outbound is draft-only by her hard rules.

---

## Cadence

- Triggered on demand whenever the user pastes notes or asks for a meeting captured.
- Stub note created within one hour of the meeting per Sylvie's standing rule, even if it's an empty timestamped placeholder pending later transcript.

---

## Wall-clock budget

Under 60 seconds end-to-end. Single-pass extraction; no parallelism needed.

---

## Eval gate (reference, not implemented)

Sylvie-owned skills do not currently carry an eval gate target. If quality drift surfaces — paraphrase masquerading as quotes, editorialization beyond the input, action items auto-routed without review — Boris will scope a fixture set and threshold at that point.

---

## Routing rule citation

**Artifact owner routes, synthesizer reports.** Sylvie owns producing this artifact. Tobias receives the side-effect (action items) after user review. Defoe synthesizes across artifacts when a daily roll-up is asked — Defoe does not author meeting notes.

---

## Quality checklist

- [ ] Single Sylvie dispatch — no fan-out.
- [ ] Wall-clock under 60 seconds end-to-end.
- [ ] Facts, interpretations, and lessons separated cleanly.
- [ ] Quotes are verbatim; paraphrase tagged as `[paraphrase]`.
- [ ] Action items surfaced to the user before routing to Tobias.
- [ ] Source link present (calendar event, transcript, or "user-pasted").
- [ ] No padding when the meeting was thin.
- [ ] Summary delivered as a draft — no auto-publish outbound.
- [ ] Anti-pattern check run before delivery; failures routed back to Sylvie for rewrite.
