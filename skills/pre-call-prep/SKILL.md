---
name: pre-call-prep
description: >-
  Build a single-page pre-call prep brief for an upcoming client meeting: account context and
  recent news, tailored business-value talking points, and Flex Credits pricing guidance, all
  compiled into one print-ready HTML page. TRIGGER when the user asks to prepare for an upcoming
  client meeting with a named account — e.g. "prep for [Account] meeting", "pre-call prep for
  [Account]", "meeting prep for [Account] on Thursday", "get me ready for the [Account] call".
metadata:
  version: "1.0"
---

# Pre-Call Prep

Builds a consolidated, single-page prep brief for an upcoming client meeting. Run the three
research angles below yourself (in parallel where possible), then compile them into one HTML
brief.

In the original multi-agent design this ran as a three-way fan-out to named personas (an
account-researcher "Roman", a business-value writer "Abigail", a pricing specialist "Ciandro"),
compiled by a designer persona "Anna." That framing doesn't matter here — do all three angles
directly yourself, as described below. If a full team roster happens to be installed
(`team/roman.md`, `team/abigail.md`, `team/ciandro.md`), treat this as an optional enhancement:
dispatch each section to the matching teammate in parallel instead of researching it yourself.
Nothing below requires that roster to exist.

---

## Angle 1 — Account research

### A. Recent news & business context
Search for recent news (past 90 days) about the account:
- Earnings reports and guidance
- Executive changes or leadership announcements
- Strategic initiatives (transformation programs, new product launches, M&A)
- Regulatory issues or industry headwinds affecting them
- Any public statements about AI, data strategy, or digital transformation

### B. Salesforce footprint & engagement
Search Slack for:
- `[Account Name] Agentforce Data Cloud`
- `[Account Name] opportunity`
- `[Account Name] account team`

Extract:
- Current Salesforce products deployed
- Active opportunities and their stages (pull from my-org if a Salesforce connection is
  available)
- Key stakeholders (account exec, CSM, solutions lead, executive sponsors)
- Recent friction points or blockers
- Internal sentiment and engagement status

### C. Tech stack intelligence
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

## Angle 2 — Business value talking points

Based on the account research above, develop **3-5 business value talking points** tailored to
this account's industry vertical and strategic priorities.

For each talking point:
- **Business outcome** (what they care about: revenue growth, cost reduction, customer
  retention, operational efficiency, risk mitigation)
- **How Salesforce delivers it** (specific Data Cloud or Agentforce capability)
- **Proof point** (customer story, benchmark, or metric from a similar company)

**Industry-specific focus (adapt to the account's actual industry):**
- **Media & entertainment**: content personalization, audience activation, ad optimization, D2C
  subscriber growth
- **Telecom**: churn reduction, network ops AI, 5G monetization, customer service automation
- **Other industries**: adapt messaging to their core business model and transformation
  priorities

**Output format:**
- 3-5 business value talking points (outcome → capability → proof)
- Recommended conversation flow (opener → discovery questions → solution positioning → next
  steps)

---

## Angle 3 — Flex Credits pricing context

Provide Flex Credits benchmarks for the account's industry and use-case scope.

**If Data Cloud is in scope:**
- Typical Data Cloud Flex Credits consumption for similar accounts (profile ingestion,
  activation, segmentation)
- Pricing guidance for the account's estimated data scale (number of profiles, activation
  frequency, connectors)
- Any flex-to-term conversion considerations

**If Agentforce is in scope:**
- Typical Agentforce Flex Credits consumption for similar accounts (conversation volume, action
  complexity)
- Pricing guidance for the account's estimated usage (number of agents, conversation volume,
  integrations)
- Capacity planning considerations

**Output format:**
- Benchmark range for similar accounts in this industry
- Estimated Flex Credits consumption for this account (if data is available)
- Key pricing questions to ask in the meeting
- Any flex credit traps or gotchas to avoid

---

## Compile the final brief

Compile all three angles into a **single-page consolidated brief** saved to:

`<PROJECT_DIR>/pre-call-prep-[account-slug]-[date].html`

### Brief structure

**Header:**
- Account name
- Meeting date/time (if provided)
- Key attendees (if known)
- Meeting objective (if provided)

**Section 1 — Account context** (Angle 1)
- Business snapshot (3-4 sentences)
- Salesforce relationship status
- Tech stack summary
- Red flags / sensitivities

**Section 2 — Business value talking points** (Angle 2)
- 3-5 tailored value propositions with outcomes, capabilities, proof points
- Recommended conversation flow

**Section 3 — Flex Credits guidance** (Angle 3)
- Benchmark pricing context
- Estimated consumption for this account
- Key pricing questions to ask

**Section 4 — Recommended prep actions**
- 3-5 bullet actions to take before the meeting (e.g. review a specific opp in Salesforce, prep
  a demo, confirm attendees, research a specific stakeholder)

### Design rules
- Single-page HTML layout (no navigation, no slides)
- Light theme for printing: body `#FFFFFF`, text `#181818`, accent `#1B96FF`
- Font: `'Salesforce Sans', 'Helvetica Neue', Arial, sans-serif`
- Print-friendly: no backgrounds, standard margins, clean hierarchy

---

## Quality checklist

- [ ] Account context is specific and current (not generic industry boilerplate)
- [ ] Business value angles are tailored to this account's strategic priorities
- [ ] Flex Credits guidance is based on real benchmarks for this industry
- [ ] Red flags are sourced from real Slack/Salesforce data (not invented risks)
- [ ] Brief is 1 page and print-ready
- [ ] File saved and path confirmed to the user
