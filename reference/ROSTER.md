# Team Roster & Pod Structure

Canonical lookup for pod membership and teammate role/file mapping. Read this file when routing a request that requires knowing who owns what, or when introducing/updating a teammate. Not auto-loaded — Rolando reads it on demand.

## Pod Structure

Pods are a routing layer on top of the Team Directory — not a reorg. They group teammates by practice area so Rolando can fan out multi-expert tasks in parallel instead of routing them one expert at a time. The Team Directory below remains the canonical role/file map.

| Pod | Members | Scope |
|---|---|---|
| **Salesforce Platform Core**             | Bob, Kaz, Aldous               | Core Salesforce architecture, Apex/LWC, governor limits, security, deployment patterns, MuleSoft integration patterns |
| **Salesforce Portfolio SE**              | Hollis, Marisol, Tomasz, Gretta, Pradeep, Jules | Cloud-specific demo and discovery across Sales, Service, Revenue/CPQ, FSC, Industries (Manufacturing/Auto/Energy), and Slack — the cloud-by-cloud SE bench for the Core SE role |
| **Agentic Experience Layer**             | Mick                           | Agentforce Experience Layer (AXL), Generative UI, agent surfaces — placeholder for future AXL specialist hires |
| **Analytics & Visualization**            | Vic                            | Tableau, Tableau Next, Tableau Pulse, embedded analytics — placeholder for future analytics-expert hires |
| **Data & AI Architecture**               | Richard, Bessie                | Cross-cloud data and AI architecture, Data Cloud grounding, data quality and AI fitness gating |
| **Warehouse-Native Data Cloud**          | John, Paul, George, Ringo      | Hyperscaler Data Cloud architecture on AWS, Snowflake, Databricks, GCP (Zero Copy, BYOL, federated grounding) |
| **Composable CDP & Activation**          | Hugo, Linnea                   | Warehouse-native composable CDP and activation (Hightouch today) plus Marketing Cloud journey + send execution (Linnea) — Linnea handles MCE journey/send; upstream Data Cloud modeling stays with the user |
| **GTM, Value**                           | Abigail, Anna                  | Business value cases, executive presentations and creative content |
| **Pricing**                              | Ciandro                        | Flex Credits pricing and consumption modelling |
| **Personal Productivity**                | Defoe, Eleanor, Marlow, Tobias, Sylvie, Dorian | Chief of staff synthesis on a cadence, calendar defense, inbox triage, task ledger, knowledge vault, Salesforce opportunity watch — all draft-only |
| **Local Dev Environment**                | Sea Dong, Harlan               | Local Mac toolchain — Claude Code CLI, plugins, git-managed skills, Homebrew, Salesforce CLI, uv, nvm, launchd update plumbing (Sea Dong); Claude Code infrastructure, connectivity, and configuration troubleshooting (Harlan) |
| **Anthropic Practice**                   | Boris                          | Anthropic stack quality bar — reviews skills, agents, hooks, slash commands, MCP servers, harness configs; pushes for token-efficient, simple, eval-backed designs |
| **Education & Enablement**               | Maggie, Wren                   | Maggie gates artifact pedagogy + voice (workshops, decks, labs, docs, READMEs); Wren coaches the SE practitioner through reps and feedback (discovery, demo arcs, exec readouts). Complements, not substitutes — Maggie owns the artifact, Wren owns the practitioner |
| **Workflow Discipline**                  | Floyd                          | Standing intake gate on the user's own working sessions. Fires at intake — before work starts — on overload (2+ tasks, no plan, unbounded scope, no done-condition), a missing plan, or a task boundary where a new worktree or context clear pays off. Paired with Boris & Maggie: Floyd gates the entrance, they gate the exit. Holds and proposes a plan-first sequence; never carries work |
| **Account Intelligence**                 | Pemberton                      | Deep, source-disciplined research on a single named account (Acme Corp today) — quarterly earnings briefs, leadership and AI-strategy tracking, watchlist diffs; expandable to additional account researchers as the TMT Strategic book grows |
| **Account Strategy**                     | Sloan                          | Opinionated POV layer on top of Pemberton's labeled facts; hunts Salesforce-platform plays for Acme Corp; routes named plays to cloud SEs / Abigail / Ciandro / Defoe with citation chain and confidence label intact |
| **Risk**                                 | Matija                         | Strategic risk synthesizer — book-level weekly roll-up of slipped commits, exec exposure, stalled opps, and competitive threats. Maigret-voiced, source-disciplined, [high-risk]/[watch]/[noise] labels. Fans out in parallel to Tobias / Dorian / Defoe / Pemberton / Marlow / Sloan |
| **Project Delivery**                     | Calder                         | Workstream choreographer for complex multi-team demo builds and technical strategies. Owns project plans (with inline dependencies + roadmap horizon), workstream-status roll-ups, T-minus demo runbooks, technical-strategy documents, and stakeholder-readout project facts. Expedition-leader voice. Hard cap: 6 skills in the pod (5 owned + 1 reserved) |
| **Build & Deploy**                       | Hank, Vera                     | Capability-isolated write-side of Rolando — anchored on the post-call moment per the May 30 design. Hank executes deploys (`sf`, `heroku`, `gh`, Slack `chat.postMessage`), Vera verifies every action against the audit log. **W1a today:** plain-text Slack post to `#build-pod-sandbox`. Scratch-org deploy + Block Kit lights up in W1b; the four absent-specialist personas (Mei, Inga, Diana, Hex) and capability-isolation wrapper land in W2 |
| **Operations (cross-pod)**               | Roman, Gilbert, Imelda         | Research, HR, and Salesforce admin / read-and-recommend account hygiene on `my-org` — keep the team itself running and the internal org diagnosed-but-never-mutated |

## Team Directory
| Name    | Role              | File                    |
|---------|-------------------|-------------------------|
| Roman   | Senior Researcher                              | team/roman.md    |
| Gilbert | HR Manager                                     | team/gilbert.md  |
| Richard | Data & AI Technical Architect                  | team/richard.md  |
| Kaz     | Salesforce Core Distinguished Solution Engineer | team/kaz.md     |
| Bob     | Salesforce Distinguished Technical Architect   | team/bob.md      |
| John    | AWS Expert & Salesforce Data Cloud Specialist   | team/john.md    |
| Paul    | Snowflake Expert & Salesforce Data Cloud Specialist | team/paul.md |
| George  | Databricks Expert & Salesforce Data Cloud Specialist | team/george.md |
| Ringo   | GCP Expert & Salesforce Data Cloud Specialist   | team/ringo.md   |
| Abigail | Business Value Consultant                      | team/abigail.md  |
| Anna    | Creative Designer & Content Producer           | team/anna.md     |
| Bessie  | Chief Data Expert                              | team/bessie.md   |
| Ciandro | Flex Credits Pricing Expert                    | team/ciandro.md  |
| Mick    | AXL (Agentforce Experience Layer) Specialist   | team/mick.md     |
| Vic     | Tableau & Analytics Architect                  | team/vic.md      |
| Hugo    | Hightouch Expert & Composable CDP / Data Activation Specialist | team/hugo.md |
| Eleanor | Calendar & Time Management Specialist          | team/eleanor.md  |
| Marlow  | Inbox & Communications Specialist              | team/marlow.md   |
| Tobias  | Tasks & Follow-Through Specialist              | team/tobias.md   |
| Sylvie  | Notes, Knowledge & Journaling Specialist       | team/sylvie.md   |
| Dorian  | Opportunity Change Tracker (Salesforce, read-only) | team/dorian.md |
| Defoe   | Chief of Staff                                 | team/defoe.md    |
| Sea Dong | Local Dev Environment / Mac Tooling Specialist | team/sea-dong.md |
| Boris   | Applied AI Architect / Forward Deployed Engineer | team/boris.md  |
| Maggie  | Head of Education                              | team/maggie.md   |
| Pemberton | Acme Corp Account Researcher                | team/pemberton.md |
| Sloan   | Acme Corp Deal Strategist                     | team/sloan.md    |
| Hollis  | Sales Cloud Solution Engineer                  | team/hollis.md   |
| Marisol | Service Cloud Solution Engineer                | team/marisol.md  |
| Linnea  | Marketing Cloud Solution Engineer              | team/linnea.md   |
| Tomasz  | Revenue Cloud / CPQ Solution Engineer          | team/tomasz.md   |
| Aldous  | MuleSoft Solution Engineer                     | team/aldous.md   |
| Jules   | Slack Solution Engineer                        | team/jules.md    |
| Gretta  | Financial Services Cloud SE                    | team/gretta.md   |
| Pradeep | Industries SE — Manufacturing/Auto/Energy      | team/pradeep.md  |
| Wren    | SE Craft Coach                                 | team/wren.md     |
| Imelda  | Salesforce Admin / RevOps Specialist (read-and-recommend) | team/imelda.md |
| Matija  | Pipeline Risk Synthesizer                      | team/matija.md   |
| Calder  | Project Lead / Workstream Choreographer        | team/calder.md   |
| Hank    | Build Pod Lead — owns deploy across `sf`, `heroku`, `gh`, Slack `chat.postMessage` | team/hank.md |
| Vera    | Build Pod Verification — audit-log integrity, deploy-validate, governor-limit checks | team/vera.md |
| Floyd   | Workflow Discipline Guardrail (Intake Gate)    | team/floyd.md    |
| Harlan  | Claude Code Infrastructure & Connectivity Specialist | team/harlan.md |

*This table is updated every time a new team member is hired.*
