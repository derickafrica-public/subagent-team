# subagent-team-harness

Portable package for the "Rolando" AI team: an orchestrator persona plus a
roster of specialist personas/skills/workflows, extracted from a working
`claude-projects` repo so it can be stood up on another machine.

> **Disclaimer — fictional personas, not a real team.** "Rolando," "Boris," "Maggie," "Floyd,"
> and the other 40 names under `agents/` are an invented orchestration naming convention, built by
> one person for their own personal Claude Code workflow. They are not real Salesforce employees,
> not a real team, not job titles, and not a sanctioned org chart. Nothing here implies Salesforce
> endorsement. Treat each `agents/<name>.md` file as a reusable subagent persona-as-code artifact —
> a role definition you can rename, merge, or discard — not as a directory of actual people.
>
> **No support channel.** This package has no maintainer. It was built and used by one person,
> and that person is not available to answer questions or fix issues after handoff. Installing it
> means you now own it — read it, adapt it, and debug it yourself.

## What This Subagent Team Can Do for You

This package is a working example of four patterns, built on top of Claude Code's subagent, skill, and workflow primitives. All four are generic — none require Salesforce, and none require keeping any of the fictional personas by name.

**1. Orchestrator-routes-to-specialist, instead of one model doing everything.** `templates/CLAUDE.md` defines a single entry point ("Rolando") whose only job is to read a request, match it against a routing table, and hand it to the subagent (`agents/*.md`) that owns that domain. The benefit is not speed — it's specificity: a persona file scoped to "refund-policy questions" or "API-versioning support" carries a narrower, denser context than a generalist would, so its answers are more consistent call to call. The cost is real too — 43 persona files is 43 files to maintain, and a routing table only helps if someone keeps it accurate.

**2. Structural parallel fan-out via `Workflow()` scripts, not ad-hoc dispatch.** `workflows/*.js` are deterministic JavaScript orchestration scripts — `parallel()`, `pipeline()`, `agent()` — that make a multi-agent fan-out a reviewable artifact instead of "trust the model to remember to dispatch these five things at once." `account-summary-refresh.js` runs five research reads in parallel, then a gated expert-POV fan-out, then a build step; `weekly-risk-sweep.js` runs six independent teammate reads in parallel, then verifies the risky ones adversarially before synthesizing. A run persists its script and its `runId`, so you can resume from an unchanged prefix instead of re-running the whole thing. This pattern generalizes to any repeated multi-step task you'd otherwise re-explain to the model every time.

**3. Standing quality gates before anything ships.** Two of the 43 personas — Boris and Maggie — exist only to review other personas' output before it reaches a user: Boris checks anything built with or for Claude (skills, agents, hooks, prompt design) against a "simplest thing that works" bar; Maggie checks anything written for a human reader for a stated takeaway, voice, and accessibility. Both are `agents/*.md` files like any other — the pattern worth taking is "route finished work through a named reviewer with a real checklist and a SHIP / REWORK / KILL verdict," not the two names themselves.

**4. Persistent per-account (or per-project, per-client, per-anything) memory.** `skills/account-research/SKILL.md` is a self-contained Claude Code Skill that keeps Markdown notes under `accounts/<slug>/`, asks new-vs-existing on entry, and detects what changed since the last session. It is the one piece here that is not Salesforce-specific in mechanism at all — swap "account" for "client," "case," or "research subject" and the skill still works, because it just reads and writes dated Markdown files. `team/journal/` (the self-improvement loop, `reference/self-improvement/`) is a smaller version of the same idea applied to the setup's own skills and rules: capture corrections, sweep weekly, propose small edits, let a human approve or reject each one.

**Be honest about the rest.** Beyond those four patterns, most of what ships here is Salesforce-Solution-Engineer-flavored content — persona hard-skills lists for Data Cloud, Agentforce, MuleSoft, CPQ, and so on. If you don't do account management or work at Salesforce, that content is dead weight you'll delete or ignore, not something to keep. Per the disclaimer above and the "What's Deliberately Not in Here" section below, this ships with no maintainer, no default account, and no working MCP/launchd/hook wiring — installing it gets you a scaffold and a set of examples to adapt, not a turnkey team.

## What's in Here

| Path | What | Portable as-is? |
|---|---|---|
| `agents/*.md` | 43 team-member personas, each with Claude Code agent frontmatter (`name`, `description`) so they're directly `Task()`-able as subagents | Yes |
| `skills/*/` (20 directories) | Real Claude Code Skills — auto-discovered by the plugin system, and copied unmodified into `.claude/skills/` by `setup.sh` | Yes |
| `commands/*.md` | Slash commands (`/account-summary-update`, `/apply-proposals`) | Yes |
| `workflows/*.js` | The two `Workflow()` scripts (`account-summary-refresh`, `weekly-risk-sweep`) | Yes, once copied to `.claude/workflows/` in the target project |
| `reference/ROSTER.md` | Canonical pod/roster table | Yes, once copied to `team/ROSTER.md` |
| `reference/playbooks/*.md` | 19 original design docs for the multi-agent orchestration setup — **historical/design reference only**. The live, self-contained mechanism is now `skills/*/SKILL.md` (18 of these 19 playbooks were converted 1:1 into real Claude Code Skills with harness-level discovery; `account-summary.md` was superseded by `skills/account-summary/SKILL.md` before that conversion). A 20th playbook, `defoe-morning-brief.md`, documented an already-retired skill and leaked a personal Heroku URL, so it was deleted outright rather than kept. Kept here only so the original persona-routing design intent isn't lost. | No — do not copy to `team/skills/`; install the `skills/*/SKILL.md` directories instead |
| `reference/self-improvement/` | Mistake-journal capture + weekly proposal-sweep scripts | Yes, once copied to `team/scripts/self-improvement/` — hook + launchd registration is manual |
| `reference/build_agents.py` | The original build tool that generated `agents/*.md` from upstream `team/*.md` persona files in the source monorepo — **historical/design reference only**, like `reference/playbooks/`. Its hardcoded paths assume a repo layout (a `team/` source directory, a `plugin/<name>/` nesting depth) that doesn't exist in this standalone package, so it does not run correctly as shipped. | No — non-functional as-is; adapt it if you're regenerating agents from your own persona source |
| `reference/launchd-templates/*.plist` | Weekly cadence job definitions | Templates only — hardcode the old machine's paths, must be edited |
| `templates/CLAUDE.md` | The orchestrator identity/routing file | Yes, once copied to the target project root as `CLAUDE.md` |
| `setup.sh` | Scaffolds all of the preceding into a target project directory in one pass | — |

### Personas (`agents/*.md`)

All 43 are fictional persona subagents (see the disclaimer above) grouped here by pod, per `reference/ROSTER.md`. Each row's description is condensed from that persona's own file — its frontmatter `description` plus its "Core Function"/"Primary Responsibility" section.

| Pod | Name | Role | What they do |
|---|---|---|---|
| Salesforce Platform Core | Bob | Distinguished Technical Architect | Deep technical validation layer for enterprise-scale Salesforce solutions — validates feasibility, catches architectural anti-patterns, checks a design survives production, not just a demo. |
| Salesforce Platform Core | Kaz | Core Distinguished Solution Engineer | Platform authority across Sales, Service, Experience, Marketing, Revenue, Field Service, and Platform clouds; designs delivery systems that hold up in production. |
| Salesforce Platform Core | Aldous | MuleSoft Solution Engineer | Leads MuleSoft demo, discovery, and architecture positioning — Anypoint Platform, API-led connectivity, integration patterns, governance; honest about when a different pattern wins. |
| Salesforce Portfolio SE | Hollis | Sales Cloud Solution Engineer | Demo-and-discovery lead for Sales Cloud; translates capability into RevOps-language outcomes (forecast accuracy, pipeline coverage, win rate, rep ramp). |
| Salesforce Portfolio SE | Marisol | Service Cloud Solution Engineer | Leads Service Cloud demo/discovery — case management, omni-channel, knowledge, self-service, contact center, Agentforce Service — with honest deflection-rate math. |
| Salesforce Portfolio SE | Tomasz | Revenue Cloud / CPQ Solution Engineer | Leads Revenue Cloud and CPQ demo/discovery — catalog, pricing, quoting, billing — translates pricing complexity into a clean amendment story. |
| Salesforce Portfolio SE | Gretta | Financial Services Cloud SE | FSC SE with capital-markets muscle memory; calls it honestly when FSC isn't the right pattern, pairs with Pradeep on the boundary. |
| Salesforce Portfolio SE | Pradeep | Industries SE (Manufacturing / Auto / Energy) | Leads Industries Cloud demo/discovery for manufacturing, automotive/dealer, and energy verticals; pairs with Gretta on the FSC/Industries line. |
| Salesforce Portfolio SE | Jules | Slack Solution Engineer | Leads Slack demo, discovery, and positioning — channels, workflows, Slack Connect, Slack AI, Slack agents — ties workflow pain to a measurable outcome. |
| Agentic Experience Layer | Mick | AXL (Agentforce Experience Layer) Specialist | Owns the Agentforce Experience Layer — Unified Experience Model, Generative UI/Personalization, App Shell architecture — above the LWC component layer. |
| Analytics & Visualization | Vic | Tableau & Analytics Architect | Owns Tableau and CRM Analytics (Tableau CRM) platform questions — architecture, governance, migration, integration with Data Cloud and Agentforce. |
| Data & AI Architecture | Richard | Data & AI Technical Architect | Translates business/IT requirements into Salesforce-native solutions across Data Cloud, Agentforce, and CRM — pre-sales through delivery and adoption governance. |
| Data & AI Architecture | Bessie | Chief Data Expert | Highest authority on data quality and fitness for AI/Agentforce consumption — profiling, cleansing, transformation, and validation before data reaches an agent's context window. |
| Warehouse-Native Data Cloud | John | AWS Expert & Data Cloud Specialist | Authority on the AWS-to-Data-Cloud boundary — ingestion patterns, connector configs, cross-platform data flows. |
| Warehouse-Native Data Cloud | Paul | Snowflake Expert & Data Cloud Specialist | Authority on the Snowflake-to-Data-Cloud boundary — bidirectional pipelines, sharing patterns, governance. |
| Warehouse-Native Data Cloud | George | Databricks Expert & Data Cloud Specialist | Authority on the Databricks Lakehouse/Data Cloud integration — ingestion through Delta Lake, MLflow training, reverse ETL back into Salesforce. |
| Warehouse-Native Data Cloud | Ringo | GCP Expert & Data Cloud Specialist | Authority on GCP-to-Data-Cloud integration — ingestion, BigQuery sharing, identity resolution, surfacing GCP-trained models in Salesforce. |
| Composable CDP & Activation | Hugo | Hightouch Expert & Composable CDP Specialist | Authority on Hightouch and warehouse-native activation — governed, identity-resolved audience delivery from a warehouse to CRM, Marketing Cloud, ad platforms, and more. |
| Composable CDP & Activation | Linnea | Marketing Cloud Solution Engineer | Leads Marketing Cloud Engagement demo/discovery — Journey Builder, Email/Mobile Studio, Personalization — translates marketing pain into journey and lifecycle metrics. |
| GTM, Value | Abigail | Business Value Consultant | Builds the ROI/TEI financial case and executive narrative for why a customer should invest in and expand Salesforce. |
| GTM, Value | Anna | Creative Designer & Content Producer | Full-spectrum creative production — decks, video, visual/motion/audio assets — concept through final delivery. |
| Pricing | Ciandro | Flex Credits Pricing Expert | Gives exact Flex Credits multipliers, runs consumption estimates, explains tier mechanics, and flags gotchas before a deal gets burned. |
| Personal Productivity | Defoe | Chief of Staff | Synthesizes calendar/inbox/Slack/org/account signal into one-screen "what deserves attention now" briefs; draft-and-stage only, never sends. |
| Personal Productivity | Eleanor | Calendar & Time Management Specialist | Defends focus blocks, drafts invites and reschedules, produces the daily and weekly plan; draft-only. |
| Personal Productivity | Marlow | Inbox & Communications Specialist | Triages Gmail/Slack, drafts replies in the user's voice, summarizes long threads; draft-only, never sends. |
| Personal Productivity | Tobias | Tasks & Follow-Through Specialist | Tracks two ledgers (owed by you / owed to you) from meetings, email, and Slack; nudges before things slip, draft-only. |
| Personal Productivity | Sylvie | Notes, Knowledge & Journaling Specialist | Captures meeting notes, maintains a personal knowledge base, runs reflection/journaling prompts; outbound is draft-only. |
| Personal Productivity | Dorian | Opportunity Change Tracker (Salesforce, read-only) | Watches Salesforce opportunities the user has deal interest on, flags material changes with a plain-language "why this matters"; read-only on the org. |
| Local Dev Environment | Sea Dong | Local Dev Environment / Mac Tooling Specialist | Owns the local Mac toolchain (Claude Code CLI, plugins, Homebrew, Salesforce CLI, uv, nvm) and its launchd update plumbing. |
| Local Dev Environment | Harlan | Claude Code Infrastructure Specialist | Diagnoses and fixes Claude Code connectivity/auth/MCP failures — unreachable API, agent-spawn errors, broken authentication. |
| Anthropic Practice | Boris | Applied AI Architect / Forward Deployed Engineer | In-house Anthropic operator; reviews everything built with Claude and pushes every artifact toward the simplest, most token-efficient design that works. |
| Education & Enablement | Maggie | Head of Education | Quality bar for every educational deliverable — workshops, decks, labs, docs; checks for a real learning objective and Anthropic/Salesforce voice. |
| Education & Enablement | Wren | SE Craft Coach | Coaches discovery, demo, story, objection handling, and executive presence through reps and feedback; runs the Weekly Rep ritual. |
| Workflow Discipline | Floyd | Workflow Discipline Guardrail (Intake Gate) | Standing intake gate; silently checks every request for overload, a missing plan, or a task-boundary signal, and speaks up only when one trips. |
| Account Intelligence | Pemberton | Account Researcher | Source-disciplined researcher who owns the live ground-truth picture of one named account — org structure, leadership, AI strategy, competitive landscape, regulatory environment. |
| Account Strategy | Sloan | Deal Strategist | Opinionated POV layer on top of Pemberton's labeled facts; asks "what's the Salesforce play here" and produces a cited, confidence-labeled Strategist's POV. |
| Risk | Matija | Pipeline Risk Synthesizer | Runs the weekly pipeline-risk sweep across six upstream sources; produces a one-screen brief with top risks, a watchlist, a noise log, and retractions of prior calls. |
| Project Delivery | Calder | Project Lead / Workstream Choreographer | Sequences multi-workstream demo builds and technical strategies against one milestone date; owns project plans, status roll-ups, T-minus runbooks, and technical-strategy docs. |
| Build & Deploy | Hank | Build Pod Lead | Executes write actions in the Build & Deploy sandbox — Slack `chat.postMessage` today; scratch-org and Heroku deploy in later waves. |
| Build & Deploy | Vera | Build Pod Verification | Reads the audit log for every Hank run, confirms pre/post entries match, and emits one pass/fail outcome per run. |
| Operations (cross-pod) | Roman | Senior Researcher | First stop in the hiring pipeline; researches a role's real-world equivalent, hard/soft skills, and working style before Gilbert drafts a persona. |
| Operations (cross-pod) | Gilbert | HR Manager | Runs the hiring pipeline — commissions Roman's research, then drafts the new teammate's full identity and capability profile. |
| Operations (cross-pod) | Imelda | Salesforce Admin / RevOps Specialist (Read-and-Recommend) | Diagnoses and documents org hygiene and RevOps issues read-only; authority ends at the read line, never writes to production. |

### Skills (`skills/*/SKILL.md`)

All 20 are real, harness-discoverable Claude Code Skills. Descriptions and trigger phrases below are condensed from each `SKILL.md`'s frontmatter `description`.

| Skill | What it does | Trigger phrase(s) |
|---|---|---|
| `account-intelligence` | Produces a four-section architect-POV brief for a named account (activity to date / trending last 30 days / noise that can wait / next 3 months focus), backed by my-org SOQL reads and a Slack scan. | "account intelligence for [account]", "run account intelligence on [account]", "give me the architect read on [account]" |
| `account-overview` | Live-status pull across a named parent account and its subsidiaries/business units, combining my-org SOQL reads with a Slack sweep into one synthesized status surface. | "account overview", "what's going on with [Account]", "[Account] live status" |
| `account-research` | Persistent per-account research/brainstorming workspace — tracks opportunities from my-org, sweeps Slack/Drive/web, runs a SWOT, and keeps Markdown memory under `accounts/`. | `/account-research`, "work on [account]", "research [account]", "set up a new account" |
| `account-summary` | Builds or refreshes an HTML deck + analyst/strategist MD companion for a named account from five research surfaces (SOQL, Slack, web, Gmail, Calendar/Meet), gated by Boris and Maggie before delivery. | "account summary", "account review", "update account summary for [Account]" |
| `competitive-response` | Builds a competitive counter-positioning brief against a named competitor — research, technical counter-positioning, and a customer-ready differentiation narrative. | "competitive response for [competitor]", "how do we beat [competitor]" |
| `deck-build` | Builds a client-specific Salesforce presentation deck — generates client-specific visuals with Nano Banana Pro, populates the Salesforce deck template, writes account-specific value narrative, and adds pricing when relevant. | "build a deck for [account]", "create presentation for [account]" |
| `demo-build-runbook` | Builds a T-minus countdown runbook for a named demo — every line names an owner, a dependency, and the roll-back trigger that would stop the demo. | "build the [account] demo runbook", "T-minus runbook for [project]" |
| `meeting-notes` | Single-pass extraction from raw notes or a transcript — decisions, action items with owners/due dates, open questions, and quotes worth preserving. Faithful capture only, no editorializing. | "capture meeting notes from [meeting]", "process the [meeting] notes" |
| `post-call-followup` | Drafts a short recap from a pasted call transcript, posts it to a Slack channel, and verifies the post landed with an append-only audit trail. Plain-text Slack post only. | "post-call followup for [account]", "Quick mode for [account] call" |
| `pre-call-prep` | Builds a single-page pre-call prep brief for an upcoming client meeting — account context, tailored value talking points, pricing guidance — as one print-ready HTML page. | "prep for [Account] meeting", "pre-call prep for [Account]" |
| `project-plan-build` | Builds a multi-phase milestone plan for a named account or project, with every milestone naming an inline dependency, a labeled citation, and a 1-3 quarter roadmap horizon. | "build a project plan for [account/project]", "draft the [project] plan" |
| `project-tracker` | Builds or updates a daily project tracker for the load-bearing named projects at an account, fanning out across SOQL, Slack, Gmail, Calendar/Meet, and web, with a prepended daily delta. | "project tracker", "update the project tracker", "how are [project] doing" |
| `self-improvement-skills-sweep` | Weekly proposal loop for skills — reads the mistake journal and skill catalogs, drops a single proposal file capped at 5 candidate actions (retire / merge / tighten / promote). | "weekly skills sweep", "self-improvement sweep", "run the sweep" |
| `stakeholder-readout` | Builds a one-page exec readout for a project or stakeholder touchpoint in three sequential passes — lock the facts, compose exec voice on top, then gate for pedagogy and voice. | "exec readout for [account/project]", "stakeholder report for [project]" |
| `technical-strategy` | Composes a technical-strategy document — account context, solution shape, demo plan, exec-narrative skeleton — gathering a technical-domain sweep before writing so the strategy never outruns its evidence. | "draft the [account] technical strategy", "technical POV on [account]" |
| `update-all-tools` | Mass-updates local dev tooling (Claude Code CLI, plugins, Salesforce CLI, uv, Homebrew, git-managed skill directories) in one pass, with a status report and a per-day log. | "update all my tools", "run the daily updater now" |
| `weekly-news-digest` | One-screen weekly public-news digest for a named account, filtered for items that affect the deal map, plus an optional internal-Slack delta; posts to a configured Slack channel. | "weekly [account] news digest", "run the weekly news digest" |
| `weekly-risk-sweep` | Weekly pipeline-risk sweep across six independent surfaces, synthesized into a one-screen brief with `[high-risk]`/`[watch]`/`[noise]` confidence labels, citations, and retractions. | "weekly risk sweep", "what's slipping this week" |
| `weekly-skills-refresh` | Scans for new Salesforce/Agentforce/Data Cloud capabilities released in the past 7 days and appends dated deltas to each in-scope persona file, plus a combined run log. | "refresh team skills", "run weekly skills refresh" |
| `workstream-status` | Weekly project workstream status — a one-screen brief surfacing the 1-2 things going wrong before the wins, with owner-named action items and a labeled citation on every line. | "workstream status", "where are we on [project]" |

### Workflows (`workflows/*.js`)

| Workflow | Orchestrates |
|---|---|
| `account-summary-refresh.js` | Five research surfaces read in parallel, then a gated expert-POV fan-out, then a concurrent HTML + MD + memory build, then Boris/Maggie/consistency gates in parallel. Drives `skills/account-summary/SKILL.md`. |
| `weekly-risk-sweep.js` | Six independent teammate reads in parallel, an adversarial verify pass on high-risk candidates, a synthesis pass into one brief, then an anti-pattern gate before delivery. Drives `skills/weekly-risk-sweep/SKILL.md`. |

### Slash Commands (`commands/*.md`)

| Command | Does |
|---|---|
| `/account-summary-update [account]` | Guaranteed-fire path for the account-summary skill — resolves account/slug/date, backs up existing artifacts, runs the `account-summary-refresh` workflow, and reports the Boris/Maggie/consistency gate verdicts before treating the run as done. |
| `/apply-proposals` | Walks the current week's self-improvement proposal file one at a time — apply, reject, skip, defer, view full diff, or quit — never batch-applies, and commits each accepted change separately. |

## What's Deliberately Not in Here

Left out by design — this is the account/business-agnostic "team infrastructure," not any one account's data:

- `accounts/*` — per-account research memory (git-ignored in the source repo)
- `team/journal/`, `team/logs/`, `team/risk/*`, `team/transition/`, `team/intelligence/`, `team/research/`, `team/deliverables/`, `team/build/` — generated output and per-account working state
- Account-specific personas/playbooks tied to one named customer (e.g. the Acme-Corp-Global-specific rows in the original roster) — the *mechanism* (Pemberton/Sloan-style account-research and account-strategy roles) is generic and included; a specific customer's brief is not
- `team/resources/CX Style Guide_Dec2025.docx` and its extraction — proprietary source material; `templates/CLAUDE.md` has a placeholder pointing at wherever you keep your own style guide
- MCP server credentials, launchd job registration, Stop-hook wiring — machine-level state that can't travel in a plugin bundle; `setup.sh`'s final output lists the manual steps

## Install

1. As a Claude Code plugin: point Claude Code at this directory (or a marketplace repo containing it) via `/plugin marketplace add` + `/plugin install subagent-team-harness`. This gets you the agents, skills, and commands auto-discovered.
2. Run the scaffold once against your target project so the `CLAUDE.md`-driven routing logic has the files it expects at the paths it expects:
   ```
   ./setup.sh /path/to/target-project
   ```
3. Follow the remaining manual steps `setup.sh` prints (gitignore rules, launchd, hooks, MCP auth). Full detail: `SETUP.md`.

See `SETUP.md` for the full walkthrough and the reasoning behind why step 2 exists even though step 1 alone covers a lot of ground.
