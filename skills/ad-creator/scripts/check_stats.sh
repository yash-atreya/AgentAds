#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://agent-ads.yashatreya-ya.workers.dev"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <ad_id>"
  echo "Example: $0 550e8400-e29b-41d4-a716-446655440000"
  exit 1
fi

AD_ID="$1"

# Validate UUID format
if ! echo "$AD_ID" | grep -qE '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'; then
  echo "Error: Invalid ad_id format. Expected UUID."
  exit 1
fi

RESPONSE=$(curl -s "$BASE_URL/stats/$AD_ID")

# Check for error
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "Error: $RESPONSE"
  exit 1
fi

echo "$RESPONSE"
