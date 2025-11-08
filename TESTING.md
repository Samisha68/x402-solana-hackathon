# Testing Guide

## Prerequisites

1. **Solana Wallet**: Install Phantom or Solflare wallet extension
2. **Devnet USDC**: You need USDC on Solana Devnet for testing
   - USDC Devnet Mint: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`
   - Get devnet USDC from PayAI facilitator or devnet faucets

3. **Devnet SOL**: You need SOL for transaction fees
   ```bash
   solana airdrop 1 YOUR_ADDRESS --url https://api.devnet.solana.com
   ```

## Testing Steps

### 1. Start Servers

```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend  
npm run dev:web
```

### 2. Open Application

Open http://localhost:3000 in your browser

### 3. Connect Wallet

1. Click "Select Wallet" button (top right)
2. Choose Phantom or Solflare
3. Approve connection
4. Ensure you're on **Devnet** (not Mainnet)

### 4. Test Payment Flow

1. Click "Unlock for $0.0001 USDC" button
2. Wallet should prompt to sign transaction
3. Approve the transaction
4. Wait for confirmation
5. Content should unlock automatically

## Expected Flow

1. **Initial Request**: `GET /api/unlock` → Returns `402 Payment Required`
2. **Payment Processing**:
   - Creates USDC transfer transaction
   - Signs with wallet
   - Sends to Solana network
   - Submits to PayAI facilitator
   - Gets X-Payment token
3. **Retry Request**: `GET /api/unlock` with `X-Payment` header → Returns `200 OK` with content

## Troubleshooting

### Wallet Not Connecting
- Check browser console for errors
- Ensure wallet extension is installed and unlocked
- Try refreshing the page

### Transaction Fails
- Check you have enough SOL for fees
- Verify you have USDC in your wallet
- Check browser console for detailed error messages

### 402 Response Issues
- Verify backend is running on port 4021
- Check `.env` file has correct `ADDRESS`, `FACILITATOR_URL`, `NETWORK`
- Check backend logs for errors

### Facilitator API Errors
- Verify `FACILITATOR_URL` is correct (https://facilitator.payai.network)
- Check network tab in browser DevTools for API call details
- Facilitator API structure may need adjustment based on actual PayAI implementation

## Debugging

### Check Backend Logs
```bash
# Backend should show:
🚀 Creator Access Pass Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Address: YOUR_ADDRESS
🌐 Network: solana-devnet
💰 Price: $0.0001
🔗 Facilitator: https://facilitator.payai.network
📡 RPC: https://api.devnet.solana.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running on http://localhost:4021
```

### Check Browser Console
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for API requests/responses

### Test Endpoints Manually

```bash
# Health check
curl http://localhost:4021/health

# Unlock endpoint (should return 402)
curl -v http://localhost:4021/unlock
```

## Notes

- The PayAI facilitator API integration may need adjustment based on their actual API structure
- Current implementation assumes `/verify` endpoint accepts payment payload
- X-Payment token format may need verification with PayAI documentation

