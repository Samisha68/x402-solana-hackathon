import { Hono } from "hono";
import { KB, findBestMatch, findById, firstSentence, catalog, dailyPick } from "../rag/knowledge.js";

const ragRouter = new Hono();

/**
 * POST /rag/preview (free)
 * 
 * Body: { question: string }
 * 
 * Returns:
 * - 200: { type: "preview", id: string, preview: string }
 * - 404: { type: "no_match", message: string }
 * - 400: Invalid request body
 */
ragRouter.post("/preview", async (c) => {
  try {
    const body = await c.req.json();
    const question = body.question;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return c.json(
        { error: "Invalid request: 'question' field is required and must be a non-empty string" },
        400
      );
    }

    const match = findBestMatch(question.trim());

    if (!match) {
      return c.json(
        {
          type: "no_match",
          message: "Not in knowledge base yet.",
        },
        404
      );
    }

    const preview = firstSentence(match.aMd);

    return c.json({
      type: "preview",
      id: match.id,
      preview,
    });
  } catch (error) {
    console.error("Error in /rag/preview:", error);
    
    if (error instanceof SyntaxError) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }

    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /rag/answer (paid via x402)
 * 
 * Body: { id: string }
 * 
 * This endpoint is protected by x402-hono paymentMiddleware.
 * - If unpaid: middleware returns 402 with accepts[] (do not handle here)
 * - If paid: middleware allows through, we return full answer
 * 
 * Returns:
 * - 200: { type: "answer", id: string, answerMd: string, txSig: string }
 * - 404: Answer not found for given id
 * - 400: Invalid request body
 */
ragRouter.post("/answer", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return c.json(
        { error: "Invalid request: 'id' field is required and must be a non-empty string" },
        400
      );
    }

    const entry = findById(id.trim());

    if (!entry) {
      return c.json(
        { error: "Answer not found for the given id" },
        404
      );
    }

    // Extract transaction signature from X-Payment-Response header if available
    // The x402-hono middleware sets this after successful settlement
    const xPaymentResponse = c.req.header("X-Payment-Response");
    let txSig = "pending";

    if (xPaymentResponse) {
      try {
        const paymentResponse = JSON.parse(
          Buffer.from(xPaymentResponse, "base64").toString("utf-8")
        );
        txSig = paymentResponse.transaction || "pending";
      } catch (e) {
        // Ignore parsing errors, use default
      }
    }

    // Log minimal info
    console.log(JSON.stringify({
      route: "/rag/answer",
      status: 200,
      id: entry.id,
      txSig,
    }));

    return c.json({
      type: "answer",
      id: entry.id,
      topic: entry.topic,
      answerMd: entry.aMd,
      txSig,
    });
  } catch (error) {
    console.error("Error in /rag/answer:", error);
    
    if (error instanceof SyntaxError) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }

    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /rag/catalog
 * 
 * Returns grouped topics with question IDs and text
 */
ragRouter.get("/catalog", async (c) => {
  try {
    const result = catalog();
    return c.json(result);
  } catch (error) {
    console.error("Error in /rag/catalog:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /rag/daily
 * 
 * Returns deterministic daily question based on UTC date
 */
ragRouter.get("/daily", async (c) => {
  try {
    const todayISO = new Date().toISOString();
    const daily = dailyPick(todayISO);
    
    if (!daily) {
      return c.json({ error: "No questions available" }, 404);
    }
    
    return c.json(daily);
  } catch (error) {
    console.error("Error in /rag/daily:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { ragRouter };
