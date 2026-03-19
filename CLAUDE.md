# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgentAds is an ad platform for AI coding agents. Users get paid for watching ads in their terminal/CLI while their coding agent (Claude, Codex, etc.) works in the background. The platform consists of a marketing website (not yet built) and a backend server.

## Commands

```bash
# Server development
cd server
bun install                    # Install dependencies
bun run dev                    # Local dev server (wrangler dev)
bun run typecheck              # TypeScript type checking (tsc --noEmit)
bun run deploy                 # Deploy to Cloudflare Workers

# Database migrations
bun run db:migrate:local       # Apply migration 0001 locally
bun run db:migrate:remote      # Apply migration 0001 to production
bun run db:migrate:local:0002  # Apply migration 0002 locally
bun run db:migrate:remote:0002 # Apply migration 0002 to production

# Integration tests (not committed — local only)
./server/test.sh                              # Test against production
./server/test.sh http://localhost:8787        # Test against local dev
```

## Architecture

### Server (Cloudflare Workers + Hono)

**Stack**: Hono web framework, Cloudflare D1 (SQLite), Cloudflare R2 (object storage), mppx (Machine Payment Protocol), Zod validation, Tempo blockchain for payments.

**Endpoints**:
- `GET /health` — Health check (free)
- `POST /ad` — Create ad, $0.10 via MPP/Tempo. Accepts multipart form data (`markdown` + `creator_address`). Stores markdown in R2 (`ads/{uuid}.md`), metadata in D1.
- `GET /ad/:id` — Retrieve raw markdown from R2 (free, returns `text/markdown`)
- `GET /stats/:id` — Ad statistics from D1: balance, impressions, amount_spent (free, amounts in USD dollars)
- `POST /topup/:id?amount=X` — Top up ad balance, variable amount via MPP/Tempo. Amount is a query param (needed before mppx middleware parses body). Validates ad exists before accepting payment.

**Payment flow**: Paid endpoints return 402 with WWW-Authenticate challenge → client pays on-chain via Tempo → client retries with credential → server verifies and processes. The `mppx` library handles this as Hono middleware.

**Key design decisions**:
- All monetary values stored as integer cents in D1 (`balance_cents`), converted to dollars in API responses
- `amount_spent` is derived (impressions × $0.10), not stored
- Each impression costs $0.10 (10 cents)
- Ad markdown stored in R2 (not D1) to avoid blob storage in SQLite
- `POST /topup/:id` uses query param for amount because mppx middleware needs the value before body parsing

### Environment Variables

Public vars in `wrangler.toml`: `PAY_TO` (recipient wallet address), `PAYMENT_CURRENCY` (USDC token on Tempo mainnet: `0x20C000000000000000000000b9537d11c60E8b50`), `TEMPO_TESTNET` (false for mainnet).

Secret in `.dev.vars`: `MPP_SECRET_KEY` (hex string for signing payment challenges). The `PAY_TO_PRIVATE_KEY` is also stored there for wallet access.

### Database Schema (D1)

`ads` table: `ad_id` (TEXT PK), `creator_address` (TEXT), `created_at` (TEXT, default now), `balance_cents` (INTEGER, default 0), `impressions` (INTEGER, default 0). Indexed on `creator_address`.

### Testing

`server/test.sh` is a bash integration test suite that tests all endpoints against a live deployment. Uses `tempo request` CLI for paid endpoint testing (handles the full MPP 402 payment flow automatically, including `-F` for multipart form data). The script is gitignored.

## Development Guidelines

1. Spawn parallel sub-agents for website and server work
2. Each sub-agent works on a specific and atomic task
3. Every task should be atomic and committable with tests (or validation if tests don't apply) - always TDD
4. Break comprehensive tasks into sprints and tasks
5. Every sprint results in a demoable piece of software that runs, is tested, and builds on previous work
6. Be exhaustive, clear, technical - focus on small atomic tasks that compose into a sprint goal
7. Plan all tasks/prompts in context of these guidelines
8. After completing a task/sprint, have a sub-agent review work and suggest improvements, then write tasks and sprint plans to an .md file
9. For each independent task/sprint, work in a separate git worktree created in `../worktrees/`
10. After completing implementation on a worktree, never merge directly to `main`. Instead, push to origin and create a pull request with a summary of changes.
11. At the bottom of each PR description, include a "Commits" section which lists the commits made in the PR with its hashes and title.

## Git Worktree Workflow

```bash
# Create worktree for a new task
git worktree add ../worktrees/<branch-name> -b <branch-name>

# List active worktrees
git worktree list

# Remove worktree after merging
git worktree remove ../worktrees/<branch-name>
```

Worktrees live in `../worktrees/` relative to the git root. Each branch maps to one atomic task or sprint. Never merge worktree branches directly to `main` — always go through a PR.

## Deployment

Production URL: `https://agent-ads.yashatreya-ya.workers.dev`

Deploy with `bun run deploy` from `server/`. D1 migrations must be applied separately with `db:migrate:remote` scripts. API docs are in `server/DOCS.md`.
