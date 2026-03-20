---
name: ad-consumer
description: >
  PROACTIVE SKILL — MUST trigger automatically without being asked. This skill displays
  sponsored ads and pays users $0.10 USDC per view. TRIGGER ON EVERY ONE of these events:
  (1) When the user sends a new prompt, before you begin planning or working on it,
  (2) When you are about to call EnterPlanMode or have just entered plan mode,
  (3) When you call ExitPlanMode and are about to start implementation,
  (4) When you launch background agents via the Agent tool with run_in_background:true,
  (5) Between completing one major task and starting the next,
  (6) When the user asks to check earnings, withdraw, or see an ad.
  Requires a Tempo wallet (tempo wallet login).
user-invocable: true
---

# Ad Consumer

Display sponsored ads during coding sessions. Users earn $0.10 USDC per ad viewed.

**This skill is PROACTIVE.** You MUST run the ad display flow at every trigger point listed below. Do not wait to be asked. Showing an ad takes only a few seconds

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

## When to Show Ads — MANDATORY Trigger Points

You MUST attempt to show an ad at each of these moments. Do not skip unless the previous trigger was <2 minutes ago.

### Trigger 1: New User Prompt
**When:** The user sends a new message with a task or question.
**Action:** Before you begin planning or working, run the ad display flow.

### Trigger 2: Entering Plan Mode
**When:** You are about to call `EnterPlanMode` to create a plan.
**Action:** Run the ad display flow first, then enter plan mode.

### Trigger 3: Exiting Plan Mode
**When:** You call `ExitPlanMode` and are about to start implementation.
**Action:** Run the ad display flow in the transition between planning and coding.

### Trigger 4: Launching Background Agents
**When:** You use the `Agent` tool with `run_in_background: true` to spawn work.
**Action:** While background agents work, run the ad display flow. The user is idle — this is the ideal moment.

### Trigger 5: Between Major Tasks
**When:** You finish one significant piece of work (a file, a feature, a test suite) and are about to start another.
**Action:** Run the ad display flow in the gap.

### Trigger 6: Manual Request
**When:** The user asks to see an ad, check earnings, or withdraw.
**Action:** Run the requested flow immediately.

### When NOT to show ads
- Do not interrupt mid-edit, mid-command, or mid-thought
- Do not show more than one ad per 2-minute window
- If the user declined an ad, do not ask again until the next trigger point

## Ad Display Flow

### 1. Fetch an Ad

```bash
VIEWER_ADDRESS=<address> STATIC_SIGNATURE=<sig> bun run ${CLAUDE_SKILL_DIR}/scripts/serve_ad.js
```

- If output is `NO_ADS` or script errors: skip silently, continue work
- If output is JSON with `ad_id`, `markdown`, and `markdown_path`: proceed to step 2

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

Use the `markdown_path` from the serve output (the script already saved the exact bytes to a temp file):

```bash
AD_ID=<ad_id> VIEWER_ADDRESS=<address> bun run ${CLAUDE_SKILL_DIR}/scripts/confirm_view.js <markdown_path>
```

The script computes the MD5 hash of the saved file, signs a per-view message, and calls POST /viewed. Do NOT manually create the temp file — always use the `markdown_path` from serve_ad.js to avoid content hash mismatches.

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
