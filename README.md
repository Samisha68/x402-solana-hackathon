# Creator Access Pass (x402)

Pay-per-unlock content platform via HTTP 402 on Solana Devnet (USDC). Instant micropayments with no accounts or subscriptions required.

## Overview

Creator Access Pass is a minimal implementation of the x402 payment protocol, enabling creators to monetize digital content through tiny USDC payments on Solana. The platform consists of a Hono server with x402 middleware that returns HTTP 402 responses for unpaid requests, and a Vite + React frontend that handles the payment flow through the PayAI facilitator. Once payment is verified, content is instantly unlocked without requiring user accounts or subscription management.

## Architecture

- **app/server** — Hono server with x402 payment middleware
  - Endpoints: `/unlock` (protected), `/health` (public)
  - Payment verification via PayAI facilitator
  - Environment-based configuration

- **app/web** — React + Tailwind + shadcn/ui frontend
  - Single-page application for unlock flow
  - Payment state management
  - Responsive design with dark mode support

**Payment Flow:**
1. Client requests `GET /unlock`
2. Server returns HTTP 402 with x402 JSON (includes facilitator payment instructions)
3. Client completes payment via PayAI facilitator
4. Client retries `GET /unlock` with `X-Payment` header
5. Server verifies payment and returns 200 with content URL

## Prerequisites

- Node.js 20+ (LTS recommended)
- NPM or PNPM package manager
- Optional: Solana CLI for Devnet faucets and testing

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable | Required | Description |
|----------|----------|-------------|
| `ADDRESS` | Yes | Solana wallet address to receive payments |
| `FACILITATOR_URL` | Yes | PayAI facilitator base URL (e.g., `https://facilitator.payai.network`) |
| `NETWORK` | Yes | Network identifier (e.g., `solana-devnet`) |
| `SOLANA_RPC_URL` | Yes | Solana RPC endpoint (e.g., `https://api.devnet.solana.com`) |
| `LOCKED_CONTENT_URL` | No | URL to reveal on successful payment unlock |
| `CREATOR_NAME` | No | Creator display name for frontend |
| `CREATOR_AVATAR_URL` | No | Creator avatar image URL |
| `CREATOR_DESCRIPTION` | No | Creator description text |

**Note:** `PAYAI_API_KEY` and `PAYAI_SECRET` are not required for this implementation.

## Setup

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Edit `.env` and set required variables (see Environment Variables section above).

## Commands

### Development (Two Terminals)

**Terminal A — Backend Server:**
```bash
npm run dev:server
```
Server runs on `http://localhost:4021`

**Terminal B — Frontend:**
```bash
npm run dev:web
```
Frontend runs on `http://localhost:5173`

### Build

Build both server and web:
```bash
npm run build
```

This compiles the TypeScript server to `app/server/dist/` and builds the Vite frontend to `app/web/dist/`.

### Start (Production)

After building, start the server:
```bash
npm start
```

### Web Preview (Optional)

Preview the built frontend:
```bash
npm -w app/web run preview
```

## Local Development Workflow

1. Start the backend server in one terminal (`npm run dev:server`)
2. Start the frontend in another terminal (`npm run dev:web`)
3. Open `http://localhost:5173` in your browser
4. The frontend is configured to call the backend at `http://localhost:4021` (CORS enabled for development)

**Verification:**
- Server logs should show configured price ($0.001), network, facilitator URL, and address
- Health endpoint: `curl http://localhost:4021/health` should return `{"status":"ok",...}`
- Frontend should load without console errors

## x402 Payment Flow (Quick Reference)

1. **Initial Request:** `GET /unlock` → Returns HTTP 402 with x402 JSON payload
   ```json
   {
     "error": "X-PAYMENT header is required",
     "paymentRequirements": {
       "scheme": "exact",
       "network": "solana-devnet",
       "maxAmountRequired": "1000",
       "payTo": "YOUR_ADDRESS",
       ...
     }
   }
   ```

2. **Payment:** Client completes payment via PayAI facilitator using the payment requirements

3. **Retry with Header:** `GET /unlock` with `X-Payment: <payment_token>` header → Returns HTTP 200
   ```json
   {
     "ok": true,
     "content": "https://example.com/unlocked-content"
   }
   ```

## Devnet Quickstart

### Get Devnet SOL

```bash
solana airdrop 1 YOUR_ADDRESS --url https://api.devnet.solana.com
```

### USDC Devnet Mint

USDC devnet mint address: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`

You can obtain devnet USDC through:
- PayAI facilitator (handles conversion automatically)
- Devnet USDC faucets
- Transfer from another devnet test wallet

## Deployment Notes

### Split Deploy (Recommended for Production)

- **Frontend:** Deploy static build (Vite output) to Vercel, Netlify, or similar
- **Backend:** Deploy Hono server to Fly.io, Railway, Render, or similar
- **CORS:** Configure CORS on the server to allow your frontend domain
- **Environment:** Set environment variables in your hosting platform

### Single Domain (Reverse Proxy)

- Use Nginx or Caddy to reverse proxy `/api/*` to the Hono server
- Serve frontend static files from root
- No CORS needed (same origin)
- Example Nginx config:
  ```
  location /api {
    proxy_pass http://localhost:4021;
  }
  location / {
    root /path/to/web/dist;
    try_files $uri /index.html;
  }
  ```

## Troubleshooting

### 402 Parsing Errors

- Inspect Network tab in browser DevTools
- Verify server returns valid JSON with `paymentRequirements` field
- Check that response status is exactly 402
- Ensure Content-Type header is `application/json`

### CORS Issues

- Verify server CORS middleware allows your frontend origin
- Check that `X-Payment` header is in `allowHeaders` list
- For production, set specific origin instead of `*`

### Missing Environment Variables

- Server will exit with clear error message listing missing variables
- Verify `.env` file exists in project root (not in `app/server/`)
- Check that all required variables are set (see Environment Variables table)

### Tailwind v4 Compatibility

- This project uses Tailwind CSS v3.4.1
- If upgrading to v4, ensure `@tailwindcss/postcss` is used in PostCSS config
- Update `tailwind.config.js` format if needed

### React Version Conflicts

- Project uses React 18.3.1 for compatibility
- If seeing "React Element from older version" errors, ensure:
  - All React dependencies use the same version
  - No duplicate React installations in `node_modules`
  - Run `npm install` from project root to ensure workspace consistency

## License

MIT (or add license later)

