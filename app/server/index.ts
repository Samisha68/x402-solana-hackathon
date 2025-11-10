import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { paymentMiddleware, Network, Resource } from "x402-hono";
import { env } from "./env.js";
import { findBestMatch, firstSentence, findById, KB } from "./rag/knowledge.js";
import { ragRouter } from "./routes/rag.js";
import { quizRouter } from "./routes/quiz.js";

const app = new Hono();

// CORS middleware - allow all origins for development
// In production, you may want to restrict this to specific origins
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Payment", "x402-payment"],
    credentials: false,
  })
);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Request logging middleware (placed after health check to avoid logging it)
app.use("*", async (c, next) => {
  const method = c.req.method;
  const path = c.req.path;
  
  // Skip logging for health checks
  if (path === "/health") {
    return next();
  }
  
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  const status = c.res.status;
  
  // Use process.stdout.write for immediate output (no buffering)
  process.stdout.write(`[${method}] ${path} → ${status} (${duration}ms)\n`);
});

// Mount FREE endpoints BEFORE payment middleware
// These endpoints don't require payment
app.route("/rag", ragRouter); // GET /rag/catalog, GET /rag/daily, POST /rag/preview

// x402 Payment Middleware
// MUST be added AFTER free endpoints but BEFORE protected endpoints
// Configure payment requirements for protected endpoints
// Using SPLTokenAmount to specify the exact USDC mint address
// Use original working mint (can be overridden via USDC_MINT env var)
const USDC_DEVNET_MINT = process.env.USDC_MINT || "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
const PRICE_USDC_MICRO = process.env.PRICE_USDC_MICRO || "1000";

app.use(
  paymentMiddleware(
    env.address,
    {
      "/unlock": {
        price: {
          amount: "1000", // $0.001 in atoms (6 decimals: 0.001 * 1e6 = 1000)
          asset: {
            address: USDC_DEVNET_MINT, // USDC Devnet mint address (original working mint)
            decimals: 6, // USDC has 6 decimals
          },
        },
        network: env.network as Network,
      },
      "/rag/answer": {
        price: {
          amount: PRICE_USDC_MICRO, // $0.001 in atoms (6 decimals: 0.001 * 1e6 = 1000)
          asset: {
            address: USDC_DEVNET_MINT, // Same mint as /unlock (can be overridden via USDC_MINT)
            decimals: 6, // USDC has 6 decimals
          },
        },
        network: env.network as Network,
      },
      "/quiz/settle": {
        price: {
          amount: PRICE_USDC_MICRO, // $0.001 in atoms (wrong answer penalty)
          asset: {
            address: USDC_DEVNET_MINT,
            decimals: 6,
          },
        },
        network: env.network as Network,
      },
    },
    {
      url: env.facilitatorUrl as Resource,
    }
  )
);

// Mount quiz router AFTER payment middleware
// Free routes (question, submit, next, stats) are accessible
// Protected route (/quiz/settle) is intercepted by middleware above
app.route("/quiz", quizRouter);

// Note: POST /rag/answer is handled by ragRouter above
// It's protected by payment middleware configured below

// Note: The paymentMiddleware automatically handles facilitator /verify and /settle
// when it receives a request with the X-Payment header. No manual proxy needed.

// Unlock endpoint - returns content after payment verification
// (Kept for backward compatibility, not surfaced in UI)
app.get("/unlock", (c) => {
  try {
    return c.json({
      ok: true,
      content: env.lockedContentUrl || "https://example.com/locked-content",
    });
  } catch (error) {
    console.error("Error in /unlock endpoint:", error);
    return c.json({ ok: false, error: "Internal server error" }, 500);
  }
});

// Error handling middleware
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Log startup information
console.log("🚀 x402 Answers Server");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📍 Address: ${env.address}`);
console.log(`🌐 Network: ${env.network}`);
console.log(`💰 Price: $0.001 USDC`);
console.log(`🪙 USDC Mint: ${USDC_DEVNET_MINT}`);
console.log(`💰 RAG Price: ${PRICE_USDC_MICRO} atoms (${Number(PRICE_USDC_MICRO) / 1e6} USDC)`);
console.log(`🔗 Facilitator: ${env.facilitatorUrl}`);
console.log(`📡 RPC: ${env.solanaRpcUrl}`);
console.log(`📚 RAG Endpoints: POST /rag/preview (free), POST /rag/answer (paid)`);
if (env.lockedContentUrl) {
  console.log(`📄 Legacy Content: ${env.lockedContentUrl}`);
}
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const port = 4021;
serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Server running on http://localhost:${info.port}`);
});

