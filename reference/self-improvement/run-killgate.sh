#!/usr/bin/env bash
# Kill-Gate One-Shot — launchd entrypoint (Phase 1, Task #8)
# Invoked by ~/Library/LaunchAgents/com.rolando.self-improve-killgate.plist
# Fires once at 2026-06-27 09:00 local. After firing, this script boots the
# launchd job out of the user domain so it does not fire again.
#
# What it does:
#   1. Computes journal stats from team/journal/inbox/*.md (proposals,
#      applied, rejected, deferred, skipped).
#   2. Writes team/journal/inbox/KILL-GATE-2026-06-27.md with a CONTINUE /
#      EVOLVE / KILL decision template the user reviews at the next
#      /apply-proposals sweep.
#   3. Self-disables (launchctl bootout). One-shot.
#
# Decisions locked (do not relitigate):
#   - Posts to team/journal/inbox/KILL-GATE-2026-06-27.md
#   - Idempotent: re-running same day overwrites the kill-gate file.
#   - Bootout is fire-and-forget — exit 0 even if it fails.
#   - --dry-run / --fixture flag writes KILL-GATE-2026-06-27-FIXTURE.md
#     and skips bootout, for smoke testing.

set -euo pipefail

# --- Args --------------------------------------------------------------------
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run|--fixture) DRY_RUN=1 ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# --- Paths -------------------------------------------------------------------
# This script is meant to live at <your-project>/team/scripts/self-improvement/run-killgate.sh
# (setup.sh places it there). No hardcoded machine path or username.
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
INBOX="${PROJECT_DIR}/team/journal/inbox"
LOG_DIR="${PROJECT_DIR}/team/logs"
RUN_DATE="$(date +%Y-%m-%d)"
RUN_LOG="${LOG_DIR}/self-improve-killgate-${RUN_DATE}.log"
LABEL="com.rolando.self-improve-killgate"

if [[ "${DRY_RUN}" -eq 1 ]]; then
  TARGET_FILE="${INBOX}/KILL-GATE-2026-06-27-FIXTURE.md"
else
  TARGET_FILE="${INBOX}/KILL-GATE-2026-06-27.md"
fi

mkdir -p "${LOG_DIR}" "${INBOX}"

{
  echo "=== Kill-Gate One-Shot — launchd run ==="
  echo "Start: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "User: $(whoami)"
  echo "DRY_RUN: ${DRY_RUN}"
  echo "Target: ${TARGET_FILE}"

  # --- Stats over inbox -----------------------------------------------------
  # Exclude INDEX.md, _deferred.md, _rejected.md, KILL-GATE-*.md from proposal
  # counts (they are not proposals themselves; they are bookkeeping artifacts
  # or this same kill-gate file).
  mapfile_compat() {
    # macOS bash 3.2 has no mapfile; use find + while-read into a global array.
    INBOX_FILES=()
    while IFS= read -r f; do
      INBOX_FILES+=("$f")
    done < <(find "${INBOX}" -maxdepth 1 -type f -name '*.md' \
              ! -name 'INDEX.md' \
              ! -name '_deferred.md' \
              ! -name '_rejected.md' \
              ! -name 'KILL-GATE-*.md' \
              | LC_ALL=C sort)
  }
  mapfile_compat

  count_lines() {
    # $1 = pattern (extended regex), counts occurrences across INBOX_FILES.
    local pattern="$1"
    local total=0
    if [[ ${#INBOX_FILES[@]} -gt 0 ]]; then
      total=$(grep -hcE "${pattern}" "${INBOX_FILES[@]}" 2>/dev/null \
                | awk '{s+=$1} END{print s+0}')
    fi
    echo "${total}"
  }

  PROPOSALS=$(count_lines '^PROPOSAL ')
  APPLIED=$(count_lines '^Status: applied(-manual)?$')
  REJECTED=$(count_lines '^Status: rejected$')
  DEFERRED=$(count_lines '^Status: deferred$')
  SKIPPED=$(count_lines '^Status: skipped$')

  # Cross-validation: count entries in _rejected.md if present.
  REJECTED_LEDGER=0
  if [[ -f "${INBOX}/_rejected.md" ]]; then
    REJECTED_LEDGER=$(grep -cE '^- ' "${INBOX}/_rejected.md" 2>/dev/null || echo 0)
  fi

  echo "Stats:"
  echo "  proposals=${PROPOSALS}"
  echo "  applied=${APPLIED}"
  echo "  rejected=${REJECTED} (ledger: ${REJECTED_LEDGER})"
  echo "  deferred=${DEFERRED}"
  echo "  skipped=${SKIPPED}"

  # --- Write the kill-gate proposal ----------------------------------------
  if ! cat > "${TARGET_FILE}" <<EOF
PROPOSAL KILL-GATE-2026-06-27
Summary: 30-day kill-gate check — decide whether the weekly proposal loop earns its keep.
Target: weekly proposal loop (com.rolando.self-improve-sweep launchd job + capture-stop hook + Sweeper-Skills)
Signal: 30 days elapsed since Phase 1 ship date 2026-05-28.
Signal strength: high — calendar-based, not heuristic.
Reversible: yes — disable launchd jobs and remove the Stop hook entry.

Journal stats (rolling 30 days):
- Proposals generated: ${PROPOSALS}
- Applied: ${APPLIED}
- Rejected: ${REJECTED}
- Deferred: ${DEFERRED}
- Skipped: ${SKIPPED}

Decide: CONTINUE, EVOLVE, or KILL.

CONTINUE — Phase 1 is earning its keep. Hold steady, let it run another month.
EVOLVE — promising but needs adjustment. Open follow-up tasks for Phase 2 (Sweeper-Memory, Sweeper-Rules, eval harness) or specific tunings.
KILL — proposals are noise or the inbox is unread. Disable both launchd jobs and remove the Stop hook entry.

KILL procedure (copy-pasteable):
  launchctl bootout gui/\$(id -u)/com.rolando.self-improve-sweep
  launchctl bootout gui/\$(id -u)/com.rolando.self-improve-killgate || true
  # Remove the third Stop hook entry from ~/.claude/settings.json:
  cp ~/.claude/settings.json ~/.claude/settings.json.bak.killgate-\$(date +%Y%m%d)
  # Manually edit ~/.claude/settings.json to drop the capture-stop.sh entry from .hooks.Stop[0].hooks
  # OR restore the most recent pre-Phase-1 backup: ls -lt ~/.claude/settings.json.bak.* | head -1

Apply: /apply-proposal KILL-GATE-2026-06-27
Reject: /reject-proposal KILL-GATE-2026-06-27
EOF
  then
    echo "ERROR: failed to write ${TARGET_FILE}"
    exit 1
  fi
  echo "Wrote: ${TARGET_FILE}"

  # --- Self-disable (skip on dry-run) --------------------------------------
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    echo "Bootout: SKIPPED (dry-run)"
  else
    set +e
    launchctl bootout "gui/$(id -u)/${LABEL}"
    BOOTOUT_RC=$?
    set -e
    echo "Bootout: rc=${BOOTOUT_RC} (non-zero is fine if job already gone)"
  fi

  echo "End: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Exit: 0"
  exit 0
} >> "${RUN_LOG}" 2>&1
