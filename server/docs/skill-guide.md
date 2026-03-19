# AgentAds Consumer Skill Guide

Guide for building a Claude Code skill (or similar agent plugin) that displays ads and earns USDC.

## Overview

The ad-consumer skill:
1. Calls `POST /serve` to get an ad
2. Displays the ad markdown in the terminal
3. After the user confirms viewing, calls `POST /viewed` to confirm and earn $0.10
4. Reports earnings to the user
5. Optionally checks balance or withdraws earnings

## Prerequisites

- An Ethereum wallet (private key)
- `AGENTADS_PRIVATE_KEY` environment variable set
- Access to the AgentAds API at `https://agent-ads.yashatreya-ya.workers.dev`

## Signing

Two types of signatures are used:

1. **Static signature** (for `/serve` and `/withdraw`): Sign `"AgentAds:{your_address}"` — do this once, reuse forever.
2. **Per-view signature** (for `/viewed`): Sign `"{content_hash}:{your_address}"` — generated after each ad is served.

### Signing Helper (Bun)

```bash
# Generate address and static signature from private key
bun -e "
const { privateKeyToAccount } = require('viem/accounts');
const account = privateKeyToAccount(process.env.AGENTADS_PRIVATE_KEY);
const message = 'AgentAds:' + account.address;
const signature = await account.signMessage({ message });
console.log('Address:', account.address);
console.log('Signature:', signature);
"
```

Store the address and static signature — they never change for a given private key.

To sign a view confirmation (per-view):
```bash
# Sign a specific content_hash for /viewed
bun -e "
const { privateKeyToAccount } = require('viem/accounts');
const account = privateKeyToAccount(process.env.AGENTADS_PRIVATE_KEY);
const contentHash = process.argv[1]; // MD5 hash from /serve response
const message = contentHash + ':' + account.address;
const signature = await account.signMessage({ message });
console.log(signature);
" <content_hash>
```

## API Calls

### Step 1: Serve an Ad

```bash
curl -X POST https://agent-ads.yashatreya-ya.workers.dev/serve \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: my-skill/1.0" \
  -d '{"viewer_address":"0xYOUR_ADDRESS","signature":"0xYOUR_STATIC_SIGNATURE"}'
```

Response (200):
```json
{
  "ad_id": "uuid",
  "markdown": "# Sponsored: ...",
  "content_hash": "a1b2c3d4e5f6..."
}
```

If no ads are available, returns 204 (no body). Display the `markdown` to the user.

### Step 2: Confirm View

After the user confirms they saw the ad, sign the `content_hash` and call `/viewed`:

```bash
curl -X POST https://agent-ads.yashatreya-ya.workers.dev/viewed \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: my-skill/1.0" \
  -d '{"viewer_address":"0xADDR","signature":"0xPER_VIEW_SIG","content_hash":"a1b2c3...","ad_id":"uuid"}'
```

Response (200):
```json
{
  "ad_id": "uuid",
  "impression_id": "uuid",
  "earned": 0.10,
  "viewer_balance": 0.10
}
```

The `signature` here signs `"{content_hash}:{viewer_address}"` (not the static signature).

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
```

After the user acknowledges the ad, call `/viewed` and then show:

```
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
The skill calls POST /serve, displays the ad markdown, then calls POST /viewed
after the user confirms viewing. If no ads are available, it silently skips.
```

## Example Flows

### View Ad Flow
1. Skill is triggered (e.g., on idle, between tasks)
2. POST /serve -> get ad markdown + content_hash
3. Render markdown in terminal
4. Wait for user to confirm viewing
5. Sign content_hash:address, call POST /viewed
6. Show earnings message

### Check Balance Flow
1. User asks "how much have I earned?"
2. GET /viewer/:address
3. Show balance, total earned, total withdrawn

### Withdraw Flow
1. User asks "withdraw my earnings"
2. POST /withdraw
3. Show tx_hash and payout amount
4. Confirm on-chain transfer
