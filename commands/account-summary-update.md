---
description: Refresh or build the account-summary HTML+MD pair via the account-summary-refresh workflow — a named invocation, which is itself a valid ultracode opt-in (no "ultracode" keyword needed).
allowed-tools: Workflow, Bash
argument-hint: [account name — required, no default ships with this plugin]
---

You are running the deterministic path for the account-summary skill (`.claude/skills/account-summary/SKILL.md`). This command exists because natural-language phrasing like "update account summary for [Account]" depends on Rolando re-matching the request against a CLAUDE.md routing table every turn, with no harness-level guarantee it fires. This command bypasses that entirely — typing it is the guarantee.

## Step 1 — Resolve account + slug

- If `$ARGUMENTS` is empty, ask the user which account to run this for. This plugin ships with no default account — do not guess or fall back to an example account.
- If `$ARGUMENTS` names an account:
  - Derive `slug` by lowercasing the name, replacing `&` with "and", replacing spaces and remaining punctuation with `-`, and collapsing repeats.
  - Show the resolved `account` and `slug` to the user in one line before proceeding — do not silently guess a slug for an account that hasn't been run before.

## Step 2 — Resolve today's date

Run:

```bash
date +%Y-%m-%d
```

(Adjust the `TZ=` prefix if you want a specific timezone's "today" — the original install used its
owner's local timezone; this plugin ships with no hardcoded timezone.) Use this value as `runDate`.
Workflow scripts cannot call `Date.now()` or `new Date()` themselves — that would break resume — so
the caller (this command) always supplies it.

## Step 3 — Back up existing artifacts, then run the workflow

Follow `.claude/skills/account-summary/SKILL.md` § "Fast path — a named Workflow call IS the
ultracode opt-in" exactly — it is the single source of truth for the backup step, the
`Workflow(...)` call shape (by `name`, with the `scriptPath` fallback), and why this call is itself
a valid ultracode opt-in (a named invocation, no "ultracode" keyword required). Use the
account/slug/date resolved in Steps 1–2 as the args, plus `projectDir` set to this project's root —
the workflow ships with no default path and errors if it is omitted. Do not re-derive the mechanics
here — read that section and execute it.

## Step 4 — Report back

When the workflow completes:

- Confirm both file paths (`<slug>-account-summary.html`, `<slug>-account-summary.md`).
- Summarize what the Baseline / Research / Expert POVs / Build phases found — the delta since last run, or "first build" if this is a fresh account.
- Surface the Boris / Maggie / HTML-MD-consistency gate verdicts explicitly. If any gate returned REWORK or KILL, say so before treating the run as done — never silently ship a flagged artifact.

## Voice

Direct. State the resolved account/slug/date before the run starts, so the user can catch a bad slug guess before committing to the 20–30 minute background run.
