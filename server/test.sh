#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://agent-ads.yashatreya-ya.workers.dev}"
PASS=0
FAIL=0
AD_ID=""

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

assert_status() {
  local test_name="$1" expected="$2" actual="$3"
  if [ "$actual" -eq "$expected" ]; then
    green "  PASS: $test_name (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $test_name (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local test_name="$1" body="$2" expected="$3"
  if echo "$body" | grep -q "$expected"; then
    green "  PASS: $test_name"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $test_name — expected body to contain '$expected'"
    red "        got: $body"
    FAIL=$((FAIL + 1))
  fi
}

# ============================================================
bold "=== AgentAds API Test Suite ==="
bold "Base URL: $BASE_URL"
echo ""

# ----------------------------------------------------------
bold "1. GET /health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
assert_status "Health returns 200" 200 "$STATUS"

BODY=$(curl -s "$BASE_URL/health")
assert_contains "Health body has status ok" "$BODY" '"status":"ok"'

# ----------------------------------------------------------
bold ""
bold "2. POST /ad (paid - \$0.10)"

# 2a. Without payment returns 402
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/ad" \
  -F "markdown=# Test Ad" \
  -F "creator_address=0x31CC1DD293D4E8F950A2FcD286a128aB6583C490")
assert_status "POST /ad without payment returns 402" 402 "$STATUS"

# 2b. With payment via tempo request returns 201
TMP_HEADERS=$(mktemp)
BODY=$(tempo request -s -D "$TMP_HEADERS" -X POST "$BASE_URL/ad" \
  -F "markdown=# Test Ad from AgentAds Test Suite" \
  -F "creator_address=0x31CC1DD293D4E8F950A2FcD286a128aB6583C490" 2>/dev/null)
STATUS=$(grep -m1 "^HTTP" "$TMP_HEADERS" | awk '{print $2}' | tr -d '\r')
rm -f "$TMP_HEADERS"
assert_status "POST /ad with payment returns 201" 201 "$STATUS"
assert_contains "POST /ad returns ad_id" "$BODY" '"ad_id"'

# Extract ad_id for subsequent tests (handles both compact and pretty-printed JSON)
AD_ID=$(echo "$BODY" | tr -d ' \n' | sed -n 's/.*"ad_id":"\([^"]*\)".*/\1/p')
if [ -n "$AD_ID" ]; then
  green "  Extracted ad_id: $AD_ID"
else
  red "  ERROR: Could not extract ad_id from response"
  FAIL=$((FAIL + 1))
fi

# 2c. No body still hits 402 first (payment before validation)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/ad")
assert_status "POST /ad with no body returns 402 (payment first)" 402 "$STATUS"

# ----------------------------------------------------------
bold ""
bold "3. GET /ad/:id"

if [ -n "$AD_ID" ]; then
  # 3a. Existing ad returns 200 with markdown
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ad/$AD_ID")
  assert_status "GET /ad/:id returns 200" 200 "$STATUS"

  BODY=$(curl -s "$BASE_URL/ad/$AD_ID")
  assert_contains "GET /ad/:id returns markdown content" "$BODY" "Test Ad from AgentAds Test Suite"

  # Check content type
  CT=$(curl -s -I "$BASE_URL/ad/$AD_ID" | grep -i "content-type:" | tr -d '\r')
  if echo "$CT" | grep -qi "text/markdown"; then
    green "  PASS: Content-Type is text/markdown"
    PASS=$((PASS + 1))
  else
    red "  FAIL: Expected Content-Type text/markdown, got: $CT"
    FAIL=$((FAIL + 1))
  fi
else
  red "  SKIP: No ad_id available (POST /ad failed)"
fi

# 3b. Non-existent ad returns 404
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ad/nonexistent")
assert_status "GET /ad/nonexistent returns 404" 404 "$STATUS"

BODY=$(curl -s "$BASE_URL/ad/nonexistent")
assert_contains "GET /ad/nonexistent error message" "$BODY" '"Ad not found"'

# ----------------------------------------------------------
bold ""
bold "4. GET /stats/:id"

if [ -n "$AD_ID" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/stats/$AD_ID")
  assert_status "GET /stats/:id returns 200" 200 "$STATUS"

  BODY=$(curl -s "$BASE_URL/stats/$AD_ID")
  assert_contains "Stats has ad_id" "$BODY" '"ad_id"'
  assert_contains "Stats has balance" "$BODY" '"balance"'
  assert_contains "Stats has impressions" "$BODY" '"impressions"'
  assert_contains "Stats has amount_spent" "$BODY" '"amount_spent"'

  # New ad should have 0 balance and 0 impressions
  assert_contains "New ad balance is 0" "$BODY" '"balance":0'
  assert_contains "New ad impressions is 0" "$BODY" '"impressions":0'
  assert_contains "New ad amount_spent is 0" "$BODY" '"amount_spent":0'
else
  red "  SKIP: No ad_id available"
fi

# 4b. Non-existent ad returns 404
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/stats/nonexistent")
assert_status "GET /stats/nonexistent returns 404" 404 "$STATUS"

# ----------------------------------------------------------
bold ""
bold "5. POST /topup/:id (paid - variable amount)"

if [ -n "$AD_ID" ]; then
  # 5a. Missing amount returns 400
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/topup/$AD_ID")
  assert_status "POST /topup without amount returns 400" 400 "$STATUS"

  BODY=$(curl -s -X POST "$BASE_URL/topup/$AD_ID")
  assert_contains "Missing amount error message" "$BODY" '"Missing required query parameter: amount"'

  # 5b. Non-existent ad returns 404
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/topup/nonexistent?amount=1.00")
  assert_status "POST /topup/nonexistent returns 404" 404 "$STATUS"

  # 5c. Without payment returns 402
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/topup/$AD_ID?amount=0.50")
  assert_status "POST /topup without payment returns 402" 402 "$STATUS"

  # 5d. With payment via tempo request returns 200
  TMP_HEADERS=$(mktemp)
  BODY=$(tempo request -s -D "$TMP_HEADERS" -X POST "$BASE_URL/topup/$AD_ID?amount=0.50" 2>/dev/null)
  STATUS=$(grep -m1 "^HTTP" "$TMP_HEADERS" | awk '{print $2}' | tr -d '\r')
  rm -f "$TMP_HEADERS"
  assert_status "POST /topup with payment returns 200" 200 "$STATUS"
  assert_contains "Topup returns ad_id" "$BODY" '"ad_id"'
  assert_contains "Topup returns topped_up" "$BODY" '"topped_up"'
  assert_contains "Topup returns balance" "$BODY" '"balance"'

  # 5e. Verify stats updated after topup
  BODY=$(curl -s "$BASE_URL/stats/$AD_ID")
  assert_contains "Balance updated after topup" "$BODY" '"balance":0.5'
else
  red "  SKIP: No ad_id available"
fi

# ----------------------------------------------------------
bold ""
bold "6. POST /serve (agent-gated ad serving)"

# 6a. Missing X-AgentAds-Client header returns 403
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/serve" \
  -H "Content-Type: application/json" \
  -d '{"viewer_address":"0x1234567890abcdef1234567890abcdef12345678","signature":"0xabc"}')
assert_status "POST /serve without client header returns 403" 403 "$STATUS"

# 6b. Invalid body returns 400
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/serve" \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: test/1.0" \
  -d '{"bad":"body"}')
assert_status "POST /serve with invalid body returns 400" 400 "$STATUS"

# 6c. Invalid signature returns 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/serve" \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: test/1.0" \
  -d '{"viewer_address":"0x1234567890abcdef1234567890abcdef12345678","signature":"0xdeadbeef"}')
assert_status "POST /serve with bad signature returns 401" 401 "$STATUS"

# NOTE: Testing with valid signatures requires a known private key.
# For full integration testing, set VIEWER_ADDRESS and VIEWER_SIGNATURE env vars.
if [ -n "${VIEWER_ADDRESS:-}" ] && [ -n "${VIEWER_SIGNATURE:-}" ]; then
  # 6d. Valid request with funded ad returns 200
  BODY=$(curl -s -X POST "$BASE_URL/serve" \
    -H "Content-Type: application/json" \
    -H "X-AgentAds-Client: test/1.0" \
    -d "{\"viewer_address\":\"$VIEWER_ADDRESS\",\"signature\":\"$VIEWER_SIGNATURE\"}")
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/serve" \
    -H "Content-Type: application/json" \
    -H "X-AgentAds-Client: test/1.0" \
    -d "{\"viewer_address\":\"$VIEWER_ADDRESS\",\"signature\":\"$VIEWER_SIGNATURE\"}")

  if [ "$STATUS" -eq 200 ]; then
    assert_status "POST /serve with valid sig returns 200" 200 "$STATUS"
    assert_contains "Serve response has ad_id" "$BODY" '"ad_id"'
    assert_contains "Serve response has markdown" "$BODY" '"markdown"'
    assert_contains "Serve response has content_hash" "$BODY" '"content_hash"'
  elif [ "$STATUS" -eq 204 ]; then
    green "  INFO: POST /serve returned 204 (no funded ads available)"
  else
    assert_status "POST /serve with valid sig returns 200 or 204" 200 "$STATUS"
  fi
else
  bold "  SKIP: Set VIEWER_ADDRESS and VIEWER_SIGNATURE env vars for full /serve tests"
fi

# ----------------------------------------------------------
bold ""
bold "6b. POST /viewed (confirm ad view)"

# 6b-a. Missing header returns 403
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/viewed" \
  -H "Content-Type: application/json" \
  -d '{"viewer_address":"0x1234567890abcdef1234567890abcdef12345678","signature":"0xabc","content_hash":"d41d8cd98f00b204e9800998ecf8427e","ad_id":"00000000-0000-0000-0000-000000000000"}')
assert_status "POST /viewed without client header returns 403" 403 "$STATUS"

# 6b-b. Invalid body returns 400
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/viewed" \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: test/1.0" \
  -d '{"bad":"body"}')
assert_status "POST /viewed with invalid body returns 400" 400 "$STATUS"

# 6b-c. Invalid signature returns 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/viewed" \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: test/1.0" \
  -d '{"viewer_address":"0x1234567890abcdef1234567890abcdef12345678","signature":"0xdeadbeef","content_hash":"d41d8cd98f00b204e9800998ecf8427e","ad_id":"00000000-0000-0000-0000-000000000000"}')
assert_status "POST /viewed with bad signature returns 401" 401 "$STATUS"

# NOTE: Full /viewed integration test requires signing content_hash:address.
# This needs VIEWER_VIEWED_SIGNATURE env var (per-view signature).
bold "  SKIP: Full /viewed test requires per-view signature (manual testing)"

# ----------------------------------------------------------
bold ""
bold "7. GET /viewer/:address"

# 7a. Unknown address returns 200 with zeros
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/viewer/0x0000000000000000000000000000000000000000")
assert_status "GET /viewer unknown address returns 200" 200 "$STATUS"

BODY=$(curl -s "$BASE_URL/viewer/0x0000000000000000000000000000000000000000")
assert_contains "Viewer has balance" "$BODY" '"balance"'
assert_contains "Viewer has total_earned" "$BODY" '"total_earned"'
assert_contains "Viewer has total_withdrawn" "$BODY" '"total_withdrawn"'
assert_contains "Viewer has impression_count" "$BODY" '"impression_count"'
assert_contains "Unknown viewer balance is 0" "$BODY" '"balance":0'

# 7b. If we have a known viewer, check their stats
if [ -n "${VIEWER_ADDRESS:-}" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/viewer/$VIEWER_ADDRESS")
  assert_status "GET /viewer known address returns 200" 200 "$STATUS"
fi

# ----------------------------------------------------------
bold ""
bold "8. POST /withdraw (agent-gated withdrawal)"

# 8a. Missing header returns 403
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/withdraw" \
  -H "Content-Type: application/json" \
  -d '{"viewer_address":"0x1234567890abcdef1234567890abcdef12345678","signature":"0xabc"}')
assert_status "POST /withdraw without client header returns 403" 403 "$STATUS"

# 8b. Invalid body returns 400
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/withdraw" \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: test/1.0" \
  -d '{"bad":"body"}')
assert_status "POST /withdraw with invalid body returns 400" 400 "$STATUS"

# 8c. Invalid signature returns 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/withdraw" \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: test/1.0" \
  -d '{"viewer_address":"0x1234567890abcdef1234567890abcdef12345678","signature":"0xdeadbeef"}')
assert_status "POST /withdraw with bad signature returns 401" 401 "$STATUS"

# NOTE: Full withdraw testing requires a funded viewer + on-chain transaction.
# This is best done manually or with a dedicated test wallet.
if [ -n "${VIEWER_ADDRESS:-}" ] && [ -n "${VIEWER_SIGNATURE:-}" ]; then
  bold "  INFO: Withdraw with real funds requires manual testing"
fi

# ----------------------------------------------------------
bold ""
bold "=== Results ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  red "SOME TESTS FAILED"
  exit 1
else
  green "ALL TESTS PASSED"
  exit 0
fi
