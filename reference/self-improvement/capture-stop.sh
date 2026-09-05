#!/usr/bin/env bash
# capture-stop.sh — Phase 1 Stop hook for the weekly proposal loop.
# Reads the Claude Code Stop hook payload on stdin, scans the session
# transcript for correction phrases on the LAST user message, and appends
# one entry to team/journal/mistakes/YYYY-MM.md. Pure shell + jq. No model
# calls. No network. Budget: <100ms.

set -euo pipefail

# --- millisecond timer (start FIRST) ---------------------------------------
# macOS /bin/bash is 3.2 (no EPOCHREALTIME) and `date` has no %N.
# perl -MTime::HiRes forks ~5ms; python3 cold-start is ~20ms; pick perl first.
now_ms() {
  if command -v gdate >/dev/null 2>&1; then
    gdate +%s%3N
  elif command -v perl >/dev/null 2>&1; then
    perl -MTime::HiRes=time -e 'printf "%d\n", time()*1000'
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c 'import time; print(int(time.time()*1000))'
  else
    echo "$(date +%s)000"
  fi
}
start_ms=$(now_ms)

# --- paths -----------------------------------------------------------------
# This script is meant to live at <your-project>/team/scripts/self-improvement/capture-stop.sh
# (setup.sh places it there). No hardcoded machine path or username.
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
JOURNAL_DIR="${PROJECT_DIR}/team/journal/mistakes"
MONTH_FILE="${JOURNAL_DIR}/$(date +%Y-%m).md"
# Directory created at install time; only mkdir if missing.
[[ -d "$JOURNAL_DIR" ]] || mkdir -p "$JOURNAL_DIR"

# --- read stdin once -------------------------------------------------------
payload="$(cat || true)"
if [[ -z "$payload" ]]; then
  exit 0
fi

# Parse session_id and transcript_path. // empty makes jq emit "" instead of "null".
session_id="$(printf '%s' "$payload" | jq -r '.session_id // empty' 2>/dev/null || true)"
transcript_path="$(printf '%s' "$payload" | jq -r '.transcript_path // empty' 2>/dev/null || true)"

# Bail silently if either is missing — never crash a hook.
if [[ -z "$session_id" || -z "$transcript_path" || ! -f "$transcript_path" ]]; then
  exit 0
fi

# --- ONE jq pass: last_user, prev_assistant, tool_use_count ---------------
# Three separate passes triple the parse cost. NUL-delimit the three fields
# so newlines inside the text bodies don't break the split.
fields="$(jq -rs --arg sep $'\x1f' '
  def text_of($c):
    if ($c | type) == "string" then $c
    elif ($c | type) == "array" then
      ($c | map(select(.type == "text") | .text) | join("\n"))
    else "" end;
  ([ .[] | select(.type == "user")
      | text_of(.message.content) | select(. != null and . != "") ] | last // "")
  + $sep +
  ([ .[] | select(.type == "assistant")
      | text_of(.message.content) | select(. != null and . != "") ] | last // "")
  + $sep +
  ([ .[] | select(.type == "assistant")
      | .message.content
      | (if type == "array" then map(select(.type == "tool_use")) | length else 0 end)
   ] | add // 0 | tostring)
' "$transcript_path" 2>/dev/null || true)"

# Split on US (\x1f). Use awk-free bash slicing.
SEP=$'\x1f'
last_user_text="${fields%%${SEP}*}"
rest="${fields#*${SEP}}"
prev_assistant_text="${rest%%${SEP}*}"
tool_use_count="${rest##*${SEP}}"
[[ -z "$tool_use_count" ]] && tool_use_count=0

# --- correction-phrase regex (case-insensitive, extended) -----------------
# False positives matter more than recall — keep this tight.
CORRECTION_RE="\\b(no,?[[:space:]]+(don'?t|do not|stop)|wrong|that'?s wrong|you got (that|it) wrong|not what i asked|actually,?[[:space:]]+(no|wait)|let'?s not (do|try) (that|this) again|undo (that|this))\\b"

signal_type="stop-clean"
matched_phrase=""
if [[ -n "$last_user_text" ]]; then
  # grep -Eio prints only the matched substring; first match wins.
  matched_phrase="$(printf '%s' "$last_user_text" | grep -Eio "$CORRECTION_RE" 2>/dev/null | head -n1 || true)"
  if [[ -n "$matched_phrase" ]]; then
    signal_type="stop-with-correction"
  fi
fi

# --- build evidence (single line, no newlines, length-bounded) ------------
sanitize() {
  # Collapse newlines/tabs to spaces, squeeze whitespace, trim.
  tr '\n\t' '  ' | tr -s ' ' | sed 's/^ *//;s/ *$//'
}

if [[ "$signal_type" == "stop-with-correction" ]]; then
  prev_snippet="$(printf '%s' "$prev_assistant_text" | sanitize | cut -c1-200)"
  evidence="matched: \"${matched_phrase}\" | prior assistant: \"${prev_snippet}\""
else
  evidence="Session ended cleanly. ${tool_use_count} tool calls."
fi

# Final scrub — markdown-safe single line, hard cap.
evidence="$(printf '%s' "$evidence" | sanitize | cut -c1-500)"
category="stop-event"
timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# --- compute latency just before write ------------------------------------
end_ms=$(now_ms)
hook_latency_ms=$(( end_ms - start_ms ))

# --- append entry ---------------------------------------------------------
# A single heredoc append is one POSIX write for this payload size; mid-write
# corruption isn't realistic here. If the month file vanishes, we recreate it.
cat >> "$MONTH_FILE" <<EOF

## ${timestamp}
- category: ${category}
- session_id: ${session_id}
- signal_type: ${signal_type}
- evidence: ${evidence}
- linked_proposal: none
- hook_latency_ms: ${hook_latency_ms}
EOF

exit 0
