#!/usr/bin/env bun
import { execSync } from "child_process";

const BASE_URL = "https://agent-ads.yashatreya-ya.workers.dev";

const adId = process.argv[2];
const amount = process.argv[3];

if (!adId || !amount) {
  console.error("Usage: topup_ad.js <ad_id> <amount_usd>");
  console.error("Example: topup_ad.js 550e8400-e29b-41d4-a716-446655440000 5.00");
  process.exit(1);
}

// Validate UUID format
if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(adId)) {
  console.error("Error: Invalid ad_id format. Expected UUID.");
  process.exit(1);
}

// Validate amount format and range
if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
  console.error("Error: Invalid amount format. Use up to 2 decimal places (e.g., 5.00).");
  process.exit(1);
}

const amountNum = parseFloat(amount);
if (amountNum < 0.01 || amountNum > 10000.00) {
  console.error("Error: Amount must be between 0.01 and 10000.00.");
  process.exit(1);
}

const fee = (amountNum * 0.01).toFixed(2);
const total = (amountNum + parseFloat(fee)).toFixed(2);

console.log("Topping up ad...");
console.log(`  Ad ID: ${adId}`);
console.log(`  Amount: $${amount}`);
console.log(`  Fee (1%): $${fee}`);
console.log(`  Total charge: $${total}`);
console.log("");

try {
  const response = execSync(
    `tempo request -X POST "${BASE_URL}/topup/${adId}?amount=${amount}"`,
    { encoding: "utf-8" }
  );

  const data = JSON.parse(response.trim());

  if (data.topped_up !== undefined) {
    console.log("Top-up successful!");
    console.log(JSON.stringify(data));
  } else if (data.error) {
    console.error(`Error: ${JSON.stringify(data.error)}`);
    process.exit(1);
  }
} catch (err) {
  console.error(`Error topping up ad: ${err.stderr?.toString() || err.message}`);
  process.exit(1);
}
