# Skill: Competitive Response

**Trigger:** User asks for competitive intelligence or counter-positioning against a specific competitor.

**Invocation examples:**
- "Competitive response for Snowflake"
- "How do we beat Databricks on this deal?"
- "Snowflake counter-positioning"
- "What's Databricks pitching to media companies right now?"

---

## Orchestration

Rolando delegates this skill as follows:

1. **Roman** — competitive research (what they're pitching, recent wins/losses, messaging)
2. **Relevant cloud expert** (based on competitor) — technical counter-positioning
3. **Abigail** — Data Cloud differentiation narrative

All three run **in parallel**. Output is a consolidated competitive counter-positioning brief.

---

## Step 1 — Competitive Research (Roman)

### A. Current Positioning & Messaging
Research the competitor's current go-to-market positioning:
- Core value propositions and differentiators they're leading with
- Target industries and use cases they're prioritizing
- Recent product launches or feature announcements (past 6 months)
- Pricing and packaging changes
- Executive messaging (CEO blog posts, earnings calls, keynotes)

### B. Known Wins & Losses
Search for recent competitive intelligence:
- Accounts where they've won against Salesforce (or vice versa)
- Win themes and key decision criteria
- Loss themes and reasons for churn
- Customer case studies they're promoting
- Analyst reports and positioning (Gartner, Forrester, etc.)

### C. Weaknesses & Gaps
Identify known gaps in their platform:
- Missing capabilities or integrations
- Pricing traps or hidden costs
- Scalability or performance issues
- Support and ecosystem limitations
- Customer complaints or churn signals

**Output format:**
- Competitor's core strengths and positioning (3-5 bullets)
- Known weaknesses and gaps (3-5 bullets)
- Recent wins/losses and decision criteria
- Key objections customers raise about them

---

## Step 2 — Technical Counter-Positioning (Cloud Expert)

Route to the relevant cloud expert based on the competitor:

| Competitor | Route to | Focus |
|---|---|---|
| Snowflake | Paul | Data Cloud vs. Snowflake architecture, connector strategy, activation gaps |
| Databricks | George | Data Cloud vs. Databricks lakehouse, Unity Catalog vs. Data Cloud harmonization |
| AWS native (Redshift, S3, Glue) | John | Data Cloud + AWS integration patterns, when to use native vs. Data Cloud |
| GCP native (BigQuery, Dataflow) | Ringo | Data Cloud + GCP integration patterns, when to use native vs. Data Cloud |
| Other CDP / activation tools (Segment, mParticle, ActionIQ, Hightouch) | Hugo | Composable CDP vs. unified platform, activation limits, identity resolution |

### Technical Comparison Framework

The assigned expert provides:

**A. Architecture Comparison**
- How does the competitor's architecture differ from Data Cloud?
- What are the trade-offs (flexibility vs. complexity, performance vs. cost, etc.)?
- What does Data Cloud do natively that requires 3rd-party tools or custom code with the competitor?

**B. Integration Patterns**
- How do customers typically integrate the competitor with Salesforce?
- What are the friction points, latency issues, or data sync challenges?
- How does Data Cloud's native Salesforce integration eliminate these?

**C. Use Case Coverage**
- What use cases does the competitor excel at?
- What use cases are awkward or impossible with the competitor?
- Where does Data Cloud have a decisive advantage?

**D. TCO & Operational Complexity**
- Hidden costs or pricing traps with the competitor
- Engineering effort required (data pipelines, connectors, maintenance)
- Vendor management complexity (multiple tools vs. unified platform)

**Output format:**
- Architecture comparison (3-5 key differences)
- Integration pain points with the competitor (3-5 bullets)
- Use cases where Data Cloud wins decisively (3-5 examples)
- TCO and operational advantages for Data Cloud (3-5 bullets)

---

## Step 3 — Differentiation Narrative (Abigail)

Based on Roman's research and the cloud expert's technical analysis, Abigail writes a **customer-facing differentiation narrative** that positions Data Cloud as the superior choice.

### Narrative Structure

**A. Acknowledge Their Strengths**
- Give credit where due (builds credibility)
- "Yes, [Competitor] is strong at [X], and many customers use it for [Y]"

**B. Highlight the Gaps**
- Specific weaknesses that matter for this use case
- "But [Competitor] struggles with [Z], which means customers have to [workaround]"

**C. Data Cloud Differentiation**
- What Data Cloud does natively that eliminates the gaps
- "Data Cloud solves this by [capability], which gives you [business outcome]"

**D. Customer Proof Points**
- Real customer stories of migration from competitor to Data Cloud
- Benchmark metrics (faster time to value, lower TCO, better performance)

**E. Objection Handling**
- Common objections customers raise ("But we already have Snowflake...")
- How to reframe the conversation ("This isn't about replacing Snowflake — it's about activating your data in Salesforce without building custom pipelines")

**Output format:**
- 2-3 paragraph differentiation narrative (customer-ready)
- 5-7 objection handling talking points (objection → reframe → proof)
- 3-5 win stories or proof points (with metrics)

---

## Final Output

Anna compiles Roman's, the cloud expert's, and Abigail's output into a **competitive counter-positioning brief** saved to:

`<PROJECT_DIR>/competitive-response-[competitor-slug]-[date].html`

### Brief Structure

**Header:**
- Competitor name
- Date prepared
- Primary use case or deal context (if provided)

**Section 1 — Competitive Intelligence** (Roman)
- Competitor's core strengths and positioning
- Known weaknesses and gaps
- Recent wins/losses and decision criteria

**Section 2 — Technical Counter-Positioning** ([Cloud Expert])
- Architecture comparison
- Integration pain points
- Use case coverage analysis
- TCO and operational advantages

**Section 3 — Differentiation Narrative** (Abigail)
- Customer-facing positioning story
- Objection handling talking points
- Win stories and proof points

**Section 4 — Battle Card Summary**
- 1-page cheat sheet: strengths, weaknesses, differentiation, objections, proof points

### Design Rules
- Multi-page HTML layout (scrollable, with anchor nav at top)
- Light theme for printing: body `#FFFFFF`, text `#181818`, accent `#1B96FF`
- Font: `'Salesforce Sans', 'Helvetica Neue', Arial, sans-serif`
- Print-friendly: clean hierarchy, standard margins

---

## Quality Checklist

- [ ] Competitive intelligence is current (past 6 months) and specific
- [ ] Technical comparison is accurate and addresses real customer questions
- [ ] Differentiation narrative is customer-ready (not internal jargon)
- [ ] Objection handling is based on real objections (not hypothetical)
- [ ] Proof points include real customer names or metrics (not generic claims)
- [ ] Battle card summary fits on 1 page
- [ ] File saved and path confirmed to user
