# AgentAds

The ad network built for AI coding agents. Developers earn USDC for viewing ads during coding sessions. Advertisers reach developers exactly when they're building.

**Website**: [agentads.xyz](https://agentads.xyz)

## How It Works

AgentAds connects advertisers with developers through AI coding agents like Claude Code and Codex. Ads are displayed as lightweight markdown during natural pauses in your workflow — between tasks, after planning, or while your agent compiles.

- **Viewers** earn **$0.10 USDC** per ad impression, paid instantly on-chain
- **Advertisers** submit ads for **$0.10** and fund campaigns at **$0.10 per impression**
- All payments settle on the **Tempo blockchain** in USDC

## Get Started

### Earn money viewing ads

```bash
npx skills add yash-atreya/AgentAds --skill ad-consumer
```

Requires a [Tempo wallet](https://tempo.im) — the skill walks you through setup.

### Create and run your own ad

```bash
npx skills add yash-atreya/AgentAds --skill ad-creator
```

The skill guides you through writing your ad, submitting it ($0.10), and funding your campaign.

## Architecture

```
┌─────────────────┐         ┌──────────────────────────┐
│  Claude Code /  │         │   AgentAds Server        │
│  Codex / Agent  │         │   (Cloudflare Workers)   │
│                 │         │                          │
│  ┌───────────┐  │  POST   │  ┌────────┐  ┌───────┐  │
│  │ad-consumer├──┼────────►│  │  Hono  ├──┤  D1   │  │
│  │  skill    │  │ /serve  │  │  API   │  │(SQLite)│  │
│  └───────────┘  │ /viewed │  └───┬────┘  └───────┘  │
│                 │         │      │                   │
│  ┌───────────┐  │  POST   │  ┌───┴────┐             │
│  │ad-creator ├──┼────────►│  │   R2   │             │
│  │  skill    │  │ /ad     │  │(Markdown│             │
│  └───────────┘  │ /topup  │  │ Storage)│             │
└─────────────────┘         │  └────────┘             │
                            └─────────┬────────────────┘
                                      │
                            ┌─────────▼────────────────┐
                            │   Tempo Blockchain       │
                            │                          │
                            │  MPP 402 Payment Flow    │
                            │  USDC settlements        │
                            │  Viewer payouts          │
                            └──────────────────────────┘
```

**Payment flow**: Paid endpoints return a `402` with a `WWW-Authenticate` challenge. The Tempo CLI handles the on-chain payment and retries with a credential. The server verifies the receipt via [MPP (Machine Payment Protocol)](https://www.mpp.fyi/) middleware and processes the request.

**Key components**:
- **Hono API** on Cloudflare Workers — handles ad CRUD, serving, billing, and withdrawals
- **Cloudflare D1** — stores ad metadata, viewer balances, impressions, and payment logs
- **Cloudflare R2** — stores ad markdown content
- **Tempo + MPP** — on-chain USDC payments for ad submission, top-ups, and viewer payouts

## Acknowledgments

Built during a hackathon with the [Tempo](https://tempo.im) ecosystem.

- **Tempo team** — for building the infrastructure that makes instant on-chain micropayments practical for machine-to-machine commerce
- **MPP protocol developers** — the [Machine Payment Protocol](https://www.mpp.fyi/) and [`mppx`](https://www.npmjs.com/package/mppx) library made it possible to add seamless 402-based payments with just a few lines of middleware
- **Vercel Skills** — for the [`npx skills add`](https://github.com/vercel-labs/skills) distribution mechanism that makes agent skills installable in one command
