#!/usr/bin/env bash
# Lists Feedback Data records deleted in EspoCRM within the last N hours, then restores them after confirmation.
# Uses the admin-only ActionHistoryRecord API and POST {EntityType}/action/restoreDeleted.
set -euo pipefail

#BASE_URL='https://cea.feedbackmanagement.dev2.510.global/api/v1'
BASE_URL='https://feedback.510.global/api/v1'
ENTITY_TYPE='CFeedbackData'
HOURS_BACK="${HOURS_BACK:-4}"
PAGE_SIZE=100

read -rp 'EspoCRM admin username: ' USERNAME
read -rsp 'Password: ' PASSWORD; echo

SINCE=$(date -u -v-"${HOURS_BACK}"H '+%Y-%m-%d %H:%M:%S')
SINCE_ENCODED=$(printf '%s' "$SINCE" | jq -sRr @uri)

OFFSET=0
TOTAL=0
FETCHED=0
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

  # EspoCRM returns total=-1 (has more) / -2 (no more) when it skips the count, so rely on page length.
  TOTAL=$(jq -r '.total' <<<"$RESPONSE")
  PAGE_COUNT=$(jq -r '.list | length' <<<"$RESPONSE")
  PAGE_ROWS=$(jq -r '.list[] | "\(.createdAt)\t\(.targetId)\t\(.targetName // "-")\t\(.userName // "-")"' <<<"$RESPONSE")
  [[ -n "$PAGE_ROWS" ]] && ROWS+="${PAGE_ROWS}"$'\n'
  FETCHED=$((FETCHED + PAGE_COUNT))
  if [[ $PAGE_COUNT -gt 0 ]]; then
    jq -r --arg off "$OFFSET" '
      "page @\($off): \(.list | length) records, \(.list[-1].createdAt) .. \(.list[0].createdAt), by: "
      + (.list | group_by(.userName) | map("\(.[0].userName // "-")=\(length)") | join(", "))' <<<"$RESPONSE"
  fi

  OFFSET=$((OFFSET + PAGE_SIZE))
  [[ $PAGE_COUNT -lt $PAGE_SIZE ]] && break
  [[ $TOTAL -ge 0 && $OFFSET -ge $TOTAL ]] && break
done

echo "Deleted ${ENTITY_TYPE} records since ${SINCE} UTC: ${FETCHED}"
echo

if [[ -z "$ROWS" ]]; then
  echo '(none)'
  exit 0
fi

echo 'Deletions:'
printf '%s' "$ROWS" | cut -f4 | sort | uniq -c | sort -rn
echo

# A record may appear more than once if deleted/restored repeatedly.
RECORD_IDS=$(printf '%s' "$ROWS" | cut -f2 | sort -u)

RECORD_COUNT=$(wc -l <<<"$RECORD_IDS" | tr -d ' ')

read -rp "Restore these ${RECORD_COUNT} record(s)? [y/N] " CONFIRM
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { echo 'Aborted.'; exit 0; }

RESTORED=0
FAILED=0

while IFS= read -r RECORD_ID; do
  [[ -z "$RECORD_ID" ]] && continue

  RESPONSE=$(curl -gsS -w '\n%{http_code}' -u "${USERNAME}:${PASSWORD}" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d "{\"id\":\"${RECORD_ID}\"}" \
    "${BASE_URL}/${ENTITY_TYPE}/action/restoreDeleted")
  HTTP_CODE=$(tail -n1 <<<"$RESPONSE")
  RESPONSE=$(sed '$d' <<<"$RESPONSE")

  if [[ "$HTTP_CODE" == "200" ]]; then
    echo "restored  ${RECORD_ID}"
    RESTORED=$((RESTORED + 1))
  else
    echo "FAILED    ${RECORD_ID} (HTTP ${HTTP_CODE}) ${RESPONSE}" >&2
    FAILED=$((FAILED + 1))
  fi
done <<<"$RECORD_IDS"

echo
echo "Restored: ${RESTORED}, failed: ${FAILED}"
[[ $FAILED -eq 0 ]]