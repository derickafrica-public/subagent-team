# Self-Improvement Skills Sweep — launchd job

Phase 1 of the weekly proposal loop. One sweeper. Skills only.

## What this job does

Once per week, on Sunday at **21:00 local**, the wrapper at
`team/scripts/self-improvement/run-weekly-sweep.sh` runs the skill at
`.claude/skills/self-improvement-skills-sweep/SKILL.md` in a single headless
`claude -p` turn. The skill reads the rolling 30-day journal plus both
skill catalogs (`~/.claude/skills/` and `team/skills/`) and proposes at
most 5 small, reversible changes for the user to review.

After the claude turn ends, the wrapper runs
`team/scripts/self-improvement/aggregate-inbox.sh` so
`team/journal/inbox/INDEX.md` is fresh.

## Files

| Path | Role |
|---|---|
| `~/Library/LaunchAgents/com.rolando.self-improve-sweep.plist` | launchd schedule |
| `team/scripts/self-improvement/run-weekly-sweep.sh` | wrapper (entrypoint) |
| `team/scripts/self-improvement/aggregate-inbox.sh` | inbox INDEX builder |
| `.claude/skills/self-improvement-skills-sweep/SKILL.md` | the skill executed |
| `~/.claude/self-improve-sweep.config` | optional config override (DRY_RUN) |
| `team/logs/self-improve-sweep-YYYY-MM-DD.log` | per-run wrapper log |
| `team/logs/self-improve-sweep-stdout.log` | launchd stdout (rare; wrapper redirects internally) |
| `team/logs/self-improve-sweep-stderr.log` | launchd stderr |

## Schedule

- **Day:** Sunday (`Weekday=0` in launchd)
- **Time:** 21:00 local
- **23-hour gap** before the Saturday `com.rolando.weekly-skills-refresh` job at 22:00 — no flock needed.
- **Catch-up:** if the Mac was asleep at 21:00 Sunday, launchd fires at next wake (`StartCalendarIntervalRunAtLoad=false`, but standard launchd Calendar catch-up applies).

## DRY_RUN shakedown — first 3 weeks

`DRY_RUN=1` is the default. The skill writes to
`team/journal/inbox/<ISO-week>.dryrun.md` instead of the live file and
does not touch `_deferred.md`.

| Run date | Mode |
|---|---|
| 2026-06-07 | DRY_RUN=1 |
| 2026-06-14 | DRY_RUN=1 |
| 2026-06-21 | DRY_RUN=1 |
| **2026-06-28** | **flip to DRY_RUN=0** |

### How to flip DRY_RUN off (week 4 — 2026-06-28)

No script edit. Drop a one-line config file:

```bash
mkdir -p ~/.claude
echo 'DRY_RUN=0' > ~/.claude/self-improve-sweep.config
```

To go back to dry-run: `echo 'DRY_RUN=1' > ~/.claude/self-improve-sweep.config`
or `rm ~/.claude/self-improve-sweep.config` (default is 1).

Verify on the next manual run:
```bash
bash <PROJECT_DIR>/team/scripts/self-improvement/run-weekly-sweep.sh
grep '^DRY_RUN' <PROJECT_DIR>/team/logs/self-improve-sweep-$(date +%Y-%m-%d).log
```

## Loading and unloading the launchd job

The plist is **NOT loaded automatically by this README**. Load it explicitly:

```bash
# Load (install) the job
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.rolando.self-improve-sweep.plist

# Verify it's loaded
launchctl print gui/$(id -u)/com.rolando.self-improve-sweep | head -40

# Unload (rollback)
launchctl bootout gui/$(id -u)/com.rolando.self-improve-sweep
```

## Manual triggers (off-schedule)

Two equivalent ways:

```bash
# A. Kick the loaded launchd job directly
launchctl kickstart gui/$(id -u)/com.rolando.self-improve-sweep

# B. Just run the wrapper script (works even if launchd job isn't loaded)
bash <PROJECT_DIR>/team/scripts/self-improvement/run-weekly-sweep.sh
```

Override DRY_RUN at the command line for one-off runs:
```bash
DRY_RUN=0 bash <PROJECT_DIR>/team/scripts/self-improvement/run-weekly-sweep.sh
```

## Logs

- Per-run wrapper log: `team/logs/self-improve-sweep-YYYY-MM-DD.log`
  Re-running the same day appends, doesn't overwrite. Check this first
  for both stdout and stderr — the wrapper redirects both into it.
- launchd-level stdout/stderr: `team/logs/self-improve-sweep-{stdout,stderr}.log`
  Only catches output that escapes before the wrapper's redirect (rare —
  setup errors, missing bash, etc.).

## Exit codes

The wrapper bubbles whichever exit code is non-zero:

1. claude's exit code (takes precedence)
2. aggregator's exit code

The final line of every run log records both:
`Exit: <final> (claude=<rc>, aggregator=<rc>)`

---

## Kill-Gate One-Shot — `com.rolando.self-improve-killgate`

Phase 1 ships with a hard 30-day kill date. The kill-gate is a separate
launchd one-shot that fires exactly once and posts a CONTINUE / EVOLVE /
KILL decision proposal into the inbox so the next `/apply-proposals` run
forces the call.

### What it does

`team/scripts/self-improvement/run-killgate.sh`:

1. Counts proposals across `team/journal/inbox/*.md` (excluding
   `INDEX.md`, `_deferred.md`, `_rejected.md`, and `KILL-GATE-*.md`).
2. Counts `^Status: applied`, `applied-manual`, `rejected`, `deferred`,
   `skipped` lines as a 30-day rolling tally (cross-validates rejected
   against `_rejected.md` ledger entries).
3. Writes `team/journal/inbox/KILL-GATE-2026-06-27.md` with the stats
   embedded and three decision branches with copy-pasteable disable
   commands.
4. Self-disables: `launchctl bootout gui/$(id -u)/com.rolando.self-improve-killgate`.
   Failure of bootout is logged but non-fatal (exit 0).

### When it fires

- **2026-06-27 09:00 local**, one-shot.
- launchd has no `Year` key. The plist pins `Month=6, Day=27, Hour=9,
  Minute=0`. The one-shot guarantee comes from the script booting itself
  out after first fire — without that, it would re-fire annually.
- If the Mac is asleep at 09:00 on 2026-06-27, launchd fires at next
  wake (within 24h is fine for a kill-gate).

### Loading and unloading

```bash
# Load (install) — do this once, well before 2026-06-27
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.rolando.self-improve-killgate.plist

# Verify loaded
launchctl print gui/$(id -u)/com.rolando.self-improve-killgate | head -40

# Cancel before the fire date (skip the gate)
launchctl bootout gui/$(id -u)/com.rolando.self-improve-killgate
```

### Manually fire early

If you want to see the kill-gate proposal before 2026-06-27:

```bash
bash <PROJECT_DIR>/team/scripts/self-improvement/run-killgate.sh
```

This writes the live `KILL-GATE-2026-06-27.md` and (if loaded) boots out
the launchd job. Re-running same day overwrites the file — single-shot
artifact.

Dry-run (writes `KILL-GATE-2026-06-27-FIXTURE.md` and skips bootout):

```bash
bash <PROJECT_DIR>/team/scripts/self-improvement/run-killgate.sh --dry-run
```

### Reschedule for a different date

Edit `~/Library/LaunchAgents/com.rolando.self-improve-killgate.plist`,
change `Month` / `Day` / `Hour` / `Minute` in the
`StartCalendarInterval` dict, then reload:

```bash
launchctl bootout  gui/$(id -u)/com.rolando.self-improve-killgate
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.rolando.self-improve-killgate.plist
```

Also update the filename in `run-killgate.sh` (`KILL-GATE-YYYY-MM-DD.md`)
and the `Signal:` line so the proposal stays self-consistent.

### Logs

- Per-run wrapper log: `team/logs/self-improve-killgate-YYYY-MM-DD.log`
- launchd-level: `team/logs/launchd-killgate-{stdout,stderr}.log`
