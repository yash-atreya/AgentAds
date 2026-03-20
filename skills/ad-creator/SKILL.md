---
name: ad-creator
description: >
  This skill creates and submits ads to the AgentAds network. It guides through
  crafting an ASCII art ad from a product description, setting up a Tempo wallet,
  submitting via the API ($0.10), and funding the ad campaign. Use when the user wants
  to create an ad, advertise a product, or promote a project on the AgentAds network.
---

# Ad Creator

Create and submit ASCII art ads to the AgentAds network. Ads are rendered as eye-catching bordered art that displays in developer terminals during coding sessions.

## Prerequisites

- **Bun** runtime installed
- **Tempo CLI** installed (`curl -sSL https://tempo.im/install.sh | sh`)
- **Tempo wallet** logged in (`tempo wallet login`)

## Workflow

### Step 1: Gather Product Info

Analyze the user's project to understand what they're advertising:
- Read `README.md`, `package.json`, `Cargo.toml`, or equivalent
- Identify: product name, tagline, 3-4 key benefits, website/repo URL
- If project files aren't available, ask the user directly
- Refer to `${CLAUDE_SKILL_DIR}/assets/examples.json` for category-specific tagline and benefit suggestions

### Step 2: Validate Ad Data

Before rendering, validate the ad data using:

```bash
bun run ${CLAUDE_SKILL_DIR}/scripts/validate_ad.js '<json>'
```

The JSON must have: `companyName` (≤30 chars), `tagline` (≤50 chars), `benefits` (2-6 items, each ≤60 chars), `link` (valid URL).

Example:
```bash
bun run ${CLAUDE_SKILL_DIR}/scripts/validate_ad.js '{"companyName":"AgentAds","tagline":"Earn USDC While Your Agent Works","benefits":["$0.10 per impression","Instant on-chain payments","Works with Claude Code & Codex"],"link":"https://agentads.xyz"}'
```

Fix any errors before proceeding.

### Step 3: Render ASCII Art Ad

Render the ad using the professional style (default):

```bash
bun run ${CLAUDE_SKILL_DIR}/scripts/render_ad.js professional '<json>'
```

Available styles: `professional` (box-drawing), `tech` (code comments), `minimal` (plain ASCII). Always default to `professional`.

The renderer produces bordered ASCII art like:
```
╔══════════════════════════════════════════════════════╗
║                     AGENTADS                         ║
║         "Earn USDC While Your Agent Works"           ║
╠══════════════════════════════════════════════════════╣
║  ✓ $0.10 per impression                             ║
║  ✓ Instant on-chain payments                        ║
║  ✓ Works with Claude Code & Codex                   ║
╠══════════════════════════════════════════════════════╣
║  🔗 https://agentads.xyz                             ║
╚══════════════════════════════════════════════════════╝
```

### Step 4: Build AD.md

Combine the ASCII art with a hook paragraph and getting started instructions using the template at `${CLAUDE_SKILL_DIR}/assets/ad_template.md`.

The final AD.md should look like:
```
--- Sponsored Ad ---

<ASCII art block from Step 3>

<1-2 sentence hook paragraph>

Get Started:
<Install command or quick start instructions>

--- End Ad ---
```

Keep total content under 2000 characters.

### Step 5: Preview and Iterate

Show the generated AD.md to the user. Iterate until they approve.

### Step 6: Wallet Setup

Before submitting, ensure the user has Tempo CLI installed and a wallet set up:

1. Check if `tempo` CLI is installed: `which tempo`
2. If not installed: `curl -sSL https://tempo.im/install.sh | sh`
3. Login: `tempo wallet login`
4. Get their address: `tempo wallet whoami -j` (use `key.address` from the JSON output)

The creator address is needed for the submission and identifies who owns the ad.

### Step 7: Submit

Save the approved AD.md to a file, then run:

```bash
bun run ${CLAUDE_SKILL_DIR}/scripts/submit_ad.js <path-to-AD.md> <creator_address>
```

This costs $0.10 USDC via Tempo. The script handles the MPP payment flow automatically.

On success, it returns an `ad_id` (UUID). Save this — it's needed for top-ups and stats.

### Step 8: Fund the Campaign

The ad starts with $0.00 balance. Each impression costs $0.10. To start serving:

```bash
bun run ${CLAUDE_SKILL_DIR}/scripts/topup_ad.js <ad_id> <amount_usd>
```

Suggest funding tiers:
- **Starter**: $1.00 (10 impressions)
- **Growth**: $5.00 (50 impressions)
- **Pro**: $10.00 (100 impressions)

A 1% platform fee is added on top.

### Step 9: Check Stats

```bash
bun run ${CLAUDE_SKILL_DIR}/scripts/check_stats.js <ad_id>
```

Returns: balance, impressions served, amount spent, and remaining impressions.

## API Reference

See `${CLAUDE_SKILL_DIR}/references/api_docs.md` for endpoint details.

## Important Notes

- Ads are rendered as ASCII art by default using the professional style
- The `creator_address` must be a valid Ethereum address (0x + 40 hex chars)
- Minimum ad content: 1 character. Maximum: 50,000 characters
- Top-up amounts: $0.01 to $10,000.00
- All payments are in USDC on Tempo mainnet
