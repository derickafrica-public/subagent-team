# Setting up subagent-team-harness on a new machine

## Why two steps (plugin install *and* setup.sh)

Claude Code plugins auto-discover `agents/`, `skills/`, and `commands/` — that
part just works after install (including the `skills/*/SKILL.md` routing
table). But this team's brain is `CLAUDE.md`: an always-loaded orchestration
file that routes every request by reading `team/ROSTER.md` and invoking
`.claude/workflows/*.js` by relative path. Plugins have no mechanism to inject that kind of always-on,
project-root instruction file — so `setup.sh` exists to materialize those
paths once, in the target project, so the routing logic in `templates/CLAUDE.md`
resolves correctly.

Do both steps. Skipping `setup.sh` gets you 43 subagents you can `Task()` by
hand, but not the Rolando orchestrator experience.

## Steps

### 1. Get the plugin onto the new machine
Simplest path: this plugin directory lives inside the `claude-projects` git
repo. Clone the repo (or just copy the `plugin/subagent-team-harness/` directory) to
the new machine.

### 2. Install as a Claude Code plugin (optional but recommended)
```
/plugin marketplace add /path/to/plugin/subagent-team-harness
/plugin install subagent-team-harness
```
This registers the 43 agents, 20 skills, and 2 commands with the harness.

### 3. Scaffold a target project
```
cd /path/to/plugin/subagent-team-harness
./setup.sh /path/to/new-or-existing-project
```
This copies:
- `CLAUDE.md` (won't overwrite an existing one — writes `CLAUDE.md.subagent-team-harness` instead so you can diff/merge)
- `team/ROSTER.md`
- `team/*.md` (43 personas, de-frontmattered back to plain persona docs)
- `team/scripts/self-improvement/*`
- `.claude/workflows/*.js`
- `.claude/commands/*.md`
- `.claude/skills/*/` (all 20 shipped skill directories)
- `.claude/agents/*.md`

### 4. Gitignore rules (if the target is a git repo)
Add the equivalents of the source repo's exclusions so per-account/local-only
state never gets committed:
```
accounts/*
!accounts/README.md
!accounts/_index.md
!accounts/_templates/
!accounts/_templates/**
team/journal/inbox/INDEX.md
team/journal/inbox/_dryrun/
team/journal/inbox/_*.md
team/journal/inbox/*.dryrun.md
team/logs/
team/risk/*
!team/risk/.gitkeep
team/runs/
team/scripts/self-improvement/state/
team/scripts/self-improvement/locks/
team/transition/_*.json
team/transition/_*.txt
team/transition/_*.soql
team/build/audit/
team/build/outbox/
core-se-runbook.md
```

### 5. Launchd cadences (macOS only, manual)
`reference/launchd-templates/*.plist` are templates from the source machine —
they hardcode `/Users/<old-user>/claude-projects` paths. For each one you want:
1. Copy it to `~/Library/LaunchAgents/`.
2. Edit the `<string>` paths to match the new machine's project location and username.
3. `launchctl load ~/Library/LaunchAgents/com.rolando.<name>.plist`

### 6. Stop-hook wiring (optional, for the self-improvement journal)
If you want the mistake-journal capture loop, add `team/scripts/self-improvement/capture-stop.sh`
to the `Stop` hooks array in the target project's `.claude/settings.json`.
This plugin doesn't ship a `hooks.json` that auto-registers it — hooks that
fire on every Stop event are worth opting into deliberately per machine.

### 7. MCP servers / credentials
Re-authenticate whatever this team's skills depend on for real work — Google
Workspace, Slack, Salesforce CLI orgs, GitHub, Heroku, etc. Credentials never
travel with a plugin or a git repo; re-run each MCP server's auth flow on the
new machine.

### 8. Account-specific material (do this last, deliberately)
Nothing account-specific shipped in this plugin on purpose (see README's
"What's deliberately NOT in here"). If you want a specific account's
research carried over too, copy that account's directory under `accounts/`
by hand — that's a decision to make per account, not something a generic
team package should assume.
