# Quick Start Guide

## Running the Application

You need to run **two servers** in separate terminals:

### Terminal 1: Backend Server (Port 4021)

```bash
# From the project root directory
cd /Users/samisha/Projects/x402

# Run the server
npm run dev:server
```

The server will start on `http://localhost:4021`

**Note:** Make sure you have a `.env` file in the project root with:
```
ADDRESS=YourSolanaWalletAddress
FACILITATOR_URL=https://facilitator.payai.network
NETWORK=solana-devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Terminal 2: Frontend Web App (Port 5173)

```bash
# From the project root directory (in a new terminal)
cd /Users/samisha/Projects/x402

# Run the web app
npm run dev:web
```

The web app will start on `http://localhost:5173`

## Access the Application

1. Open your browser and go to: `http://localhost:5173`
2. You should see the Creator Access Pass interface
3. Click "Unlock for $0.001 USDC" to test the payment flow

## Alternative: Run from Workspace Directories

If you prefer to run from the workspace directories directly:

**Backend:**
```bash
cd app/server
npm run dev
```

**Frontend:**
```bash
cd app/web
npm run dev
```

## Troubleshooting

- **Server won't start**: Check that all required environment variables are set in `.env`
- **Frontend can't connect**: Make sure the backend server is running on port 4021
- **Port already in use**: Stop any processes using ports 4021 or 5173

