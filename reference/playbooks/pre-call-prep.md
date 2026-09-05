# Skill: Pre-Call Prep

**Trigger:** User asks to prepare for an upcoming client meeting with a named account.

**Invocation examples:**
- "Prep for Meridian Studios meeting"
- "Pre-call prep for Harborview Media"
- "Meeting prep for Fenwick Wireless on Thursday"
- "Get me ready for the Cascade Communications call"

---

## Orchestration

Rolando delegates this skill as follows:

1. **Roman** — account research (business priorities, recent news, tech stack intel)
2. **Abigail** — business value angles tailored to the account's industry vertical
3. **Ciandro** — Flex Credits benchmarks for similar companies in that industry

All three run **in parallel**. Output is a consolidated 1-page brief.

---

## Step 1 — Account Research (Roman)

### A. Recent News & Business Context
Search for recent news (past 90 days) about the account:
- Earnings reports and guidance
- Executive changes or leadership announcements
- Strategic initiatives (transformation programs, new product launches, M&A)
- Regulatory issues or industry headwinds affecting them
- Any public statements about AI, data strategy, or digital transformation

### B. Salesforce Footprint & Engagement
Search Slack (`mcp__plugin_slack_slack__slack_search_public_and_private`) for:
- `[Account Name] Agentforce Data Cloud`
- `[Account Name] opportunity`
- `[Account Name] CSG AE`

Extract:
- Current Salesforce products deployed
- Active opportunities and their stages
- Key stakeholders (AE, CSM, CSG leads, executive sponsors)
- Recent friction points or blockers
- Internal sentiment and engagement status

### C. Tech Stack Intelligence
Research the account's known technology stack:
- Cloud data platforms (Snowflake, Databricks, AWS, GCP, Azure)
- CRM and marketing automation tools
- CDP or customer data systems
- AI/ML platforms or initiatives
- Any competitive threats (non-Salesforce platforms in play)

**Output format:**
- 3-4 sentence business context summary
- Salesforce relationship snapshot (products, key contacts, active deals)
- Tech stack summary with implications for Data Cloud / Agentforce positioning
- Red flags or sensitivities to avoid in the meeting

---

## Step 2 — Business Value Angles (Abigail)

Based on Roman's research, develop **3-5 business value talking points** tailored to this account's industry vertical and strategic priorities.

For each talking point:
- **Business outcome** (what they care about: revenue growth, cost reduction, customer retention, operational efficiency, risk mitigation)
- **How Salesforce delivers it** (specific Data Cloud or Agentforce capability)
- **Proof point** (customer story, benchmark, or metric from a similar company)

**Industry-specific focus:**
- **Media & Entertainment** (e.g., Meridian Studios, Harborview Media): content personalization, audience activation, ad optimization, D2C subscriber growth
- **Telecom** (e.g., Fenwick Wireless, Bluepeak Telecom): churn reduction, network ops AI, 5G monetization, customer service automation
- **Other industries**: adapt messaging to their core business model and transformation priorities

**Output format:**
- 3-5 business value talking points (outcome → capability → proof)
- Recommended conversation flow (opener → discovery questions → solution positioning → next steps)

---

## Step 3 — Flex Credits Pricing Context (Ciandro)

Provide Flex Credits benchmarks for the account's industry and use case scope.

**If Data Cloud is in scope:**
- Typical Data Cloud Flex Credits consumption for similar accounts (profile ingestion, activation, segmentation)
- Pricing guidance for the account's estimated data scale (number of profiles, activation frequency, connectors)
- Any flex-to-term conversion considerations

**If Agentforce is in scope:**
- Typical Agentforce Flex Credits consumption for similar accounts (conversation volume, action complexity)
- Pricing guidance for the account's estimated usage (number of agents, conversation volume, integrations)
- Capacity planning considerations

**Output format:**
- Benchmark range for similar accounts in this industry
- Estimated Flex Credits consumption for this account (if data is available)
- Key pricing questions to ask in the meeting
- Any flex credit traps or gotchas to avoid

---

## Final Output

Anna compiles Roman's, Abigail's, and Ciandro's output into a **single-page consolidated brief** saved to:

`<PROJECT_DIR>/pre-call-prep-[account-slug]-[date].html`

### Brief Structure

**Header:**
- Account name
- Meeting date/time (if provided)
- Key attendees (if known)
- Meeting objective (if provided)

**Section 1 — Account Context** (Roman)
- Business snapshot (3-4 sentences)
- Salesforce relationship status
- Tech stack summary
- Red flags / sensitivities

**Section 2 — Business Value Talking Points** (Abigail)
- 3-5 tailored value propositions with outcomes, capabilities, proof points
- Recommended conversation flow

**Section 3 — Flex Credits Guidance** (Ciandro)
- Benchmark pricing context
- Estimated consumption for this account
- Key pricing questions to ask

**Section 4 — Recommended Prep Actions**
- 3-5 bullet actions to take before the meeting (e.g., review specific opp in SFDC, prep demo, confirm attendees, research specific stakeholder)

### Design Rules
- Single-page HTML layout (no navigation, no slides)
- Light theme for printing: body `#FFFFFF`, text `#181818`, accent `#1B96FF`
- Font: `'Salesforce Sans', 'Helvetica Neue', Arial, sans-serif`
- Print-friendly: no backgrounds, standard margins, clean hierarchy

---

## Quality Checklist

- [ ] Account context is specific and current (not generic industry boilerplate)
- [ ] Business value angles are tailored to this account's strategic priorities
- [ ] Flex Credits guidance is based on real benchmarks for this industry
- [ ] Red flags are sourced from real Slack/SFDC data (not invented risks)
- [ ] Brief is 1 page and print-ready
- [ ] File saved and path confirmed to user
