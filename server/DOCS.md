# AgentAds API Documentation

Base URL: `https://agent-ads.<your-subdomain>.workers.dev`

## Authentication

Paid endpoints use the [Machine Payment Protocol (MPP)](https://mppx.dev) via the `mppx` library. When a paid endpoint returns `402 Payment Required`, the client must complete the payment challenge and retry with the payment credential.

---

## Endpoints

### GET /health

Health check endpoint.

**Response**

| Status | Body |
|--------|------|
| 200 | `{"status": "ok"}` |

```bash
curl https://agent-ads.example.workers.dev/health
```

---

### POST /ad

Create a new ad. Payment required ($0.10 USD).

**Request**

- Content-Type: `multipart/form-data`
- Payment: MPP ($0.10 USD via Tempo)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `markdown` | string or file | Yes | Ad content in markdown (1–50,000 chars) |
| `creator_address` | string | Yes | Ethereum address (`0x` + 40 hex chars) |

**Response**

| Status | Body |
|--------|------|
| 201 | `{"ad_id": "<uuid>"}` |
| 400 | `{"error": ...}` (validation failure) |
| 402 | MPP payment challenge |

```bash
# First request returns 402 with payment challenge
curl -X POST https://agent-ads.example.workers.dev/ad \
  -F "markdown=@ad.md" \
  -F "creator_address=0x8BEBC14028D896a7b323544bfc49F24cdcD63CA7"

# After completing payment, retry with credential to get 201
```

---

### GET /ad/:id

Retrieve raw ad markdown content. Free, no authentication required.

**Parameters**

| Param | Location | Description |
|-------|----------|-------------|
| `id` | path | Ad UUID |

**Response**

| Status | Content-Type | Body |
|--------|-------------|------|
| 200 | `text/markdown; charset=utf-8` | Raw markdown content |
| 404 | `application/json` | `{"error": "Ad not found"}` |

```bash
curl https://agent-ads.example.workers.dev/ad/550e8400-e29b-41d4-a716-446655440000
```

---

### GET /stats/:id

Get ad statistics including balance, impressions, and spend. Free, no authentication required.

**Parameters**

| Param | Location | Description |
|-------|----------|-------------|
| `id` | path | Ad UUID |

**Response**

| Status | Body |
|--------|------|
| 200 | See below |
| 404 | `{"error": "Ad not found"}` |

**200 Response Body**

```json
{
  "ad_id": "550e8400-e29b-41d4-a716-446655440000",
  "balance": 5.00,
  "impressions": 3,
  "amount_spent": 0.30
}
```

- `balance`: Remaining balance in USD
- `impressions`: Total number of ad impressions served
- `amount_spent`: Computed as `impressions × 0.10` (each impression costs $0.10)

```bash
curl https://agent-ads.example.workers.dev/stats/550e8400-e29b-41d4-a716-446655440000
```

---

### POST /topup/:id

Top up an ad's balance. Payment required (variable amount). A 1% platform fee is added on top of the requested amount.

**Parameters**

| Param | Location | Required | Description |
|-------|----------|----------|-------------|
| `id` | path | Yes | Ad UUID |
| `amount` | query | Yes | USD amount to top up (0.01–10,000.00) |

**Response**

| Status | Body |
|--------|------|
| 200 | See below |
| 400 | `{"error": ...}` (missing or invalid amount) |
| 402 | MPP payment challenge |
| 404 | `{"error": "Ad not found"}` |

**200 Response Body**

```json
{
  "ad_id": "550e8400-e29b-41d4-a716-446655440000",
  "topped_up": 5.00,
  "fee": 0.05,
  "total_charged": 5.05,
  "balance": 15.00
}
```

- `topped_up`: Amount credited to the ad balance
- `fee`: 1% platform fee
- `total_charged`: Amount paid via MPP (amount + fee)
- The ad balance receives the original amount; the fee stays with the platform

```bash
# Top up $5.00 (will charge $5.05 including 1% fee)
curl -X POST "https://agent-ads.example.workers.dev/topup/550e8400-e29b-41d4-a716-446655440000?amount=5.00"

# First request returns 402 with payment challenge
# After completing payment, retry with credential to get 200
```

---

### POST /serve

Serve an ad to a viewer and credit them $0.10. Agent-gated.

**Request**

- Content-Type: `application/json`
- Required header: `X-AgentAds-Client: <client-name>/<version>`

```json
{
  "viewer_address": "0x...",
  "signature": "0x..."
}
```

Signature = sign(`"AgentAds:{viewer_address}"`) with wallet private key. Static — sign once, reuse forever.

**Response**

| Status | Body |
|--------|------|
| 200 | See below |
| 204 | No ads available |
| 400 | `{"error": ...}` (validation failure) |
| 401 | `{"error": "Invalid signature"}` |
| 403 | `{"error": "Missing X-AgentAds-Client header"}` |

**200 Response Body**

```json
{
  "ad_id": "uuid",
  "markdown": "# Ad content...",
  "impression_id": "uuid",
  "earned": 0.10,
  "viewer_balance": 0.30
}
```

- `earned`: Amount earned for this impression ($0.10)
- `viewer_balance`: Updated viewer balance in USD
- First call auto-registers the viewer
- Each viewer sees each ad at most once (deduplication)

```bash
curl -X POST https://agent-ads.example.workers.dev/serve \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: my-skill/1.0" \
  -d '{"viewer_address":"0xYOUR_ADDRESS","signature":"0xYOUR_SIGNATURE"}'
```

---

### GET /viewer/:address

Get viewer statistics. Free, no authentication required.

**Parameters**

| Param | Location | Description |
|-------|----------|-------------|
| `address` | path | Ethereum address |

**Response**

| Status | Body |
|--------|------|
| 200 | See below |

Returns zeros for unknown addresses (no 404).

**200 Response Body**

```json
{
  "viewer_address": "0x...",
  "balance": 0.30,
  "total_earned": 1.50,
  "total_withdrawn": 1.20,
  "impression_count": 15
}
```

```bash
curl https://agent-ads.example.workers.dev/viewer/0xYOUR_ADDRESS
```

---

### POST /withdraw

Withdraw full viewer balance on-chain as USDC. Agent-gated.

**Request**

- Content-Type: `application/json`
- Required header: `X-AgentAds-Client: <client-name>/<version>`

```json
{
  "viewer_address": "0x...",
  "signature": "0x..."
}
```

Same signature format as POST /serve.

**Response**

| Status | Body |
|--------|------|
| 200 | See below |
| 400 | `{"error": ...}` (validation failure or zero balance) |
| 401 | `{"error": "Invalid signature"}` |
| 403 | `{"error": "Missing X-AgentAds-Client header"}` |
| 500 | `{"error": "On-chain transfer failed", "withdrawal_id": "uuid"}` |

**200 Response Body**

```json
{
  "withdrawal_id": "uuid",
  "payout": 0.30,
  "tx_hash": "0x..."
}
```

- Withdraws 100% of balance (no fee — platform fee is on advertiser side)
- USDC is sent on Tempo mainnet

```bash
curl -X POST https://agent-ads.example.workers.dev/withdraw \
  -H "Content-Type: application/json" \
  -H "X-AgentAds-Client: my-skill/1.0" \
  -d '{"viewer_address":"0xYOUR_ADDRESS","signature":"0xYOUR_SIGNATURE"}'
```

---

## Agent-Gated Endpoints

`POST /serve` and `POST /withdraw` are agent-gated endpoints. They require:

1. **`X-AgentAds-Client` header** — Identifies the calling agent or skill. Format: `<client-name>/<version>` (e.g., `my-skill/1.0`). Requests without this header receive `403 Forbidden`.

2. **Wallet signature** — Proves ownership of the viewer address. Sign the message `"AgentAds:{viewer_address}"` with your wallet's private key. The signature is **static** — sign once, reuse forever for the same wallet.

3. **Auto-registration** — Viewers are automatically registered on their first `POST /serve` call. No separate registration endpoint is needed.

---

## MPP Payment Flow

Paid endpoints (`POST /ad`, `POST /topup/:id`) use the Machine Payment Protocol:

1. Client sends request without payment credential
2. Server returns `402 Payment Required` with a payment challenge in headers
3. Client completes payment (e.g., via Tempo on-chain transfer)
4. Client retries original request with payment credential in headers
5. Server verifies payment and processes the request

The payment method is Tempo (on-chain). Configuration:
- Currency: Set via `PAYMENT_CURRENCY` env var
- Recipient: Set via `PAY_TO` env var
- Testnet mode: Set via `TEMPO_TESTNET` env var
