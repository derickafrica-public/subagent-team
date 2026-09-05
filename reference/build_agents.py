#!/usr/bin/env python3
"""One-time conversion: team/<name>.md persona files -> plugin agents/<name>.md.

HISTORICAL / DESIGN REFERENCE ONLY — not functional in this standalone package.
This was the build tool used inside the original monorepo (where it lived at
`plugin/<name>/scripts/build_agents.py`, three directories under the repo root,
next to a `team/*.md` source-of-truth directory) to regenerate `agents/*.md`
from upstream persona files whenever they changed. Neither `team/*.md` nor that
directory depth exists in this portable package, so REPO_ROOT below resolves to
the wrong place and this script will not run correctly as shipped. Kept here,
same as `reference/playbooks/`, so the original build process isn't lost — if
you want to regenerate agents from your own persona source, treat this as a
starting point to adapt, not a script to run as-is.
"""
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
TEAM_DIR = REPO_ROOT / "team"
OUT_DIR = REPO_ROOT / "plugin" / "subagent-team-harness" / "agents"

# Non-persona files that live alongside personas in team/ but aren't team members.
SKIP = {"ROSTER.md", "runbook.md"}

def first_sentence(text):
    text = re.sub(r"\s+", " ", text).strip()
    m = re.search(r"(.+?[.!?])(\s|$)", text)
    return (m.group(1) if m else text)[:300]

def build_description(name, title_line, body):
    core_fn = re.search(r"##\s*Core Function\s*\n+(.+?)(?:\n##|\Z)", body, re.S)
    persona = re.search(r"##\s*Persona\s*\n+(.+?)(?:\n##|\Z)", body, re.S)
    lead = title_line.lstrip("# ").strip()
    detail = ""
    if core_fn:
        detail = first_sentence(core_fn.group(1))
    elif persona:
        detail = first_sentence(persona.group(1))
    desc = f"{lead}. {detail}".strip()
    return desc.replace('"', "'")

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    for path in sorted(TEAM_DIR.glob("*.md")):
        if path.name in SKIP:
            continue
        text = path.read_text()
        lines = text.splitlines()
        title_line = next((l for l in lines if l.strip().startswith("# ")), f"# {path.stem.title()}")
        slug = path.stem.lower()
        description = build_description(slug, title_line, text)
        frontmatter = (
            "---\n"
            f"name: {slug}\n"
            f"description: {description}\n"
            "---\n\n"
        )
        out_path = OUT_DIR / path.name
        out_path.write_text(frontmatter + text)
        count += 1
    print(f"Wrote {count} agent files to {OUT_DIR}")

if __name__ == "__main__":
    main()
