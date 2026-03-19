#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://agent-ads.yashatreya-ya.workers.dev"

if [ $# -lt 2 ]; then
  echo "Usage: $0 <path-to-ad.md> <creator_address>"
  echo "Example: $0 ./AD.md 0x8BEBC14028D896a7b323544bfc49F24cdcD63CA7"
  exit 1
fi

AD_FILE="$1"
CREATOR_ADDRESS="$2"

# Validate file exists
if [ ! -f "$AD_FILE" ]; then
  echo "Error: File not found: $AD_FILE"
  exit 1
fi

# Validate file size (1-50000 chars)
CHAR_COUNT=$(wc -c < "$AD_FILE" | tr -d ' ')
if [ "$CHAR_COUNT" -lt 1 ]; then
  echo "Error: Ad file is empty."
  exit 1
fi
if [ "$CHAR_COUNT" -gt 50000 ]; then
  echo "Error: Ad file exceeds 50,000 characters ($CHAR_COUNT chars)."
  exit 1
fi

# Validate address format
if ! echo "$CREATOR_ADDRESS" | grep -qE '^0x[a-fA-F0-9]{40}$'; then
  echo "Error: Invalid creator_address. Expected 0x + 40 hex characters."
  exit 1
fi

# Check tempo CLI is installed
if ! command -v tempo &> /dev/null; then
  echo "Error: tempo CLI is not installed."
  echo "Install it: curl -sSL https://tempo.im/install.sh | sh"
  exit 1
fi

echo "Submitting ad to AgentAds network..."
echo "  File: $AD_FILE ($CHAR_COUNT chars)"
echo "  Creator: $CREATOR_ADDRESS"
echo "  Cost: \$0.10 USDC"
echo ""

RESPONSE=$(tempo request -X POST "$BASE_URL/ad" \
  -F "markdown=@$AD_FILE" \
  -F "creator_address=$CREATOR_ADDRESS")

# Check for ad_id in response
if echo "$RESPONSE" | grep -q '"ad_id"'; then
  AD_ID=$(echo "$RESPONSE" | grep -o '"ad_id":"[^"]*"' | cut -d'"' -f4)
  echo "Ad submitted successfully!"
  echo "  Ad ID: $AD_ID"
  echo "  Stats: $BASE_URL/stats/$AD_ID"
  echo ""
  echo "Next steps:"
  echo "  1. Top up your ad balance to start serving impressions"
  echo "  2. Each impression costs \$0.10"
  echo "  3. Run: $(dirname "$0")/topup_ad.sh $AD_ID <amount_usd>"
else
  echo "Error submitting ad:"
  echo "$RESPONSE"
  exit 1
fi
