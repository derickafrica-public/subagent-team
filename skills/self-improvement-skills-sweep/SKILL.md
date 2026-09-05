---
name: self-improvement-skills-sweep
description: >-
  Weekly proposal loop for skills — reads the recent mistake journal, the user's skill catalogs
  (both a user-level ~/.claude/skills/ and a project-level team/skills/), and the prior weekly
  proposal file, then drops a single proposal file with at most 5 candidate actions (retire /
  merge / tighten / promote) for the user to apply or reject. TRIGGER when the user says "run the
  weekly skills sweep", "skills sweep", "self-improvement sweep", "run the sweep", or this skill is
  invoked headlessly by a scheduled job (e.g. a launchd job like com.rolando.self-improve-sweep,
  if one is configured in your environment). DO NOT TRIGGER when the user is talking about skills
  generally, asking "what skills do we have", editing or building a skill, running an unrelated
  scheduled skills refresh, or asking about memory / rules / hooks / plugins (those are separate
  sweeps, out of scope here).
metadata:
  version: "1.0"
---

# Skill: Weekly Proposal Loop — Skills Sweep

This sweep covers skills only. Memory, rules, hooks, and plugins are out of scope — if you build
sweepers for those later, keep them as separate passes, not folded into this one.

You are reading recent corrections plus the two skill catalogs and proposing at most five small,
reversible changes. Each proposal is a 30-second decision for the user. Direct register. Reject
freely is the user's right and the system depends on it.

> Proposals are pattern matches over recent corrections. They can be wrong. Reject freely. — this
> exact line lands at the bottom of every weekly file.

---

## Inputs to read (in this order)

Read these and only these. Do not browse outside this list.

1. **Stop-event journal — rolling 30-day window**
   - Current month: `team/journal/mistakes/$(date +%Y-%m).md`
   - Prior month: `team/journal/mistakes/$(date -v-1m +%Y-%m).md` if it exists
   - Schema is in `team/journal/README.md`. Each entry has `signal_type` (`stop-with-correction` or
     `stop-clean`), `evidence` (one line), and `session_id`. Treat `stop-with-correction` as the
     high-signal entries; `stop-clean` is background.

2. **User-level skill catalog** — `~/.claude/skills/`
   - List subdirectories. For each, read the first ~40 lines of `SKILL.md` (or root `*.md` if no
     `SKILL.md`) to get `name` and `description`.

3. **Team-level skill catalog** — `team/skills/`
   - Each `*.md` in this directory. Read the first ~40 lines for trigger phrases.

4. **Prior weekly proposal files** — `team/journal/inbox/`
   - Read the previous 1-2 ISO-week files (e.g., `2026-W21.md`) to detect recurring proposals —
     same `Target:` appearing two weeks in a row. Recurring items get prioritized in the TL;DR.
   - Read `team/journal/inbox/_deferred.md` if it exists. These are proposals that overflowed the
     5-cap last week and must be merged back into the priority pool this week.

5. **Session JSONLs — only if needed for skill-invocation counts**
   - `~/.claude/projects/-Users-youruser-claude-projects/*.jsonl`
   - Use `jq`, not `awk`. Example one-liner to count how often a named skill appears in tool_use
     blocks across all sessions in the last 60 days:
     ```bash
     find ~/.claude/projects/-Users-youruser-claude-projects -name '*.jsonl' -mtime -60 \
       -exec jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .name' {} + \
       | sort | uniq -c | sort -nr
     ```
   - Do not read more than necessary. If the journal alone gives you enough signal, skip this.

6. **Memory index — context only** — `~/.claude/projects/-Users-youruser/memory/MEMORY.md`
   - Read for context. Do NOT propose changes to memory in this sweep. Memory is out of scope here
     (a separate sweeper's job, if one exists in your environment).

---

## What triggers a proposal

Four proposal types. Each needs a `Signal strength` rating: `low`, `medium`, or `high`, based on
data confidence. Be honest about it.

### 1. Retire
- A skill not invoked in 60+ days.
- Signal: `tool_use` count for that skill name across the JSONL window = 0.
- Signal strength: `high` if the JSONL window is complete and clearly shows zero uses; `medium` if
  the window may be incomplete; `low` if you only have catalog metadata and no invocation data.

### 2. Merge
- Two skills with semantically near-identical descriptions or trigger patterns.
- Cite both target paths in the proposal block.
- Signal strength: `medium` by default. `high` only if the trigger phrases overlap word-for-word.

### 3. Tighten trigger
- A skill whose entries in the journal show repeated `stop-with-correction` signals where the
  matched phrase suggests the skill misfired (e.g., "no, I didn't ask for X" in the context of
  skill X having just run).
- Cite at least 2 journal entries by timestamp.
- Signal strength: `high` only with 3+ matching entries; `medium` with 2; below 2 — don't propose.

### 4. Promote slash command to skill
- A slash command invoked 3+ times in the last 30 days with similar prompts (read the journal
  evidence and the JSONL transcripts).
- A stable trigger phrase + reusable workflow = skill candidate.
- Signal strength: `medium` until the trigger phrase is genuinely stable; `high` only with 5+
  invocations and a clear repeated phrase.

If the data does not clear the bar above, do not invent a proposal. The honest move is fewer
proposals, not weaker ones.

---

## Cap and overflow

Hard cap: 5 proposals per week.

If more than 5 candidates clear the bar:
1. Rank by signal strength: `high` first, then `medium`, then `low`.
2. Within the same strength, rank by recency of the most recent supporting journal entry.
3. The first 5 land in this week's file.
4. Remaining go to `team/journal/inbox/_deferred.md` (single rolling file, not per-week). Each
   carries `Deferred from <ISO-week>` so next week's sweep merges them back into the pool.

Recurring detection: if a `Target:` appeared in the prior 1-2 weekly files and is still a candidate
this week, mark it `Recurring` in the TL;DR. Recurring items are the highest-signal items.

---

## Output path

`team/journal/inbox/<ISO-week>.md`

ISO week format: `%G-W%V` — for example, `2026-W22.md`. Use `date +%G-W%V` (BSD/macOS `date`).
Never use `%Y-W%V` — `%Y` and `%V` disagree at year boundaries.

Writes ONLY inside `claude-projects/team/`. Never write into `~/.claude/`. Proposals targeting
`~/.claude/skills/` must include a copy-pasteable apply command in the body that the user runs
manually.

---

## Output format — the weekly file

The whole file is one Markdown document. Top section is the TL;DR. Then the proposal blocks in
priority order. Then the honesty line at the bottom.

### TL;DR header (always present)

```
# Weekly Proposal Loop — <ISO-week>

Total proposals: <n>
By target: <count by target file or directory>
Recurring (2nd+ week): <list of targets, or "none">
Estimated review time: <n × 30s = ~Xm>
Cap: 5 per week. Overflow deferred to next week.

---
```

### Proposal block (repeat per proposal, max 5)

```
PROPOSAL <id>
Summary: <one-line plain-language summary, above the diff. THIS IS THE FIELD THAT PROTECTS THE 30-SECOND-PER-PROPOSAL TARGET.>
Target: <file path>
Signal: <what triggered this; cite journal entries by timestamp or counts>
Signal strength: <low | medium | high>
Reversible: yes — git revert <sha after apply>
Change:
<unified diff for paths inside claude-projects/, OR a copy-pasteable mv / rm / cat <<EOF > command for paths under ~/.claude/>
Apply: /apply-proposal <id>
Reject: /reject-proposal <id>
```

`<id>` format: `<ISO-week>-<seq>`, e.g., `2026-W22-01`. Sequence within the week file.

For `~/.claude/skills/` retirements, the `Change:` block is a copy-pasteable shell command, not a
diff. Example:

```
Change:
# User runs this manually — the sweep does not write to ~/.claude/
mv ~/.claude/skills/<name> ~/.claude/skills/.retired/<name>-$(date +%Y-%m-%d)
```

### Honesty line (always last)

```
---
Proposals are pattern matches over recent corrections. They can be wrong. Reject freely.
```

---

## Empty-week handling

If the journal has fewer than 5 entries in the rolling 30-day window, emit the file but with zero
proposals:

```
# Weekly Proposal Loop — <ISO-week>

No proposals this week. Journal had <n> entries — too few to draw signal from. See
team/journal/mistakes/ for what was captured.

---
Proposals are pattern matches over recent corrections. They can be wrong. Reject freely.
```

This is honest-about-limits. Do not pad with weak proposals to look productive.

---

## Voice rules

- Never use "self-improving" anywhere user-facing. Use "weekly proposal loop."
- Active voice. Imperative or "you can." Never "lets you / allows / enables / empowers."
- Sentence capitalization in body and list items. Title Capitalization in headings only.
- Exact product names if any appear: Agentforce, Data Cloud, Apex, Lightning Experience,
  AppExchange. Metadata API has no "the."
- Error tone: `Apply failed for <id>. Reason: <git error>. No files changed.` No apology theater.
- Short sentences. One idea per line in proposal bodies.

---

## Dry-run flag

Early runs (recommend at least the first 3 scheduled runs) should support `--dry-run`. If invoked
by a scheduled job, pass the flag via the prompt. When dry-run is set, write the file to
`team/journal/inbox/<ISO-week>.dryrun.md` instead of `<ISO-week>.md`, and prepend a single line at
the very top of the file:

```
DRY RUN — proposals not yet active.
```

Do not write to `_deferred.md` on dry-run. Dry-run is read-only outside the dryrun file.

---

## Ordering of work in this single turn

You get one turn. Do this, in order, with tool calls — never narrate "I'll do X next":

1. Read journal files in the rolling 30-day window. Count entries; categorize by `signal_type`.
2. List `~/.claude/skills/` and `team/skills/`. Read enough of each to get name + description.
3. Read prior 1-2 weekly proposal files in `team/journal/inbox/`, plus `_deferred.md` if present.
4. If signal warrants, run the JSONL jq one-liner for skill invocation counts.
5. Identify candidates. Score signal strength. Honest about it.
6. If <5 journal entries: write the empty-week file. Stop.
7. Otherwise: rank candidates, take the top 5, write the weekly file. Overflow to `_deferred.md`.
8. Final response: a 3-line summary — file path written, count of proposals, count deferred. No
   preamble.

---

## Hand-offs

If a finding implies something larger than a skill action for this sweep — e.g., "the team needs a
new capability we don't have," "the journal is missing a category we should capture" — do not
propose it in this file. Note it for the user in the final summary instead. Deciding what to do
with that note is the user's call, not this sweep's — it stays out of scope here on purpose.
