/**
 * Helper functions for RAG feature
 */

import type { AskPreview, AskFull, RagError } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4021";

/**
 * Extract first sentence from text
 */
export function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  if (match) {
    return match[0].trim();
  }
  return text.substring(0, 100).trim() + (text.length > 100 ? "..." : "");
}

/**
 * Fetch RAG preview endpoint (free)
 * @param question - The question to ask
 * @returns Response object
 */
export async function fetchRagPreview(question: string): Promise<Response> {
  return fetch(`${API_URL}/rag/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });
}

/**
 * Fetch RAG answer endpoint (paid via x402)
 * This should be called via wrapFetchWithPaymentSolana from x402-solana.ts
 * @param id - The answer ID from preview
 * @returns Response object
 */
export async function fetchRagAnswer(id: string): Promise<Response> {
  return fetch(`${API_URL}/rag/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });
}

/**
 * Parse 200 preview response
 */
export async function parsePreviewResponse(
  response: Response
): Promise<AskPreview> {
  const data = await response.json();
  if (data.type === "preview" && data.id && data.preview) {
    return { preview: data.preview, id: data.id };
  }
  throw new Error("Invalid preview response format");
}

/**
 * Parse 200 full answer response
 */
export async function parseFullResponse(response: Response): Promise<AskFull> {
  const data = await response.json();
  if (data.type === "answer" && data.answerMd && data.id && data.txSig) {
    return {
      answerMd: data.answerMd,
      id: data.id,
      topic: data.topic,
      txSig: data.txSig,
    };
  }
  throw new Error("Invalid full response format");
}

/**
 * Parse error response
 */
export async function parseErrorResponse(response: Response): Promise<RagError> {
  const data = await response.json();
  if (data.type === "no_match") {
    return {
      error: data.message || "Not in knowledge base yet.",
      suggestion: "Try asking about: discriminator mismatch, PDA seeds, rent exemption, compute budget, or account re-initialization",
    };
  }
  return {
    error: data.error || "Unknown error",
    suggestion: data.suggestion,
  };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}
