# Skill: Account Summary (HTML deck + analyst/strategist MD companion)

**Trigger:** User asks for an account summary, account review, account brief, or **update** of an existing account summary for any named account.

**Invocation examples:**
- "Create an account summary for [Account Name]"
- "Build an account review for [Company]"
- "Give me an account brief for [Account]"
- "Update account summary for [Account Name]" → runs **Update Mode** (see below)
- Scheduled: launchd `com.rolando.account-summary-weekly` (Monday 07:00 America/Chicago) →
  runs **Update Mode** headlessly for Acme Corp. Ad-hoc invocation is always available in a
  session regardless of the schedule.

**Source surfaces (all five required):** my-org SOQL · Slack · public web · **Gmail** · **Google Calendar +
Meet transcripts**. Email and calendar/transcript research became required inputs on **2026-07-25** when the
Google Workspace connection was restored. If a surface is unreachable on a given run, say so in the artifact
rather than silently omitting it — a missing surface is itself a finding.

**Two artifacts, always produced together:**
1. `./[account-slug]-account-summary.html` — the 8-slide exec-facing deck.
2. `./[account-slug]-account-summary.md` — a verbose companion written in the voice of an
   **industry analyst + Salesforce strategist** (see "MD companion" below). This is **not optional** —
   every build and every update emits both files.

**Cadence:** this summary is **refreshed weekly, every Monday morning**, and is also **updatable
ad-hoc at any time**. The MD companion carries a `## Weekly changelog` section (newest delta on top)
so each refresh appends what moved rather than overwriting the history. When run in Update Mode, add a
new dated changelog entry; do not discard prior entries.

**Scheduling (Acme Corp).** The weekly refresh runs headlessly in **Update Mode**:
- **Schedule:** Monday 07:00 America/Chicago, weekly.
- **launchd job:** `com.rolando.account-summary-weekly` →
  `~/Library/LaunchAgents/com.rolando.account-summary-weekly.plist`
  (version-controlled copy at `team/scripts/com.rolando.account-summary-weekly.plist`).
- **Wrapper:** `team/scripts/account-summary-weekly.sh` — imperative single-turn `claude -p` headless
  run; `DRY_RUN=1` prints the resolved prompt, `FORCE=1` bypasses the Monday/07:00 CT guard for manual
  testing. `RunAtLoad` is false, so loading the plist or rebooting never triggers a run.
- **Activate:** `launchctl load ~/Library/LaunchAgents/com.rolando.account-summary-weekly.plist`
  (deactivate with `unload`). The job is delivered unloaded — load it when ready.
- **Ad-hoc, any time:** type `"Update account summary for Acme Corp"` (or a fresh
  `"Create an account summary for Acme Corp"`) in a Claude Code session. The schedule and the ad-hoc
  path run the same skill; neither blocks the other.
- To point the weekly job at a different account, override `ACCOUNT_NAME` / `ACCOUNT_SLUG` in the
  wrapper (they default to Acme Corp).

**Why the MD companion exists:** it is the persistent, verbose memory behind the deck — the analyst's
evolving SWOT and the week-over-week changelog seed future pre-call prep and Defoe's morning brief with
context the 8-slide deck is too terse to carry.

---

## Execution path — ultracode workflow (preferred)

The whole refresh is scripted at **`.claude/workflows/account-summary-refresh.js`**:

```
Workflow({ name: 'account-summary-refresh',
           args: { account: 'Acme Corp', slug: 'acme-corp', runDate: '<YYYY-MM-DD>' } })
```

`runDate` is **required** — workflow scripts cannot call `Date.now()` or `new Date()`, so the caller passes today's date in. `mode` is optional; the script detects update-vs-build by checking whether the HTML already exists.

If `name` fails to resolve (the registry loads at session start, so a script added mid-session isn't yet registered), use the path form — it always resolves, and it is what the headless launchd wrapper uses:

```
Workflow({ scriptPath: '.claude/workflows/account-summary-refresh.js',
           args: { account: 'Acme Corp', slug: 'acme-corp', runDate: '<YYYY-MM-DD>' } })
```

Five phases: **Baseline** (find the delta boundary) → **Research** (all five surfaces in parallel) → **Expert POVs** (gated fan-out) → **Build** (digest, then HTML + MD + memory written concurrently) → **Gates** (Boris, Maggie, and an HTML/MD consistency check concurrently).

**What the script enforces that a prose skill only requests:**

- **Delta boundary computed once, before any surface runs.** Every research agent receives the same `since` date, so the SOQL pull and the Gmail pull cannot disagree about what "this week" means.
- **The use-case gate is code, not judgment.** The SOQL agent tags each open opportunity with the clouds it actually touches; the script matches those tags against a per-lens alias table. "Dispatch 5–8, not all 14" stops being an instruction the model may drift from — the omitted experts are computed, and each lands in the "omitted, with reason" note automatically. The prose channel is **negation-aware**: "no Financial Services Cloud" does not fire the FSC lens. Adding a lens means adding its aliases, or it silently never fires.
- **The shared context brief is built once by construction.** `SHARED_CONTEXT` is a single string assembled after the research barrier and passed verbatim to every expert. The cost discipline holds because there is literally one copy.
- **Missing surfaces cannot be silently dropped.** Every surface returns `reachable: boolean`; unreachable ones are threaded into the shared context, both artifacts, and the return value.
- **The two artifacts are checked against each other.** They are written by separate concurrent agents, so agreement is not free. A third gate fails the run on divergent pipeline figures, an opp named in one artifact only, a one-sided red flag, or date drift between the deck footer and the MD frontmatter.

**Why Build is four agents.** One agent cannot hold ~30k tokens of research *and* read both existing artifacts *and* write both back — that measured ~75k tokens on Acme Corp and failed three times with `Prompt is too long`. A `build:digest` agent condenses the five surfaces into a ≤12k-character brief, then the HTML, MD, and memory writers run concurrently off that brief, each told not to read the others' files. Top-30 opportunities by amount are inlined rather than all of them, and the dropped count is logged. **Back up both artifacts before a refresh** — the workflow does not, and a half-finished build leaves the pair inconsistent.

**Prompt caching note:** the script does not set `cache_control` manually — subagent prompts are cached by the harness, and the shared block sits at the front of every expert prompt with only the persona and lens varying after it, which is the prefix shape caching wants. The intent of the earlier `cache_control` instruction is satisfied structurally.

**Interactive invocation:** say `ultracode` with a trigger phrase, or ask for the workflow by name. The manual delegation path below stays valid for quick ad-hoc updates where the full five-phase run is more machinery than the question needs.

---

## Orchestration (manual path)

When not running the workflow, Rolando delegates as follows:

1. **Roman** — runs parallel research (Slack + web)
2. **Kaz / Richard** — pulls Salesforce org data via sf CLI
3. **Anna** — builds the final HTML deck

---

## Step 1 — Parallel Research (Roman)

Run ALL five searches simultaneously:

### A. Slack Search
Search `mcp__plugin_slack_slack__slack_search_public_and_private` for:
- `[Account Name] Agentforce Data Cloud`
- `[Account Name] opportunity pipeline`
- `[Account Name] [industry keywords]`

Extract: key stakeholders, friction points, active engagements, internal sentiment, CSG/AE activity, any named exec relationships.

### B. Web Research
Search the account's public website and recent news (2025–present) for:
- Their core business units and lines of business
- Strategic priorities and transformation initiatives (AI, data, CX, digital)
- Any public statements about Salesforce, AI platforms, or data strategy
- Recent news: earnings, restructuring, leadership changes, M&A, regulatory issues
- Industry-specific tailwinds and headwinds that materially affect them

Use this to write the **Industry Trends & Market Context** slide AND to inform the account overview narrative. Do not use generic industry content — research this specific company's situation.

### C. Salesforce Org Data (my-org)
Run these SOQL queries via `sf data query --target-org my-org --json`:

```soql
-- Account record
SELECT Id, Name, BillingCity, BillingState, Industry, Type, Owner.Name,
       AnnualRevenue, NumberOfEmployees, Website
FROM Account
WHERE Name LIKE '%[Account Name]%'
ORDER BY Name ASC
```

```soql
-- Current FY opportunities (adjust date for current fiscal year start)
SELECT Id, Name, StageName, Amount, CloseDate, Probability, Type,
       ForecastCategoryName, Owner.Name, Account.Name, Description, NextStep
FROM Opportunity
WHERE (Account.Name LIKE '%[Account Name]%')
  AND CloseDate >= [FY_START_DATE]
ORDER BY StageName, CloseDate ASC
```

### D. Email activity (Gmail)

Google Workspace reconnected 2026-07-25 — email and calendar are **required** inputs now, not optional.

Search `mcp__plugin_google-workspace_google-workspace__search_gmail_messages`:
- `(<Account> OR <domain.com> OR <brand keywords>) after:YYYY/MM/DD` — use the last-generated date on updates, FY start on a fresh build
- Then `get_gmail_threads_content_batch` on the distinct thread IDs (batch ≤25)

Gmail threads are long and quote-heavy. Strip signature blocks, `urldefense` links, calendar boilerplate,
and quoted reply chains before reading — a 15-thread pull is ~200KB raw and ~10KB of actual signal. If the
batch response spills to a file, slice it with a targeted script (grep/python) rather than reading it whole.
Reach for a Haiku/Sonnet extraction subagent only when the pull spans many threads and mechanical slicing
would still leave more than a few thousand lines to read.

Extract, and **attribute to a named person and date**:
- **Customer-voice quotes** — what the customer said in their own words. This is the highest-value signal in
  the whole skill; Slack carries our internal read, email carries theirs.
- Escalation language and urgency ("this is getting escalated internally", repeated "any update?" pings)
- Named new contacts and their titles from signature blocks — these often surface stakeholders before CRM does
- Commitments made in writing (dates, next steps, who owns what) and whether they were met
- Resolution confirmations — a customer writing "yes, that's resolved" is the only clean close on an escalation
- Responsiveness asymmetry: customer pings vs. our replies, and the lag between them

Separate **human threads from machine traffic.** Report-subscription digests, calendar invite notifications,
and auto-generated Gemini notes are not account activity — mine them for numbers, then exclude them from the
"who said what" read. Flag when a figure in an automated digest disagrees with the SOQL pull (different
filters, not necessarily an error) rather than silently picking one.

### E. Calendar + meeting transcripts

**Forward calendar** — `get_events` with `detailed: true` over the next ~3 weeks, filtered to the account.
Extract: scheduled meetings, attendee lists (who from the customer is actually showing up), recurring cadences,
and any dated decision gate on the calendar. This is what turns "30/60/90" from guesswork into a real schedule.

**Meeting transcripts** — `meeting_notes_search` with the account name, `date_from` = last-generated date.
Gemini notes and Meet transcripts land in Drive; read them with `get_doc_as_markdown` (`include_comments: false`).

For each transcript, prefer the **Decisions**, **Next steps**, and **Details** sections over the raw transcript
body — they are already de-noised and timestamped. Extract:
- **Decisions actually made**, with who aligned on them (architecture calls, strategy picks, fallback plans)
- **Open action items with named owners** — these are the real commitments; nothing in CRM captures them
- **Constraints the customer stated** — regulatory, security, compliance, org-structure limits. These bound
  every downstream bet and are almost never in the opportunity record.
- Technical blockers named in the room, and the workaround the team agreed to
- Who was in the room vs. who was invited — attendance is a relationship signal

Treat Gemini notes as **auto-generated and fallible**: they misspell names and occasionally garble a claim.
Verify any name, number, or decision you plan to quote against the transcript body or a second source, and
attribute with a timestamp when the transcript offers one.

Summarize by:
- Stage breakdown (count + total ACV per stage)
- Forecast category totals (Commit / Best Case / Pipeline / Omitted / Closed)
- Top 10 opportunities by amount with stage, close date, owner
- Total closed won vs. open pipeline
- Flag any forecast inconsistencies (e.g., Commit category at <30% probability)

---

## Step 2 — Build the HTML Deck (Anna)

Build a **7-slide HTML presentation** using the structure below. The file saves to `<PROJECT_DIR>/accounts/[account-slug]/[account-slug]-account-summary.html`.

### Design Rules
- Dark theme: body `#060D18`, slide body `#111827`, header/footer `#0B2241`
- Accent colors: `--sf-cloud-blue: #1B96FF`, `--sf-teal: #06A59A`, `--sf-amber: #FF9E2C`, `--sf-red: #BA0517`, `--sf-green: #2E844A`
- Font: `'Salesforce Sans', 'Helvetica Neue', Arial, sans-serif`
- Slide dimensions: 1280×720px fixed, shown one at a time via JS navigation
- **Never** hardcode font-family, font-size overrides, or arbitrary colors beyond the palette above

### Navigation (required on every deck)
- Full-screen viewport showing one slide at a time (`position: absolute`, `display: none / flex`)
- Prev / Next buttons below the viewport
- Dot indicators (one per slide, clickable)
- Slide counter (`1 / 7`)
- Keyboard support: `ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown`
- Keyboard hint: `← → arrow keys to navigate`

### Slide Structure (8 slides)

#### Slide 1 — Title
- Account name (large, bold)
- Subtitle: focus area (e.g., "Agentforce & Data 360 Strategic Review")
- Eyebrow: "Account Summary · Confidential · [Month Year]"
- Meta chips: Industry · Account Type · AE Name · CSM Name · CSG Leads
- Bottom accent bar: brand-colored gradient (derive from industry/company brand if possible)

#### Slide 2 — Account Overview
- Stat row: Revenue · Employees · Business Units · Salesforce relationship length · any strategic flag (SIC, QBR, etc.)
- Left column: Business units in play (colored dot badges) + current Salesforce footprint (products deployed)
- Right column: Strategic context (2–3 sentence narrative from research) + Key stakeholders (name, role, relevance)

#### Slide 3 — FY Pipeline by Stage
- Stat row: Total active pipeline · Commit · Best Case · Closed Won · Omitted/Legacy
- Horizontal pipeline bar (proportional by ACV per stage group)
- Table: top 8–10 opportunities (Stage pill · Name · Amount · Close Date · Forecast category · Owner)
- Two callout boxes: flag any forecast misalignments + note true actionable pipeline vs. omitted/legacy noise
- Footer page number updated to reflect total slide count

#### Slide 4 — Strategic Initiatives
- Two-column layout: primary initiative (left) + secondary initiative (right)
- 2 cards per column: specific named opportunities/programs with amount, stage, owner, and context
- Engagement timeline (6 steps): past milestones ✓ → current pivot point → future milestones ◌

#### Slide 5 — Red Flags & Areas of Concern
- Flag list (7 items max): 🔴 critical blockers, 🟠 amber risks, 🟡 watch items
- Each flag: bold title + 2-sentence description with specific evidence from Slack/org data
- Evidence must be real and specific — no generic risk statements
- Source every flag from actual Slack messages, org data, or web research

#### Slide 6 — Industry Trends & Market Context
- 2×4 grid of trend cards (8 cards)
- Each card: icon · trend title · 1–2 sentence finding (specific, sourced, 2025–2026) · "SF Play" line in blue (how Data Cloud or Agentforce directly addresses this trend for this account)
- **Research the specific account's situation** — do not use generic industry boilerplate
- Focus on trends that materially affect THIS account's business model and strategic priorities

#### Slide 7 — Digital Wallet Usage & Commerce Stats
- Stat row: 5 key wallet adoption metrics (global transaction value, user count, conversion lift, primary-use %, generational preference)
- 6-card trend grid (2×3): each card covers a wallet/digital commerce trend specifically relevant to the account's industry and business model
- Each card: icon · trend title · 1–2 sentence finding with real data · "SF Play" line in blue (Data Cloud or Agentforce angle)
- Tailor cards to the account — a media company gets streaming/shoppable TV/parks wallet cards; a retailer gets POS/loyalty/BNPL cards; a B2B company gets AP automation/procurement wallet cards
- Do not reuse generic wallet stats — research what's actually relevant to this specific account's revenue streams

#### Slide 8 — Recommended Next Actions
- Three columns: Immediate (this week) · Short-Term (this quarter) · Strategic (next 2 quarters)
- 4 bullet actions per column, specific and actionable
- Bottom row: two callout boxes — pivotal moment/key event + account team roster (owner chips)

---

## Step 3 — Build the MD companion (always, alongside the HTML)

Write `<PROJECT_DIR>/accounts/[account-slug]/[account-slug]-account-summary.md` — a verbose, opinionated
read in the voice of an **industry analyst covering the account's sector + a Salesforce platform
strategist covering the account.** The deck is the exec artifact; the MD is the thinking behind it.

Required structure:
- **Frontmatter** — `type`, `account`, `slug`, `sfdc_account_id`, `companion_deck`, `cadence: weekly`,
  `generated`, `last_updated`, `sources`.
- **Interrogability note** (near the top, after the intro blockquote) — a short line telling the reader
  the file is built to be **conversed with / interrogated**: they can ask to defend any number, expand
  any section, stress-test a bet, or re-run the analysis against a new signal. This is the whole point of
  the MD companion — it is the durable, queryable thinking behind the terse deck.
- **`## Weekly changelog`** — newest delta on top. Each entry dated. On a fresh build, entry #1 is the
  baseline. On Update Mode, prepend a new dated entry listing exactly what moved since last run; never
  delete prior entries.
- **BLUF** — one analyst paragraph.
- **Who they are** — the analyst's read of the company's strategy and why it matters to Salesforce;
  a post-reorg stakeholder/economic-buyer map.
- **Pipeline** — the strategist's honest read: headline number, then the caveats that change what it
  means (stage mix, Commit $, renewal inflation, hygiene noise). Group the book by thesis.
- **What moved this week** — the live Slack/delivery surface.
- **`## Email + meeting activity`** — a dedicated section, after "what moved" and before SWOT. Three parts:
  1. **Email threads** — one line per substantive human thread: participants, date range, what it's actually
     about, and at least one **verbatim customer quote** where one exists. Name the customer-side sender.
  2. **Meetings held** — per transcript: date, who attended (customer names separated from ours), decisions
     aligned, and open action items with owners.
  3. **Meetings scheduled** — the forward calendar for this account, so the 30/60/90 section can reference
     real dates instead of inventing them.

  Then a short **"what the customer's own words tell us"** read: where email/transcript signal *contradicts*
  or *outruns* the CRM record. This is the section's reason for existing — the record says Stage 02, the email
  says "this is getting escalated internally," and those are different facts about the same account.
- **SWOT** (refreshed) · **Where I'd place the bets** (prioritized) · **30/60/90**.
- **`## Expert POVs — the cloud bench weighs in`** — **always the last content section, before Sources.**
  Fan out (in parallel) to the relevant Salesforce cloud experts and append each one's read. See
  "Expert POV fan-out" below for who to route to and what each returns.
- **Sources** — include an "Expert POVs" line listing which specialists contributed and the date, plus
  **"Email"** (thread subjects + date range) and **"Meeting transcripts"** (doc titles + dates) lines. Cite
  transcripts by title and date so a reader can find the Drive doc.

Tone: empirical, opinionated, specific. Cite real names/dates/figures. Separate signal from noise
explicitly. No hype, no generic filler — every claim answers "so what for the relationship."

### Expert POV fan-out (required in every MD)

Dispatch the relevant cloud experts **in parallel** (each reads their own `team/<name>.md` persona for
voice, plus the shared account context). Route by which clouds have real footprint or pipeline in the
account — do not force a take where there's no use case (say so and omit that expert instead).

**Cost discipline (required — Boris gate).** The fan-out preserves each expert's distinct voice, but do
not re-derive the account context 11 times:

1. **Build one shared context brief first**, before dispatching anyone. Assemble the SOQL opportunity
   table, the Slack/delivery surface, and the web-research findings into a single block. This is the
   *same* text every expert receives.
2. **Cache that shared block.** Pass it with `cache_control: {"type": "ephemeral"}` on the shared-context
   message so the parallel experts read from a warm prompt cache instead of re-paying for the full
   context per agent. Each expert's *own* prompt = the cached shared block + their `team/<name>.md`
   persona + the one-line lens instruction. Only the persona and lens vary per agent.
3. **Gate hard on use case (do not dispatch on spec).** Spin up an expert **only** if their cloud has
   real footprint, live pipeline, or a named opportunity in the account. Omit the rest and record them
   in the "omitted, with reason" note — never dispatch an agent just to have it say "no use case here."
   A typical account fires 5–8 experts, not all 14 lenses.

This keeps the multi-voice fidelity the fan-out exists for while cutting redundant context spend — one
cached brief read many ways, not one uncached brief re-read many times.

| Lens | Expert (`team/<file>.md`) |
|------|---------------------------|
| Sales Cloud | Hollis |
| Service Cloud | Marisol |
| Data Cloud / data architecture | Richard (and Bessie for data-quality/AI-fitness when relevant) |
| Agentforce / AXL | Mick |
| Tableau & Analytics | Vic |
| Revenue Cloud / CPQ | Tomasz |
| Slack | Jules |
| Marketing Cloud | Linnea |
| MuleSoft / integration | Aldous |
| Industries (Mfg/Auto/Energy) | Pradeep |
| Financial Services Cloud | Gretta |
| Flex Credits / consumption economics | Ciandro |
| Hyperscaler Data Cloud (AWS/Snowflake/Databricks/GCP) | John / Paul / George / Ringo |
| Composable CDP | Hugo |

Each expert returns ~150–280 words: **(1)** what they see in the account through their lens, **(2)** their
read on the related opportunities (which is real, which is soft, sequencing), and **(3)** one cross-cloud
coordination flag (where their cloud depends on or feeds another). Bold one-line headline, cite specific
opps, no preamble. Close the section with a short **cross-cloud through-line** synthesizing the common
dependency across the experts. In Update Mode, refresh this section against the current picture (re-run
the experts whose opportunities moved); the changelog carries the history.

## Output Requirements

- Single self-contained `.html` file (no external dependencies)
- HTML saved to `<PROJECT_DIR>/accounts/[account-slug]/[account-slug]-account-summary.html`
- MD companion saved to `<PROJECT_DIR>/accounts/[account-slug]/[account-slug]-account-summary.md` — **always**
- All data from Slack, my-org, and web research must be reflected — no placeholder text
- All page numbers in footers must reflect the actual total slide count
- Confirm **both** file paths to the user when done

---

## Update Mode

**Trigger phrases:** "update account summary for [Account]", "refresh the [Account] deck", "update the [Account] account summary"

Update mode is fundamentally different from a fresh build — it is a targeted delta, not a full rebuild.

### Step 1 — Read the Existing File

Read `<PROJECT_DIR>/accounts/[account-slug]/[account-slug]-account-summary.html` and extract:
- The **generated date** from the footer of the last slide (e.g., "Generated April 26, 2026")
- The **last-known pipeline figures** from the stat row on the Pipeline slide
- The **existing red flags** from the flags slide
- The **account team names** from the last slide

### Step 2 — Delta Research (parallel)

Run only what has changed since the last-generated date:

**A. Slack — new messages only**
Search `mcp__plugin_slack_slack__slack_search_public_and_private` with `after:[last_generated_date]`:
- `[Account Name] Agentforce Data Cloud`
- `[Account Name] opportunity`
Look specifically for: new stakeholder activity, escalations, wins, blockers, deal status changes, or CSG notes.

**B. SOQL — fresh pipeline snapshot**
Re-run the full opportunity query against my-org. Compare totals to the values extracted from the existing file. Note:
- Opportunities that changed stage since last run
- New opportunities added
- Opportunities that closed won or lost
- Any new forecast misalignments

**C. Web — recent news only**
Search for news about the account published **after** the last-generated date. Focus on earnings, executive changes, M&A, product launches, or any event that materially affects the Salesforce relationship or deal context.

**D. Email — new threads only**
`search_gmail_messages` with `after:[last_generated_date]` (Gmail wants `YYYY/MM/DD`). Batch-fetch the new
thread IDs. Look for: escalations opened or closed, customer-stated urgency, new named contacts, written
commitments and whether they held, and any thread that contradicts the CRM record.

**E. Calendar + transcripts — since last run, plus forward look**
`meeting_notes_search` with `date_from: [last_generated_date]` for meetings held since the last refresh, and
`get_events` (`detailed: true`) for the next ~3 weeks. New decisions, new action items, newly-stated customer
constraints, and the forward meeting schedule all feed the changelog and the 30/60/90.

### Step 3 — Selective Slide Updates

Only update slides where the data actually changed. Leave unchanged slides as-is.

| Slide | Update if… |
|---|---|
| Title | Always — update the generated date |
| Account Overview | New stakeholder info or footprint changes |
| Pipeline by Stage | Any opportunity data changed |
| Strategic Initiatives | New programs, stage advances, or timeline shifts |
| Red Flags | New blockers surfaced, existing flags resolved, or severity changed — **email escalation language and transcript-stated blockers are first-class evidence here** |
| Industry Trends | Major industry news that changes the story |
| Digital Wallet Stats | Significant new wallet/commerce data for this industry |
| Recommended Actions | Prior actions completed; new actions required |

### Step 4 — Update the "Last Updated" Marker

Change the footer on the last slide from:
`Salesforce Confidential · Generated [old date]`
to:
`Salesforce Confidential · Generated [original date] · Updated [today's date]`

### Step 5 — Deliver

Overwrite the existing HTML at the same path **and** update the MD companion:
- Prepend a new dated entry to the MD `## Weekly changelog` listing exactly what moved (pipeline delta,
  stage moves, new/killed opps, new signals, resolved/new flags). Keep all prior entries.
- Overwrite the MD body sections (BLUF, pipeline, what-moved, SWOT, bets) with the current picture — the
  changelog preserves history; the body always reflects now.
- Refresh the `## Expert POVs` section: re-run the experts whose opportunities moved since last run and
  update the cross-cloud through-line. Leave unchanged expert takes as-is.
- Cross-check before delivery: the pipeline figures, new/killed opps, and red flags in the HTML must match
  what the MD's changelog and body report. If the HTML and MD tell different stories, fix before shipping.

Tell the user:
- What slides changed and why
- What new information was found vs. what was unchanged
- Any new red flags or resolved flags
- Confirm both file paths.

---

## Quality Checklist Before Delivering

- [ ] Navigation works: Prev/Next buttons, dots, keyboard arrows
- [ ] All 8 slides present with correct page numbers
- [ ] Pipeline data sourced from my-org SOQL (not invented)
- [ ] Slack insights quoted or paraphrased with specifics (names, dates, quotes)
- [ ] **Email activity pulled** — Gmail searched since the last-generated date; substantive human threads
      summarized with at least one attributed customer quote; machine traffic (report digests, invite
      notifications) separated from real activity, not counted as it
- [ ] **Meeting transcripts pulled** — `meeting_notes_search` run since the last-generated date; decisions,
      owned action items, and customer-stated constraints extracted; Gemini-note names/numbers verified before
      quoting
- [ ] **Forward calendar pulled** — scheduled account meetings feed the 30/60/90 section with real dates
- [ ] **MD `## Email + meeting activity` section present** — threads, meetings held, meetings scheduled, plus
      the "customer's own words vs. the CRM record" read
- [ ] Any conflict between email/transcript signal and the CRM record is stated explicitly, not smoothed over
- [ ] Industry trends slide is account-specific (web-researched, not generic)
- [ ] Digital wallet slide tailored to this account's specific revenue streams
- [ ] Red flags sourced from real evidence, not generic risks
- [ ] No hardcoded font or color overrides fighting the design system
- [ ] Keyboard focus visible on nav buttons + dots; slide counter uses `aria-live` (WCAG 2.2 AA)
- [ ] **MD companion exists** with complete frontmatter, interrogability note, `## Weekly changelog`, and all body sections
- [ ] **MD `## Expert POVs` section present** — relevant cloud experts fanned out in parallel, each with headline + opp read + cross-cloud flag, plus a closing cross-cloud through-line; omitted experts noted with reason
- [ ] **Fan-out cost discipline applied** — shared account context built once and passed with `cache_control` (not re-derived per expert); experts dispatched only where a real use case exists (5–8 typical, not all 14 lenses)
- [ ] HTML and MD tell the same story (pipeline figures, new/killed opps, red flags match)
- [ ] Both file paths saved and confirmed to user
- [ ] **Update mode only:** New dated changelog entry prepended; prior entries preserved; body overwritten to current
