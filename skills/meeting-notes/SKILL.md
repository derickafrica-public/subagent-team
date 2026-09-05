---
name: meeting-notes
description: >-
  Process raw meeting notes or a transcript in a single pass, extracting decisions, action items
  with owners and due dates, open questions, and quotes worth preserving — faithful capture only,
  no editorializing. TRIGGER when the user asks to "capture meeting notes from [meeting]",
  "process the [meeting] notes", or "log the [meeting] decisions".
metadata:
  version: "1.0"
---

# Meeting Notes

Post-meeting capture: turn raw notes or a transcript into a one-screen summary — decisions, action
items, open questions, and quotes worth preserving. This is single-pass extraction, not synthesis:
the input is one artifact, and the discipline is faithful capture, not adding interpretation that
isn't in the source.

> In the original multi-agent Rolando design this was owned by the `Sylvie` persona — see
> `agents/sylvie.md` if you have the full roster installed for her standing stub-note format and
> vault conventions. This skill performs the extraction directly so it works standalone.

**Argument:** raw meeting notes pasted by the user, a transcript (link or pasted text), or a
calendar event you can resolve to a transcript.

---

## Step 1 — Extract, in a single pass

Read the input once and pull out each of the following. Do not editorialize or add interpretation
beyond what's stated — faithful capture is the entire job.

| Element | Extraction rule | Output shape |
|---|---|---|
| **Decisions made** | Any commitment, choice, or direction stated by an attendee. | Bullet list. Each: `decision` · `who decided` · `effective date if stated`. |
| **Action items** | Verb-led commitments with an owner and (where stated) a due date. | Bullet list. Each: `[verb-led action]` · `owner` · `due date or "no date stated"`. |
| **Open questions / parked items** | Topics raised but not resolved. | Bullet list. Each: `question` · `who raised it` · `parked-for routing if known`. |
| **Quotes worth preserving** | Verbatim phrasing from a counterparty or the user that captures a posture, decision, or sensitivity. | Bullet list. Each: `"verbatim quote"` · `attributed to whom` · `1-line context`. |

**Faithful capture rule:** quote verbatim. No paraphrase masquerading as a quote — if the source
phrasing is fuzzy or you're compressing it, mark it `[paraphrase]`.

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

ACTION ITEMS (pending user review before routing anywhere)
- [verb-led action] — owner: [name] — due: [date or "no date stated"]

OPEN QUESTIONS / PARKED
- [question]. Raised by: [name]. Parked for: [routing if known].

QUOTES WORTH PRESERVING
- "[verbatim quote]" — [attributed to] — [context]

SOURCE
- Calendar event: [event_id if available]
- Transcript / raw notes: [link or "user-pasted"]
```

The summary fits on one screen. **No padding when the meeting was thin** — a meeting that produced
one decision and no action items ships a short note. Don't invent structure that wasn't in the input.

---

## Step 3 — Route action items only after the user reviews them

Surface the action items to the user first and let them review, edit, or remove any before they go
anywhere else. Only after the user approves should you route them onward — for example, appending
them to a commitment-tracking file or ledger if your project uses one (e.g. `team/<name>-ledger.md`
if that convention exists), or simply leaving them in the note for the user to route manually if it
doesn't.

**Hard rule:** never auto-route action items before the user reviews them. Auto-routing is the
failure mode this skill exists to prevent.

---

## Step 4 — Verify before delivering

Run this check before handing the summary to the user. It fails if any of these are true:

- [ ] **Facts, interpretations, and lessons are mixed.** Separation is non-negotiable.
- [ ] **Paraphrase masquerading as a quote.** Verbatim quotes only; paraphrase tagged `[paraphrase]`.
- [ ] **Editorializing beyond what was said.** No interpretation you can't defend from the input.
- [ ] **Action items routed onward before user review.** Routing is always user-gated.
- [ ] **Padding when the meeting was thin.** A short note is a valid note.
- [ ] **Source link missing.** Every note carries a calendar event ID, transcript link, or
  "user-pasted" tag.

If any check fails, rewrite before delivering.

---

## Anti-patterns this skill forbids

1. **Editorializing or interpreting beyond what was said.** Faithful capture is the whole point.
2. **Paraphrase masquerading as a quote.** Verbatim only.
3. **Auto-routing action items without user review.**
4. **Padding a thin meeting.** Empty-but-shipped sections are fine; invented structure is not.
5. **Auto-publishing outbound.** All output here is draft-only.

---

## Output

Stage the summary as a draft Markdown note (e.g. `team/<slug>/meeting-notes/<date>-<meeting>.md`
if you're using that convention, or wherever you keep notes). Draft only — no auto-publish.

## Cadence

- Run on demand whenever the user pastes notes or asks for a meeting captured.
- Create the stub note within about an hour of the meeting where practical, even if it's an empty
  timestamped placeholder pending a later transcript.

## Efficiency note

This is single-pass extraction — no parallel research needed. It should take well under a minute
of processing once the input is in hand.
