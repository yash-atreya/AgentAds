#!/usr/bin/env bun
import { privateKeyToAccount } from "viem/accounts";
import { execSync } from "child_process";

// Read spending key from tempo wallet
let walletInfo;
try {
  const output = execSync("tempo wallet whoami -j", { encoding: "utf-8" });
  walletInfo = JSON.parse(output);
} catch {
  console.error("Error: Tempo wallet not logged in. Run: tempo wallet login");
  process.exit(1);
}

if (!walletInfo.key?.key || !walletInfo.key?.address) {
  console.error("Error: Could not read spending key from tempo wallet.");
  console.error("Ensure you have a spending key set up: tempo wallet login");
  process.exit(1);
}

const privateKey = walletInfo.key.key;
const address = walletInfo.key.address;
const mainWallet = walletInfo.wallet;

// Create viem account and sign static message
const account = privateKeyToAccount(privateKey);
const staticMessage = `AgentAds:${address}`;
const staticSignature = await account.signMessage({ message: staticMessage });

console.log(JSON.stringify({
  address,
  static_signature: staticSignature,
  wallet: mainWallet,
}));
