# rolando-team

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
| `reference/launchd-templates/*.plist` | Weekly cadence job definitions | Templates only — hardcode the old machine's paths, must be edited |
| `templates/CLAUDE.md` | The orchestrator identity/routing file | Yes, once copied to the target project root as `CLAUDE.md` |
| `setup.sh` | Scaffolds all of the preceding into a target project directory in one pass | — |

## What's Deliberately Not in Here

Left out by design — this is the account/business-agnostic "team infrastructure," not any one account's data:

- `accounts/*` — per-account research memory (git-ignored in the source repo)
- `team/journal/`, `team/logs/`, `team/risk/*`, `team/transition/`, `team/intelligence/`, `team/research/`, `team/deliverables/`, `team/build/` — generated output and per-account working state
- Account-specific personas/playbooks tied to one named customer (e.g. the Acme-Corp-Global-specific rows in the original roster) — the *mechanism* (Pemberton/Sloan-style account-research and account-strategy roles) is generic and included; a specific customer's brief is not
- `team/resources/CX Style Guide_Dec2025.docx` and its extraction — proprietary source material; `templates/CLAUDE.md` has a placeholder pointing at wherever you keep your own style guide
- MCP server credentials, launchd job registration, Stop-hook wiring — machine-level state that can't travel in a plugin bundle; `setup.sh`'s final output lists the manual steps

## Install

1. As a Claude Code plugin: point Claude Code at this directory (or a marketplace repo containing it) via `/plugin marketplace add` + `/plugin install rolando-team`. This gets you the agents, skills, and commands auto-discovered.
2. Run the scaffold once against your target project so the `CLAUDE.md`-driven routing logic has the files it expects at the paths it expects:
   ```
   ./setup.sh /path/to/target-project
   ```
3. Follow the remaining manual steps `setup.sh` prints (gitignore rules, launchd, hooks, MCP auth). Full detail: `SETUP.md`.

See `SETUP.md` for the full walkthrough and the reasoning behind why step 2 exists even though step 1 alone covers a lot of ground.
