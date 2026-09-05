#!/bin/zsh
# ============================================================================
# account-summary-weekly.sh — launchd entrypoint
#
# OWNER:    Rolando team (account-summary skill)
# PURPOSE:  Weekly Monday-morning refresh of the Acme Corp account summary.
#           Invokes the `account-summary-refresh` ultracode workflow headlessly
#           (.claude/workflows/account-summary-refresh.js), which runs UPDATE MODE:
#           overwrites ./accounts/${ACCOUNT_SLUG}/${ACCOUNT_SLUG}-account-summary.{html,md} with the current
#           picture and prepends a dated changelog entry to the MD.
#
# ULTRACODE: The headless prompt invokes the Workflow tool BY NAME. The
#           interactive `ultracode` keyword is not available to `claude -p`, but
#           a direct named-workflow invocation is an equally valid explicit
#           opt-in. runDate is passed in as an arg because workflow scripts
#           cannot call Date.now()/new Date(). --max-turns is raised to cover the
#           workflow dispatch plus the wait for its background completion.
#
# CADENCE:  Monday 07:00 America/Chicago, weekly.
#           Invoked by ~/Library/LaunchAgents/com.rolando.account-summary-weekly.plist
#           RunAtLoad is false in the plist — loading/reboot must NOT trigger a run.
#
# AD-HOC:   This is only the scheduled path. The summary is also updatable on
#           demand at any time by typing into a Claude Code session:
#               "Update account summary for Acme Corp"
#           (or a fresh "Create an account summary for Acme Corp"). The skill,
#           not this script, is the source of truth for behavior.
#
# TARGET:   Account = Acme Corp (slug acme-corp). To point the weekly job at a
#           different account, override ACCOUNT_NAME / ACCOUNT_SLUG below.
#
# TARGET ORG:  my-org  (read-only, SOQL only, no DML — enforced by the skill).
#
# DST GUARD:  launchd StartCalendarInterval fires in *local* time. If the Mac TZ
#            drifts off Central, the TZ=America/Chicago hour/weekday guard below
#            exits early. Mirrors com.rolando.defoe-morning-brief.
#
# USAGE:
#   ./account-summary-weekly.sh              # scheduled/headless run
#   DRY_RUN=1 ./account-summary-weekly.sh    # print the resolved prompt, no claude call
#   FORCE=1 ./account-summary-weekly.sh      # skip the Monday/07:00 CT guard (manual test)
# ============================================================================

set -u

# This script is meant to live at <your-project>/team/scripts/account-summary-weekly.sh
# (setup.sh places it there). PROJECT_DIR derives from its own location so it
# never assumes a specific machine or username — override with the env var if
# you relocate the script.
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)}"
CLAUDE_BIN="${CLAUDE_BIN:-$(command -v claude || echo "$HOME/.local/bin/claude")}"
LOG_DIR="${PROJECT_DIR}/team/logs"

ACCOUNT_NAME="${ACCOUNT_NAME:-Acme Corp}"
ACCOUNT_SLUG="${ACCOUNT_SLUG:-acme-corp}"

RUN_DATE="$(TZ=America/Chicago date +%Y-%m-%d)"
RUN_LOG="${LOG_DIR}/account-summary-weekly-${RUN_DATE}.log"

mkdir -p "${LOG_DIR}"

# --- DST / wrong-day guard --------------------------------------------------
# Only enforced on scheduled runs. FORCE=1 bypasses for manual testing.
if [[ "${FORCE:-0}" != "1" ]]; then
  CT_HOUR="$(TZ=America/Chicago date +%H)"
  CT_DOW="$(TZ=America/Chicago date +%u)"   # 1=Mon ... 7=Sun
  if [[ "${CT_DOW}" != "1" || "${CT_HOUR}" != "07" ]]; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] guard: not Monday 07:xx CT (dow=${CT_DOW} hour=${CT_HOUR}) — exiting without run. Set FORCE=1 to override." >> "${RUN_LOG}"
    exit 0
  fi
fi

# Build the headless prompt. Imperative, single-turn — `claude -p` gets one turn.
read -r -d '' PROMPT <<PROMPT_EOF || true
You are Rolando running the WEEKLY account-summary refresh in HEADLESS mode.
There is NO second turn and no one to report back to.

Do the work by invoking the ultracode workflow — this is an explicit, authorized
opt-in to multi-agent orchestration for this run. Call the Workflow tool NOW:

  Workflow({
    scriptPath: "${PROJECT_DIR}/.claude/workflows/account-summary-refresh.js",
    args: {
      account:  "${ACCOUNT_NAME}",
      slug:     "${ACCOUNT_SLUG}",
      runDate:  "${RUN_DATE}",
      projectDir: "${PROJECT_DIR}"
    }
  })

Use scriptPath, not name. The named-workflow registry is populated at session start
and is not guaranteed in a headless run; scriptPath resolves unconditionally.

runDate is passed in because workflow scripts cannot call Date.now() or new Date().
Do NOT omit it. Do NOT hand-dispatch the research subagents yourself — the script at
${PROJECT_DIR}/.claude/workflows/account-summary-refresh.js owns the fan-out, the
expert-POV use-case gate, and the Boris/Maggie gates. The skill at
${PROJECT_DIR}/.claude/skills/account-summary/SKILL.md remains the source of truth for slide
structure, MD structure, and the quality checklist; the script drives it.

RUN MODE: the script auto-detects. If
${PROJECT_DIR}/accounts/${ACCOUNT_SLUG}/${ACCOUNT_SLUG}-account-summary.html exists it runs UPDATE MODE
(delta research since the file's generated date, selective slide updates, a new
dated changelog entry prepended with all prior entries preserved). If not, it runs
a full first build.

Workflows run in the background. WAIT for the completion notification before
responding — do not report the run as done while it is still in flight, and do not
invent its results.

Non-negotiables the workflow enforces (verify them in its return value):
- Both artifacts refreshed together: ${PROJECT_DIR}/accounts/${ACCOUNT_SLUG}/${ACCOUNT_SLUG}-account-summary.html
  AND ${PROJECT_DIR}/accounts/${ACCOUNT_SLUG}/${ACCOUNT_SLUG}-account-summary.md.
- ALL FIVE source surfaces read: my-org SOQL, Slack, public web, Gmail, and Google
  Calendar + Meet transcripts. A surface that is unreachable is reported as a
  finding in both artifacts, never silently omitted.
- Expert POV fan-out gated on real use case (typically 5-8 of 14 lenses), with the
  shared account context built once and reused.
- Memory synced under ${PROJECT_DIR}/accounts/${ACCOUNT_SLUG}/.
- my-org is READ-ONLY: SELECT-only SOQL, no DML.
- Boris and Maggie gates run in parallel.

If the Workflow tool is unavailable or the run fails outright, fall back to
executing the skill's steps directly in this turn and say so in the run summary.

After the workflow returns, emit a plain-text run summary: what moved this week
(pipeline delta, stage moves, new/killed opps, new/resolved flags), the email and
meeting-transcript signal picked up, which expert POVs ran and which were omitted,
any unreachable surfaces, the Boris/Maggie verdicts (surface REWORK or KILL
explicitly — do not bury it), and confirmation of both file paths.
PROMPT_EOF

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "=== DRY RUN — resolved prompt ==="
  echo "RUN_DATE=${RUN_DATE}"
  echo "ACCOUNT_NAME=${ACCOUNT_NAME}"
  echo "ACCOUNT_SLUG=${ACCOUNT_SLUG}"
  echo "RUN_LOG=${RUN_LOG}"
  echo "--- PROMPT ---"
  echo "${PROMPT}"
  echo "--- END PROMPT ---"
  exit 0
fi

{
  echo "=== Weekly account-summary refresh launchd run ==="
  echo "Start: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "User: $(whoami)"
  echo "PWD: ${PROJECT_DIR}"
  echo "Account: ${ACCOUNT_NAME} (${ACCOUNT_SLUG})"
  echo "Claude bin: ${CLAUDE_BIN}"

  cd "${PROJECT_DIR}" || { echo "cd failed"; exit 1; }

  # Headless invocation. bypassPermissions because there is no interactive user.
  # The workflow does the heavy lifting in subagents, so the main loop needs few
  # turns — but --max-turns stays high to cover waiting out the background run
  # and any fallback-to-direct-execution path.
  "${CLAUDE_BIN}" \
    --permission-mode bypassPermissions \
    --max-turns 120 \
    -p "${PROMPT}"

  echo "End: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Exit: $?"
} >> "${RUN_LOG}" 2>&1
