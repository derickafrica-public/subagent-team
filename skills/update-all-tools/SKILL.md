---
name: update-all-tools
description: >-
  Mass-update the user's local dev tooling — Claude Code CLI, Claude plugins, Salesforce CLI,
  uv, Homebrew, and any git-managed skill directories — in one pass, with a section-by-section
  status report and a per-day append log. TRIGGER when the user says "update all my tools",
  "update everything", "run the daily updater now", "run update-all", "check yesterday's update
  log", "is everything up to date", or "uninstall the daily updater".
metadata:
  version: "1.0"
---

# Update All Tools

Mass-updates the user's Claude Code CLI, Claude plugins, Salesforce CLI, uv, Homebrew, and any
git-managed skills under `~/.claude/skills` (plus any extra repos listed in
`~/.claude/update-all.config`). Reports outdated npm globals (does not auto-upgrade them), warns
on low disk, and rotates logs older than 30 days. Safe to run on demand or daily via launchd.

Source repo pinned at SHA `7bdcd7ccf08c9708b9712ff31142f2e9de9ffa1a`
(https://github.com/sdong101010/claude-update-all).

In the original multi-agent design this skill was owned end-to-end by a persona named "Sea
Dong" (`team/sea-dong.md`), with no fan-out to anyone else. That framing doesn't matter here —
run the script directly yourself. If a `team/sea-dong.md` file happens to exist, its audit/install
history is useful background, but nothing below depends on it.

---

## On-demand invocation

```
~/.claude/scripts/update-all.sh
```

- **Exit 0** = all sections green.
- **Exit 1** = at least one section failed (the script keeps going; it doesn't bail on first
  error).
- Log file: `~/.claude/logs/update-all-YYYY-MM-DD.log` (per-day append).

To re-check a prior day's run without re-running:
```
ls -la ~/.claude/logs/update-all-*.log
tail -50 ~/.claude/logs/update-all-YYYY-MM-DD.log
```

---

## Daily schedule (launchd)

When installed, runs daily at 07:30 local via launchd label `com.claude.update-all`. Schedule
changes go through the config file:

```
echo 'LAUNCHD_HOUR=9' >> ~/.claude/update-all.config
echo 'LAUNCHD_MINUTE=30' >> ~/.claude/update-all.config
~/.claude/scripts/update-all.sh --install-launchd   # regen plist
```

Verify the schedule is loaded:
```
launchctl print "gui/$(id -u)/com.claude.update-all"
```

---

## Logs

| Path | What |
|---|---|
| `~/.claude/logs/update-all-YYYY-MM-DD.log` | Per-day append. One per calendar day. Full section output. |
| `~/.claude/logs/launchd-stdout.log` | Overwritten each launchd fire. Last scheduled run's stdout. |
| `~/.claude/logs/launchd-stderr.log` | Overwritten each launchd fire. Last scheduled run's stderr. |

If a `team/` directory is present in the current project, also write a short pre-install audit
and install run log under `team/logs/update-all-audit-<YYYY-MM-DD>.md` and
`team/logs/update-all-install-<YYYY-MM-DD>.md` for a durable record — optional, but recommended
whenever this skill changes the install or schedule.

Logs older than 30 days are auto-deleted by the script's own log-rotation section (matches
`~/.claude/logs/update-all-*.log` only).

---

## Configuration

`~/.claude/update-all.config` (sourced bash, all settings optional):

```bash
LAUNCHD_HOUR=7
LAUNCHD_MINUTE=30
EXTRA_GIT_REPOS=( ~/Developer/my-tool )
SKILL_DIRS=( ~/.claude/skills )
ENABLE_HOMEBREW=1
ENABLE_SF_CLI=1
ENABLE_UV=1
ENABLE_NPM_REPORT=1
ENABLE_DISK_CHECK=1
```

A template usually ships alongside the source repo as `update-all.config.example` — copy it to
`~/.claude/update-all.config` and edit rather than authoring one from scratch.

---

## Rollback

Disable just the schedule:
```
~/.claude/scripts/update-all.sh --uninstall-launchd
```

Full uninstall (removes symlinks if and only if they point into the working clone — the upstream
uninstaller checks `readlink` first):
```
<path to the cloned claude-update-all repo>/uninstall.sh
```

Manual full removal if the uninstaller can't be reached:
```
launchctl bootout "gui/$(id -u)/com.claude.update-all"
rm -f ~/Library/LaunchAgents/com.claude.update-all.plist
rm -f ~/.claude/scripts/update-all.sh
rm -f ~/.claude/skills/update-all-tools/SKILL.md
rmdir ~/.claude/skills/update-all-tools 2>/dev/null
rmdir ~/.claude/scripts 2>/dev/null
rm -f ~/.claude/update-all.config
```

Logs are intentionally **not** removed by uninstall — keep them for forensic value.

---

## Output requirements

- Every on-demand invocation reports the exit code, the log path, and a section-by-section
  status table.
- Every schedule change re-installs the plist and verifies with `launchctl print`.
- Every install/uninstall is logged (see Logs above) with the command list and rollback steps.
- Never install the schedule on a failed dry run — the gate is "exit 0 AND zero failed sections."

---

## Failure handling

If a section fails on a manual run:
- Read the log under `~/.claude/logs/update-all-YYYY-MM-DD.log`.
- Classify: transient (network, CDN hiccup, source temporarily down) vs. structural (wrong PATH,
  missing tool, permissions).
- For transients, re-run once. For structural failures, stop and report — do not loop, do not
  bypass the script.
- Never `sudo`. Never write under `/Library/`, `/usr/`, `/etc/`. Never modify files inside
  `~/.claude/skills/`.
