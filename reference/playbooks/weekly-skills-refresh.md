# Skill: Weekly Salesforce Skills Refresh

**Trigger:** User (or scheduled cron) asks to "refresh team skills", "update team Salesforce skills", "run weekly skills refresh", or the launchd job `com.rolando.weekly-skills-refresh` invokes Claude with this skill.

**Invocation examples:**
- "Roman, run the weekly skills refresh"
- "Update the team's Salesforce skills"
- Scheduled: Saturday 22:00 via launchd

---

## Orchestration

Rolando/Lando delegates the entire workflow to **Roman** (Senior Researcher). Roman performs the scan, writes the delta to each in-scope teammate's file across **both** active rosters, and produces a single run log.

---

## Two Rosters In Scope

This skill covers **two parallel team rosters**. Each weekly run touches both. Run log aggregates results from both rosters.

### Roster A — Rolando team (`<PROJECT_DIR>/team/`)

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

Skip: Roman, Gilbert, Abigail, Anna — non-product roles.

### Roster B — Lando team (`/Users/youruser/Documents/DEVS/lando/team/`)

Roster B is organized into pods. The skill scans the same way regardless of pod, but the run log groups counts by pod for at-a-glance review.

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

**Industry & GTM pod** _(partially in scope — Victoria and Sloane track Salesforce product surface relevant to their domains)_
| Teammate | File | Focus area | In scope? |
|---|---|---|---|
| Abigail (lead) | `abigail.md` | BVS / ROI modeling | Skip — non-product role |
| Victoria | `victoria.md` | Media & Ad Sales strategy (industry product news, Salesforce media-cloud features) | In scope |
| Sloane | `sloane.md` | Technical Enablement & Workshop GTM (new training-relevant Salesforce features) | In scope |
| Anna | `anna.md` | Visual Design | Skip — non-product role |

Skip on Roster B: Roman, Gilbert, Abigail, Anna — non-product roles.

> **Cross-roster note.** Richard appears on both rosters. Each roster's Richard file is updated independently — capabilities relevant to Salesforce Data & AI architecture flow into both, with the same dedupe rule applied per file.

---

## Step 1 — Scan for New Salesforce Capabilities

Roman performs parallel research covering the **past 7 days** only (Saturday → prior Saturday). Sources:

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
- "Bedrock" + AgentCore / Knowledge Bases (Sable's surface)

**C. Deduplicate**
If a capability was already appended in a prior weekly run (check the target file's `## Recent Capability Updates` section), skip it.

---

## Step 2 — Classify Each Finding Per Roster

For every new capability discovered, classify the **primary owner in each roster independently**:

- A finding may map to one teammate in Roster A and a different teammate in Roster B (e.g., a Data Cloud connector → Bessie in A, Richard in B).
- A finding may map to **only one** roster if the other has no relevant teammate (e.g., a Hightouch announcement only goes to Hugo in Roster A; Roster B has no Hightouch specialist).
- Skill line format: `[Capability name] — [1-sentence what it does]. Source: [URL]`

---

## Step 3 — Append to Teammate Files

Each in-scope file must contain a section titled `## Recent Capability Updates`. If it does not exist, create it at the bottom of the file.

Format:

```markdown
## Recent Capability Updates

### YYYY-MM-DD (week of [Saturday date])
- [Capability] — [one-sentence description]. Source: [URL]
- [Capability] — [one-sentence description]. Source: [URL]
```

Rules:
- **Prepend** new weekly blocks above older ones
- **Never delete** prior weeks — history is cumulative
- If no new capabilities for a teammate this week, write: `- No new Salesforce capabilities found this week.`
- One line per bullet. No paragraphs.

---

## Step 4 — Write Run Log

After updating files, Roman writes a single combined run log to:
`<PROJECT_DIR>/team/logs/weekly-skills-refresh-YYYY-MM-DD.md`

Run log format:

```markdown
# Weekly Skills Refresh — [Saturday date]

**Run start:** [ISO timestamp]
**Run end:** [ISO timestamp]
**Sources scanned:** [count]
**New capabilities found:** [count]

## Roster A — Rolando team (claude-projects)
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

## Roster B — Lando team (DEVS/lando)

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

## Sources Consulted
- [url 1]
- [url 2]
...
```

---

## Output Requirements

- Every in-scope teammate file across **both rosters** is either updated or has a "no new capabilities" entry for the week
- Run log file exists at the expected path
- No duplicate entries (dedupe per file before writing)
- No fabricated capabilities — every bullet must have a verifiable source URL
- Keep formatting consistent with existing teammate file style

---

## Failure Handling

If Roman cannot reach the web or a source is down:
- Write the run log noting which sources failed
- Do not append empty or speculative entries
- Exit cleanly so launchd does not retry-loop
