# File structure & memory model

How account memory is stored, and the rules for creating/updating it. Storage is **Markdown** under
`accounts/` — readable, editable, Obsidian-friendly (YAML frontmatter + `[[wikilinks]]` + tags).

## Layout
```
accounts/
├── _index.md                 # master list of accounts (one row each) — keep in sync
├── README.md                 # human-facing explainer (why .md, how it works)
├── _templates/               # blank templates; copy these for each new account
│   ├── profile.md  memory-log.md  opportunities.md
│   ├── swot.md     signals.md     drive-log.md  research-note.md
└── <slug>/                   # one folder per account
    ├── profile.md            # current-state truth: who they are, people, our footprint
    ├── memory-log.md         # reverse-chron journal (long-term memory) — NEWEST ON TOP
    ├── opportunities.md      # pipeline snapshot synced from my-org
    ├── swot.md               # SWOT + strategic analysis, bets, 30/60/90
    ├── signals.md            # triaged developments: 🔴 attention / 🟡 watch / ⚪ noise
    ├── drive-log.md          # Drive folder manifest + new/changed-doc detection state
    └── research/             # dated deep-dive notes & brainstorms
        └── YYYY-MM-DD-topic.md
```

## The six core files — purpose & update mode

| File | Holds | Update mode |
|------|-------|-------------|
| `profile.md` | Identity, key people (their side + ours), priorities, footprint, links | **In place** as facts change; bump `updated:` |
| `memory-log.md` | Dated journal of every session (research/brainstorm/decision/meeting/analysis/update) | **Append**, newest on top |
| `opportunities.md` | Open pipeline + recently closed from my-org, + your read | **Replace tables** on sync; bump `last_synced:` |
| `swot.md` | BLUF, SWOT, "where I'd place bets", 30/60/90 plays, sources | **Rewrite** the analysis on refresh; bump `updated:` |
| `signals.md` | External/internal developments triaged by importance + scan history | **Append** scans; move items between 🔴/🟡/⚪ |
| `drive-log.md` | Manifest of the account's Drive folder + detection state | **Replace manifest** on sync; bump `last_synced:` |

Deep dives go in `research/` as `YYYY-MM-DD-topic.md` (from `research-note.md`) so core files stay lean.

## Placeholder fill rules (setup)
Templates use `{{TOKENS}}`. When copying `_templates/*` into `<slug>/`, replace:

| Token | Value |
|-------|-------|
| `{{ACCOUNT_NAME}}` | Display name, e.g. `Coupe Health LLC` |
| `{{SLUG}}` | lowercase, hyphenated, no punctuation: `coupe-health` |
| `{{SFDC_ACCOUNT_ID}}` | Confirmed 15/18-char Account Id (blank if not in my-org) |
| `{{WEBSITE}}` `{{INDUSTRY}}` `{{OWNER}}` | From `find-account.sh` / user |
| `{{DATE}}` | Today (from context), `YYYY-MM-DD` |
| `{{DRIVE_FOLDER}}` `{{DRIVE_FOLDER_ID}}` | The account's dedicated Drive folder URL + ID |
| `{{SLACK_CHANNEL}}` | Primary channel name/link, or blank |
| `{{ONE_LINER}}` | One sentence: who they are + why they matter |
| `{{TITLE}}` | (research notes only) the note's title |

Leave a token's line blank rather than writing `{{TOKEN}}` if there's genuinely no value yet.

## Slug rules
- Lowercase, spaces→hyphens, strip `LLC/Inc/Corp` and punctuation: `Coupe Health LLC` → `coupe-health`.
- Must be unique under `accounts/`. If taken by a *different* entity, add a qualifier: `acme-uk`.
- The slug is the folder name and the wikilink prefix (`[[coupe-health/profile]]`).

## `_index.md` row format
```
| [[<slug>/profile|<Account Name>]] | <slug> | <status> | <tier> | <YYYY-MM-DD last worked> | <$ open> | [[<slug>/]] |
```
Update the row's "last worked" and "open pipeline" whenever you touch the account.

## Memory-log entry format (append to top)
```markdown
## YYYY-MM-DD — <short title> · <type>
**Context:** why we worked on it / what was asked.
**What we did:** sources touched, files updated.
**Findings / decisions:** the substance — with your analysis, not just facts.
**Open threads:**
- [ ] follow-ups
**Sources:** SFDC / Slack #chan / Drive:<doc> / URL / internal wiki.
```

## Re-entry protocol (existing account)
Read `profile.md` → top of `memory-log.md` → the file relevant to the ask. Recap current state in
1–3 lines before doing new work, so the user sees you've "remembered."
