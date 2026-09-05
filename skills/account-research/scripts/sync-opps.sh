#!/usr/bin/env bash
# sync-opps.sh — pull an account's opportunities from my-org (SFDC) and emit Markdown tables.
#
# Usage:
#   sync-opps.sh "<Account Name>"           # match by account name (LIKE)
#   sync-opps.sh --id <SFDC_ACCOUNT_ID>     # match by 15/18-char Account Id (exact, preferred)
#
# Output: Markdown to stdout — an "Open pipeline" table, a "Recently closed" table, and totals.
# The skill pastes this into the account's opportunities.md. SFDC remains source of truth.
#
# Requires: sf CLI authenticated to org alias "my-org", plus jq. Portable to macOS bash 3.2.

set -euo pipefail
ORG="my-org"
US=$'\x1f'   # unit separator: non-whitespace field delim so EMPTY middle fields survive `read`

usage() { echo "Usage: $0 \"<Account Name>\"  |  $0 --id <SFDC_ACCOUNT_ID>" >&2; exit 2; }
[[ $# -ge 1 ]] || usage

if [[ "${1:-}" == "--id" ]]; then
  [[ $# -eq 2 ]] || usage
  WHERE="AccountId = '$2'"; LABEL="AccountId=$2"
else
  NAME_ESC="${1//\'/\\\'}"                       # escape single quotes for SOQL
  WHERE="Account.Name LIKE '%${NAME_ESC}%'"; LABEL="Name~${1}"
fi

run_query() { sf data query --target-org "$ORG" --json --query "$1" 2>/dev/null; }

# Portable thousands-separated dollars. "" / null -> "—". Handles 0 and negatives.
fmt_amt() {
  awk -v n="${1:-}" 'BEGIN{
    if(n=="" || n=="null"){print "—"; exit}
    s=sprintf("%d",n); neg=(s ~ /^-/); if(neg)s=substr(s,2);
    r=""; while(length(s)>3){r=","substr(s,length(s)-2) r; s=substr(s,1,length(s)-3)}
    printf "%s$%s%s\n", (neg?"-":""), s, r
  }'
}

OPEN_SOQL="SELECT Name, StageName, Amount, CloseDate, Probability, NextStep, Owner.Name \
FROM Opportunity WHERE ${WHERE} AND IsClosed = false ORDER BY CloseDate ASC NULLS LAST, Amount DESC"
CLOSED_SOQL="SELECT Name, StageName, Amount, CloseDate, IsWon \
FROM Opportunity WHERE ${WHERE} AND IsClosed = true AND CloseDate = LAST_N_DAYS:365 ORDER BY CloseDate DESC LIMIT 20"

OPEN_JSON="$(run_query "$OPEN_SOQL")"
CLOSED_JSON="$(run_query "$CLOSED_SOQL")"

echo "**Matched on:** ${LABEL}"
echo ""
echo "## Open pipeline"
echo ""
echo "| Opportunity | Stage | Amount | Close date | Prob. | Next step | Owner |"
echo "|-------------|-------|-------:|-----------|------:|-----------|-------|"

OPEN_COUNT="$(echo "$OPEN_JSON" | jq -r '.result.records | length')"
OPEN_TOTAL="$(echo "$OPEN_JSON" | jq -r '[.result.records[].Amount // 0] | add // 0')"
if [[ "${OPEN_COUNT:-0}" -gt 0 ]]; then
  while IFS="$US" read -r name stage amount close prob next owner; do
    [[ -n "$prob" && "$prob" != "null" ]] && prob="${prob}%" || prob="—"
    next="$(echo "${next}" | tr '\n' ' ' | cut -c1-60)"; [[ -z "$next" ]] && next="—"
    printf '| %s | %s | %s | %s | %s | %s | %s |\n' \
      "${name:-—}" "${stage:-—}" "$(fmt_amt "$amount")" "${close:-—}" "$prob" "$next" "${owner:-—}"
  done < <(echo "$OPEN_JSON" | jq -r --arg d "$US" \
      '.result.records[] | [.Name, .StageName, (.Amount|tostring), (.CloseDate//""), (.Probability|tostring), (.NextStep//""), (.Owner.Name//"")] | join($d)')
else
  echo "| _none open_ | | | | | | |"
fi
echo ""
echo "**Open count:** ${OPEN_COUNT:-0}  ·  **Open total:** $(fmt_amt "$OPEN_TOTAL")"
echo ""
echo "## Recently closed (last 12 mo)"
echo ""
echo "| Opportunity | Stage | Amount | Close date | Won? |"
echo "|-------------|-------|-------:|-----------|------|"
CLOSED_COUNT="$(echo "$CLOSED_JSON" | jq -r '.result.records | length')"
if [[ "${CLOSED_COUNT:-0}" -gt 0 ]]; then
  while IFS="$US" read -r name stage amount close won; do
    [[ "$won" == "true" ]] && won="✅ Won" || won="❌ Lost"
    printf '| %s | %s | %s | %s | %s |\n' \
      "${name:-—}" "${stage:-—}" "$(fmt_amt "$amount")" "${close:-—}" "$won"
  done < <(echo "$CLOSED_JSON" | jq -r --arg d "$US" \
      '.result.records[] | [.Name, .StageName, (.Amount|tostring), (.CloseDate//""), (.IsWon|tostring)] | join($d)')
else
  echo "| _none in last 12 mo_ | | | | |"
fi
echo ""
echo "_Synced from my-org via SOQL. SFDC is the source of truth for live values._"
