---
name: competitive-response
description: >-
  Build a competitive counter-positioning brief against a named competitor — competitive research,
  technical counter-positioning, and a customer-ready differentiation narrative, compiled into a
  battle-card brief. TRIGGER on "competitive response for [competitor]", "[competitor]
  counter-positioning", "how do we beat [competitor]", "how do we beat [competitor] on this deal",
  "what's [competitor] pitching to [industry] companies right now".
metadata:
  version: "1.0"
---

# Competitive Response

Produce a competitive counter-positioning brief for a named competitor: what they're pitching, where
they're weak, and a customer-ready narrative for winning against them — compiled into a one-page
battle card plus the supporting detail behind it.

**Argument:** the competitor's name (e.g. "Snowflake", "Databricks"), and, if given, the deal or use
case context to tailor the narrative to.

---

## Step 1 — Competitive research

### A. Current positioning & messaging
Research the competitor's current go-to-market positioning:
- Core value propositions and differentiators they're leading with
- Target industries and use cases they're prioritizing
- Recent product launches or feature announcements (past 6 months)
- Pricing and packaging changes
- Executive messaging (CEO blog posts, earnings calls, keynotes)

### B. Known wins & losses
Search for recent competitive intelligence:
- Accounts where they've won or lost against your platform
- Win themes and key decision criteria
- Loss themes and reasons for churn
- Customer case studies they're promoting
- Analyst reports and positioning (Gartner, Forrester, etc.)

### C. Weaknesses & gaps
Identify known gaps in their platform:
- Missing capabilities or integrations
- Pricing traps or hidden costs
- Scalability or performance issues
- Support and ecosystem limitations
- Customer complaints or churn signals

**Output shape for this step:**
- Competitor's core strengths and positioning (3-5 bullets)
- Known weaknesses and gaps (3-5 bullets)
- Recent wins/losses and decision criteria
- Key objections customers raise about them

*In the source multi-agent design this research pass was owned by a persona named Roman — see
`team/roman.md` if that roster happens to be installed. It isn't required: run the research yourself.*

---

## Step 2 — Technical counter-positioning

Work out the technical comparison directly. If this install has domain specialists for specific
platforms (cloud experts, solution architects, etc.), route to whichever one matches the
competitor — the table below is the original design's routing map and is useful as a checklist of
what to cover even with no such roster installed:

| Competitor | Comparison focus |
|---|---|
| Snowflake | Data-platform architecture, connector strategy, activation gaps |
| Databricks | Lakehouse architecture, catalog/governance vs. your platform's data harmonization |
| AWS native (Redshift, S3, Glue) | Integration patterns with your platform, when to use native vs. unified platform |
| GCP native (BigQuery, Dataflow) | Integration patterns with your platform, when to use native vs. unified platform |
| Other CDP / activation tools (Segment, mParticle, ActionIQ, Hightouch) | Composable CDP vs. unified platform, activation limits, identity resolution |

### Technical comparison framework

**A. Architecture comparison**
- How does the competitor's architecture differ from your platform's?
- What are the trade-offs (flexibility vs. complexity, performance vs. cost, etc.)?
- What does your platform do natively that requires 3rd-party tools or custom code with the competitor?

**B. Integration patterns**
- How do customers typically integrate the competitor with your core platform?
- What are the friction points, latency issues, or data-sync challenges?
- How does your platform's native integration eliminate these?

**C. Use case coverage**
- What use cases does the competitor excel at?
- What use cases are awkward or impossible with the competitor?
- Where does your platform have a decisive advantage?

**D. TCO & operational complexity**
- Hidden costs or pricing traps with the competitor
- Engineering effort required (data pipelines, connectors, maintenance)
- Vendor-management complexity (multiple tools vs. unified platform)

**Output shape for this step:**
- Architecture comparison (3-5 key differences)
- Integration pain points with the competitor (3-5 bullets)
- Use cases where your platform wins decisively (3-5 examples)
- TCO and operational advantages for your platform (3-5 bullets)

---

## Step 3 — Differentiation narrative

Based on Steps 1 and 2, write a **customer-facing differentiation narrative** that positions your
platform as the superior choice for this deal or use case.

### Narrative structure

**A. Acknowledge their strengths**
- Give credit where due (builds credibility)
- "Yes, [Competitor] is strong at [X], and many customers use it for [Y]"

**B. Highlight the gaps**
- Specific weaknesses that matter for this use case
- "But [Competitor] struggles with [Z], which means customers have to [workaround]"

**C. Your platform's differentiation**
- What your platform does natively that eliminates the gaps
- "[Platform] solves this by [capability], which gives you [business outcome]"

**D. Customer proof points**
- Real customer stories of migration from the competitor to your platform
- Benchmark metrics (faster time to value, lower TCO, better performance)

**E. Objection handling**
- Common objections customers raise ("But we already have [Competitor]...")
- How to reframe the conversation ("This isn't about replacing [Competitor] — it's about
  activating your data without building custom pipelines")

**Output shape for this step:**
- 2-3 paragraph differentiation narrative (customer-ready)
- 5-7 objection-handling talking points (objection → reframe → proof)
- 3-5 win stories or proof points (with metrics)

*In the source multi-agent design this step was owned by a persona named Abigail — see
`team/abigail.md` if installed. Not required: write the narrative yourself.*

---

## Step 4 — Compile the brief

Compile Steps 1–3 into a **competitive counter-positioning brief** saved to:

`<PROJECT_DIR>/competitive-response-[competitor-slug]-[date].html`

(Substitute whatever output directory convention this install actually uses if `<PROJECT_DIR>` isn't
a defined location — a project root or a `reports/` folder both work.)

### Brief structure

**Header:**
- Competitor name
- Date prepared
- Primary use case or deal context (if provided)

**Section 1 — Competitive intelligence** (Step 1)
- Competitor's core strengths and positioning
- Known weaknesses and gaps
- Recent wins/losses and decision criteria

**Section 2 — Technical counter-positioning** (Step 2)
- Architecture comparison
- Integration pain points
- Use case coverage analysis
- TCO and operational advantages

**Section 3 — Differentiation narrative** (Step 3)
- Customer-facing positioning story
- Objection handling talking points
- Win stories and proof points

**Section 4 — Battle card summary**
- 1-page cheat sheet: strengths, weaknesses, differentiation, objections, proof points

### Design rules
- Multi-page HTML layout (scrollable, with anchor nav at top)
- Light theme for printing: body `#FFFFFF`, text `#181818`, accent `#1B96FF`
- Font: `'Salesforce Sans', 'Helvetica Neue', Arial, sans-serif`
- Print-friendly: clean hierarchy, standard margins

---

## Quality checklist

- [ ] Competitive intelligence is current (past 6 months) and specific
- [ ] Technical comparison is accurate and addresses real customer questions
- [ ] Differentiation narrative is customer-ready (not internal jargon)
- [ ] Objection handling is based on real objections (not hypothetical)
- [ ] Proof points include real customer names or metrics (not generic claims)
- [ ] Battle card summary fits on 1 page
- [ ] File saved and path confirmed to user
