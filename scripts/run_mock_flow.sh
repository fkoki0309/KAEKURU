#!/usr/bin/env bash
set -euo pipefail
PORT=3001
TOKEN="DEV$(date +%s)"
echo "PORT=$PORT TOKEN=$TOKEN"

# Activate tag
RESP=$(curl -s -X POST "http://localhost:$PORT/api/tags/activate" \
  -H "Content-Type: application/json" \
  -H "x-sample-user-id: mock-user" \
  -d "{\"token\":\"$TOKEN\",\"owner_name\":\"山田太郎\",\"item_name\":\"財布\"}")

echo "--- activate response (raw) ---"
echo "$RESP"
echo "--- activate response (jq) ---"
echo "$RESP" | jq .
OWNER_ID=$(echo "$RESP" | jq -r '.owner.id // .owner_id // .id // empty')
echo "OWNER_ID=$OWNER_ID"

# Create return case
RC_RESP=$(curl -s -X POST "http://localhost:$PORT/api/return-cases" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\",\"method\":\"dropoff\",\"dropoff_location\":\"駅の交番\",\"finder_photo_url\":null,\"finder_memo\":\"交番へ届けました\"}")

echo "--- return case create (jq) ---"
echo "$RC_RESP" | jq .
RC_ID=$(echo "$RC_RESP" | jq -r '.return_case.id // .id // .return_case_id // empty')
echo "RC_ID=$RC_ID"

# Owner notifications
echo "--- owner notifications ---"
curl -s "http://localhost:$PORT/api/owners/$OWNER_ID/notifications" | jq .

# Confirm receipt
echo "--- confirm receipt ---"
curl -s -X POST "http://localhost:$PORT/api/return-cases/$RC_ID/confirm" | jq .

# Create reward
echo "--- create reward ---"
curl -s -X POST "http://localhost:$PORT/api/return-cases/$RC_ID/rewards" -H "Content-Type: application/json" -d '{"amount":1000}' | jq .

# List rewards
echo "--- list rewards ---"
curl -s "http://localhost:$PORT/api/owners/$OWNER_ID/rewards" | jq .

# Link finder
echo "--- link finder ---"
curl -s -X POST "http://localhost:$PORT/api/return-cases/$RC_ID/link-finder" -H "Content-Type: application/json" -d '{"name":"拾得者 太郎","email":"finder@example.com","phone":"090-0000-0000"}' | jq .

# Expiry: set expires_at to past if tmp/mockDb.json exists
if [ -f tmp/mockDb.json ]; then
  echo "--- set expires_at to past for RC in tmp/mockDb.json ---"
  jq --arg rc "$RC_ID" '(.returnCases[] | select(.id==$rc) ).expires_at = "2000-01-01T00:00:00Z"' tmp/mockDb.json > tmp/mockDb.json.tmp && mv tmp/mockDb.json.tmp tmp/mockDb.json || true
  echo "--- run expiry alerts ---"
  curl -s -X POST "http://localhost:$PORT/api/tasks/expiry-alerts/run" | jq .
  echo "--- owner notifications after alerts ---"
  curl -s "http://localhost:$PORT/api/owners/$OWNER_ID/notifications" | jq .
else
  echo "tmp/mockDb.json not found; skipping expiry alert"
fi

# Debug return case
echo "--- return case debug ---"
curl -s "http://localhost:$PORT/api/debug/mock-state" | jq '.returnCases[] | select(.id=="'$RC_ID'")'
