#!/usr/bin/env bash
# Lists Feedback Data records deleted in EspoCRM within the last N hours, via the admin-only ActionHistoryRecord API.
set -euo pipefail

#BASE_URL='https://cea.feedbackmanagement.dev2.510.global/api/v1'
BASE_URL='https://feedback.510.global/api/v1'
ENTITY_TYPE='CFeedbackData'
HOURS_BACK="${HOURS_BACK:-3}"
PAGE_SIZE=200

read -rp 'EspoCRM admin username: ' USERNAME
read -rsp 'Password: ' PASSWORD; echo

SINCE=$(date -u -v-"${HOURS_BACK}"H '+%Y-%m-%d %H:%M:%S')
SINCE_ENCODED=$(printf '%s' "$SINCE" | jq -sRr @uri)

OFFSET=0
TOTAL=0
ROWS=''

while :; do
  QUERY="maxSize=${PAGE_SIZE}&offset=${OFFSET}&orderBy=createdAt&order=desc"
  QUERY+="&where[0][type]=equals&where[0][attribute]=action&where[0][value]=delete"
  QUERY+="&where[1][type]=equals&where[1][attribute]=targetType&where[1][value]=${ENTITY_TYPE}"
  QUERY+="&where[2][type]=after&where[2][attribute]=createdAt&where[2][value]=${SINCE_ENCODED}"

  RESPONSE=$(curl -gsS -w '\n%{http_code}' -u "${USERNAME}:${PASSWORD}" \
    -H 'Content-Type: application/json' \
    "${BASE_URL}/ActionHistoryRecord?${QUERY}")
  HTTP_CODE=$(tail -n1 <<<"$RESPONSE")
  RESPONSE=$(sed '$d' <<<"$RESPONSE")

  if [[ "$HTTP_CODE" != "200" ]]; then
    echo "Request failed (HTTP ${HTTP_CODE}). 401 = bad credentials, 403 = user is not an admin." >&2
    echo "$RESPONSE" >&2
    exit 1
  fi

  TOTAL=$(jq -r '.total' <<<"$RESPONSE")
  PAGE_ROWS=$(jq -r '.list[] | "\(.createdAt)\t\(.targetId)\t\(.targetName // "-")\t\(.userName // "-")"' <<<"$RESPONSE")
  [[ -n "$PAGE_ROWS" ]] && ROWS+="${PAGE_ROWS}"$'\n'

  OFFSET=$((OFFSET + PAGE_SIZE))
  [[ $OFFSET -ge $TOTAL ]] && break
done

echo "Deleted ${ENTITY_TYPE} records since ${SINCE} UTC: ${TOTAL}"
echo

if [[ -z "$ROWS" ]]; then
  echo '(none)'
  exit 0
fi

printf 'deletedAt\trecordId\trecordName\tdeletedBy\n%s' "$ROWS" | column -t -s $'\t'