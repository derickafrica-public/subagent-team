---
name: deck-build
description: >-
  Build a client-specific Salesforce presentation deck for a named account or topic — generates
  client-specific visuals with Nano Banana Pro, builds slides inside the Salesforce deck template,
  writes account-specific business-value narrative, adds Flex Credits pricing when Data Cloud or
  Agentforce is in scope, and reviews architecture content for technical accuracy before delivery.
  TRIGGER on "build a deck for [account]", "create presentation for [account]", "deck for [account]
  on [topic]", "create a Data Cloud presentation for [account]", "build a presentation for
  [account] covering Data Cloud + Agentforce".
metadata:
  version: "1.0"
---

# Deck Build

Build a client-specific Salesforce presentation deck for a named account or topic: generate visuals,
build the deck inside the Salesforce template, write account-specific business-value content, add
Flex Credits pricing when relevant, and check architecture content for accuracy before delivery.

**Argument:** the account name and topic (e.g. "Data Cloud + Agentforce for Audience Activation for
Acme Corp").

---

## Step 1 — Generate client-specific visuals

**Before touching any slides**, generate at least **3 client-specific images** using the
`sf-diagram-nanobananapro` skill (Nano Banana Pro).

### Required images

1. **Cover image** — industry-appropriate visual featuring the client's logo (if available) or brand colors
   - Example: "Cinematic wide-angle photograph of a modern streaming media control room with the
     client's logo integrated into holographic displays"

2. **Industry context visual** — represents the client's business environment or strategic priorities
   - Example for media: "Photorealistic isometric illustration of a connected media ecosystem
     showing content studios, streaming platforms, advertising networks, and audience data flows"
   - Example for telco: "Cinematic photograph of a 5G network operations center with real-time
     customer data dashboards and AI agent overlays"

3. **Solution visual** — represents the Salesforce solution (Data Cloud, Agentforce, or both) in the client's context
   - Example: "Architectural diagram showing Data Cloud harmonizing customer data from streaming
     platforms, retail, and D2C channels, feeding into Agentforce agents for personalized recommendations"

**All images must:**
- Include the client's logo or brand colors (if publicly available)
- Reflect the client's specific industry and business model (not generic)
- Be high-resolution, professional quality
- Be saved to `<PROJECT_DIR>/.agents/artifacts/[account-slug]-[image-name].png` (or this install's
  equivalent artifacts directory)

---

## Step 2 — Build the deck

Build the deck following the Salesforce Deck Template & Build Approach (see the project's own
CLAUDE.md or setup docs for the exact template ID this install uses).

### Critical rules (non-negotiable)

1. **Always copy the template first** — this imports the master theme (fonts, colors, backgrounds).
2. **Always inspect the template first** — identify pre-built layouts that match the content
   structure. Preserve matching layouts, delete non-matching slides.
3. **Always use a text-replace operation to populate content** — this preserves the template's
   formatting and theme. Only delete slides that don't match the content structure.
4. **Never delete all slides and start blank** — this loses the master theme and requires rebuilding everything.
5. **Never hardcode fontFamily, fontSize, or foregroundColor** — let the master theme apply
   naturally. Explicit style values fight the master and produce off-brand output.
6. **Add images** — cover image on the title slide (from Step 1), industry-context visual on the
   business-context or use-case slide, solution visual on the architecture or solution-design slide.

### Deck structure (8-12 slides)

The exact slide count and structure depend on the topic, but follow this general flow:

#### Slide 1 — Title
- Account name
- Presentation topic (e.g., "Data Cloud + Agentforce for Audience Activation")
- Date
- Presenters (if provided)
- Cover image (from Step 1)

#### Slides 2-3 — Business context
- Account overview (industry, business model, strategic priorities)
- Current challenges or transformation initiatives
- Why now? (catalyst for change, market pressures, competitive threats)
- Industry context visual (from Step 1)

#### Slides 4-6 — Solution overview
- How Data Cloud / Agentforce addresses the business challenges
- Key capabilities and use cases
- Architecture overview (high-level, not deeply technical)
- Solution visual (from Step 1)

#### Slides 7-8 — Business value
- Quantified business outcomes (revenue impact, cost savings, efficiency gains)
- Customer proof points (similar companies, similar use cases)
- ROI framework or value calculator (if applicable)

#### Slides 9-10 — Implementation approach (optional, if requested)
- Phased roadmap (MVP → scale → optimize)
- Timeline and milestones
- Success metrics and KPIs

#### Slide 11 — Flex Credits pricing (if applicable)
- Estimated Flex Credits consumption for the proposed solution
- Benchmark pricing for similar accounts
- Flex-to-term conversion guidance

#### Slide 12 — Next steps
- Recommended actions (immediate, short-term, strategic)
- Meeting schedule or engagement timeline
- Key contacts and escalation path

---

## Step 3 — Write business-value content

Write the narrative content for the **Business Context** and **Business Value** slides, tailored to
the account's industry vertical and strategic priorities.

### Content requirements

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

**Output shape:** content for each slide, delivered as markdown or plain text, then integrated into
the slides via the template's text-replace or text-box tools.

*In the source multi-agent design, Step 1/2 were owned by a persona named Anna and Step 3 by a
persona named Abigail — see `team/anna.md` / `team/abigail.md` if that roster happens to be
installed. Not required: do the generation, build, and writing yourself.*

---

## Step 4 — Add Flex Credits pricing (if applicable)

If the deck covers Data Cloud or Agentforce, add Flex Credits pricing estimates.

### Pricing slide content

- **Estimated consumption** — based on the account's data scale and use case scope
- **Benchmark range** — typical Flex Credits consumption for similar accounts in this industry
- **Flex-to-term guidance** — when to recommend flex vs. annual term licensing
- **Key assumptions** — data volume, activation frequency, number of agents, conversation volume, etc.

**Output shape:** pricing slide content as structured data (table or bullet format), integrated into
the Flex Credits slide.

*In the source multi-agent design this was owned by a persona named Ciandro — see
`team/ciandro.md` if installed.*

---

## Step 5 — Technical accuracy review (if applicable)

If the deck includes architecture content, review it for technical accuracy before delivery.

### Review checklist

- [ ] Architecture diagrams are accurate and reflect current product capabilities
- [ ] Integration patterns are technically sound (no fantasy architecture)
- [ ] Use case alignment — does the proposed solution actually solve the stated business problem?
- [ ] Edge cases and failure modes considered (or at least acknowledged)
- [ ] No overselling — claims are backed by real product capabilities, not roadmap vapor
- [ ] Terminology is correct (product names, API names, technical concepts)

**If the review finds issues:** update the deck to address the findings, then re-review before final delivery.

*In the source multi-agent design this review was owned by a persona named Bob — see `team/bob.md`
if installed.*

---

## Final output

Deliver the final deck with:

1. **Slide deck link** — shared with edit access
2. **Summary of what's included:**
   - Slide count and structure
   - Key messages and business value narrative
   - Flex Credits pricing (if included)
   - Technical review status (reviewed, or not applicable)
3. **Generated images** — file paths to all visuals used in the deck

**File naming:**
- Deck title: `[Account Name] — [Topic] — [Date]`
- Example: `Acme Corp — Data Cloud + Agentforce for Audience Activation — May 2026`

---

## Quality checklist

- [ ] 3+ client-specific visuals generated before building slides
- [ ] Deck built using the Salesforce deck template (template formatting preserved, no hardcoded fonts/colors)
- [ ] Business value content is account-specific and quantified (not generic)
- [ ] Flex Credits pricing included (if Data Cloud or Agentforce is in scope)
- [ ] Technical accuracy review completed (if architecture content included)
- [ ] All slides follow the Salesforce CX Style Guide (product names, capitalization, voice)
- [ ] Deck link shared with user
- [ ] Summary of deck contents confirmed to user
