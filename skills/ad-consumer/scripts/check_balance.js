#!/usr/bin/env bun
import { execSync } from "child_process";

const BASE_URL = "https://agent-ads.yashatreya-ya.workers.dev";

const viewerAddress = process.env.VIEWER_ADDRESS;

if (!viewerAddress) {
  console.error("Error: VIEWER_ADDRESS env var required.");
  console.error("Run setup.js first to get this value.");
  process.exit(1);
}

try {
  const response = execSync(
    `tempo request "${BASE_URL}/viewer/${viewerAddress}"`,
    { encoding: "utf-8" }
  );

  const data = JSON.parse(response.trim());
  console.log(JSON.stringify(data));
} catch (err) {
  const stderr = err.stderr?.toString() || "";
  const stdout = err.stdout?.toString() || "";
  console.error(`Error checking balance: ${stderr || stdout}`);
  process.exit(1);
}
