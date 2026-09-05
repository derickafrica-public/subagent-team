---
name: account-research
description: >-
  Account research, brainstorming, and analysis workspace with persistent per-account memory.
  Use when the user wants to work on a customer/prospect account: research it, brainstorm ideas,
  track opportunities from my-org (Salesforce), search Slack / Google Drive / internal knowledge /
  the web for updates, run a SWOT, triage signal-vs-noise, or ask about documents in a Drive folder.
  Maintains memory in Markdown under accounts/. TRIGGER when the user runs /account-research,
  says "work on <account>", "research <account>", "set up a new account", "what's new with <account>",
  "track opportunities for <account>", "any new docs for <account>", or asks for account analysis/SWOT.
  Also trigger when the user mentions a company name in a sales/customer context.
metadata:
  version: "1.0"
---

# Account Research & Memory

A workspace for researching accounts, brainstorming, and keeping durable memory across sessions.
Data lives as **Markdown** under `accounts/` (readable/editable, Obsidian-friendly).

**Argument (optional):** `$ARGUMENTS` may name an account (e.g. `/account-research Coupe Health`)
or an intent (e.g. `/account-research new`). If empty, run the router below.

---

## Core principles (read first, every time)

1. **Analyze, don't just report.** The user explicitly wants an opinion. Every time you surface
   information, add a "so what?": what it means for this account, whether it's signal or noise,
   and what (if anything) to do. Do a SWOT when it helps. Flag what deserves attention. Say when
   something is just noise. A bare list of headlines or opportunities is a failure mode.
2. **Memory is the point.** Persist your work. After any meaningful session, append to the
   account's `memory-log.md` and update the relevant file(s). When re-entering an account, read
   its memory first so you continue rather than restart. See `references/file-structure.md`.
3. **Cite sources.** Note where each fact came from (SFDC, Slack, a specific Drive doc, a URL,
   internal wiki). The user needs to trust and trace the memory.
4. **`my-org` = the user's connected Salesforce org** (alias `my-org`). "Opportunities in my-org"
   means SOQL against it. Never invent pipeline numbers — pull them.
5. **Today's date** is available in context — use it for "recent", date-stamping, and `when:` web filters.

---

## Router — what to do when invoked

**Step 1 — Figure out if this is a NEW or EXISTING account.**

First read the index to see what already exists:
- Read `accounts/_index.md` and list the account folders: `ls accounts/`.

Then:
- If `$ARGUMENTS` names an account that matches an existing folder → **Existing account** (go to §Existing).
- If it names an account with **no** folder → confirm, then **New account** (go to §Setup).
- If `$ARGUMENTS` is empty or ambiguous → **ask the user directly**:

  > "Are we working on a **new** account or an **existing** one? If existing, which — I have:
  > [list existing accounts]."

  Use the AskUserQuestion tool for this when it helps. Then branch to §Setup or §Existing.

Do **not** skip this branch. The user specifically wants to be asked new-vs-existing.

---

## §Setup — onboard a NEW account

Goal: create the account's folder + memory files, seed them from a first pass across sources,
and end with an initial analysis. Be conversational; confirm before writing lots of files.

1. **Identify the account in my-org.** Run the resolver (it disambiguates — many similarly named
   entities exist, and the real one usually has open opportunities):
   ```bash
   .claude/skills/account-research/scripts/find-account.sh "<name the user gave>"
   ```
   Show the candidates (name, industry, website, owner, # open opps). **Ask the user to confirm
   which Account Id is the right one** — do not assume. If none match, the account may not be in
   my-org yet; proceed with a manual profile and leave `sfdc_account_id` blank.

2. **Collect setup inputs.** Ask the user for anything you can't derive (keep it short — offer to
   fill the rest later):
   - Confirmed **SFDC Account Id** (from step 1).
   - **The account's dedicated Google Drive folder** — a link or folder ID. Each main account has
     its own folder that the user continuously adds to and modifies; this folder is the anchor for
     document Q&A and new/changed-doc detection, so **ask for it during setup** and store the ID in
     `drive-log.md`. (If they don't have it yet, proceed and capture it on first Drive request.)
   - Primary **Slack channel(s)** if any.
   - **Tier / priority** and a one-line "why they matter."

3. **Create the workspace.** Compute a `slug` (lowercase, hyphenated, e.g. `coupe-health`).
   Copy every template from `accounts/_templates/` into `accounts/<slug>/`,
   create `accounts/<slug>/research/`, and fill the `{{PLACEHOLDER}}` tokens
   (`{{ACCOUNT_NAME}}`, `{{SLUG}}`, `{{SFDC_ACCOUNT_ID}}`, `{{WEBSITE}}`, `{{INDUSTRY}}`,
   `{{OWNER}}`, `{{DATE}}` = today, `{{DRIVE_FOLDER}}`, `{{DRIVE_FOLDER_ID}}`, `{{SLACK_CHANNEL}}`,
   `{{ONE_LINER}}`). Use the Write tool per file. See `references/file-structure.md` for the fill rules.

4. **Seed from sources (first pass).** Do a light sweep — details in `references/data-sources.md`:
   - **Opportunities:** run `scripts/sync-opps.sh --id <AccountId>` and paste the tables into
     `opportunities.md`; add your read of the pipeline.
   - **Drive:** if a folder was given, list it and populate `drive-log.md` (this becomes the
     baseline for new-doc detection).
   - **Slack + internal knowledge:** quick search for the account name; note anything live.
   - **Web:** pull recent news (leadership changes, key objectives, business trends) via the
     Google-News-RSS recipe; keep only what matters.

5. **Initial analysis.** Fill `swot.md` (at least a BLUF + a first-cut SWOT) and triage findings
   into `signals.md` (🔴 attention / 🟡 watch / ⚪ noise). This is the deliverable — lead with it.

6. **Record memory + index.** Append a setup entry to `memory-log.md`, and add the account as a
   row in `_index.md`. Tell the user what you created and what you found.

---

## §Existing — work an EXISTING account

1. **Load memory first.** Read, in order: `profile.md`, the top of `memory-log.md` (most recent
   entries), then whichever of `opportunities.md` / `swot.md` / `signals.md` / `drive-log.md` is
   relevant to the request. This is how you "remember." Briefly recap where things stand.

2. **Do the requested work** (see the command playbook below).

3. **Always update memory.** After the work, append a dated entry to `memory-log.md`, update any
   file whose facts changed (in place), and refresh `updated:`/`last_synced:` frontmatter + the
   `_index.md` row. Never do work and leave no trace.

### Command playbook (route the user's ask)

| The user says… | Do this |
|----------------|---------|
| "track / refresh opportunities", "what's the pipeline" | Run `scripts/sync-opps.sh --id <id>`, update `opportunities.md`, then **give your read**: which deals are real/slipping, risk, what to chase. |
| "what's new", "any updates" | Sweep Slack + internal knowledge + web (see data-sources.md), triage into `signals.md`, lead with 🔴/🟡. Say plainly if it's mostly noise. |
| "any new documents", "check the Drive folder" | Run the **Drive new-doc detection** procedure below; report new/changed docs, summarize the important ones, update `drive-log.md`. |
| "new doc: <link/id>" (manual heads-up) | Read that file, summarize, note why it matters, add to `drive-log.md` and (if material) `signals.md`. |
| "ask about <document>" | Find it in `drive-log.md`/Drive, read it, answer against its content, cite it. |
| "do a SWOT", "analyze this account" | Refresh inputs as needed, rewrite `swot.md` (BLUF + SWOT + bets + 30/60/90). Have an opinion. |
| "brainstorm ideas" | Brainstorm using loaded memory as context; capture in a `research/YYYY-MM-DD-topic.md` note and log it. |
| "research <topic> for this account" | Deep dive across sources, write a `research/` note, distill the "so what," log it. |
| "leadership changes / objectives / trends" | Web + internal sweep focused on that; file into `signals.md` and/or `profile.md` (people). |

---

## Drive new-doc detection (how the user tells Claude about new docs)

Two supported paths — see `references/data-sources.md` for exact tool calls:

- **Automatic diff:** when the user says "check <account> for new documents," list the live Drive
  folder (from `drive_folder_id` in `drive-log.md`), compare against the manifest table, and report
  anything **added or modified since `last_synced`**. Summarize the important ones, then rewrite the
  manifest and bump `last_synced`.
- **Manual heads-up:** the user pastes a Drive link/ID and says it's new. Read it, summarize, judge
  significance, and update `drive-log.md` (and `signals.md` if it matters).

If no `drive_folder_id` is set yet, ask for the folder link once and store it — then diffs work.

---

## Writing discipline (keep memory clean)

- **Update in place** for current-state facts (profile, pipeline, SWOT). **Append** for journal
  (`memory-log.md`, `signals.md` scan history). Newest on top for journals.
- Keep the six core files lean; push long deep-dives into `research/` and link them.
- Every analysis file ends with its **sources**. Every memory entry names what you touched.
- Use `[[slug/file]]` wikilinks so Obsidian backlinks work.

## References
- `references/file-structure.md` — the memory model, file specs, placeholder fill rules, slug rules.
- `references/data-sources.md` — exact recipes: SOQL/my-org, Slack, Drive, internal search, web.
- `references/analysis-framework.md` — how to do SWOT and signal-vs-noise with an opinion.
