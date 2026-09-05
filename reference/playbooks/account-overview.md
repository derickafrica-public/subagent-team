# Skill: Acme Corp Account Overview (live status pull)

**Trigger phrases:**
- "Acme Corp account overview"
- "what's going on with Acme Corp"
- "Acme Corp live status"
- "pull the Acme Corp picture"
- "Pemberton, run the overview"
- "acme overview" / "acme status"

**Owner:** Pemberton synthesizes. Imelda runs the my-org SOQL reads. Defoe leads the synthesis layout.

**Purpose.** On-demand live status surface across the Acme Corp parent (`<ACME_CORP_PARENT_ACCOUNT_ID>`) and its subsidiaries (Beacon Pricing, Indices, Market Intelligence, Ratings, Nimbus AI, Continental Data Partners, Acme Sustainability, VinTrust pre-cutover, etc.). Not a hand-off doc — a live read of "what's happening right now."

---

## Reference artifacts (load these first; they hold the load-bearing detail)

| File | Purpose |
|---|---|
| `team/reference/sp-account-soql.sql` | All 7 SOQL queries (Q0 ID-list builder + Q1–Q7 reads). Field-corrected per 2026-06-19 live run. |
| `team/reference/sp-slack-channels.json` | Canonical channel list, subsidiary channels, 14 search strings, noise rules pointer. |
| `team/reference/sp-noise-filter.md` | Hard drops + soft flags for name collisions (Beaconville, Nimbusco, Caroline Beacon, Acme Corp Composite Index). |
| `team/templates/sp-overview-template.md` | The output skeleton — render into this, do not freelance the structure. |
| `team/scripts/eval-sp-overview.sh` | Pre-render gate. Runs 8 checks. Skill MUST PASS this before delivering. |

If any of those files is missing, stop and surface the gap to the user — do not proceed with a partial pull.

---

## Dispatch

Run **discovery first, then three reads in parallel**, then synthesize, then gate.

### 0. Discovery (Imelda + Pemberton, run in parallel)
The skill's canonical lists drift over time. Every run, check for new umbrella accounts and new account-relevant Slack channels before the main reads.

**0a — Account-parent discovery (Imelda).**
- Run Q8 from `team/reference/sp-account-soql.sql`. Returns parent IDs for accounts whose parent name matches `Acme Corp %`, `Contin%`, `Acme Corp%`, `Nimbus AI%`, `Acme Sustainability`, `Suvarna Ratings%`, `Acme Intelligence Platform%`, `Meridian Financial %`.
- Resolve the returned IDs to names with a follow-up `SELECT Id, Name FROM Account WHERE Id IN (...)`.
- Diff against the 15 canonical-name parent list in Q0.
- **For each new parent:** apply the noise-filter rules in `team/reference/sp-noise-filter.md` (drop `Nimbusco*`, `Nimbuskai*`, `Contin*`, `CDP - Community Data Providers`, etc.).
- Surviving new parents get reported under `Newly-discovered parents` in the output. Do **not** silently fold them into `:SP_ACCOUNT_IDS` — the user decides per run whether they belong.
- **For each new parent the user accepts**, append it to Q0's canonical name list (manual edit) — the next run picks it up automatically.

**0b — Slack channel discovery (Pemberton).**
- Run `slack_search_channels` for every query in `channel_discovery_queries` from `team/reference/sp-slack-channels.json`.
- Diff each result's channel ID against `canonical_channels[].id + subsidiary_channels[].id` already in the JSON.
- Apply the regex `noise_drop_patterns` from `channel_discovery_settings` to filter out collisions (Beaconville, Nimbusco, generic "global" channels with no Acme Corp context).
- Surviving new channels get reported under `Newly-discovered channels` in the output. Do **not** silently scan them in this run — the user decides per run whether they belong.
- **For each new channel the user accepts**, add it to `subsidiary_channels[]` in the JSON — the next run scans it.

### 1. my-org SOQL reads (Imelda)
- Run Q0 from `team/reference/sp-account-soql.sql` to build `:SP_ACCOUNT_IDS` (the umbrella ID list).
- **Step 0 — required:** flatten the Q0 result to a comma-separated quoted-ID string. Subsequent queries silently scope-collapse if you skip this.
- Run Q1–Q7 in parallel against `--target-org my-org`.
- Cache scratch outputs to `team/transition/_sp_run_<YYYY-MM-DD>_<n>_*.json` for the eval script to read.
- **Sibling-account check:** also run the sibling-account query at the bottom of the SOQL file (`Acme Corp Ratings - Analysts`, `Suvarna Ratings` non-children, etc.). If the sibling list is non-empty, surface it under `Risk surface > Org-hygiene flags` with `[sibling-not-under-canonical-parent]`.

### 2. Slack scans (Pemberton)
- Read every channel in `canonical_channels` from `team/reference/sp-slack-channels.json`.
- Run every string in `search_strings_30d`, replacing `<TODAY-30D>` with today minus 30 days.
- Apply `team/reference/sp-noise-filter.md` — drop hard-drops, label soft-flags. **Count drops** for the Signal fidelity line.

### 3. User publication reconciliation (Pemberton)
- Pull `from:@account.owner in:#account-owner-channel after:<TODAY-30D>` (note: `from:@account.owner` exact syntax — `from:the account owner` returns zero).
- Note any Acme-Corp-relevant published call (weekly digest, STRATEGIST'S POV, hygiene addenda).
- If current Slack signal contradicts a published call, surface the contradiction in the `Reconciliation:` paragraph — do not silently overwrite.

### 4. Synthesize (Defoe)
- Render into `team/templates/sp-overview-template.md`.
- Save to `team/transition/sp-overview-<YYYY-MM-DD>.md`.
- Surface to the user inline as well.
- **Discovery findings get a dedicated section** at the top under Signal fidelity — see template.

### 5. Eval gate (required before delivery)
- Run `team/scripts/eval-sp-overview.sh <draft.md> <scratch_prefix>`.
- If exit 1 (BLOCK): fix the failures and re-render before showing the user.
- If exit 0 with warnings: surface the warnings in the delivery message above the brief.

### 6. Post to Slack #account-owner-channel (Hank, after eval gate passes)
- **Gate:** only run this step if Step 5 returned exit 0. If eval failed, surface the brief inline only — do NOT post to Slack.
- **Extract summary:** run `team/scripts/extract-sp-summary.sh <draft.md>` to get the Slack-shaped block (header, Signal fidelity, Top of mind, Pipeline total, Discovery, highest-leverage next move, file path).
- **Post:** Hank calls `slack_send_message` with channel `#account-owner-channel`, text = the extracted summary.
- **No file upload.** The brief stays on local disk only — it contains my-org record IDs and ACV figures that should not enter Slack's retention. The post includes the local file path so the user can open it from the Slack message.
- **No Block Kit yet.** Plain mrkdwn text only, per the W1a Build & Deploy slice. Block Kit lights up in W1b.
- **Vera verifies:** after post, Hank logs the post timestamp + channel ID to `team/build/audit/sp-overview-<YYYY-MM-DD>.log`. Vera reads the channel back via `slack_search_public` (`in:#account-owner-channel from:@<bot> after:<today>`) to confirm the post landed and the file path string is intact. If Vera's read-back fails, surface the failure to the user — do not silently retry.
- **Skip rule:** if the user's prompt explicitly says "don't post" / "skip slack" / "show inline only", honor that and skip Step 6.

---

## SE forecast notes — known scope mismatch

The user's Daily Opp Pulse report `<DAILY_OPP_PULSE_REPORT_ID>` (per-installation — resolve locally, do not hardcode) covers TMT-Strat assignments only. The Acme Corp umbrella is owned by other AEs (names redacted — resolve locally) so the report yields **zero overlap** for this skill. The Signal fidelity line should report:

```
SE forecast notes pulled from <DAILY_OPP_PULSE_REPORT_ID>: out of scope (umbrella not in report)
```

Do not silently treat this as a failure or as missing data — it is a known scope mismatch.

---

## Hard rules

- **Read-only.** Imelda's posture applies. SOQL SELECT, Reports REST API GET, Slack search/read only. No DML, no metadata deployment, no state-mutating Apex.
- **No invented data.** Empty section → write `No signal in last 30 days.` Do not pad.
- **Confidence labels.** Anything not source-anchored gets `[medium]` or `[low]`. Eval gate counts confidence-tag coverage.
- **Subsidiary fidelity.** Every opp / channel / stakeholder must be attributed to a subsidiary. Eval gate enforces this on the stakeholder watchlist.
- **Don't re-litigate the user's published calls.** Reconcile, surface contradictions, never silently rewrite.
- **Mobility Global cutover (2026-07-01).** Until cutover, VinTrust / DealerSignal / Marchand Data are in scope. After cutover, drop them from scope and update the header.
- **Salesforce CX Style Guide (Dec 2025).** Active voice. Sentence case in body, title case in headings. Product names: Agentforce, Data Cloud / Data 360, MuleSoft, Apex, AppExchange.

---

## Failure modes to watch

From the 2026-06-19 first run:
- **`Opportunity.NextStep` is empty across all 350 open opps.** SE narrative for this account lives in Slack threads + the Success channel, not on the opp record. Don't expect anything in the field.
- **15 canonical Acme Corp parent variants exist in my-org.** Q0 expands across all of them — do not narrow to a single ParentId.
- **Stage-01 placeholders distort headline ACV.** ~46% of headline ACV in the first run was Stage-01 auto-renewal placeholders for 2028+ close dates. Eval gate warns above 30%; surface the warning prominently.
- **Quiet canonical channels are not the same as missing data.** `#acct-acmecorp`, `#acct-acmecorp-beacon`, `#acme_corp_agentforce` were silent in the first 30d window. Report the silence; don't treat it as a query failure.

---

## Run cadence

On-demand. No cron. Whenever the user invokes a trigger phrase.
