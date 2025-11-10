"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Loader2, Send, Lock, CheckCircle2, Copy, ExternalLink, AlertCircle, BookOpen } from "lucide-react";
import { wrapFetchWithPaymentSolana } from "@/lib/x402-solana";
import { awardUnlock, recordDailyCompletion, type Topic } from "@/lib/quest";
import { DailyQuestCard } from "@/components/DailyQuestCard";
import { QuestPanel } from "@/components/QuestPanel";
import { ExamplesModal } from "@/components/ExamplesModal";
import type { RagState, AskPreview, AskFull, RagError } from "./types";
import {
  fetchRagPreview,
  fetchRagAnswer,
  parsePreviewResponse,
  parseFullResponse,
  parseErrorResponse,
  copyToClipboard,
} from "./helpers";

// Dynamically import WalletMultiButton with SSR disabled
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const DEFAULT_QUESTION = "How do I fix a discriminator mismatch?";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4021";
const FACILITATOR_URL = process.env.NEXT_PUBLIC_FACILITATOR_URL || "https://facilitator.payai.network";

interface CatalogItem {
  id: string;
  q: string;
}

interface CatalogTopic {
  title: string;
  items: CatalogItem[];
}

interface Catalog {
  topics: CatalogTopic[];
  count: number;
}

export function RagCard() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [state, setState] = useState<RagState>("idle");
  const [question, setQuestion] = useState<string>(DEFAULT_QUESTION);
  const [preview, setPreview] = useState<AskPreview | null>(null);
  const [fullAnswer, setFullAnswer] = useState<AskFull | null>(null);
  const [error, setError] = useState<RagError | null>(null);
  const [copied, setCopied] = useState(false);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dailyQuestId, setDailyQuestId] = useState<string | null>(null);

  // Load catalog and daily quest on mount
  useEffect(() => {
    fetch(`${API_URL}/rag/catalog`)
      .then((res) => res.json())
      .then((data) => {
        if (data.topics && data.count) {
          setCatalog(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch catalog:", err);
      });

    // Load daily quest ID
    fetch(`${API_URL}/rag/daily`)
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setDailyQuestId(data.id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch daily quest:", err);
      });
  }, []);

  // Show toast notification
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Get 3 random suggestions from catalog
  const getSuggestions = (): string[] => {
    if (!catalog) return [];
    const allItems = catalog.topics.flatMap((topic) => topic.items);
    const shuffled = [...allItems].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map((item) => item.q);
  };

  const handlePickQuestion = (q: string) => {
    setQuestion(q);
    setState("idle");
    setPreview(null);
    setFullAnswer(null);
    setError(null);
  };

  const handleAsk = async () => {
    if (!question.trim()) {
      setError({ error: "Please enter a question" });
      setState("error");
      return;
    }

    setState("asking");
    setError(null);
    setPreview(null);
    setFullAnswer(null);

    try {
      const response = await fetchRagPreview(question.trim());

      if (response.status === 200) {
        const previewData = await parsePreviewResponse(response);
        setPreview(previewData);
        setState("preview");
      } else if (response.status === 404) {
        const errorData = await parseErrorResponse(response);
        setError(errorData);
        setState("error");
      } else {
        setError({ error: `Unexpected status: ${response.status}` });
        setState("error");
      }
    } catch (err) {
      setError({
        error: err instanceof Error ? err.message : "Failed to fetch preview",
      });
      setState("error");
    }
  };

  const handlePay = async () => {
    if (!question.trim() || !preview) {
      return;
    }

    // Check wallet connection
    if (!wallet.connected || !wallet.publicKey) {
      setError({ error: "Please connect your wallet first" });
      setState("error");
      return;
    }

    setState("paying");
    setError(null);

    try {
      console.log("[RagCard] Starting payment flow for answer ID:", preview.id);
      console.log("[RagCard] Wallet connected:", wallet.connected, wallet.publicKey?.toString());
      
      // Use wrapFetchWithPaymentSolana to handle x402 payment flow
      const response = await wrapFetchWithPaymentSolana(
        `${API_URL}/rag/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: preview.id }),
        },
        wallet,
        connection,
        FACILITATOR_URL,
        API_URL
      );

      console.log("[RagCard] Payment flow completed, response status:", response.status);

      if (response.ok) {
        const fullData = await parseFullResponse(response);
        
        // Check for transaction signature in headers
        // Try X-Payment-Response first (from middleware), then X-Transaction-Signature (from our polling)
        let actualTxSig: string | null = null;
        
        const xPaymentResponse = response.headers.get("X-Payment-Response");
        if (xPaymentResponse) {
          try {
            // Browser-compatible base64 decode
            const decoded = atob(xPaymentResponse);
            const paymentResponse = JSON.parse(decoded);
            actualTxSig = paymentResponse.transaction;
          } catch (e) {
            console.error("Failed to parse X-Payment-Response header:", e);
          }
        }
        
        // Fallback: check our custom header from network polling
        if (!actualTxSig) {
          actualTxSig = response.headers.get("X-Transaction-Signature");
        }
        
        // Update fullData with actual transaction signature if found
        if (actualTxSig) {
          fullData.txSig = actualTxSig;
          console.log("🎉 Payment verified on-chain!", {
            signature: actualTxSig,
            explorer: `https://explorer.solana.com/tx/${actualTxSig}?cluster=devnet`,
          });
        } else {
          console.log("⚠️ Transaction signature not found - transaction may still be processing");
        }
        
        setFullAnswer(fullData);
        setState("unlocked");

        // Award unlock and XP
        if (fullData.topic && fullData.id) {
          const result = awardUnlock(fullData.topic as Topic, fullData.id);
          let xpGained = 10;
          
          // Check if this is the daily quest and award bonus XP
          if (dailyQuestId && fullData.id === dailyQuestId) {
            const todayISO = new Date().toISOString();
            const dailyResult = recordDailyCompletion(todayISO);
            xpGained = 15; // 10 for answer + 5 for daily quest
            setToast(`Daily quest completed! +15 XP total (${dailyResult.rank})`);
          } else {
            setToast(`Progress updated: +10 XP (${result.rank})`);
          }
          
          // Force QuestPanel to refresh by triggering a storage event
          window.dispatchEvent(new Event("storage"));
          
          if (result.badges.length > 0) {
            setTimeout(() => {
              setToast(`Badge unlocked: ${result.badges.join(", ")}!`);
            }, 3000);
          }
        }

        // Save to localStorage
        try {
          const history = JSON.parse(localStorage.getItem("rag-history") || "[]");
          history.unshift({
            id: fullData.id,
            question: question.trim(),
            answerMd: fullData.answerMd,
            txSig: fullData.txSig,
            timestamp: Date.now(),
          });
          // Keep only last 10
          localStorage.setItem("rag-history", JSON.stringify(history.slice(0, 10)));
        } catch (e) {
          // Ignore localStorage errors
        }
      } else {
        const errorData = await parseErrorResponse(response);
        setError(errorData);
        setState("error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed";
      setError({
        error: errorMessage,
        suggestion: err instanceof Error && errorMessage.includes("cancelled")
          ? "Payment was cancelled. Please try again."
          : err instanceof Error && errorMessage.includes("verification")
          ? "Payment verification failed. Please check your wallet and try again."
          : undefined,
      });
      setState("error");
      console.error("Payment error:", err);
    }
  };

  const handleCopyTxSig = async () => {
    if (!fullAnswer) return;
    const success = await copyToClipboard(fullAnswer.txSig);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setState("idle");
    setQuestion(DEFAULT_QUESTION);
    setPreview(null);
    setFullAnswer(null);
    setError(null);
  };

  const suggestions = getSuggestions();

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-[#9945FF] text-white rounded-lg shadow-lg shadow-purple-500/30 animate-in slide-in-from-top">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Quest Card */}
          <DailyQuestCard onPick={handlePickQuestion} dailyQuestId={dailyQuestId || undefined} />

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border solana-border shadow-lg shadow-purple-500/10">
      <div className="p-6 space-y-6">
        {/* Wallet Connection */}
        <div className="flex justify-end">
          <WalletMultiButton />
        </div>

        {/* Question Input */}
        <div className="space-y-2">
          <label htmlFor="question" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            Ask a Solana Question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (state === "idle" || state === "error") {
                  handleAsk();
                }
              }
            }}
            placeholder="How do I fix a discriminator mismatch?"
            disabled={state === "asking" || state === "paying"}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            rows={3}
          />
                <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Press Cmd/Ctrl + Enter to submit
          </p>
                  <button
                    onClick={() => setExamplesOpen(true)}
                    className="text-xs text-[#14F195] hover:text-[#9945FF] transition-colors flex items-center gap-1 font-medium hover:underline"
                  >
                    <BookOpen className="w-3 h-3" />
                    Browse Examples
                  </button>
                </div>
        </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (state === "idle" || state === "error") && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePickQuestion(suggestion)}
                        className="text-xs px-3 py-1.5 bg-slate-800 border border-[#9945FF] hover:border-[#14F195] hover:bg-[#9945FF]/10 text-slate-300 hover:text-[#14F195] rounded transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

        {/* Ask Button */}
        {(state === "idle" || state === "error") && (
          <button
            onClick={handleAsk}
            disabled={!question.trim()}
                  className="w-full bg-[#9945FF] text-white hover:bg-[#8A3EE6] disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Ask Question
          </button>
        )}

        {/* Loading State */}
        {(state === "asking" || state === "paying") && (
          <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>
              {state === "asking" ? "Searching knowledge base..." : "Processing payment..."}
            </span>
          </div>
        )}

        {/* Preview State (200) */}
        {state === "preview" && preview && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-2 mb-2">
                <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                    Preview
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {preview.preview}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handlePay}
              disabled={!wallet.connected}
                    className="w-full bg-[#9945FF] text-white hover:bg-[#8A3EE6] disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {wallet.connected ? "Pay 1¢ to Unlock Full Answer" : "Connect Wallet to Unlock"}
            </button>
          </div>
        )}

        {/* Unlocked State (200) */}
        {state === "unlocked" && fullAnswer && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Answer Unlocked!</span>
            </div>

            {/* Full Answer (Markdown) */}
            <div className="prose prose-slate dark:prose-invert max-w-none p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  code: ({ className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !className || !match;
                    return !isInline ? (
                      <div className="relative group">
                        <pre className="bg-slate-900 dark:bg-slate-800 text-slate-100 p-4 rounded-lg overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                        <button
                          onClick={async () => {
                            const codeText = String(children).replace(/\n$/, "");
                            await copyToClipboard(codeText);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4 text-slate-200" />
                        </button>
                      </div>
                    ) : (
                      <code
                        className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {fullAnswer.answerMd}
              </ReactMarkdown>
            </div>

            {/* Transaction Signature */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                Transaction Signature
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={fullAnswer.txSig}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono"
                />
                <button
                  onClick={handleCopyTxSig}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg transition-colors flex items-center gap-2"
                  title="Copy signature"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={`https://explorer.solana.com/tx/${fullAnswer.txSig}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg transition-colors flex items-center gap-2"
                  title="View on Solana Explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Ask Another Question
            </button>
          </div>
        )}

        {/* Error State */}
        {state === "error" && error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                  {error.error}
                </p>
                {error.suggestion && (
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error.suggestion}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleReset}
              className="mt-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-1.5 px-3 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
        </div>

        {/* Sidebar - Quest Panel */}
        <div className="lg:col-span-1">
          <QuestPanel />
        </div>
      </div>

      {/* Examples Modal */}
      <ExamplesModal
        open={examplesOpen}
        onClose={() => setExamplesOpen(false)}
        onSelect={handlePickQuestion}
      />
    </>
  );
}
