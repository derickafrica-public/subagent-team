# Skill: Acme Corp — Project Tracker (Eagle · Narwhal · Lynx · Leopard)

**Trigger phrases:**
- "Acme Corp project tracker"
- "update the project tracker"
- "track Acme Corp projects"
- "how are Eagle / Narwhal / Lynx / Leopard doing"
- "Acme Corp project status"
- "what's happening on Eagle" (or Narwhal, Lynx, Leopard)
- "project tracker update"

**Output:** `accounts/acme-corp/acme-corp-project-tracker.md` — created on first run, updated daily
thereafter. Never overwrite the `## Daily Delta` history — prepend each new delta entry on top.

---

## Why This Skill Exists

Eagle and Narwhal are load-bearing for future Salesforce work at Acme Corp. A slip in either
changes the account relationship, not just a project plan. Lynx (Extended Hypercare) and
Leopard (Agentforce Energy) are open-wound and murky respectively — both need daily
monitoring. This skill surfaces movement across all four in one place, at a glance,
with the ability to drill down.

---

## Project Registry

| Codename | Full Name | Division | Phase | Salesforce Owner | Acme Corp Sponsor |
|----------|-----------|----------|-------|-----------------|-------------|
| **Eagle** | Ratings RCA/RCB Implementation | Ratings | Implementation — Q1 FY27 go-live | Alexandra Nicolosi (AE) | Chris Craig (CAO) |
| **Narwhal** | Data Cloud 1 / Architecture Build | Market Intelligence (CCO) | Architecture + build | Lizzie Taylor (Head of CX) | Chris Nilsson (CCO) |
| **Lynx** | Project Ark Lynx Extended Hypercare | Cross-division | Hypercare — open | Sanjna Patyal (CSM) / MJ Jaremchuk | Internal Acme Corp ops |
| **Leopard** | Agentforce for Sales & Service (Energy) | Energy / Pricing & Benchmarks | Go/no-go unclear — data quality blocker | TBD | Jason Gibson (CFO, new Apr 2026) |

**Eagle and Narwhal are tier-1.** Any slip in either is a `🔴 FLAG` regardless of context.
Lynx and Leopard are tier-2 — monitor for contagion risk to the Salesforce relationship.

---

## Team Routing

| Task | Owner | Notes |
|------|-------|-------|
| Slack search (all 4 projects) | Pemberton | Search `#` channels + DMs for all codenames and related terms |
| SOQL opportunity + case pull | Imelda | Queries below — read-only, no mutations |
| Gmail search | Marlow | Filter to project-relevant threads only |
| Calendar + Meet transcripts | Eleanor | Pull project meetings, calls, QBRs |
| Public web | Roman | Product pages, press, partner announcements |
| Project format + synthesis | Defoe | Assembles the tracker update; Calder reviews section structure |
| Voice + pedagogy gate | Maggie | Gates the tracker output before it is written to disk |

**Calder annotates project structure only.** Abigail provides the deal-impact framing for
Eagle and Narwhal's "Why this matters for the deal" lines. Anna's format guidance is baked
into the tracker template below — do not deviate from it without re-consulting her.

---

## Data Sources & Search Terms

### A. Slack (`mcp__plugin_slack_slack__slack_search_public_and_private`)

Run these searches, `after:[last_run_date]` on updates, full history on first build:

```
"Project Eagle" OR "Ratings RCA" OR "RCB" OR "Ratings implementation" in:#tmt-strat-allorg-community #acme-corp* #salesforce-sp* #ratings*
"Narwhal" OR "Data Cloud 1" OR "DC1" OR "Narwhal architecture" OR "CCO data cloud" in:#tmt-strat-allorg-community #acme-corp* #dc-sp*
"Project Lynx" OR "Ark Lynx" OR "extended hypercare" OR "Jaremchuk" OR "hypercare" in:#acme-corp* #success-plans* #csm*
"Project Leopard" OR "Agentforce Energy" OR "AF for Sales Service" OR "Energy agentforce" OR "Cat Baldwin" OR "data quality blocker" in:#tmt-strat-allorg-community #acme-corp* #energy*
```

Pull the message text, sender, channel, and timestamp for every hit.

### B. SOQL (`sf data query --target-org my-org --json`)

**Opportunities by project:**
```sql
SELECT Id, Name, StageName, Amount, CloseDate, ForecastCategory, OwnerId, Owner.Name,
       LastActivityDate, NextStep, Probability
FROM Opportunity
WHERE (Name LIKE '%Eagle%' OR Name LIKE '%Ratings RCA%' OR Name LIKE '%RCB%'
    OR Name LIKE '%Narwhal%' OR Name LIKE '%Data Cloud 1%' OR Name LIKE '%Lynx%'
    OR Name LIKE '%Leopard%' OR Name LIKE '%Agentforce%Energy%'
    OR Name LIKE '%Agentforce%Sales%Service%Energy%')
  AND AccountId IN (SELECT Id FROM Account WHERE Name LIKE '%Acme Corp%')
  AND IsClosed = false
ORDER BY Amount DESC NULLS LAST
```

**Open support cases related to these projects:**
```sql
SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate, LastModifiedDate,
       OwnerId, Owner.Name, AccountId, Account.Name, Description
FROM Case
WHERE AccountId IN (SELECT Id FROM Account WHERE Name LIKE '%Acme Corp%')
  AND IsClosed = false
  AND (Subject LIKE '%Eagle%' OR Subject LIKE '%Narwhal%' OR Subject LIKE '%Lynx%'
    OR Subject LIKE '%Leopard%' OR Subject LIKE '%RCA%' OR Subject LIKE '%RCB%'
    OR Subject LIKE '%hypercare%' OR Subject LIKE '%Data Cloud%' OR Subject LIKE '%Agentforce%')
ORDER BY Priority ASC, CreatedDate DESC
```

**Success plan tasks (past-due and upcoming 14 days):**
```sql
SELECT Id, Subject, Status, ActivityDate, OwnerId, Owner.Name, WhatId, What.Name
FROM Task
WHERE What.Type = 'Account'
  AND What.Name LIKE '%Acme Corp%'
  AND (ActivityDate <= TODAY OR ActivityDate <= NEXT_N_DAYS:14)
  AND IsClosed = false
ORDER BY ActivityDate ASC
```

### C. Gmail (`mcp__plugin_google-workspace_google-workspace__search_gmail_messages`)

```
subject:(Eagle OR Narwhal OR Lynx OR Leopard OR "Ratings RCA" OR "Data Cloud 1")
from:(@<account-domain>.com)
after:[last_run_date in YYYY/MM/DD]
```

Batch-fetch threads with `get_gmail_threads_content_batch`. Strip calendar boilerplate and
signature blocks before reading. Note any customer quotes with attributed speaker + date.

### D. Google Calendar + Meet Transcripts

Search `meeting_notes_search` for: `Eagle`, `Narwhal`, `Lynx`, `Leopard`, `Acme Corp Ratings`,
`CCO`, `Lizzie Taylor`, `Chris Craig`. Pull transcripts with `get_doc_as_markdown`.
Note any action items, decisions, and named owners — these override Slack-sourced signals.

### E. Public Web (Roman)

Scan for: Acme Corp press releases, Ratings product announcements, AI strategy updates,
any mention of Data Cloud or Agentforce co-marketing. Prioritize official investor relations
and product pages. Flag anything that affects Eagle's timeline or Leopard's rationale.

---

## Tracker Format Spec

*This format was designed with Anna (visual hierarchy, negative space, scannable) and Abigail
(deal-impact framing, confidence labels, so-what first) as the reference voices. Calder's
source-discipline rule applies to every labeled fact. Do not deviate from this structure.*

```markdown
# Acme Corp — Project Tracker
> Updated: YYYY-MM-DD HH:MM CT | Next update: [scheduled or on-demand]
> Sources: [list what fired / what was unreachable — unreachable is a finding, not silence]

---

## At a Glance

| Project | Status | Last Signal | Next Gate |
|---------|--------|-------------|-----------|
| 🦅 Eagle (Ratings RCA/RCB) | 🟢/🟡/🔴 word | YYYY-MM-DD — one-line summary | Date + milestone |
| 🐳 Narwhal (Data Cloud 1 / CCO) | | | |
| 🐆 Lynx (Extended Hypercare) | | | |
| 🐈 Leopard (Agentforce Energy) | | | |

**Status key:** 🟢 On track · 🟡 Watch · 🔴 At risk / blocked · ⚫ Unclear / no signal
**Tier-1 (Eagle, Narwhal):** any 🔴 surfaces here = immediate action needed for the account relationship.

---

## Daily Delta — YYYY-MM-DD
*What moved since the last run. Source-cited. ≤10 bullets. Slips and flags first.*

- 🔴 [slip/flag]: [what happened] — source: [channel/record/email], [date], [speaker if applicable]
- 🟡 [watch]: [what to monitor]
- ✅ [resolved]: [what closed]

---

## 🦅 Eagle — Ratings RCA/RCB Implementation

**Status:** [indicator + one-line read]
**SF Owner:** Alexandra Nicolosi (AE) · **Acme Corp Sponsor:** Chris Craig (CAO)
**Go-live target:** Q1 FY27

**Why this matters for the deal** *(Abigail's framing)*
> [1–2 sentences: what a slip or success here does to the Salesforce account relationship
> and the $90M ROI scorecard commitment. Update only when the substance changes.]

**Latest activity** *(most recent first, max 5 lines)*
- YYYY-MM-DD — [what happened] [[source label]]
- YYYY-MM-DD — [what happened] [[source label]]

**Open items** *(owner-named)*
- [ ] [action] — owner: [name] — by [date or trigger]

**Trouble areas / flags**
- [flag] — [1-line description, evidence cited, age of flag]

**Linked opportunities**
| Opp ID | Name | Stage | Amount | Close |
|--------|------|-------|--------|-------|

---

## 🐳 Narwhal — Data Cloud 1 / CCO Architecture

**Status:** [indicator + one-line read]
**SF Owner:** Lizzie Taylor (Head of CX) · **Acme Corp Sponsor:** Chris Nilsson (CCO)

**Why this matters for the deal**
> [1–2 sentences: Narwhal is the Data Cloud beachhead in CCO; a blocked architecture
> decision delays every downstream upsell motion. Update when substance changes.]

**Latest activity** *(max 5 lines)*
- YYYY-MM-DD — [what happened] [[source label]]

**Open items**
- [ ] [action] — owner: [name] — by [date or trigger]

**Trouble areas / flags**
- [flag] — [evidence cited, age]

**Architecture decisions outstanding**
- DC1 vs. separate-instance call — decision owner: Lizzie Taylor · status: [open/closed]
- MNPI security-model doc — owner: Marisa Taylor · status: [open/closed]
- CCO Data Cloud sandboxes — owner: the account owner · status: [open/closed]

**Linked opportunities**
| Opp ID | Name | Stage | Amount | Close |
|--------|------|-------|--------|-------|

---

## 🐆 Lynx — Project Ark Extended Hypercare

**Status:** [indicator + one-line read]
**SF Owner (CSM):** Sanjna Patyal / MJ Jaremchuk

**Why this matters for the deal**
> [1–2 sentences: ongoing hypercare mismanagement damages the overall account health score
> and gives Acme Corp leverage in renewal conversations. Update when substance changes.]

**Latest activity** *(max 5 lines)*
- YYYY-MM-DD — [what happened] [[source label]]

**Open success-plan tasks (past-due first)**
| Task | Due Date | Owner | Days Overdue |
|------|----------|-------|-------------|
| [task] | [date] | [name] | [n] |

**Trouble areas / flags**
- [flag] — [evidence cited]

---

## 🐈 Leopard — Agentforce for Sales & Service (Energy)

**Status:** [indicator + one-line read]
**SF Owner:** TBD · **Acme Corp Decision-makers:** Jason Gibson (CFO) · Lizzie Taylor · Chris Nilsson

**Why this matters for the deal**
> [1–2 sentences: Leopard's outcome does not determine whether Data Foundations happens —
> it will happen either way. A no-go forces a separate Data Foundations project, which is
> still a Salesforce win. Update when the go/no-go is confirmed.]

**Go/no-go status:** [CONFIRMED / UNCONFIRMED — source] — date: [YYYY-MM-DD or unknown]
**Data quality blocker:** Cat Baldwin leading cleansing — status: [open/resolved/unknown]

**Latest activity** *(max 5 lines)*
- YYYY-MM-DD — [what happened] [[source label]]

**Open items**
- [ ] Confirm go/no-go date and invite list — currently Slack-sourced only
- [ ] [additional items]

**Linked opportunities**
| Opp ID | Name | Stage | Amount | Close |
|--------|------|-------|--------|-------|

---

## Open Cases — All Projects

| Case # | Project | Subject | Priority | Status | Age | Owner |
|--------|---------|---------|----------|--------|-----|-------|
| [474264064] | [Lynx?] | [subject] | Sev1/2 | [status] | [n days] | [name] |

*Cases pulled from SOQL + Slack escalation threads. Age = days since creation.*

---

## Source Log

| Surface | Status | Coverage through |
|---------|--------|-----------------|
| my-org SOQL | ✅/❌ | YYYY-MM-DD |
| Slack | ✅/❌ | YYYY-MM-DD |
| Gmail | ✅/❌ | YYYY-MM-DD |
| Calendar / Meet transcripts | ✅/❌ | YYYY-MM-DD |
| Public web | ✅/❌ | YYYY-MM-DD |

*An ❌ surface is a finding, not silence. Do not fill in project sections with "no signal" when
a surface was down — note the gap explicitly.*
```

---

## Execution Protocol

### Build Mode (first run, file does not exist)

1. **Defoe** reads the existing account-summary artifacts
   (`acme-corp-account-summary.md`, `accounts/acme-corp/`) to seed known state for each project.
   Extracts all currently known facts, dates, and owners per codename and builds a pre-fill brief.
2. **Pemberton** runs Slack searches (full history, not delta-bounded).
3. **Imelda** runs all three SOQL queries.
4. **Marlow** runs Gmail search (full history).
5. **Eleanor** runs Calendar + transcripts search (full history).
6. **Roman** sweeps public web for project-relevant signals.
7. Steps 2–6 run in parallel. Defoe synthesizes the six inputs into the tracker format.
8. **Calder** reviews the project-section structure (slips before wins, named owners, no green-washing).
9. **Abigail** writes the "Why this matters for the deal" lines for Eagle and Narwhal.
10. **Maggie** gates the full artifact before it is written to disk. If she flags REWORK, fix
    before writing. If she flags KILL, escalate to Rolando.
11. Write `accounts/acme-corp/acme-corp-project-tracker.md`. Confirm the file was written.
12. **Hank** posts the Slack summary to `#acme-corp-intel` then recreates the project tracker canvas
    (see "Slack Post — #acme-corp-intel" and "Canvas Recreate — #acme-corp-intel" below).

### Update Mode (file exists — daily or on-demand)

1. **Defoe** reads the existing tracker and records the last-run date per section.
2. Run steps 2–6 in parallel, all with `after:[last_run_date]` delta bounds.
3. Defoe compiles only what changed since the last run into a new `## Daily Delta — YYYY-MM-DD`
   entry. Prepend it below the `## At a Glance` table — do not delete prior delta entries.
4. For each project section: append new `Latest activity` lines (prepend to the list), update
   open items (check off resolved, add new), and revise status if warranted.
5. Update the `## Open Cases` table and `## Source Log`.
6. **Calder** spot-checks the delta for named-owner discipline.
7. **Maggie** gates — lightweight pass sufficient for update mode unless a section was substantially
   rewritten.
8. Write the updated file. Backup the prior version to
   `accounts/acme-corp/acme-corp-project-tracker-YYYY-MM-DD.bak` before overwriting.
9. **Hank** posts the Slack summary to `#acme-corp-intel` then recreates the project tracker canvas
   (see "Slack Post — #acme-corp-intel" and "Canvas Recreate — #acme-corp-intel" below).

---

## Slack Post — #acme-corp-intel

**Channel:** `#acme-corp-intel` · **Channel ID:** `C0XXXXXXXXX`
**Runs after every Build and Update.** Hank owns the post. Vera confirms the message timestamp.

### What to post

Compose a single Slack message containing two sections extracted verbatim from the freshly
written tracker file:

**Section 1 — At a Glance table** (copy as-is from the tracker)
**Section 2 — Daily Delta bullets** (copy the most recent `## Daily Delta — YYYY-MM-DD` block only)

Format the message as:

```
*Acme Corp — Project Tracker update · YYYY-MM-DD*

*At a Glance*
| Project | Status | Last Signal | Next Gate |
|---------|--------|-------------|-----------|
| 🦅 Eagle (Ratings RCA/RCB) | [status] | [date — summary] | [gate] |
| 🐳 Narwhal (Data Cloud 1 / CCO) | [status] | [date — summary] | [gate] |
| 🐆 Lynx (Extended Hypercare) | [status] | [date — summary] | [gate] |
| 🐈 Leopard (Agentforce Energy) | [status] | [date — summary] | [gate] |

*What moved today*
[daily delta bullets, verbatim from the tracker — slips 🔴 first, watches 🟡 second, resolved ✅ last]

_Full tracker: `accounts/acme-corp/acme-corp-project-tracker.md`_
```

### What to post — rules

- **Never invent or paraphrase.** Copy the At-a-Glance table and Daily Delta verbatim from the
  tracker. Do not summarize, reword, or add commentary.
- **Post even if the delta is thin.** A "no new signal" delta is still a post — it confirms the
  tracker ran and the surfaces were checked. Mark unreachable surfaces in the delta as usual.
- **One message per run, never a thread.** Do not split into multiple messages.
- **If Hank cannot reach Slack,** log the failure in the tracker's Source Log as
  `Slack post ❌ — [error reason] — YYYY-MM-DD` and surface it to Rolando. Do not silently skip.
- **Vera verifies** the message timestamp is present in the API response before the skill reports
  success. A 200 OK with no `ts` field is treated as a failure.

---

### Canvas Recreate — #acme-corp-intel

After posting the channel message, Hank recreates the project tracker canvas so the in-channel
document reflects the latest file content.

**Why recreate instead of update:** the Slack MCP exposes `slack_create_canvas` but not a canvas
update tool. Recreating is functionally equivalent — the new canvas URL is always posted in the
accompanying channel message, so anyone following `#acme-corp-intel` always has the current link.

**Canvas registry** (original bulk-upload snapshot — these are superseded after first live run):

| File (actual path under accounts/acme-corp/) | Original Canvas ID |
|------|--------------------|
| acme-corp-project-tracker.md | `F0BP352D11R` |
| acme-corp-account-summary.md | `F0BPBADBCJV` |
| profile.md | `F0BPD33Q6Q4` |
| opportunities.md | `F0BP35625EX` |
| signals.md | `F0BPD34RYKE` |
| swot.md | `F0BP7D5DLG6` |
| memory-log.md | `F0BP5SGMYRK` |
| drive-log.md | `F0BPBAHHGCR` |

**The project tracker skill only recreates `acme-corp-project-tracker.md`.** The other 7 files
are updated by their respective skills (account-summary, account-intelligence, etc.).

**Steps (Hank executes after posting the channel message):**

1. Read the freshly written `accounts/acme-corp/acme-corp-project-tracker.md` in full.
2. Strip YAML frontmatter (any `---` block at the top) and normalize `####` headings to `###`.
3. Call `slack_create_canvas` with:
   - `channel_id`: `C0XXXXXXXXX`
   - `title`: `Acme Corp — Project Tracker · YYYY-MM-DD` (today's date)
   - `markdown`: full file content (stripped/normalized from step 2)
4. Capture the returned canvas ID and URL.
5. Post a follow-up line in `#acme-corp-intel`:
   ```
   _Canvas updated: [Acme Corp — Project Tracker · YYYY-MM-DD](canvas_url)_
   ```
6. **Vera verifies** the canvas ID is present in the create response. A missing ID = failure.
7. If canvas creation fails, log `Canvas recreate ❌ — [error] — YYYY-MM-DD` in the Source Log
   and surface to Rolando. The channel message from the prior step still stands — do not retry
   more than once.

**Old canvases are not deleted.** They become dated snapshots. The channel message link always
points to the current one.

### On unreachable surfaces

Do not infer "nothing happened." State the surface failure explicitly in both the `## Source Log`
and the `## Daily Delta` for that run. Do not carry forward stale facts as if they were new.

---

## Source-Discipline Labels (inherit from Pemberton)

- `[publicly known — <source>]`
- `[inferred — <basis>]`
- `[rumored — <channel>]`
- `[internal — <record/channel/thread>]`

Every fact in the tracker carries one of these four labels. Stripped citations escalate to Rolando.

---

## What This Skill Does NOT Do

- Does not maintain the `acme-corp-account-summary.{html,md}` deck — that is `account-summary.md`.
- Does not replace the weekly risk sweep — Matija still owns cross-book risk synthesis.
- Does not update canvases for the other 7 `accounts/acme-corp/` files — each file's own skill owns its canvas recreate.
- Does not track opportunities outside the four named projects — use `account-intelligence.md` or
  `sp-account-overview.md` for the full picture.

---

## Standing Notes

- **Eagle is the single highest-priority signal in the Acme Corp account.** CAO Chris Craig is the Dreamforce
  SIC anchor and the $90M ROI scorecard co-signer. A slip in Eagle is a slip in the exec relationship.
- **Narwhal's architecture decisions (DC1 vs. separate instance, MNPI wall) are unresolved as of
  2026-08-07.** Until resolved, Narwhal has no confirmed build path — treat it as blocked, not progressing.
- **Leopard's go/no-go (originally 7/29) was never confirmed** across two consecutive account-summary
  runs. Do not promote any date to "confirmed" in this tracker without a Calendar or email source.
- **Lynx hypercare task ledger was 10 items overdue as of 7/27.** The oldest item (Jaremchuk, 45+ days)
  sets the floor on account health. Track the ledger every run.
