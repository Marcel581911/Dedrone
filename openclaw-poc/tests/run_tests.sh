#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-localhost}"
PORT="${2:-8000}"
BASE="http://$HOST:$PORT"

echo "ZEUS-POC Test Suite"
echo "Target: $BASE"
echo "---"

# Wait for service to become available (up to 30s)
echo -n "Waiting for service..."
for i in $(seq 1 30); do
  if curl -sf "$BASE/health" >/dev/null 2>&1; then
    echo " ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo " TIMEOUT - service not responding."
    exit 1
  fi
  sleep 1
  echo -n "."
done

PASS=0
FAIL=0

run_test() {
  local name="$1"
  local result="$2"
  if [ "$result" -eq 0 ]; then
    echo "  PASS  $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $name"
    FAIL=$((FAIL + 1))
  fi
}

# Test 1: Health endpoint
RESP=$(curl -sf "$BASE/health")
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='ok'" 2>/dev/null
run_test "GET /health" $?

# Test 2: Agent info
RESP=$(curl -sf "$BASE/api/v1/agent")
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'name' in d and d['status']=='ready'" 2>/dev/null
run_test "GET /api/v1/agent" $?

# Test 3: Chat endpoint (may fail if no valid API key, but should return 200)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"sender":"test","text":"hello"}')
[ "$HTTP_CODE" -eq 200 ]
run_test "POST /api/v1/chat (status 200)" $?

# Test 4: Chat response has reply field
RESP=$(curl -sf -X POST "$BASE/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"sender":"test","text":"say hi"}')
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'reply' in d" 2>/dev/null
run_test "POST /api/v1/chat (reply field present)" $?

# Test 5: Frontend served
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
[ "$HTTP_CODE" -eq 200 ]
run_test "GET / (frontend)" $?

echo "---"
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
