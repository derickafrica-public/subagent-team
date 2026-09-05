#!/usr/bin/env bash
# Scaffolds a target project directory with everything the Rolando CLAUDE.md
# template references by relative path. Run once per new machine/project,
# from anywhere, pointing at the project root you want to seed.
#
# Usage: ./setup.sh [target-project-dir]   (defaults to current directory)
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-$PWD}"

if [ ! -d "$TARGET" ]; then
  echo "Target directory does not exist: $TARGET" >&2
  exit 1
fi

echo "Seeding Rolando team scaffold into: $TARGET"

mkdir -p "$TARGET/team/skills"
mkdir -p "$TARGET/team/scripts/self-improvement"
mkdir -p "$TARGET/.claude/workflows"
mkdir -p "$TARGET/.claude/commands"
mkdir -p "$TARGET/.claude/skills"
mkdir -p "$TARGET/.claude/agents"

# CLAUDE.md — do not overwrite an existing one blindly.
if [ -f "$TARGET/CLAUDE.md" ]; then
  echo "  ! $TARGET/CLAUDE.md already exists — writing template to CLAUDE.md.subagent-team-harness instead. Diff and merge by hand."
  cp "$PLUGIN_DIR/templates/CLAUDE.md" "$TARGET/CLAUDE.md.subagent-team-harness"
else
  cp "$PLUGIN_DIR/templates/CLAUDE.md" "$TARGET/CLAUDE.md"
  echo "  + CLAUDE.md"
fi

cp "$PLUGIN_DIR/reference/ROSTER.md" "$TARGET/team/ROSTER.md"
echo "  + team/ROSTER.md"

for f in "$PLUGIN_DIR"/agents/*.md; do
  name="$(basename "$f")"
  # Strip the plugin-only frontmatter block so team/<name>.md matches the
  # original persona-doc format the CLAUDE.md routing table expects.
  awk 'BEGIN{c=0; skipblank=0} /^---$/{c++; if(c<=2){if(c==2) skipblank=1; next}} { if(skipblank){skipblank=0; if($0=="") next} if(c>=2) print }' "$f" > "$TARGET/team/$name"
done
echo "  + team/*.md (43 persona files, frontmatter stripped)"

cp "$PLUGIN_DIR/reference/self-improvement/"* "$TARGET/team/scripts/self-improvement/"
echo "  + team/scripts/self-improvement/*"

cp "$PLUGIN_DIR/workflows/"*.js "$TARGET/.claude/workflows/"
echo "  + .claude/workflows/*.js"

cp "$PLUGIN_DIR/commands/"*.md "$TARGET/.claude/commands/"
echo "  + .claude/commands/*.md"

for d in "$PLUGIN_DIR"/skills/*/; do
  name="$(basename "$d")"
  cp -R "$d" "$TARGET/.claude/skills/$name"
done
echo "  + .claude/skills/* (20 skill directories)"

cp "$PLUGIN_DIR/agents/"*.md "$TARGET/.claude/agents/"
echo "  + .claude/agents/*.md (43 files — lets you also Task() a teammate directly as a subagent, in addition to Rolando reading team/<name>.md as reference)"

cat <<'EOF'

Done. Remaining manual steps (see SETUP.md):
  1. Add team/journal/, team/logs/, team/risk/, accounts/* etc. to .gitignore
     if this target is a fresh git repo (see plugin's SETUP.md for the exact rules).
  2. Re-create launchd cadences from reference/launchd-templates/*.plist —
     fix the paths inside each plist (they hardcode the old machine's path) and
     `launchctl load` them.
  3. Re-wire the Stop hook (team/scripts/self-improvement/capture-stop.sh) in
     .claude/settings.json if you want the mistake-journal capture loop running.
  4. Re-authenticate MCP servers (Google Workspace, Slack, Salesforce CLI, etc.)
     on this machine — credentials never travel with the plugin.
EOF
