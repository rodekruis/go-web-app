#!/usr/bin/env bash
# Lists User records deleted in EspoCRM within the last N hours, via the admin-only ActionHistoryRecord API.
set -euo pipefail

# BASE_URL='https://cea.feedbackmanagement.dev2.510.global/api/v1'
BASE_URL='https://feedback.510.global/api/v1'
ENTITY_TYPE='User'
HOURS_BACK="${HOURS_BACK:-3}"
PAGE_SIZE=200

read -rp 'EspoCRM admin username: ' USERNAME
read -rsp 'Password: ' PASSWORD; echo

# Non-admins only see their own ActionHistoryRecord entries (OnlyOwn access filter), silently.
ME=$(curl -gsS -u "${USERNAME}:${PASSWORD}" "${BASE_URL}/App/user")
echo "Authenticated as $(jq -r '.user.userName' <<<"$ME") (type: $(jq -r '.user.type' <<<"$ME"), isAdmin: $(jq -r '.user.isAdmin' <<<"$ME"))"

SINCE=$(date -u -v-"${HOURS_BACK}"H '+%Y-%m-%d %H:%M:%S')
SINCE_ENCODED=$(printf '%s' "$SINCE" | jq -sRr @uri)

echo
echo "All deletions since ${SINCE} UTC, by target type:"
curl -gsS -u "${USERNAME}:${PASSWORD}" \
  "${BASE_URL}/ActionHistoryRecord?maxSize=${PAGE_SIZE}&where[0][type]=equals&where[0][attribute]=action&where[0][value]=delete&where[1][type]=after&where[1][attribute]=createdAt&where[1][value]=${SINCE_ENCODED}" \
  | jq -r '.list[].targetType' | sort | uniq -c | sort -rn
echo

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

if [[ -n "$ROWS" ]]; then
  printf 'deletedAt\tuserId\tuserName\tdeletedBy\n%s' "$ROWS" | column -t -s $'\t'
  echo
  echo 'Deletions by actor:'
  printf '%s' "$ROWS" | cut -f4 | sort | uniq -c | sort -rn
else
  echo '(none)'
fi
