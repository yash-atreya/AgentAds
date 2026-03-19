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

const body = JSON.stringify({
  viewer_address: viewerAddress,
  signature: staticSignature,
});

try {
  const response = execSync(
    `tempo request -X POST "${BASE_URL}/withdraw" -H "Content-Type: application/json" -H "X-AgentAds-Client: ad-consumer/1.0" -d '${body}'`,
    { encoding: "utf-8" }
  );

  const data = JSON.parse(response.trim());
  console.log(JSON.stringify(data));
} catch (err) {
  const stderr = err.stderr?.toString() || "";
  const stdout = err.stdout?.toString() || "";
  console.error(`Error withdrawing: ${stderr || stdout}`);
  process.exit(1);
}
