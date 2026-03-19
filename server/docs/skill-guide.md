# AgentAds Consumer Skill Guide

Guide for building a Claude Code skill (or similar agent plugin) that displays ads and earns USDC.

## Overview

The ad-consumer skill:
1. Calls `POST /serve` to get an ad
2. Displays the ad markdown in the terminal
3. Reports earnings to the user
4. Optionally checks balance or withdraws earnings

## Prerequisites

- An Ethereum wallet (private key)
- `AGENTADS_PRIVATE_KEY` environment variable set
- Access to the AgentAds API at `https://agent-ads.yashatreya-ya.workers.dev`

## Signing

The API requires a one-time signature to prove wallet ownership. Sign the message `"AgentAds:{your_address}"` with your private key.

### Signing Helper (Bun)

```bash
# Generate address and signature from private key
bun -e "
const { privateKeyToAccount } = require('viem/accounts');
const account = privateKeyToAccount(process.env.AGENTADS_PRIVATE_KEY);
const message = 'AgentAds:' + account.address;
const signature = await account.signMessage({ message });
console.log('Address:', account.address);
console.log('Signature:', signature);
"
```

Store the address and signature — they never change for a given private key.

## API Calls

### View an Ad

```bash
curl -X POST https://agent-ads.yashatreya-ya.workers.dev/serve \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: my-skill/1.0" \
  -d '{"viewer_address":"0xYOUR_ADDRESS","signature":"0xYOUR_SIGNATURE"}'
```

Response (200):
```json
{
  "ad_id": "uuid",
  "markdown": "# Sponsored: ...",
  "impression_id": "uuid",
  "earned": 0.10,
  "viewer_balance": 0.10
}
```

If no ads are available, returns 204 (no body).

### Check Balance

```bash
curl https://agent-ads.yashatreya-ya.workers.dev/viewer/0xYOUR_ADDRESS
```

### Withdraw Earnings

```bash
curl -X POST https://agent-ads.yashatreya-ya.workers.dev/withdraw \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: my-skill/1.0" \
  -d '{"viewer_address":"0xYOUR_ADDRESS","signature":"0xYOUR_SIGNATURE"}'
```

## Display Pattern

When building a skill, display the ad naturally:

```
Sponsored Message
---------------------
[rendered markdown content]
---------------------
You earned $0.10 (balance: $0.30)
```

## SKILL.md Template

```markdown
---
name: ad-consumer
description: View sponsored ads and earn USDC
---

# Ad Consumer Skill

Display a sponsored ad and earn $0.10 USDC.

## Setup
Set `AGENTADS_PRIVATE_KEY` to your Ethereum private key.

## Usage
The skill calls POST /serve, displays the ad markdown, and reports earnings.
If no ads are available, it silently skips.
```

## Example Flows

### View Ad Flow
1. Skill is triggered (e.g., on idle, between tasks)
2. POST /serve -> get ad
3. Render markdown in terminal
4. Show earnings message

### Check Balance Flow
1. User asks "how much have I earned?"
2. GET /viewer/:address
3. Show balance, total earned, total withdrawn

### Withdraw Flow
1. User asks "withdraw my earnings"
2. POST /withdraw
3. Show tx_hash and payout amount
4. Confirm on-chain transfer
