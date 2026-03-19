#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://agent-ads.yashatreya-ya.workers.dev"

if [ $# -lt 2 ]; then
  echo "Usage: $0 <ad_id> <amount_usd>"
  echo "Example: $0 550e8400-e29b-41d4-a716-446655440000 5.00"
  exit 1
fi

AD_ID="$1"
AMOUNT="$2"

# Validate UUID format
if ! echo "$AD_ID" | grep -qE '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'; then
  echo "Error: Invalid ad_id format. Expected UUID."
  exit 1
fi

# Validate amount format and range
if ! echo "$AMOUNT" | grep -qE '^[0-9]+(\.[0-9]{1,2})?$'; then
  echo "Error: Invalid amount format. Use up to 2 decimal places (e.g., 5.00)."
  exit 1
fi

# Check amount range using awk
if echo "$AMOUNT" | awk '{if ($1 < 0.01 || $1 > 10000.00) exit 0; else exit 1}'; then
  echo "Error: Amount must be between 0.01 and 10000.00."
  exit 1
fi

# Check tempo CLI is installed
if ! command -v tempo &> /dev/null; then
  echo "Error: tempo CLI is not installed."
  echo "Install it: curl -sSL https://tempo.im/install.sh | sh"
  exit 1
fi

# Calculate expected charge with 1% fee
FEE=$(echo "$AMOUNT" | awk '{printf "%.2f", $1 * 0.01}')
TOTAL=$(echo "$AMOUNT $FEE" | awk '{printf "%.2f", $1 + $2}')

echo "Topping up ad..."
echo "  Ad ID: $AD_ID"
echo "  Amount: \$$AMOUNT"
echo "  Fee (1%): \$$FEE"
echo "  Total charge: \$$TOTAL"
echo ""

RESPONSE=$(tempo request -X POST "$BASE_URL/topup/$AD_ID?amount=$AMOUNT")

if echo "$RESPONSE" | grep -q '"topped_up"'; then
  echo "Top-up successful!"
  echo "$RESPONSE"
else
  echo "Error topping up ad:"
  echo "$RESPONSE"
  exit 1
fi
