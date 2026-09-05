#!/usr/bin/env bash
# find-account.sh — resolve an account in my-org (SFDC) by name.
# Prints candidate matches as JSON lines so the skill can pick / confirm the right Account.
#
# Usage: find-account.sh "<partial account name>"
# Output: up to 10 matches, one JSON object per line: {id,name,industry,website,type,owner,openOpps}
#
# Requires: sf CLI authenticated to org alias "my-org", plus jq.

set -euo pipefail
ORG="my-org"
[[ $# -ge 1 ]] || { echo "Usage: $0 \"<account name>\"" >&2; exit 2; }

NAME_ESC="${1//\'/\\\'}"
SOQL="SELECT Id, Name, Industry, Website, Type, Owner.Name, \
(SELECT Id FROM Opportunities WHERE IsClosed = false) \
FROM Account WHERE Name LIKE '%${NAME_ESC}%' ORDER BY Name LIMIT 10"

sf data query --target-org "$ORG" --json --query "$SOQL" 2>/dev/null \
  | jq -c '.result.records[] | {
      id: .Id,
      name: .Name,
      industry: (.Industry // ""),
      website: (.Website // ""),
      type: (.Type // ""),
      owner: (.Owner.Name // ""),
      openOpps: ((.Opportunities.records // []) | length)
    }'
