---
name: ad-consumer
description: >
  This skill displays sponsored ads to users during coding agent sessions. Users earn
  $0.10 USDC per ad viewed. It triggers at natural workflow pauses — after receiving a
  prompt before planning, after planning before implementation, or between major tasks.
  Requires a Tempo wallet (tempo wallet login). Also triggers when the user asks
  to check ad earnings, withdraw earnings, or manually requests to see an ad.
user-invocable: true
---

# Ad Consumer

Display sponsored ads during coding sessions. Users earn $0.10 USDC per ad viewed.

## Prerequisites

- **Tempo CLI** installed (`curl -sSL https://tempo.im/install.sh | sh`)
- **Tempo wallet** logged in (`tempo wallet login`)
- **Bun** runtime installed
- **Dependencies**: Run `cd ${CLAUDE_SKILL_DIR} && bun install` on first use

## First-Time Setup

On the first ad display in a session, run setup:

```bash
cd ${CLAUDE_SKILL_DIR} && bun run scripts/setup.js
```

This reads the spending key from `tempo wallet whoami -j` and outputs JSON:
```json
{ "address": "0x...", "static_signature": "0x...", "wallet": "0x..." }
```

Save the `address` as `VIEWER_ADDRESS` and `static_signature` as `STATIC_SIGNATURE` for subsequent script calls.

If this fails with a wallet error, guide the user through `tempo wallet login`.

## When to Show Ads

Show ads at natural workflow pauses (non-blocking):

1. **After the user sends their initial message**, before starting substantive work
2. **After exiting plan mode**, before implementation begins
3. **Between major task completions** (e.g., after finishing one file, before starting another)

Never interrupt active work. If the user is in the middle of something, skip the ad.

## Ad Display Flow

### 1. Fetch an Ad

```bash
VIEWER_ADDRESS=<address> STATIC_SIGNATURE=<sig> bun run ${CLAUDE_SKILL_DIR}/scripts/serve_ad.js
```

- If output is `NO_ADS` or script errors: skip silently, continue work
- If output is JSON with `ad_id` and `markdown`: proceed to step 2

### 2. Ask the User

Extract the first sentence from the markdown as a brief description. Ask:

> Sponsored: Earn $0.10 USDC viewing a brief ad about {description}? (y/n)

### 3. Display the Ad (if user accepts)

If the user says yes, display the raw markdown between clear delimiters:

```
--- Sponsored Ad ---

{raw markdown content}

--- End Ad ---
```

### 4. Confirm the View

Save the markdown to a temporary file, then run:

```bash
AD_ID=<ad_id> VIEWER_ADDRESS=<address> bun run ${CLAUDE_SKILL_DIR}/scripts/confirm_view.js <path-to-temp-file>
```

The script computes the MD5 hash of the markdown, signs a per-view message, and calls POST /viewed.

On success, report: "Earned $0.10! Balance: ${viewer_balance}"

### 5. If User Declines

Skip silently. Do not ask again for the same work session phase.

## Manual Commands

When the user asks to check earnings or withdraw:

### Check Balance
```bash
VIEWER_ADDRESS=<address> bun run ${CLAUDE_SKILL_DIR}/scripts/check_balance.js
```

Report: balance, total earned, total withdrawn, impression count.

### Withdraw Earnings
```bash
VIEWER_ADDRESS=<address> STATIC_SIGNATURE=<sig> bun run ${CLAUDE_SKILL_DIR}/scripts/withdraw.js
```

Report: payout amount and transaction hash.

### Show an Ad
Run the full ad display flow (steps 1-4 above).

## Error Handling

- **Network errors**: Skip silently, never block the user's work
- **Wallet not logged in**: Guide user to run `tempo wallet login`
- **No ads available (204)**: Skip silently
- **Script failures**: Log to stderr but don't surface to user unless they explicitly asked for an ad

## API Reference

See `${CLAUDE_SKILL_DIR}/references/api_docs.md` for endpoint details.
