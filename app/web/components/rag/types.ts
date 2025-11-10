/**
 * TypeScript types for RAG (x402 Answers) feature
 */

export interface AskReq {
  question: string;
}

export interface AskPreview {
  preview: string;
  id: string;
}

export interface AskFull {
  answerMd: string;
  id: string;
  topic?: string;
  txSig: string;
}

export interface RagError {
  error: string;
  suggestion?: string;
}

export type RagState = "idle" | "asking" | "preview" | "paying" | "unlocked" | "error";

