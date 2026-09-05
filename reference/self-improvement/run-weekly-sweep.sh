#!/usr/bin/env bash
# Weekly Skills Sweep — launchd entrypoint (Phase 1, Task #3)
# Invoked by ~/Library/LaunchAgents/com.rolando.self-improve-sweep.plist
# Runs as user youruser every Sunday at 21:00 local time.
#
# Executes the skill at .claude/skills/self-improvement-skills-sweep/SKILL.md in a
# single headless `claude -p` turn, then runs the inbox aggregator so
# team/journal/inbox/INDEX.md is fresh after every sweep.
#
# Decisions locked (do not relitigate):
#   - Sun 21:00 local
#   - No flock (weekly cadence, 23h gap from weekly-skills-refresh)
#   - DRY_RUN=1 default ON for first 3 Sunday runs (2026-06-07, -14, -21)
#     Flip to 0 on the 4th run (2026-06-28) by editing
#     ~/.claude/self-improve-sweep.config (see README) — no script edit.

set -euo pipefail

# --- Optional config override ------------------------------------------------
# User can flip DRY_RUN without editing this script:
#   echo 'DRY_RUN=0' > ~/.claude/self-improve-sweep.config
CONFIG_FILE="${HOME}/.claude/self-improve-sweep.config"
if [[ -f "${CONFIG_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${CONFIG_FILE}"
fi

# --- Defaults ----------------------------------------------------------------
DRY_RUN="${DRY_RUN:-1}"   # ON for shakedown weeks
# This script is meant to live at <your-project>/team/scripts/self-improvement/run-weekly-sweep.sh
# (setup.sh places it there). PROJECT_DIR derives from its own location — no
# hardcoded machine path or username. Override with the env var if you relocate it.
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
CLAUDE_BIN="${CLAUDE_BIN:-$(command -v claude || echo "$HOME/.local/bin/claude")}"
# The skill file is copied by setup.sh (or auto-discovered when the plugin is installed via
# `claude plugin marketplace add`) to .claude/skills/self-improvement-skills-sweep/SKILL.md under
# the project root — never to team/skills/, which setup.sh never populates for this skill.
SKILL_PATH=".claude/skills/self-improvement-skills-sweep/SKILL.md"
AGGREGATOR="${PROJECT_DIR}/team/scripts/self-improvement/aggregate-inbox.sh"
LOG_DIR="${PROJECT_DIR}/team/logs"
RUN_DATE="$(date +%Y-%m-%d)"
ISO_WEEK="$(date +%G-W%V)"
RUN_LOG="${LOG_DIR}/self-improve-sweep-${RUN_DATE}.log"

mkdir -p "${LOG_DIR}"

# --- Body --------------------------------------------------------------------
# Single block, all output appended to the dated log. Re-runs same day append.
{
  echo "=== Self-Improvement Skills Sweep — launchd run ==="
  echo "Start: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "User: $(whoami)"
  echo "PWD target: ${PROJECT_DIR}"
  echo "Claude bin: ${CLAUDE_BIN}"
  echo "Skill: ${SKILL_PATH}"
  echo "ISO week: ${ISO_WEEK}"
  echo "DRY_RUN: ${DRY_RUN}"
  echo "Aggregator: ${AGGREGATOR}"

  cd "${PROJECT_DIR}" || { echo "cd failed: ${PROJECT_DIR}"; exit 1; }

  # Headless single-turn invocation. --max-turns 40 is enough for: read journal,
  # list two skills catalogs, read prior weekly files + _deferred, optional
  # JSONL jq scan, write the weekly file. No web search needed for this skill.
  echo "--- claude invocation begin ---"
  set +e
  "${CLAUDE_BIN}" \
    --permission-mode bypassPermissions \
    --max-turns 40 \
    -p "Run the weekly skills sweep skill at ${SKILL_PATH} NOW in this single turn. ISO week: ${ISO_WEEK}. Dry-run: ${DRY_RUN}. Do not narrate; perform tool calls and emit the 3-line summary as your final response."
  CLAUDE_RC=$?
  set -e
  echo "--- claude invocation end (rc=${CLAUDE_RC}) ---"

  # Aggregator runs regardless of claude's exit code so a partial sweep still
  # leaves INDEX.md consistent with whatever inbox files exist on disk.
  echo "--- aggregator begin ---"
  set +e
  "${AGGREGATOR}"
  AGG_RC=$?
  set -e
  echo "--- aggregator end (rc=${AGG_RC}) ---"

  # Bubble whichever non-zero exit code occurred. Claude takes precedence.
  FINAL_RC=0
  if [[ ${CLAUDE_RC} -ne 0 ]]; then
    FINAL_RC=${CLAUDE_RC}
  elif [[ ${AGG_RC} -ne 0 ]]; then
    FINAL_RC=${AGG_RC}
  fi

  echo "End: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Exit: ${FINAL_RC} (claude=${CLAUDE_RC}, aggregator=${AGG_RC})"

  exit ${FINAL_RC}
} >> "${RUN_LOG}" 2>&1
