---
name: weekly-skills-refresh
description: >-
  Scan for new Salesforce/Agentforce/Data Cloud capabilities released in the past 7 days and
  append dated deltas to each in-scope teammate persona file, plus write a combined run log.
  TRIGGER when the user says "refresh team skills", "update team Salesforce skills", "run
  weekly skills refresh", "Roman, run the weekly skills refresh", or a scheduled job invokes
  this skill (e.g. a launchd job on a Saturday-night cadence).
metadata:
  version: "1.0"
---

# Weekly Salesforce Skills Refresh

Scans for Salesforce/Agentforce/Data Cloud capabilities released in the last 7 days and appends
a dated delta to each in-scope teammate file, then writes one combined run log.

In the original multi-agent design this whole workflow was delegated to a research persona named
"Roman." That framing doesn't matter here — do the scan, the classification, and the file writes
yourself, as described below.

**On the team rosters below:** the two rosters and their teammate-to-file mappings are the
*targets* this skill writes to — they are not an orchestration dependency, so keep them even
without a live multi-agent roster installed. They are also project-specific examples: adapt the
roster tables, file paths, and teammate names to whatever persona files (or plain topic files)
your own project actually keeps. If a project has no `team/` roster at all, skip Step 3 and just
report findings inline instead of appending to files.

---

## Two rosters in scope (example configuration — adapt to your project)

This skill covers **two parallel team rosters** in the reference deployment it was built for.
Each weekly run touches both, and the run log aggregates results from both. Treat this as a
worked example of "one or more target rosters, each mapping capability areas to files" — the
mechanism generalizes to a single roster or to none.

### Roster A — primary team (`<PROJECT_DIR>/team/`)

| Teammate | File | Focus area |
|---|---|---|
| Kaz | `kaz.md` | Salesforce Core platform (Apex, LWC, Flow, metadata) |
| Richard | `richard.md` | Data & AI architecture across Salesforce |
| John | `john.md` | AWS + Salesforce Data Cloud |
| Paul | `paul.md` | Snowflake + Salesforce Data Cloud |
| George | `george.md` | Databricks + Salesforce Data Cloud |
| Ringo | `ringo.md` | GCP + Salesforce Data Cloud |
| Mick | `mick.md` | Agentforce Experience Layer (AXL) |
| Bessie | `bessie.md` | Chief Data Expert (Data Cloud, harmonization, identity) |
| Vic | `vic.md` | Tableau & Analytics |
| Ciandro | `ciandro.md` | Flex Credits pricing |
| Hugo | `hugo.md` | Hightouch + composable CDP / data activation |

Skip non-product roles (e.g. research, HR, business-value, design personas) — they have nothing
to append.

### Roster B — secondary team (e.g. `/Users/youruser/Documents/DEVS/lando/team/`)

Roster B is organized into pods. The skill scans the same way regardless of pod, but the run log
groups counts by pod for at-a-glance review.

**SF Architecture pod**
| Teammate | File | Focus area |
|---|---|---|
| Richard (lead) | `richard.md` | Salesforce Data & AI Technical Architect (Data Cloud, Agentforce, MuleSoft, Informatica, MCP/A2A, Zero Copy) |
| Bob | `bob.md` | Salesforce Distinguished Technical Architect (platform architecture, integration patterns, security, performance) |
| Sterling | `sterling.md` | Data 360 & Agentforce Flex Credit estimates |

**Hyperscaler-AI pod**
| Teammate | File | Focus area |
|---|---|---|
| Mira | `mira.md` | Snowflake (Cortex AI, Zero Copy, cost governance) |
| Nolan | `nolan.md` | AWS (SageMaker, Bedrock, AppFlow) |
| Greer | `greer.md` | Google Cloud (BigQuery, Vertex AI, Gemini, Looker) |
| Sable | `sable.md` | Amazon Bedrock Agents / AgentCore / Knowledge Bases |

**Integration pod**
| Teammate | File | Focus area |
|---|---|---|
| Frank | `frank.md` | Informatica IDMC, CDI, MDM, CLAIRE AI |
| Chad | `chad.md` | MuleSoft Anypoint, API-led, Direct to Data Cloud, Flex Gateway |

**Agentic UX pod**
| Teammate | File | Focus area |
|---|---|---|
| Floyd (lead) | `floyd.md` | AXL & Agentic Experience Architect |
| Beck | `beck.md` | Frontend / Demo Engineer |

**Data Prep & Analytics pod**
| Teammate | File | Focus area |
|---|---|---|
| Ellis (lead) | `ellis.md` | AI Data Preparation (CRISP-DM, RAG prep, Data 360) |
| Vic Stewart | `vic_stewart.md` | Tableau platform (legacy + Cloud + Tab Next + Semantics) |

**Industry & GTM pod** _(partially in scope — only the teammates who track Salesforce product
surface relevant to their domain)_
| Teammate | File | Focus area | In scope? |
|---|---|---|---|
| Victoria | `victoria.md` | Media & Ad Sales strategy (industry product news, Salesforce media-cloud features) | In scope |
| Sloane | `sloane.md` | Technical Enablement & Workshop GTM (new training-relevant Salesforce features) | In scope |

Skip non-product roles (business-value, design, research, HR personas) on both rosters.

> **Cross-roster note.** If the same teammate name appears on both rosters (e.g. "Richard"),
> update each roster's file independently — capabilities relevant to that person's domain flow
> into both, with the same dedupe rule applied per file.

---

## Step 1 — Scan for new Salesforce capabilities

Research the **past 7 days** only (this run's date back to 7 days prior). Sources:

**A. Official release & product news**
- Salesforce release notes (current + next preview)
- Salesforce Admin blog
- Salesforce Developer blog
- Salesforce Architects blog
- Agentforce / Data Cloud product announcement pages
- Trailblazer community highlights

**B. Product surface scan (web search)**
Items published in the last 7 days mentioning:
- "Agentforce" new actions, topics, metadata types
- "Data Cloud" new connectors, DMO changes, activation targets
- "Einstein" new features or model updates
- "Flow" new elements, "Apex" new APIs, "LWC" new primitives
- "Tableau" + Salesforce, "Tableau Next", "Tableau Semantics"
- "Slack AI" Salesforce integrations
- Flex Credits pricing changes or new meters
- "Hightouch" + Salesforce / Data Cloud / composable CDP
- "MuleSoft" + Anypoint / Direct to Data Cloud / Flex Gateway
- "Informatica" + IDMC / CLAIRE / Salesforce
- "Bedrock" + AgentCore / Knowledge Bases

**C. Deduplicate**
If a capability was already appended in a prior weekly run (check the target file's `## Recent
Capability Updates` section), skip it.

---

## Step 2 — Classify each finding per roster

For every new capability discovered, classify the **primary owner in each roster
independently**:

- A finding may map to one teammate in Roster A and a different teammate in Roster B (e.g. a
  Data Cloud connector announcement might land with a data-activation specialist in one roster
  and an architecture generalist in the other).
- A finding may map to **only one** roster if the other has no relevant teammate.
- Line format: `[Capability name] — [1-sentence what it does]. Source: [URL]`

---

## Step 3 — Append to teammate files

Each in-scope file must contain a section titled `## Recent Capability Updates`. If it does not
exist, create it at the bottom of the file.

Format:

```markdown
## Recent Capability Updates

### YYYY-MM-DD (week of [run date])
- [Capability] — [one-sentence description]. Source: [URL]
- [Capability] — [one-sentence description]. Source: [URL]
```

Rules:
- **Prepend** new weekly blocks above older ones.
- **Never delete** prior weeks — history is cumulative.
- If no new capabilities for a teammate this week, write:
  `- No new Salesforce capabilities found this week.`
- One line per bullet. No paragraphs.

---

## Step 4 — Write a run log

After updating files, write a single combined run log to:
`<PROJECT_DIR>/team/logs/weekly-skills-refresh-YYYY-MM-DD.md`

Run log format:

```markdown
# Weekly Skills Refresh — [run date]

**Run start:** [ISO timestamp]
**Run end:** [ISO timestamp]
**Sources scanned:** [count]
**New capabilities found:** [count]

## Roster A — primary team
- Kaz — [N] new items
- Richard — [N] new items
- John — [N] new items
- Paul — [N] new items
- George — [N] new items
- Ringo — [N] new items
- Mick — [N] new items
- Bessie — [N] new items
- Vic — [N] new items
- Ciandro — [N] new items
- Hugo — [N] new items

## Roster B — secondary team

### SF Architecture pod
- Richard — [N] new items
- Bob — [N] new items
- Sterling — [N] new items

### Hyperscaler-AI pod
- Mira — [N] new items
- Nolan — [N] new items
- Greer — [N] new items
- Sable — [N] new items

### Integration pod
- Frank — [N] new items
- Chad — [N] new items

### Agentic UX pod
- Floyd — [N] new items
- Beck — [N] new items

### Data Prep & Analytics pod
- Ellis — [N] new items
- Vic Stewart — [N] new items

### Industry & GTM pod (partial scope)
- Victoria — [N] new items
- Sloane — [N] new items

## Skipped (no new capabilities)
- [teammate], [teammate], ...

## Sources consulted
- [url 1]
- [url 2]
...
```

---

## Output requirements

- Every in-scope teammate file across **both rosters** is either updated or has a "no new
  capabilities" entry for the week.
- Run log file exists at the expected path.
- No duplicate entries (dedupe per file before writing).
- No fabricated capabilities — every bullet must have a verifiable source URL.
- Keep formatting consistent with existing teammate file style.

---

## Failure handling

If the web can't be reached or a source is down:
- Write the run log noting which sources failed.
- Do not append empty or speculative entries.
- Exit cleanly so a scheduled run does not retry-loop.
