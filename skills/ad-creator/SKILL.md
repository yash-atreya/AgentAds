---
name: ad-creator
description: >
  This skill creates and submits ads to the AgentAds network. It guides through
  crafting an AD.md skill file from a product description, setting up a Tempo wallet,
  submitting via the API ($0.10), and funding the ad campaign. Use when the user wants
  to create an ad, advertise a product, or promote a project on the AgentAds network.
---

# Ad Creator

Create and submit ads to the AgentAds network. Ads are skill-formatted markdown files (AD.md) that get displayed to developers during coding sessions.

## Prerequisites

- **Bun** runtime installed
- **Tempo CLI** installed (`curl -sSL https://tempo.im/install.sh | sh`)
- **Tempo wallet** logged in (`tempo wallet login`)

## Workflow

### Step 1: Gather Product Info

Analyze the user's project to understand what they're advertising:
- Read `README.md`, `package.json`, `Cargo.toml`, or equivalent
- Identify: product name, one-line description, key features, getting started instructions, website/repo URL
- If project files aren't available, ask the user directly

### Step 2: Generate AD.md

Use the template at `${CLAUDE_SKILL_DIR}/assets/ad_template.md` to create an AD.md file. Replace all `{PLACEHOLDER}` values with real content.

The AD.md must be a valid skill markdown file with YAML frontmatter:
- `name`: Product name (short, memorable)
- `description`: One compelling sentence describing the product

The body should be concise, scannable markdown that a developer can read in 15-30 seconds. Include:
- A hook paragraph (1-2 sentences, grab attention)
- 3-4 key features as bold bullet points
- Getting started instructions (install command, quick example)
- A call-to-action with URL

Keep total content under 2000 characters for best engagement.

### Step 3: Preview and Iterate

Show the generated AD.md to the user. Ask if they want changes to:
- The hook/tagline
- Feature list
- Getting started section
- Call-to-action

Iterate until they approve.

### Step 4: Wallet Setup

Before submitting, ensure the user has Tempo CLI installed and a wallet set up:

1. Check if `tempo` CLI is installed: `which tempo`
2. If not installed: `curl -sSL https://tempo.im/install.sh | sh`
3. Login: `tempo wallet login`
4. Get their address: `tempo wallet whoami -j` (use `key.address` from the JSON output)

The creator address is needed for the submission and identifies who owns the ad.

### Step 5: Submit

Save the approved AD.md to a file, then run:

```bash
bun run ${CLAUDE_SKILL_DIR}/scripts/submit_ad.js <path-to-AD.md> <creator_address>
```

This costs $0.10 USDC via Tempo. The script handles the MPP payment flow automatically.

On success, it returns an `ad_id` (UUID). Save this — it's needed for top-ups and stats.

### Step 6: Fund the Campaign

The ad starts with $0.00 balance. Each impression costs $0.10. To start serving:

```bash
bun run ${CLAUDE_SKILL_DIR}/scripts/topup_ad.js <ad_id> <amount_usd>
```

Suggest funding tiers:
- **Starter**: $1.00 (10 impressions)
- **Growth**: $5.00 (50 impressions)
- **Pro**: $10.00 (100 impressions)

A 1% platform fee is added on top.

### Step 7: Check Stats

```bash
bun run ${CLAUDE_SKILL_DIR}/scripts/check_stats.js <ad_id>
```

Returns: balance, impressions served, amount spent, and remaining impressions.

## API Reference

See `${CLAUDE_SKILL_DIR}/references/api_docs.md` for endpoint details.

## Important Notes

- Ad content is stored as markdown in the platform — no ASCII art, no special formatting
- The `creator_address` must be a valid Ethereum address (0x + 40 hex chars)
- Minimum ad content: 1 character. Maximum: 50,000 characters
- Top-up amounts: $0.01 to $10,000.00
- All payments are in USDC on Tempo mainnet
