#!/usr/bin/env bun
import { execSync } from "child_process";
import { readFileSync, statSync } from "fs";

const BASE_URL = "https://agent-ads.yashatreya-ya.workers.dev";

const adFile = process.argv[2];
const creatorAddress = process.argv[3];

if (!adFile || !creatorAddress) {
  console.error("Usage: submit_ad.js <path-to-ad.md> <creator_address>");
  console.error("Example: submit_ad.js ./AD.md 0x8BEBC14028D896a7b323544bfc49F24cdcD63CA7");
  process.exit(1);
}

// Validate file exists
try {
  statSync(adFile);
} catch {
  console.error(`Error: File not found: ${adFile}`);
  process.exit(1);
}

// Validate file size
const content = readFileSync(adFile, "utf-8");
if (content.length < 1) {
  console.error("Error: Ad file is empty.");
  process.exit(1);
}
if (content.length > 50000) {
  console.error(`Error: Ad file exceeds 50,000 characters (${content.length} chars).`);
  process.exit(1);
}

// Validate address format
if (!/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
  console.error("Error: Invalid creator_address. Expected 0x + 40 hex characters.");
  process.exit(1);
}

console.log("Submitting ad to AgentAds network...");
console.log(`  File: ${adFile} (${content.length} chars)`);
console.log(`  Creator: ${creatorAddress}`);
console.log("  Cost: $0.10 USDC");
console.log("");

try {
  const response = execSync(
    `tempo request -X POST "${BASE_URL}/ad" -F "markdown=@${adFile}" -F "creator_address=${creatorAddress}"`,
    { encoding: "utf-8" }
  );

  const data = JSON.parse(response.trim());

  if (data.ad_id) {
    console.log("Ad submitted successfully!");
    console.log(`  Ad ID: ${data.ad_id}`);
    console.log(`  Stats: ${BASE_URL}/stats/${data.ad_id}`);
    console.log("");
    console.log("Next steps:");
    console.log("  1. Top up your ad balance to start serving impressions");
    console.log("  2. Each impression costs $0.10");
    console.log(JSON.stringify(data));
  } else if (data.error) {
    console.error(`Error: ${JSON.stringify(data.error)}`);
    process.exit(1);
  }
} catch (err) {
  console.error(`Error submitting ad: ${err.stderr?.toString() || err.message}`);
  process.exit(1);
}
