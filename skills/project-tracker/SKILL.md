---
name: project-tracker
description: >-
  Build or update a daily project tracker for the load-bearing named projects at a named account
  (Acme Corp by default), fanning out across my-org SOQL, Slack, Gmail, Calendar/Meet transcripts,
  and public web, then writing a single at-a-glance status file with a prepended daily delta.
  TRIGGER when the user asks for a "project tracker", "Acme Corp project tracker", "update the
  project tracker", "track Acme Corp projects", "how are Eagle / Narwhal / Lynx / Leopard doing",
  "Acme Corp project status", "what's happening on Eagle" (or Narwhal, Lynx, Leopard), or
  "project tracker update".
metadata:
  version: "1.0"
---

# Project Tracker — Acme Corp (Eagle · Narwhal · Lynx · Leopard)

**Output:** `accounts/acme-corp/acme-corp-project-tracker.md` — created on first run, updated daily
thereafter. Never overwrite the `## Daily Delta` history — prepend each new delta entry on top.

**Argument (optional):** a project codename (`Eagle`, `Narwhal`, `Lynx`, `Leopard`) or "all". If
empty, run the full tracker across all four.

---

## Why This Skill Exists

Eagle and Narwhal are load-bearing for future Salesforce work at Acme Corp. A slip in either
changes the account relationship, not just a project plan. Lynx (Extended Hypercare) and
Leopard (Agentforce Energy) are open-wound and murky respectively — both need daily
monitoring. This skill surfaces movement across all four in one place, at a glance, with the
ability to drill down.

This file is a customized example for one account's four named projects. If you install it for a
different account, replace the codenames, the registry table below, and the search terms with
your own — the mechanics (delta-prepend, source labeling, tier-1 flagging) carry over unchanged.

---

## Project Registry

| Codename | Full Name | Division | Phase | Salesforce Owner | Acme Corp Sponsor |
|----------|-----------|----------|-------|-----------------|-------------|
| **Eagle** | Subsidiary A — Compliance Platform Implementation | Subsidiary A (ratings & compliance) | Implementation — Q1 FY27 go-live | Alexandra Nicolosi (AE) | Chris Craig (CAO) |
| **Narwhal** | Data Cloud 1 / Architecture Build | Subsidiary B (data & analytics, CCO org) | Architecture + build | Lizzie Taylor (Head of CX) | Chris Nilsson (CCO) |
| **Lynx** | Project Ark Lynx Extended Hypercare | Cross-division | Hypercare — open | Sanjna Patyal (CSM) / MJ Jaremchuk | Internal Acme Corp ops |
| **Leopard** | Agentforce for Sales & Service (Energy) | Energy / Subsidiary C (commodities & insights) | Go/no-go unclear — data quality blocker | TBD | Jason Gibson (CFO, new Apr 2026) |

**Eagle and Narwhal are tier-1.** Any slip in either is a `🔴 FLAG` regardless of context.
Lynx and Leopard are tier-2 — monitor for contagion risk to the Salesforce relationship.

---

## How To Run This — Data-Gathering Lanes

Run each lane below yourself, directly, in the current session. Where the account's environment
happens to have a full multi-agent roster installed (named personas like Pemberton, Imelda,
Marlow, Eleanor, Roman, Defoe, Calder, Abigail, Maggie, Hank, Vera), fanning these lanes out to
those personas in parallel is a valid optional enhancement — see `agents/<name>.md` if that
roster exists in your install. It is never required: every lane below is written to be run
solo, in sequence or in parallel tool calls, with no dependency on any named agent existing.

| Lane | What to do | Original multi-agent owner (optional, flavor only) |
|------|-----------|------|
| Slack search (all 4 projects) | Run the searches in §A below across the listed channel wildcards + DMs, for all codenames and related terms | Pemberton |
| SOQL opportunity + case pull | Run the read-only queries in §B against `my-org` | Imelda |
| Gmail search | Run the search in §C, filtered to project-relevant threads only (if Gmail access is available) | Marlow |
| Calendar + Meet transcripts | Run the search in §D for project meetings, calls, QBRs (if Calendar access is available) | Eleanor |
| Public web | Sweep for the signals in §E | Roman |
| Synthesis into tracker format | Assemble the six inputs into the Tracker Format Spec below | Defoe / Calder |
| Deal-impact framing | Write or refresh the "Why this matters for the deal" lines for Eagle and Narwhal | Abigail |
| Quality/voice self-check | Re-read the assembled tracker for named-owner discipline, slips-before-wins ordering, and no green-washing before writing it to disk | Maggie |

Gmail and Calendar lanes are genuinely optional — if those tools/connectors are not wired into
your session, skip them and log the gap in the `## Source Log` (see below) rather than guessing.

---

## Data Sources & Search Terms

### A. Slack (`mcp__plugin_slack_slack__slack_search_public_and_private` or equivalent)

Run these searches, `after:[last_run_date]` on updates, full history on first build:

```
"Project Eagle" OR "Compliance Platform" OR "Subsidiary A implementation" in:#tmt-strat-allorg-community #acme-corp* #salesforce-acme* #acct-suba*
"Narwhal" OR "Data Cloud 1" OR "DC1" OR "Narwhal architecture" OR "CCO data cloud" in:#tmt-strat-allorg-community #acme-corp* #dc-acme*
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
WHERE (Name LIKE '%Eagle%' OR Name LIKE '%Compliance Platform%'
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
    OR Subject LIKE '%Leopard%' OR Subject LIKE '%Compliance Platform%'
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

### C. Gmail (if available, e.g. `mcp__plugin_google-workspace_google-workspace__search_gmail_messages`)

```
subject:(Eagle OR Narwhal OR Lynx OR Leopard OR "Compliance Platform" OR "Data Cloud 1")
from:(@<account-domain>.com)
after:[last_run_date in YYYY/MM/DD]
```

Batch-fetch threads and strip calendar boilerplate and signature blocks before reading. Note any
customer quotes with attributed speaker + date.

### D. Calendar + Meet Transcripts (if available)

Search meeting notes for: `Eagle`, `Narwhal`, `Lynx`, `Leopard`, `Acme Corp Subsidiary A`,
`CCO`, `Lizzie Taylor`, `Chris Craig`. Pull transcripts. Note any action items, decisions, and
named owners — these override Slack-sourced signals.

### E. Public Web

Scan for: Acme Corp press releases, Subsidiary A product announcements, AI strategy updates,
any mention of Data Cloud or Agentforce co-marketing. Prioritize official investor relations
and product pages. Flag anything that affects Eagle's timeline or Leopard's rationale.

---

## Tracker Format Spec

Do not deviate from this structure — it was designed for scannability (status at a glance up
top, drill-down below) and for source discipline (every labeled fact cites where it came from).

```markdown
# Acme Corp — Project Tracker
> Updated: YYYY-MM-DD HH:MM CT | Next update: [scheduled or on-demand]
> Sources: [list what fired / what was unreachable — unreachable is a finding, not silence]

---

## At a Glance

| Project | Status | Last Signal | Next Gate |
|---------|--------|-------------|-----------|
| 🦅 Eagle (Subsidiary A) | 🟢/🟡/🔴 word | YYYY-MM-DD — one-line summary | Date + milestone |
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

## 🦅 Eagle — Subsidiary A Compliance Platform Implementation

**Status:** [indicator + one-line read]
**SF Owner:** Alexandra Nicolosi (AE) · **Acme Corp Sponsor:** Chris Craig (CAO)
**Go-live target:** Q1 FY27

**Why this matters for the deal**
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
> [1–2 sentences: Narwhal is the Data Cloud beachhead in the CCO org; a blocked architecture
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
> [1–2 sentences: Leopard's outcome does not determine whether the underlying data-foundations
> work happens — it will happen either way. A no-go forces a separate data-foundations project,
> which is still a Salesforce win. Update when the go/no-go is confirmed.]

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
| [case number] | [Lynx?] | [subject] | Sev1/2 | [status] | [n days] | [name] |

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

1. Read any existing account-summary artifacts (`accounts/acme-corp/`, if present) to seed known
   state for each project. Extract all currently known facts, dates, and owners per codename and
   build a pre-fill brief.
2. Run the Slack searches in §A (full history, not delta-bounded).
3. Run all three SOQL queries in §B.
4. Run the Gmail search in §C if available (full history).
5. Run the Calendar + transcripts search in §D if available (full history).
6. Sweep public web per §E for project-relevant signals.
7. Steps 2–6 can run in parallel tool calls. Synthesize the results into the Tracker Format Spec.
8. Self-review the project-section structure: slips before wins, named owners, no green-washing.
9. Write the "Why this matters for the deal" lines for Eagle and Narwhal.
10. Re-read the full artifact once more for voice/quality before writing it to disk — tighten
    anything that reads padded or vague.
11. Write `accounts/acme-corp/acme-corp-project-tracker.md`. Confirm the file was written.
12. (Optional, if Slack tooling is configured) Post the summary and recreate the tracker canvas —
    see "Optional: Post to Slack" below.

### Update Mode (file exists — daily or on-demand)

1. Read the existing tracker and record the last-run date per section.
2. Run steps 2–6 above again, all with `after:[last_run_date]` delta bounds.
3. Compile only what changed since the last run into a new `## Daily Delta — YYYY-MM-DD`
   entry. Prepend it below the `## At a Glance` table — do not delete prior delta entries.
4. For each project section: append new `Latest activity` lines (prepend to the list), update
   open items (check off resolved, add new), and revise status if warranted.
5. Update the `## Open Cases` table and `## Source Log`.
6. Spot-check the delta for named-owner discipline.
7. Quality/voice pass — a lightweight re-read is sufficient for update mode unless a section was
   substantially rewritten, in which case give it the full pass from Build Mode step 10.
8. Write the updated file. Back up the prior version to
   `accounts/acme-corp/acme-corp-project-tracker-YYYY-MM-DD.bak` before overwriting.
9. (Optional, if Slack tooling is configured) Post the summary and recreate the tracker canvas.

---

## Optional: Post To Slack (only if Slack MCP tools are configured)

If Slack write tools (e.g. `slack_send_message`, `slack_create_canvas`) are available in your
session and the user has confirmed a target channel, you can post a summary after every Build or
Update run. This is a nice-to-have distribution step, not a requirement of the skill — skip it
entirely if no Slack write access exists.

**Suggested channel:** `#acme-corp-intel` (replace with the account's actual intel channel).

### What to post

Compose a single Slack message containing two sections extracted verbatim from the freshly
written tracker file — never invent or paraphrase:

```
*Acme Corp — Project Tracker update · YYYY-MM-DD*

*At a Glance*
| Project | Status | Last Signal | Next Gate |
|---------|--------|-------------|-----------|
| 🦅 Eagle (Subsidiary A) | [status] | [date — summary] | [gate] |
| 🐳 Narwhal (Data Cloud 1 / CCO) | [status] | [date — summary] | [gate] |
| 🐆 Lynx (Extended Hypercare) | [status] | [date — summary] | [gate] |
| 🐈 Leopard (Agentforce Energy) | [status] | [date — summary] | [gate] |

*What moved today*
[daily delta bullets, verbatim from the tracker — slips 🔴 first, watches 🟡 second, resolved ✅ last]

_Full tracker: `accounts/acme-corp/acme-corp-project-tracker.md`_
```

Rules:
- Copy the At-a-Glance table and Daily Delta verbatim from the tracker. Do not summarize, reword,
  or add commentary.
- Post even if the delta is thin — a "no new signal" delta still confirms the tracker ran.
- One message per run, never a thread.
- If the Slack post fails, log the failure in the tracker's `## Source Log` as
  `Slack post ❌ — [error reason] — YYYY-MM-DD`. Do not silently skip. Verify the API response
  actually returned a message timestamp before reporting success — a 200 OK with no `ts` field
  is a failure.

### Canvas recreate (optional, requires `slack_create_canvas`)

If canvas tooling is available, recreate (rather than update — most Slack MCP setups expose
create but not update) the tracker canvas after every post so the in-channel document reflects
the latest file content:

1. Read the freshly written tracker file in full.
2. Strip any YAML frontmatter and normalize `####` headings to `###`.
3. Call the canvas-create tool with the target channel, a title of
   `Acme Corp — Project Tracker · YYYY-MM-DD`, and the normalized markdown.
4. Capture the returned canvas ID/URL and post a follow-up line linking it.
5. Verify the canvas ID is present in the create response — a missing ID is a failure. If it
   fails, log `Canvas recreate ❌ — [error] — YYYY-MM-DD` in the Source Log and don't retry more
   than once; the channel message from the prior step still stands.

Old canvases are not deleted — they become dated snapshots. The channel message link always
points to the current one.

### On unreachable surfaces

Do not infer "nothing happened." State the surface failure explicitly in both the `## Source Log`
and the `## Daily Delta` for that run. Do not carry forward stale facts as if they were new.

---

## Source-Discipline Labels

Every fact in the tracker carries one of these four labels:

- `[publicly known — <source>]`
- `[inferred — <basis>]`
- `[rumored — <channel>]`
- `[internal — <record/channel/thread>]`

A fact with no label is incomplete work — go back and label it before writing the file.

---

## What This Skill Does NOT Do

- Does not maintain the account's HTML/MD account-summary deck — that's a separate skill.
- Does not replace a weekly cross-account risk sweep, if one exists in your install.
- Does not update canvases for other account files — each file's own skill (if any) owns its own
  canvas recreate.
- Does not track opportunities outside the four named projects — use a broader account-research
  or account-intelligence pass for the full account picture.

---

## Standing Notes

- **Eagle is the single highest-priority signal in the Acme Corp account.** CAO Chris Craig is
  the SIC anchor and the $90M ROI scorecard co-signer. A slip in Eagle is a slip in the exec
  relationship.
- **Narwhal's architecture decisions (DC1 vs. separate instance, MNPI wall) are unresolved as of
  the last major review.** Until resolved, treat Narwhal as blocked, not progressing.
- **Leopard's go/no-go was never confirmed across two consecutive review passes.** Do not promote
  any date to "confirmed" in this tracker without a Calendar or email source.
- **Lynx's hypercare task ledger runs materially overdue.** The oldest overdue item sets the
  floor on account health. Track the ledger every run.
