#!/usr/bin/env bun
import { createHash } from "crypto";
import { privateKeyToAccount } from "viem/accounts";
import { execSync } from "child_process";
import { readFileSync } from "fs";

const BASE_URL = "https://agent-ads.yashatreya-ya.workers.dev";

// Args: <path-to-markdown-file>
const markdownPath = process.argv[2];
if (!markdownPath) {
  console.error("Usage: confirm_view.js <path-to-markdown-file>");
  console.error("Env vars required: AD_ID, VIEWER_ADDRESS");
  process.exit(1);
}

const adId = process.env.AD_ID;
const viewerAddress = process.env.VIEWER_ADDRESS;

if (!adId || !viewerAddress) {
  console.error("Error: AD_ID and VIEWER_ADDRESS env vars required.");
  process.exit(1);
}

// Read spending key from tempo wallet
let privateKey;
try {
  const output = execSync("tempo wallet whoami -j", { encoding: "utf-8" });
  const walletInfo = JSON.parse(output);
  privateKey = walletInfo.key.key;
} catch {
  console.error("Error: Could not read spending key from tempo wallet.");
  process.exit(1);
}

// Read markdown and compute MD5
const markdown = readFileSync(markdownPath, "utf-8");
const contentHash = createHash("md5").update(markdown).digest("hex");

// Sign per-view message: "{content_hash}:{viewer_address}"
const account = privateKeyToAccount(privateKey);
const message = `${contentHash}:${viewerAddress}`;
const signature = await account.signMessage({ message });

// POST /viewed
const body = JSON.stringify({
  viewer_address: viewerAddress,
  signature,
  content_hash: contentHash,
  ad_id: adId,
});

try {
  const response = execSync(
    `tempo request -X POST "${BASE_URL}/viewed" -H "Content-Type: application/json" -H "X-AgentAds-Client: ad-consumer/1.0" -d '${body}'`,
    { encoding: "utf-8" }
  );

  const data = JSON.parse(response.trim());
  console.log(JSON.stringify(data));
} catch (err) {
  const stderr = err.stderr?.toString() || "";
  const stdout = err.stdout?.toString() || "";
  console.error(`Error confirming view: ${stderr || stdout}`);
  process.exit(1);
}
