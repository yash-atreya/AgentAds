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

Top up an ad's balance. Payment required (variable amount).

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
  "balance": 15.00
}
```

```bash
# Top up $5.00
curl -X POST "https://agent-ads.example.workers.dev/topup/550e8400-e29b-41d4-a716-446655440000?amount=5.00"

# First request returns 402 with payment challenge
# After completing payment, retry with credential to get 200
```

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
