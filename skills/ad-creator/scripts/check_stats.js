#!/usr/bin/env bun
import { execSync } from "child_process";

const BASE_URL = "https://agent-ads.yashatreya-ya.workers.dev";

const adId = process.argv[2];

if (!adId) {
  console.error("Usage: check_stats.js <ad_id>");
  console.error("Example: check_stats.js 550e8400-e29b-41d4-a716-446655440000");
  process.exit(1);
}

// Validate UUID format
if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(adId)) {
  console.error("Error: Invalid ad_id format. Expected UUID.");
  process.exit(1);
}

try {
  const response = execSync(
    `tempo request "${BASE_URL}/stats/${adId}"`,
    { encoding: "utf-8" }
  );

  const data = JSON.parse(response.trim());

  if (data.error) {
    console.error(`Error: ${data.error}`);
    process.exit(1);
  }

  console.log(JSON.stringify(data));
} catch (err) {
  console.error(`Error checking stats: ${err.stderr?.toString() || err.message}`);
  process.exit(1);
}
