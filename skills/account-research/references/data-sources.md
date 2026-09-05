# Data sources — exact recipes

Everything the skill can pull from, with concrete tool calls. Always cite which source a fact came from.

---

## 1. my-org (Salesforce) — opportunities & account data

`my-org` is the connected org alias. Two ways in:

### A) Helper scripts (preferred for opportunities)
```bash
# Resolve/disambiguate an account by name → JSON candidates (id, industry, website, owner, openOpps)
.claude/skills/account-research/scripts/find-account.sh "Coupe Health"

# Sync opportunities → Markdown tables (open pipeline + recently closed + totals)
.claude/skills/account-research/scripts/sync-opps.sh --id <ACCOUNT_ID>
.claude/skills/account-research/scripts/sync-opps.sh "Coupe Health"   # by name (LIKE) if no id
```
The real account is usually the candidate with **open opportunities** — confirm the Id with the user.

### B) Ad-hoc SOQL (for anything else)
```bash
sf data query --target-org my-org --json --query "SELECT ... FROM ... WHERE ..."
```
Useful objects/fields (verified present in my-org):
- **Account:** `Id, Name, Industry, Website, Type, Owner.Name, Description`
- **Opportunity:** `Name, StageName, Amount, CloseDate, Probability, NextStep, ForecastCategoryName, Owner.Name, IsClosed, IsWon, LastModifiedDate, Type`
- **Contact:** `Name, Title, Email, Account.Name` — for key people.
- Child query pattern: `(SELECT Id FROM Opportunities WHERE IsClosed = false)` inside an Account query.

Notes: escape `'` in names as `\'`. `Amount` may be null. SFDC is the source of truth — the `.md`
tables are point-in-time snapshots; re-sync rather than hand-edit numbers.

---

## 2. Google Drive — the account document hub

**Model (per the user's workflow):** each main account has **one dedicated Drive folder** that the
user continuously adds to and modifies (decks, docs, sheets). That folder's ID is the anchor for
everything here. Capture it at setup into `drive-log.md` frontmatter (`drive_folder_id`).

### Get the folder ID
From a URL like `https://drive.google.com/drive/folders/1AbC…XyZ`, the ID is the last path segment
(`1AbC…XyZ`). Store both the URL and the ID.

### List / read the folder
```
list_drive_items(folder_id="<FOLDER_ID>", order_by="modifiedTime desc", detailed=true)
search_drive_files(query="'<FOLDER_ID>' in parents", order_by="modifiedTime desc")   # alt
get_drive_file_content(file_id="<FILE_ID>")     # native Docs/Sheets/Slides → text/CSV; Office parsed
```
For subfolders, recurse: list each child folder's contents too (accounts sometimes nest by quarter).

### New-doc / changed-doc detection (the core loop)
The user **continuously adds AND modifies** content, so detect both:
1. Read `drive-log.md`: its `last_synced` timestamp and the "Known documents" table (name, fileId, modified).
2. List the live folder with `list_drive_items(..., order_by="modifiedTime desc")`.
3. Classify each live file:
   - **New** — `fileId` not in the manifest.
   - **Modified** — `fileId` in manifest but its `modifiedTime` is newer than the stored value.
   - **Unchanged** — otherwise.
4. Report New + Modified first. For the important ones, `get_drive_file_content` and summarize
   ("what it is" + "why it matters"). Ask before reading a large batch.
5. Rewrite the "Known documents" table to the current state and set `last_synced` = now.
   Move noteworthy items into "Document notes"; drop anything material into `signals.md`.

**Manual heads-up path:** if the user pastes a link/ID and says "new doc," skip the diff — just
`get_drive_file_content`, summarize, judge significance, and update the manifest.

---

## 3. Slack — internal chatter, deal rooms, updates

```
slack_search_public(query="Coupe Health renewal", sort="timestamp")     # public only, no consent needed
slack_search_channels(query="coupe")                                     # find the account's channel
slack_read_channel(channel_id="C…")                                      # recent messages in a channel
```
Private channels/DMs: `slack_search_public_and_private` — **ask the user's consent first**, then use it.
Use `after:YYYY-MM-DD` / `from:@person` / `in:#channel` modifiers to narrow. Prefer 2–3 focused
searches over one broad one. Note the channel + date for anything you cite.

---

## 4. Internal knowledge — Confluence, Quip, wiki, webpages

```
search(query="<account> account plan", sources=["confluence","quip","slack","webpages"])
```
Good for account plans, QBRs, strategy docs, internal context the web won't have. Include the doc
title + link when you cite.

---

## 5. Web — trends, leadership changes, objectives, news

There is **no general web-search tool**; use `WebFetch` against structured, fetchable endpoints.

### Google News RSS (primary recipe — proven to work)
```
WebFetch(
  url="https://news.google.com/rss/search?q=%22<ACCOUNT>%22+when:14d&hl=en-US&gl=US&ceid=US:en",
  prompt="List headlines, sources, and publish dates."
)
```
- URL-encode the query. `%22…%22` = exact phrase. `when:14d` / `when:30d` = recency window.
- Add terms for focus: `%22Acme%22+(CEO+OR+leadership+OR+layoffs+OR+earnings+OR+acquisition)`.
- Then `WebFetch` the individual article URLs worth reading for detail.

### Other fetchable sources
- Company newsroom / IR / press pages: `WebFetch(url="<company>/news", prompt="...")`.
- A specific article/report URL the user shares.
Note: `WebFetch` can't reach authenticated/paywalled pages; it upgrades http→https and returns
cross-host redirects for you to follow. Always date-stamp and link web findings.

---

## 6. Gmail (optional) — threads with/about the account
```
search_gmail_messages(query="Coupe Health")     # standard Gmail operators; from:/after: etc.
get_gmail_message_content(message_id="…")
```
Use when the user asks about email threads or you need contact-level context. Cite sender + date.

---

## Source-selection heuristics
- **Pipeline / revenue / stage / owner →** my-org (SOQL). Never guess these.
- **What's the customer doing publicly →** web.
- **What do WE know / internal POV →** Slack + internal knowledge + Drive.
- **Documents / decks / QBRs →** the account's Drive folder.
- Cross-check: if web says one thing and SFDC/Slack another, surface the discrepancy — that's signal.
