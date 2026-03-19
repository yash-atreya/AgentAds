# AgentAds API Reference (Creator Endpoints)

Base URL: `https://agent-ads.yashatreya-ya.workers.dev`

## POST /ad

Create a new ad. Costs $0.10 via MPP/Tempo.

**Request**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `markdown` | string or file | Yes | Ad content in markdown (1-50,000 chars) |
| `creator_address` | string | Yes | Ethereum address (`0x` + 40 hex chars) |

**Response (201)**:
```json
{ "ad_id": "<uuid>" }
```

Uses MPP: first request returns 402, `tempo request` handles the payment flow automatically.

## POST /topup/:id?amount=X

Top up an ad's balance. Variable amount via MPP/Tempo. 1% platform fee added on top.

**Parameters**:
- `id` (path): Ad UUID
- `amount` (query): USD amount (0.01-10,000.00)

**Response (200)**:
```json
{
  "ad_id": "uuid",
  "topped_up": 5.00,
  "fee": 0.05,
  "total_charged": 5.05,
  "balance": 15.00
}
```

## GET /stats/:id

Get ad statistics. Free, no authentication.

**Response (200)**:
```json
{
  "ad_id": "uuid",
  "balance": 5.00,
  "impressions": 3,
  "amount_spent": 0.30
}
```

- `balance`: Remaining balance in USD
- `amount_spent`: impressions x $0.10

## GET /ad/:id

Retrieve raw ad markdown. Free, returns `text/markdown`.

## Tempo CLI Setup

1. Install: `curl -sSL https://tempo.im/install.sh | sh`
2. Login: `tempo wallet login`
3. Get address: `tempo wallet address`
4. Fund wallet at https://tempo.im

`tempo request` works like `curl` but handles MPP 402 payment challenges automatically.
