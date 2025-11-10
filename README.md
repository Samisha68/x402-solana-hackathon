# Coin Rush

A Solana knowledge quiz application powered by RAG (Retrieval-Augmented Generation). Test your understanding of Solana and Anchor development through topic-based quizzes with x402 micropayments.

## Overview

Coin Rush is an interactive quiz platform featuring:
- Topic-based quiz system with 40 curated questions across 4 topics
- RAG-powered knowledge base for question generation
- x402 micropayment integration for unlocking explanations
- Gamification with XP tracking and topic mastery badges

## Architecture

- **Backend** (`app/server`): Hono server with RAG knowledge base, quiz API, and x402 payment middleware
- **Frontend** (`app/web`): Next.js quiz application with topic selection, timer-based questions, and scorecard

## Prerequisites

- Node.js 20+ (LTS recommended)
- NPM package manager
- Solana wallet (for payments on wrong answers)

## Environment Variables

Create a `.env` file in the project root:

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

1. Navigate to the quiz page
2. Select a topic: Solana Basics, Anchor Basics, PDAs & Programs, or Transactions & Troubleshooting
3. Enter your name and start the quiz
4. Answer 10 questions from your chosen topic (10 seconds per question)
5. Earn +15 XP for correct answers
6. For wrong answers, pay via x402 to unlock the explanation (-5 XP penalty)
7. View your scorecard with topic mastery badge (e.g., "Anchor Basics Master")

## Build & Deploy

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## License

MIT
