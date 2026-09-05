---
name: account-overview
description: >-
  On-demand live-status pull across a named account's parent org and its subsidiaries or
  business units, combining my-org SOQL reads with a Slack sweep into one synthesized status
  surface. Not a hand-off doc — a read of "what's happening right now." TRIGGER when the user
  asks for an "account overview", "what's going on with [Account]", "[Account] live status",
  "pull the [Account] picture", "run the overview for [Account]", or "[account] status" /
  "[account] overview" for any named parent account with subsidiaries (e.g. "Acme Corp account
  overview", "what's going on with Acme Corp", "Acme Corp live status", "pull the Acme Corp
  picture", "acme overview", "acme status").
metadata:
  version: "1.0"
---

# Account Overview — live status pull

**Purpose.** An on-demand live status surface across a parent account (e.g. Acme Corp) and its
subsidiaries or business units (e.g. Acme Corp Subsidiary A, Subsidiary B, Subsidiary C, ...).
Not a hand-off doc — a live read of "what's happening right now," built fresh each run from
my-org (Salesforce) and Slack.

In the original multi-agent design this ran as a fan-out across named personas (an "Imelda" for
SOQL reads, a "Pemberton" for Slack + synthesis, a "Defoe" for layout, a "Hank"/"Vera" pair for
posting + verifying). This skill runs standalone: do every step below directly. If a full team
roster happens to be installed (`team/<name>.md` files), treat the persona names in parentheses
as an optional parallel fan-out — dispatch to those teammates instead of running the step
yourself — but nothing below requires that roster to exist.

---

## Reference artifacts (load these first; they hold the load-bearing detail)

| File | Purpose |
|---|---|
| `team/reference/account-overview-soql.sql` | All SOQL queries (a Q0 ID-list builder + numbered reads Q1–Q7, plus a discovery query and a sibling-account query). Adapt the account/subsidiary name patterns to the real account before running. |
| `team/reference/account-overview-slack-channels.json` | Canonical channel list, subsidiary channels, search strings, noise-rule pointer. |
| `team/reference/account-overview-noise-filter.md` | Hard drops + soft flags for name collisions (similarly-named unrelated orgs, people, or companies that share a word with the account/subsidiary names). |
| `team/templates/account-overview-template.md` | The output skeleton — render into this, do not freelance the structure. |
| `team/scripts/eval-account-overview.sh` | Pre-render gate. Runs a fixed set of quality checks. Must pass before delivering. |

If any of those files is missing, stop and surface the gap to the user — do not proceed with a
partial pull. (These files are populated per-project; see the project's own setup process if the
directory is empty.)

---

## Run it — discovery, then three reads in parallel, then synthesize, then gate

### 0. Discovery — check for new parents and new channels before the main reads

The account's canonical lists drift over time. Every run, look for new umbrella accounts and new
account-relevant Slack channels before the main reads.

**0a — Account-parent discovery.**
- Run the discovery query in `team/reference/account-overview-soql.sql`. It returns parent IDs
  for accounts whose parent name matches the account's known name-family patterns (e.g. `Acme
  Corp %`, `Subsidiary A%`, `Subsidiary B%`, `Subsidiary C%` — substitute the real account's
  known subsidiary name stems here).
- Resolve the returned IDs to names with a follow-up `SELECT Id, Name FROM Account WHERE Id IN
  (...)`.
- Diff against the canonical parent-name list already in the Q0 query.
- **For each new parent:** apply the noise-filter rules in
  `team/reference/account-overview-noise-filter.md` to drop obvious false positives (unrelated
  companies or people whose name happens to share a word with the account or a subsidiary).
- Surviving new parents get reported under `Newly-discovered parents` in the output. Do **not**
  silently fold them into the account-ID list — the user decides per run whether they belong.
- **For each new parent the user accepts**, append it to Q0's canonical name list (manual edit)
  — the next run picks it up automatically.

**0b — Slack channel discovery.**
- Run channel search for every query in `channel_discovery_queries` from
  `team/reference/account-overview-slack-channels.json`.
- Diff each result's channel ID against `canonical_channels[].id + subsidiary_channels[].id`
  already in the JSON.
- Apply the `noise_drop_patterns` regex from `channel_discovery_settings` to filter out
  collisions (name lookalikes, generic "global" channels with no real connection to the account).
- Surviving new channels get reported under `Newly-discovered channels` in the output. Do **not**
  silently scan them in this run — the user decides per run whether they belong.
- **For each new channel the user accepts**, add it to `subsidiary_channels[]` in the JSON — the
  next run scans it.

### 1. my-org SOQL reads

- Run Q0 from `team/reference/account-overview-soql.sql` to build the umbrella account-ID list.
- **Step 0 — required:** flatten the Q0 result to a comma-separated quoted-ID string. Subsequent
  queries silently scope-collapse if you skip this.
- Run Q1–Q7 in parallel against `--target-org my-org`.
- Cache scratch outputs to `team/transition/_account-overview-run_<YYYY-MM-DD>_<n>_*.json` for
  the eval script to read.
- **Sibling-account check:** also run the sibling-account query at the bottom of the SOQL file
  (accounts that look like they belong to the family — e.g. `Acme Corp Subsidiary D -
  Analysts` — but aren't actually parented under the canonical umbrella). If the sibling list is
  non-empty, surface it under `Risk surface > Org-hygiene flags` with
  `[sibling-not-under-canonical-parent]`.

### 2. Slack scan

- Read every channel in `canonical_channels` from
  `team/reference/account-overview-slack-channels.json`.
- Run every string in `search_strings_30d`, replacing `<TODAY-30D>` with today minus 30 days.
- Apply `team/reference/account-overview-noise-filter.md` — drop hard-drops, label soft-flags.
  **Count drops** for the Signal fidelity line.

### 3. Prior-publication reconciliation

- Pull the account owner's own recent publications to this account (e.g. a weekly digest or
  strategist call posted to their personal or team channel in the last 30 days).
- Note any account-relevant published call (weekly digest, strategist's POV, hygiene addenda).
- If current Slack signal contradicts a published call, surface the contradiction in the
  `Reconciliation:` paragraph — do not silently overwrite.

### 4. Synthesize

- Render into `team/templates/account-overview-template.md`.
- Save to `team/transition/account-overview-<YYYY-MM-DD>.md`.
- Surface to the user inline as well.
- **Discovery findings get a dedicated section** at the top under Signal fidelity — see template.

### 5. Eval gate (required before delivery)

- Run `team/scripts/eval-account-overview.sh <draft.md> <scratch_prefix>`.
- If exit 1 (BLOCK): fix the failures and re-render before showing the user.
- If exit 0 with warnings: surface the warnings in the delivery message above the brief.

### 6. Optional — post a Slack summary (only after the eval gate passes)

- **Gate:** only run this step if Step 5 returned exit 0, and only if the user has a Slack
  posting target for this workflow. If eval failed, surface the brief inline only — do NOT post
  to Slack.
- **Extract summary:** run `team/scripts/extract-account-overview-summary.sh <draft.md>` to get
  the Slack-shaped block (header, Signal fidelity, Top of mind, Pipeline total, Discovery,
  highest-leverage next move, file path).
- **Post:** send the extracted summary to the target channel via whatever Slack tool is
  available.
- **No file upload.** The brief stays on local disk only — it may contain org record IDs and ACV
  figures that should not enter Slack's retention. The post includes the local file path so the
  user can open it from the Slack message.
- **Plain text only.** No Block Kit formatting unless the project has already standardized on it.
- **Verify the post landed:** read the channel back (a search like `in:#channel from:<bot>
  after:<today>`) to confirm the post landed and the file path string is intact. If the read-back
  fails, surface the failure to the user — do not silently retry.
- **Skip rule:** if the user's prompt explicitly says "don't post" / "skip slack" / "show inline
  only", honor that and skip this step.

---

## SE forecast notes — known scope mismatch pattern

Some org-level forecast reports are scoped to a specific team's assignments and will show **zero
overlap** with a large umbrella account owned by other account executives. When that happens, the
Signal fidelity line should report the mismatch plainly, e.g.:

```
SE forecast notes pulled from <report Id>: out of scope (umbrella not in report)
```

Do not silently treat this as a failure or as missing data — it is a known scope mismatch, not a
query error.

---

## Hard rules

- **Read-only.** SOQL SELECT, Reports REST API GET, Slack search/read only. No DML, no metadata
  deployment, no state-mutating Apex.
- **No invented data.** Empty section → write `No signal in last 30 days.` Do not pad.
- **Confidence labels.** Anything not source-anchored gets `[medium]` or `[low]`. Eval gate counts
  confidence-tag coverage.
- **Subsidiary fidelity.** Every opp / channel / stakeholder must be attributed to a specific
  subsidiary or business unit. Eval gate enforces this on the stakeholder watchlist.
- **Don't re-litigate published calls.** Reconcile, surface contradictions, never silently
  rewrite a prior published read.
- **Business-unit cutover dates.** If a subsidiary is mid-transition (acquired, divested, or
  being folded into another business unit as of a known date), track that cutover date explicitly
  — before it, the subsidiary is in scope; after it, drop it from scope and update the header.
- **Salesforce CX Style Guide (Dec 2025).** Active voice. Sentence case in body, title case in
  headings. Product names: Agentforce, Data Cloud, MuleSoft, Apex, AppExchange.

---

## Failure modes to watch

- **A key narrative field (e.g. `Opportunity.NextStep`) can be empty across most open opps.** The
  real narrative may live in Slack threads or a success channel instead of on the record. Don't
  expect it in the field, and don't treat an empty field as missing data on its own.
- **Multiple canonical parent-account variants can exist for one umbrella.** The Q0 query is
  built to expand across all known variants — do not narrow to a single `ParentId`.
- **Placeholder pipeline records can distort headline ACV.** Auto-renewal or template
  placeholder rows with far-future close dates can inflate a headline total. The eval gate should
  warn above a set threshold (e.g. 30% of headline ACV); surface that warning prominently when it
  fires.
- **A quiet canonical channel is not the same as missing data.** If a channel was silent in the
  30-day window, report the silence; don't treat it as a query failure.

---

## Run cadence

On-demand. No cron. Run whenever the user invokes a trigger phrase for a specific account.
