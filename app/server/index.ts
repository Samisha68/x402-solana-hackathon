import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { paymentMiddleware, Network, Resource } from "x402-hono";
import { env } from "./env.js";

const app = new Hono();

// CORS middleware - allow all origins for development
// In production, you may want to restrict this to specific origins
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Payment"],
    credentials: false,
  })
);

// x402 Payment Middleware
// Configure payment requirements for the /unlock endpoint
// Using SPLTokenAmount to specify the exact USDC mint address
const USDC_DEVNET_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

app.use(
  paymentMiddleware(
    env.address,
    {
      "/unlock": {
        price: {
          amount: "1000", // $0.001 in atoms (6 decimals: 0.001 * 1e6 = 1000)
          asset: {
            address: USDC_DEVNET_MINT, // USDC Devnet mint address
            decimals: 6, // USDC has 6 decimals
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

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Note: The paymentMiddleware automatically handles facilitator /verify and /settle
// when it receives a request with the X-Payment header. No manual proxy needed.

// Unlock endpoint - returns content after payment verification
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
console.log("🚀 Creator Access Pass Server");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📍 Address: ${env.address}`);
console.log(`🌐 Network: ${env.network}`);
  console.log(`💰 Price: $0.001 USDC`);
console.log(`🪙 USDC Mint: ${USDC_DEVNET_MINT}`);
console.log(`🔗 Facilitator: ${env.facilitatorUrl}`);
console.log(`📡 RPC: ${env.solanaRpcUrl}`);
if (env.lockedContentUrl) {
  console.log(`📄 Content: ${env.lockedContentUrl}`);
}
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const port = 4021;
serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Server running on http://localhost:${info.port}`);
});

