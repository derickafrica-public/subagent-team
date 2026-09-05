#!/usr/bin/env bash
# aggregate-inbox.sh — concatenate weekly proposal files in
# team/journal/inbox/ into INDEX.md. Lexicographic order so ISO weeks
# sort naturally. Excludes _deferred.md and INDEX.md itself. Idempotent.
# Exits 0 even on empty inbox.

set -euo pipefail

# This script is meant to live at <your-project>/team/scripts/self-improvement/aggregate-inbox.sh
# (setup.sh places it there). No hardcoded machine path or username.
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
INBOX="${PROJECT_DIR}/team/journal/inbox"
INDEX="${INBOX}/INDEX.md"

mkdir -p "$INBOX"

# Collect *.md files, excluding INDEX.md and _deferred.md, lexicographic order.
# macOS /bin/bash is 3.2 — no `mapfile`. Portable: feed a sorted file list
# through a read loop. Filenames are ours; no spaces expected.
files=$(find "$INBOX" -maxdepth 1 -type f -name '*.md' \
          ! -name 'INDEX.md' ! -name '_deferred.md' \
        | LC_ALL=C sort)

{
  printf '# Inbox Index — generated %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  if [[ -z "$files" ]]; then
    printf '\n_No weekly proposal files yet._\n'
  else
    printf '\n'
    while IFS= read -r f; do
      base="$(basename "$f")"
      first_heading="$(grep -m1 '^# ' "$f" 2>/dev/null | sed 's/^# //' || true)"
      [[ -z "$first_heading" ]] && first_heading="(no heading)"
      printf -- '- %s — %s\n' "$base" "$first_heading"
    done <<< "$files"
  fi
} > "$INDEX"

exit 0
