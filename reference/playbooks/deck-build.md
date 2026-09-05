# Skill: Deck Build

**Trigger:** User asks to build a presentation deck for a named account or topic.

**Invocation examples:**
- "Build a deck for Meridian Studios"
- "Create a Data Cloud presentation for Harborview Media"
- "Deck for Fenwick Wireless on Agentforce"
- "Build a presentation for Cascade Communications covering Data Cloud + Agentforce"

---

## Orchestration

Rolando delegates this skill as follows:

1. **Anna** — generate 3+ client-specific visuals with Nano Banana Pro, build slides using Salesforce template (following the template formatting rules in CLAUDE.md)
2. **Abigail** — write business value narrative content
3. **Ciandro** — add Flex Credits pricing estimates (if Data Cloud or Agentforce is in scope)
4. **Bob** — technical accuracy review before delivery (if architecture content is included)

Anna and Abigail work in parallel. Ciandro and Bob review after the initial draft is complete.

---

## Step 1 — Generate Client-Specific Visuals (Anna)

**Before touching any slides**, generate at least **3 client-specific images** using Nano Banana Pro (`sf-diagram-nanobananapro` skill):

### Required Images

1. **Cover image** — industry-appropriate visual featuring the client's logo (if available) or brand colors
   - Example: "Cinematic wide-angle photograph of a modern streaming media control room with a client logo integrated into holographic displays"

2. **Industry context visual** — represents the client's business environment or strategic priorities
   - Example for media: "Photorealistic isometric illustration of a connected media ecosystem showing content studios, streaming platforms, advertising networks, and audience data flows"
   - Example for telco: "Cinematic photograph of a 5G network operations center with real-time customer data dashboards and AI agent overlays"

3. **Solution visual** — represents the Salesforce solution (Data Cloud, Agentforce, or both) in the client's context
   - Example: "Architectural diagram showing Data Cloud harmonizing customer data from streaming platforms, theme parks, merchandise, and D2C channels, feeding into Agentforce agents for personalized recommendations"

**All images must:**
- Include the client's logo or brand colors (if publicly available)
- Reflect the client's specific industry and business model (not generic)
- Be high-resolution, professional quality
- Be saved to `<PROJECT_DIR>/.agents/artifacts/[account-slug]-[image-name].png`

---

## Step 2 — Build the Deck (Anna)

Anna builds the deck following the **Salesforce Deck Template & Build Approach** defined in CLAUDE.md.

### Critical Rules (Non-Negotiable)

1. **Always copy the template first**
   - Use `drive_copy_file` on template ID `1O1X3_RmXR6jWrKIUimFBGNAQCgR3xFnlFpgE5gyg_wg`
   - This imports the master theme (fonts, colors, backgrounds)

2. **Always inspect the template with `slides_get` first**
   - Identify pre-built layouts that match the content structure
   - Preserve matching layouts, delete non-matching slides

3. **Always use `slides_replace_text` to populate content**
   - This preserves the template's formatting and theme
   - Only delete slides that don't match the content structure

4. **Never delete all slides and start blank**
   - This loses the master theme and requires rebuilding everything

5. **Never hardcode fontFamily, fontSize, or foregroundColor**
   - Let the master theme apply naturally
   - Explicit style values fight the master and produce off-brand output

6. **Add images with `slides_add_image`**
   - Cover image on title slide (generated in Step 1)
   - Industry context visual on business context or use case slide
   - Solution visual on architecture or solution design slide

### Deck Structure (8-12 slides)

The exact slide count and structure depend on the topic, but follow this general flow:

#### **Slide 1 — Title**
- Account name
- Presentation topic (e.g., "Data Cloud + Agentforce for Audience Activation")
- Date
- Presenters (if provided)
- Cover image (generated in Step 1)

#### **Slide 2-3 — Business Context**
- Account overview (industry, business model, strategic priorities)
- Current challenges or transformation initiatives
- Why now? (catalyst for change, market pressures, competitive threats)
- Industry context visual (generated in Step 1)

#### **Slide 4-6 — Solution Overview**
- How Data Cloud / Agentforce addresses the business challenges
- Key capabilities and use cases
- Architecture overview (high-level, not deeply technical)
- Solution visual (generated in Step 1)

#### **Slide 7-8 — Business Value**
- Quantified business outcomes (revenue impact, cost savings, efficiency gains)
- Customer proof points (similar companies, similar use cases)
- ROI framework or value calculator (if applicable)

#### **Slide 9-10 — Implementation Approach** (optional, if requested)
- Phased roadmap (MVP → scale → optimize)
- Timeline and milestones
- Success metrics and KPIs

#### **Slide 11 — Flex Credits Pricing** (if applicable)
- Estimated Flex Credits consumption for the proposed solution
- Benchmark pricing for similar accounts
- Flex-to-term conversion guidance

#### **Slide 12 — Next Steps**
- Recommended actions (immediate, short-term, strategic)
- Meeting schedule or engagement timeline
- Key contacts and escalation path

---

## Step 3 — Write Business Value Content (Abigail)

Abigail writes the narrative content for the **Business Context** and **Business Value** slides, tailored to the account's industry vertical and strategic priorities.

### Content Requirements

**For Business Context slides:**
- 3-4 sentence account-specific narrative (not generic industry boilerplate)
- 3-5 strategic challenges or transformation priorities (sourced from research, not invented)
- Catalyst for change (why this matters now, what's driving urgency)

**For Business Value slides:**
- 3-5 quantified business outcomes with metrics
  - Example: "Increase D2C subscriber LTV by 15-20% through AI-powered content recommendations"
  - Example: "Reduce customer churn by 10-15% with proactive Agentforce interventions"
- Customer proof points (similar companies, similar use cases, real metrics)
- ROI framework (if applicable): expected investment, expected return, payback period

**Output format:**
- Content for each slide delivered as markdown or plain text
- Anna integrates this content into the slides using `slides_replace_text` or `slides_add_text_box`

---

## Step 4 — Add Flex Credits Pricing (Ciandro, if applicable)

If the deck covers Data Cloud or Agentforce, Ciandro provides Flex Credits pricing estimates.

### Pricing Slide Content

- **Estimated consumption** — based on the account's data scale and use case scope
- **Benchmark range** — typical Flex Credits consumption for similar accounts in this industry
- **Flex-to-term guidance** — when to recommend flex vs. annual term licensing
- **Key assumptions** — data volume, activation frequency, number of agents, conversation volume, etc.

**Output format:**
- Pricing slide content delivered as structured data (table or bullet format)
- Anna integrates this into the Flex Credits slide

---

## Step 5 — Technical Accuracy Review (Bob, if applicable)

If the deck includes architecture content, Bob reviews for technical accuracy before delivery.

### Bob's Review Checklist

- [ ] Architecture diagrams are accurate and reflect current product capabilities
- [ ] Integration patterns are technically sound (no fantasy architecture)
- [ ] Use case alignment — does the proposed solution actually solve the stated business problem?
- [ ] Edge cases and failure modes considered (or at least acknowledged)
- [ ] No overselling — claims are backed by real product capabilities, not roadmap vapor
- [ ] Terminology is correct (product names, API names, technical concepts)

**If Bob finds issues:**
- Anna updates the deck to address Bob's feedback
- Bob re-reviews before final delivery

---

## Final Output

Anna delivers the final deck with:

1. **Google Slides link** — shared with edit access
2. **Summary of what's included**:
   - Slide count and structure
   - Key messages and business value narrative
   - Flex Credits pricing (if included)
   - Technical review status (reviewed by Bob, or not applicable)
3. **Generated images** — file paths to all Nano Banana visuals used in the deck

**File naming:**
- Google Slides: `[Account Name] — [Topic] — [Date]`
- Example: `Meridian Studios — Data Cloud + Agentforce for Audience Activation — May 2026`

---

## Quality Checklist

- [ ] 3+ client-specific visuals generated with Nano Banana Pro before building slides
- [ ] Deck built using Salesforce template (copied from 1O1X3_RmXR6jWrKIUimFBGNAQCgR3xFnlFpgE5gyg_wg)
- [ ] Template formatting preserved (no hardcoded fonts/colors, used `slides_replace_text`)
- [ ] Business value content is account-specific and quantified (not generic)
- [ ] Flex Credits pricing included (if Data Cloud or Agentforce is in scope)
- [ ] Technical accuracy review completed by Bob (if architecture content included)
- [ ] All slides follow Salesforce CX Style Guide (product names, capitalization, voice)
- [ ] Google Slides link shared with user
- [ ] Summary of deck contents confirmed to user
