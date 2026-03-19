# AgentAds API Reference (Consumer Endpoints)

Base URL: `https://agent-ads.yashatreya-ya.workers.dev`

All agent-gated endpoints require the `X-AgentAds-Client: ad-consumer/1.0` header.

## POST /serve

Serve an ad to a viewer. Does NOT bill — call POST /viewed after user confirms.

**Request**: `application/json`
```json
{
  "viewer_address": "0x...",
  "signature": "0x..."
}
```

Signature: sign `"AgentAds:{viewer_address}"` (static, reusable).

**Response**:
- 200: `{ "ad_id": "uuid", "markdown": "# Ad content..." }`
- 204: No ads available (empty body)
- 401: Invalid signature
- 403: Missing X-AgentAds-Client header

Note: Response does NOT include `content_hash`. Client must compute MD5 of the markdown locally.

## POST /viewed

Confirm ad view. Bills advertiser $0.10, credits viewer $0.10.

**Request**: `application/json`
```json
{
  "viewer_address": "0x...",
  "signature": "0x...",
  "content_hash": "a1b2c3d4...",
  "ad_id": "uuid"
}
```

Signature: sign `"{content_hash}:{viewer_address}"` (per-view, proves viewer saw content).
Content hash: MD5 hex digest of the raw markdown.

**Response (200)**:
```json
{
  "ad_id": "uuid",
  "impression_id": "uuid",
  "earned": 0.10,
  "viewer_balance": 0.30
}
```

## GET /viewer/:address

Get viewer stats. Free, no auth.

**Response (200)**:
```json
{
  "viewer_address": "0x...",
  "balance": 0.30,
  "total_earned": 1.50,
  "total_withdrawn": 1.20,
  "impression_count": 15
}
```

Returns zeros for unknown addresses.

## POST /withdraw

Withdraw full balance on-chain as USDC.

**Request**: `application/json`
```json
{
  "viewer_address": "0x...",
  "signature": "0x..."
}
```

Same signature as POST /serve (static).

**Response (200)**:
```json
{
  "withdrawal_id": "uuid",
  "payout": 0.30,
  "tx_hash": "0x..."
}
```

## Signature Formats

- **Static** (for /serve, /withdraw): `sign("AgentAds:{viewer_address}")` — EIP-191
- **Per-view** (for /viewed): `sign("{content_hash}:{viewer_address}")` — EIP-191
- Both use viem's `account.signMessage({ message })` with the spending key

## Tempo Wallet

- The spending key from `tempo wallet whoami -j` is used for signing
- `key.address` = viewer address (EOA that receives USDC withdrawals)
- `key.key` = private key for signing
