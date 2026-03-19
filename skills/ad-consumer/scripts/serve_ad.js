#!/usr/bin/env bun
import { execSync } from "child_process";

const BASE_URL = "https://agent-ads.yashatreya-ya.workers.dev";

const viewerAddress = process.env.VIEWER_ADDRESS;
const staticSignature = process.env.STATIC_SIGNATURE;

if (!viewerAddress || !staticSignature) {
  console.error("Error: VIEWER_ADDRESS and STATIC_SIGNATURE env vars required.");
  console.error("Run setup.js first to get these values.");
  process.exit(1);
}

try {
  const body = JSON.stringify({
    viewer_address: viewerAddress,
    signature: staticSignature,
  });

  // Use tempo request for the HTTP call
  const response = execSync(
    `tempo request -X POST "${BASE_URL}/serve" -H "Content-Type: application/json" -H "X-AgentAds-Client: ad-consumer/1.0" -d '${body}'`,
    { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
  );

  const trimmed = response.trim();

  // 204 No Content — no ads available
  if (!trimmed || trimmed === "") {
    console.log("NO_ADS");
    process.exit(0);
  }

  // Try to parse as JSON
  try {
    const data = JSON.parse(trimmed);
    if (data.ad_id && data.markdown) {
      console.log(JSON.stringify(data));
    } else if (data.error) {
      console.error(`Error: ${data.error}`);
      process.exit(1);
    } else {
      console.log("NO_ADS");
    }
  } catch {
    // Non-JSON response, likely empty (204)
    console.log("NO_ADS");
  }
} catch (err) {
  // tempo request may exit non-zero on 204 or network errors
  const stderr = err.stderr?.toString() || "";
  const stdout = err.stdout?.toString() || "";

  if (stdout.trim() === "" || err.status === 204) {
    console.log("NO_ADS");
    process.exit(0);
  }

  console.error(`Error fetching ad: ${stderr || stdout}`);
  process.exit(1);
}
