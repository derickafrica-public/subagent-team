---
description: Walk the current week's proposal loop one-by-one and apply, reject, defer, or skip each.
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

You are reviewing the weekly proposal loop interactively. One proposal at a time. The user keeps control of every change. Default-interactive — never batch-apply.

## Step 1 — Locate the proposal file

Resolve the current ISO-week file:

```bash
WEEK=$(date +%G-W%V)
FILE="<PROJECT_DIR>/team/journal/inbox/${WEEK}.md"
```

If `$FILE` does not exist, fall back to the most recent file matching `team/journal/inbox/[0-9]*.md`, excluding `_deferred.md`, `_rejected.md`, and `INDEX.md`:

```bash
FILE=$(ls -t <PROJECT_DIR>/team/journal/inbox/[0-9]*.md 2>/dev/null \
  | grep -vE '/(\_deferred|\_rejected|INDEX)\.md$' | head -1)
```

If no file resolves, print exactly:

```
No proposals to review. Run the weekly sweep to generate proposals.
```

Then stop. Do not continue.

## Step 2 — Print the honesty line

Once a file is resolved, print exactly (replace `<ISO-week>` with the resolved week):

```
Reviewing <ISO-week> proposals. Reject freely — proposals are pattern matches that can be wrong.
```

## Step 3 — Parse proposal blocks

Read the file. A proposal block starts at a line matching `^PROPOSAL ` and ends at the next line matching `^PROPOSAL ` or end-of-file. For each block, extract:

- `id` — the value after `PROPOSAL ` on the heading line
- `Summary:` — one-line plain-language summary
- `Target:` — file path or directory
- `Signal:` — what triggered the proposal
- `Signal strength:` — low / medium / high
- `Reversible:` — the reversibility note
- `Change:` block — everything between `Change:` and the next labeled key (`Apply:`, `Reject:`, or end of block)
- `Status:` — current status if present (`pending`, `applied`, `applied-manual`, `rejected`, `skipped`, `deferred`); treat absent as `pending`

## Step 4 — Skip resolved proposals

For each block whose status is `applied`, `applied-manual`, `rejected`, or `deferred`, skip silently. Do not display.

For each block whose status is `pending` or `skipped` or absent, present.

If zero unresolved blocks exist, print exactly:

```
All proposals in <ISO-week> already resolved. Nothing to review.
```

Then stop.

## Step 5 — Walk one-by-one

For each unresolved proposal, display this exact format:

```
─── Proposal <id> ───
Summary: <summary>
Target: <target>
Signal: <signal>
Signal strength: <strength>
Reversible: <reversible>

Change:
<change block>

[a]pply / [r]eject / [s]kip / [d]efer / [v]iew full diff / [q]uit
```

Then read one keystroke from the user. Accept only `a`, `r`, `s`, `d`, `v`, `q` (case-insensitive). Anything else — re-prompt.

## Step 6 — Handle each key

### `a` — apply

Determine if the target is auto-applyable. A target is auto-applyable if and only if it resolves under `<PROJECT_DIR>/` (the repo). Targets under `/Users/youruser/.claude/` or any path outside the repo are NOT auto-applyable.

**Auto-applyable path:**

1. Apply the Change block. If the Change is a unified diff, write it to a temp file and run `git apply --check <tmp>` first; if check passes, run `git apply <tmp>`. If the Change is a shell command (e.g., `mv`, `rm`, `cat <<EOF >`), execute it directly.
2. If the apply fails, print exactly: `Apply failed for <id>. Reason: <git error>. No files changed.` Then re-prompt this proposal — do not advance.
3. Stage only the affected target file(s) — never `git add -A`.
4. Build the commit subject: `self-improve: <id> — <signal-summary>`. Take the proposal's `Signal:` line, strip leading whitespace, truncate to 50 characters total after the `self-improve: <id> — ` prefix. If the resulting subject exceeds 72 chars, truncate to 72.
5. Run: `git -C <PROJECT_DIR> commit -m "<subject>"`. Capture the resulting SHA: `git -C <PROJECT_DIR> rev-parse --short HEAD`.
6. Update the proposal block in the weekly file: append (or replace) `Status: applied` and `Applied at: <ISO-8601 UTC timestamp>, commit: <sha>` immediately above the next `PROPOSAL` heading or end-of-file.
7. Print: `Applied <id> as commit <sha>.`
8. Advance to the next proposal.

**Non-repo path (e.g., `~/.claude/`):**

1. Do NOT execute. Print exactly:

   ```
   Manual apply required — target is outside the repo.
   Run this yourself:

   <change block, verbatim>
   ```

2. Then prompt: `Did you run it? [y/n] `.
3. If `y`: mark the proposal `Status: applied-manual` and append `Applied at: <ISO-8601 UTC timestamp>, manual: true`. Print: `Marked <id> applied-manual.` Advance.
4. If `n`: leave the proposal as-is (no status change). Print: `Left <id> unresolved.` Advance.

### `r` — reject

1. Prompt: `Reject reason (Enter to skip): `
2. Read a single line. Empty is fine.
3. Append the full proposal block plus the reason and a UTC timestamp to `<PROJECT_DIR>/team/journal/inbox/_rejected.md`. Format:

   ```
   ## <id> — rejected <ISO-8601 UTC>
   Reason: <reason or "(no reason given)">

   <full original proposal block>

   ---
   ```

   Create `_rejected.md` if it does not exist.
4. Update the proposal block in the weekly file: append `Status: rejected` and `Rejected at: <ISO-8601 UTC timestamp>`. Include the reason inline as `Reject reason: <reason>` if non-empty.
5. Print: `Rejected <id>.` Advance.

### `s` — skip

1. Update the proposal block in the weekly file: append (or replace) `Status: skipped`.
2. Print: `Skipped <id>. Will re-prompt next /apply-proposals run.`
3. Advance.

### `d` — defer

1. Append the full proposal block to `<PROJECT_DIR>/team/journal/inbox/_deferred.md`, prefixed with a tag line: `Deferred from <ISO-week> at <ISO-8601 UTC>`. Create `_deferred.md` if it does not exist.
2. Update the proposal block in the weekly file: append `Status: deferred` and `Deferred at: <ISO-8601 UTC timestamp>`.
3. Print: `Deferred <id>.` Advance.

### `v` — view full diff

1. Print the full Change block again, exactly as parsed.
2. Re-prompt the same proposal — do not advance.

### `q` — quit

1. Print the run summary (see Step 8 format).
2. Stop.

## Step 7 — Status update mechanics

When updating a proposal's status, use Edit tool against the weekly file. Match the exact `PROPOSAL <id>` heading line plus the rest of the block as the unique anchor. Insert status lines (`Status:`, `Applied at:`, `Rejected at:`, `Deferred at:`, `Reject reason:`) immediately before the trailing blank line that separates this proposal from the next, or before the next `PROPOSAL` heading. If the proposal already has a `Status:` line (e.g., user is overriding a prior `skipped`), replace it.

Never touch other proposals in the file. Never reorder.

## Step 8 — End-of-run summary

When all unresolved proposals have been visited (or the user quit), print exactly:

```
<n> applied, <m> rejected, <k> deferred, <j> skipped, <p> remaining.
```

Where `n` counts both `applied` and `applied-manual` from this run, `m` counts rejects, `k` counts defers, `j` counts skips, and `p` counts proposals left unresolved (e.g., from a `q` quit before the end, or non-repo path declined after `n`).

If the user did not quit (reached end of list naturally), append a second line:

```
Re-run /apply-proposals to revisit skipped items, or wait for next Sunday's sweep.
```

## Voice rules

- Direct register. "Skipped 2026-W22-01." not "I've gone ahead and skipped that one for you."
- Never use "self-improving" in any user-facing string. The word is "proposal."
- Active voice. No "lets you / allows / enables."
- Sentence capitalization in body. Title Capitalization on headings.
- Error tone is fixed: `Apply failed for <id>. Reason: <error>. No files changed.` No apology, no preamble.

## Constraints

- Never write outside `<PROJECT_DIR>/`. Specifically: never write to `/Users/youruser/.claude/`. For any target outside the repo, print the copy-pasteable command and require user confirmation.
- Never use `git add -A` or `git add .`. Stage only the target file(s) the proposal touched.
- Never amend an existing commit. Each accepted proposal is a new commit.
- Never skip git hooks. If a hook fails, print the standard error tone and re-prompt the same proposal.
- Idempotent within a week. Re-running on the same file must not double-apply, double-reject, or double-defer.
