# x402 Answers

Solana RAG Knowledge Hub with x402 micropayments. Ask questions, get previews, unlock full answers via HTTP 402 on Solana Devnet.

## Overview

x402 Answers is a knowledge platform for Solana/Anchor developers featuring:
- RAG (Retrieval-Augmented Generation) Q&A system with 40+ curated questions
- Topic-based quiz system (10 questions per topic)
- x402 micropayment integration for unlocking full answers
- Gamification with XP, topic mastery, and progress tracking

## Architecture

- **Backend** (`app/server`): Hono server with x402 payment middleware, RAG endpoints, and quiz API
- **Frontend** (`app/web`): Next.js application with quiz interface, wallet integration, and payment flow

## Prerequisites

- Node.js 20+ (LTS recommended)
- NPM package manager
- Solana wallet (for payments)

## Environment Variables

Create a `.env` file in the project root with:

```
ADDRESS=YourSolanaWalletAddress
FACILITATOR_URL=https://facilitator.payai.network
NETWORK=solana-devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (see above)

3. Start development servers:

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:web
```

4. Open `http://localhost:3000` in your browser

## How to Enjoy

### Quiz Mode

1. Navigate to the quiz page
2. Select a topic: Solana Basics, Anchor Basics, PDAs & Programs, or Transactions & Troubleshooting
3. Enter your name and start the quiz
4. Answer 10 questions from your chosen topic
5. Earn XP for correct answers (+15 XP) or pay to unlock explanations for wrong answers (-5 XP penalty)
6. View your scorecard with topic mastery badge

### RAG Q&A Mode

1. Ask a question about Solana/Anchor development
2. Receive a free preview (first sentence of the answer)
3. Pay via x402 to unlock the full answer with detailed explanations and code examples
4. Track your progress and unlock achievements

## Build & Deploy

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

For deployment instructions, see the project documentation.

## License

MIT
