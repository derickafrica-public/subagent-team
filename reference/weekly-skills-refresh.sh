#!/bin/zsh
# Weekly Salesforce Skills Refresh — launchd entrypoint
# Invoked by /Library/LaunchDaemons/com.rolando.weekly-skills-refresh.plist
# Runs weekly (Saturday 22:00 local in the original install — adjust the
# plist to your own schedule).
#
# Scans for new Salesforce product capabilities published in the last 7 days
# and appends a dated block to each in-scope teammate's "## Recent Capability
# Updates" section under team/.
#
# NOTE: the original author's version of this script also synced a SECOND,
# unrelated personal project's team roster in the same run ("Roster B"). That
# cross-project behavior was removed here — it assumed a second private repo
# with its own named personas that has nothing to do with this plugin. If you
# maintain more than one Claude Code "team" project and want one script to
# refresh both, fork this and add your own second roster back in.

set -u

# This script is meant to live at <your-project>/team/scripts/weekly-skills-refresh.sh
# (setup.sh places it there). No hardcoded machine path or username.
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)}"
ROSTER_DIR="${PROJECT_DIR}/team"
CLAUDE_BIN="${CLAUDE_BIN:-$(command -v claude || echo "$HOME/.local/bin/claude")}"
LOG_DIR="${PROJECT_DIR}/team/logs"
RUN_DATE="$(date +%Y-%m-%d)"
RUN_LOG="${LOG_DIR}/launchd-${RUN_DATE}.log"

# Compute the 7-day scan window (last week's run date → this run, inclusive).
# `date -v` is BSD/macOS-specific.
WINDOW_END="${RUN_DATE}"
WINDOW_START="$(date -v-7d +%Y-%m-%d)"
RUN_LOG_MD="${LOG_DIR}/weekly-skills-refresh-${WINDOW_END}.md"

mkdir -p "${LOG_DIR}"

# Build the headless prompt. Imperative, single-turn — no "delegate and report
# back" framing, because `claude -p` only gets one turn.
read -r -d '' PROMPT <<PROMPT_EOF || true
You are running the weekly Salesforce skills refresh in HEADLESS mode.
There is NO second turn. You must execute every step of the skill at
${ROSTER_DIR}/skills/weekly-skills-refresh.md NOW, in this single turn,
using tool calls. Do NOT respond with "delegating to Roman" or "I'll report
back" — there is no one to report back to. Perform the work yourself, acting
as Roman (research), and only after every tool call has completed, emit the
run-log summary as your final response.

Scan window (use exactly these dates; do not guess):
  Start (inclusive): ${WINDOW_START}
  End   (inclusive): ${WINDOW_END}

Roster to update — directory: ${ROSTER_DIR}
  Read team/ROSTER.md for current pod membership and in-scope teammates
  (file = <name>.md). Skip any teammate ROSTER.md marks non-product /
  out of scope (e.g. business-value or design-only roles with no product
  surface to track).

Required actions, in order, all in this turn:

1. Web-search every source category listed in the skill file Step 1
   (release notes, Admin / Developer / Architects blogs, Agentforce + Data
   Cloud announcements, Trailblazer highlights, plus the product surface
   keyword scan). Restrict results to items published between
   ${WINDOW_START} and ${WINDOW_END} inclusive.

2. For each new capability found, classify the primary owner among the
   in-scope teammates per team/ROSTER.md.

3. Dedupe against existing entries already present in each teammate's
   "## Recent Capability Updates" section before writing.

4. For every in-scope teammate file, edit the file and prepend a new block
   under "## Recent Capability Updates" using the exact format from the skill:
     ### ${WINDOW_END} (week of ${WINDOW_END})
     - <Capability> — <one-sentence description>. Source: <URL>
   If the section does not exist, create it at the bottom of the file. If
   no new capabilities were found for that teammate this week, write the
   single line: "- No new Salesforce capabilities found this week."
   Never delete prior weekly blocks.

5. Write the run log to:
   ${RUN_LOG_MD}
   using the markdown format from Step 4 of the skill. Group per-teammate
   counts under their pod heading per team/ROSTER.md. Include run start/end
   ISO timestamps, sources scanned count, total capabilities found count,
   full sources-consulted URL list. Create the file if it does not exist;
   overwrite if a partial run wrote it earlier today.

6. Only after all file writes complete, emit a final response that is the
   plain-text run-log summary (per-teammate counts + total sources + total
   capabilities). No preamble, no "I will" / "I'm going to" — just the
   completed summary.

Constraints:
- No fabricated capabilities. Every bullet needs a verifiable source URL.
- If the network is unreachable, write the run log noting which sources
  failed and exit cleanly without appending speculative entries.
- Idempotent: safe to re-run the same day; dedupe must prevent doubles.
PROMPT_EOF

# Dry-run flag: print the resolved prompt instead of invoking claude.
# Usage: DRY_RUN=1 /path/to/weekly-skills-refresh.sh
if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "=== DRY RUN — resolved prompt ==="
  echo "RUN_DATE=${RUN_DATE}"
  echo "WINDOW_START=${WINDOW_START}"
  echo "WINDOW_END=${WINDOW_END}"
  echo "ROSTER_DIR=${ROSTER_DIR}"
  echo "RUN_LOG=${RUN_LOG}"
  echo "RUN_LOG_MD=${RUN_LOG_MD}"
  echo "--- PROMPT ---"
  echo "${PROMPT}"
  echo "--- END PROMPT ---"
  exit 0
fi

{
  echo "=== Weekly Skills Refresh launchd run ==="
  echo "Start: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "User: $(whoami)"
  echo "PWD: ${PROJECT_DIR}"
  echo "Roster: ${ROSTER_DIR}"
  echo "Claude bin: ${CLAUDE_BIN}"
  echo "Window: ${WINDOW_START} → ${WINDOW_END}"
  echo "Run-log markdown target: ${RUN_LOG_MD}"

  cd "${PROJECT_DIR}" || { echo "cd failed"; exit 1; }

  # Headless invocation. Imperative single-turn prompt; --max-turns raised
  # so the model can chain web searches + file edits plus the run-log write
  # in one invocation. --permission-mode bypassPermissions is required
  # because there is no interactive user to approve tool calls.
  "${CLAUDE_BIN}" \
    --permission-mode bypassPermissions \
    --max-turns 80 \
    -p "${PROMPT}"

  echo "End: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Exit: $?"
} >> "${RUN_LOG}" 2>&1
