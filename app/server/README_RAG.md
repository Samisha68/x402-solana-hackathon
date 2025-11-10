# RAG Endpoint Documentation

## Overview

The RAG (Retrieval-Augmented Generation) endpoints provide a real x402 payment implementation for a knowledge base. Users can preview answers for free, then unlock full answers via x402 micropayments on Solana.

## Endpoints

### POST `/rag/preview` (Free)

Get a preview of an answer without payment.

**Request:**
```json
{
  "question": "How do I fix a discriminator mismatch?"
}
```

**Response (200):**
```json
{
  "type": "preview",
  "id": "discriminator-mismatch",
  "preview": "A discriminator mismatch occurs when Anchor's account discriminator doesn't match the expected value."
}
```

**Response (404 - No Match):**
```json
{
  "type": "no_match",
  "message": "Not in knowledge base yet."
}
```

The `preview` contains the first sentence of the answer, extracted from the full markdown response.

### POST `/rag/answer` (Paid via x402)

Get the full answer after payment verification. This endpoint is protected by `x402-hono` payment middleware.

**Request:**
```json
{
  "id": "discriminator-mismatch"
}
```

**Response (402 - Unpaid):**

When no `X-Payment` header is present, the middleware returns:

**Status:** `402 Payment Required`

**Body:**
```json
{
  "error": "X-PAYMENT header is required",
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana-devnet",
      "maxAmountRequired": "1000",
      "asset": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      "decimals": 6,
      "payTo": "<recipient-address>",
      "extra": {
        "feePayer": "<facilitator-address>"
      }
    }
  ]
}
```

**Response (200 - Paid):**

When `X-Payment` header is present and payment is verified:

**Status:** `200 OK`

**Body:**
```json
{
  "type": "answer",
  "id": "discriminator-mismatch",
  "answerMd": "# Full Answer\n\nA discriminator mismatch occurs...",
  "txSig": "4xabc123def456..."
}
```

The `answerMd` contains the full markdown answer with code examples, explanations, and reference links. The `txSig` is the transaction signature from the on-chain payment settlement.

**Response (404 - Not Found):**
```json
{
  "error": "Answer not found for the given id"
}
```

## Knowledge Base

The knowledge base is hardcoded in `/app/server/rag/knowledge.ts` and contains 5 Q&A pairs covering:

1. Discriminator mismatch errors (`discriminator-mismatch`)
2. PDA seeds and derivation (`pda-seeds`)
3. Rent exemption calculations (`rent-exemption`)
4. Compute budget instructions (`compute-budget`)
5. Account re-initialization (`reinit-account`)

Each entry includes:
- `id`: Unique identifier
- `q`: Question string
- `aMd`: Full answer in markdown with code examples and reference links

## Matching Algorithm

The preview endpoint uses a simple fuzzy matching algorithm:

1. **Exact match:** Direct string comparison (case-insensitive)
2. **Substring match:** Checks if question contains entry or vice versa
3. **Keyword overlap:** Scores entries based on keyword matches (longer keywords weighted higher)

Returns the best match if score >= 10, otherwise returns null (404).

## Payment Flow

The `/rag/answer` endpoint uses real x402 payments via `x402-hono` middleware:

1. **Client requests** `POST /rag/answer` with `{ id }` (no payment header)
2. **Middleware returns 402** with payment requirements in `accepts[]`
3. **Client builds transaction:**
   - Creates partially-signed SPL-USDC `TransferChecked` transaction
   - Amount: 1000 atoms (0.001 USDC, 6 decimals)
   - Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
   - Fee payer: Facilitator address from `extra.feePayer`
4. **Client calls facilitator `/verify`** to get `X-Payment` token
5. **Client retries** `POST /rag/answer` with `X-Payment` header
6. **Middleware verifies** payment via facilitator `/settle`
7. **Middleware allows through** → handler returns full answer with `txSig`

## Configuration

**Environment Variables:**
- `USDC_MINT`: USDC mint address (default: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`)
- `PRICE_USDC_MICRO`: Price in atoms (default: `1000` = 0.001 USDC)
- `ADDRESS`: Recipient wallet address
- `FACILITATOR_URL`: PayAI facilitator URL
- `NETWORK`: Network identifier (e.g., `solana-devnet`)

**Mount Order (Critical):**
1. `/rag/preview` endpoint (free, no middleware)
2. Payment middleware (gates `/rag/answer`)
3. `/rag/answer` handler (receives verified requests)

## CORS

The endpoints are covered by the global CORS middleware in `app/server/index.ts`, which allows:
- All origins (development)
- `POST`, `GET`, `OPTIONS` methods
- `Content-Type`, `X-Payment` headers

For production, restrict origins to your frontend domain.

## Logging

The `/rag/answer` endpoint logs minimal JSON:
```json
{
  "route": "/rag/answer",
  "status": 200,
  "id": "discriminator-mismatch",
  "txSig": "4xabc123..."
}
```

## Error Handling

- **400:** Invalid request body (missing or invalid `question`/`id`)
- **404:** No matching answer found (preview) or invalid `id` (answer)
- **402:** Payment required (answer endpoint, expected for unpaid requests)
- **500:** Internal server error
