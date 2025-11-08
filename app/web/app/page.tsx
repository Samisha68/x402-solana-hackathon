"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { Lock, Unlock, Loader2, CheckCircle2 } from "lucide-react";
import { wrapFetchWithPaymentSolana } from "@/lib/x402-solana";

// Dynamically import WalletMultiButton with SSR disabled to avoid hydration errors
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

type PaymentState = "idle" | "loading" | "payment_required" | "processing" | "success" | "error";

interface PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset?: string;
}

interface UnlockResponse {
  ok: boolean;
  content?: string;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const FACILITATOR_URL = process.env.NEXT_PUBLIC_FACILITATOR_URL || "https://facilitator.payai.network";

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [unlockedContent, setUnlockedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const creatorName = process.env.NEXT_PUBLIC_CREATOR_NAME || "Creator";
  const creatorAvatar = process.env.NEXT_PUBLIC_CREATOR_AVATAR_URL;
  const creatorDescription = process.env.NEXT_PUBLIC_CREATOR_DESCRIPTION || "Building open internet tools";

  const handleUnlock = async () => {
    // Check wallet connection
    if (!wallet.connected || !wallet.publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    setPaymentState("loading");
    setError(null);

    try {
      // Use wrapped fetch with automatic payment handling
        const response = await wrapFetchWithPaymentSolana(
          `${API_URL}/unlock`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
          wallet,
          connection,
          FACILITATOR_URL,
          API_URL
        );

      if (response.ok) {
        const data: UnlockResponse = await response.json();
        if (data.ok && data.content) {
          setUnlockedContent(data.content);
          setPaymentState("success");
          
          // Check for transaction signature in X-Payment-Response header
          const xPaymentResponse = response.headers.get("X-Payment-Response");
          if (xPaymentResponse) {
            try {
              const paymentResponse = JSON.parse(
                Buffer.from(xPaymentResponse, "base64").toString("utf-8")
              );
              console.log("🎉 Payment verified on-chain!", {
                signature: paymentResponse.transaction,
                explorer: `https://explorer.solana.com/tx/${paymentResponse.transaction}?cluster=devnet`,
              });
            } catch (e) {
              // Ignore parsing errors
            }
          }
        } else {
          setError(data.error || "Failed to unlock content");
          setPaymentState("error");
        }
      } else {
        const data = await response.json();
        setError(data.error || "Request failed");
        setPaymentState("error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      setPaymentState("error");
      console.error("Payment error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Wallet Connection Button */}
        <div className="mb-6 flex justify-end">
          <WalletMultiButton />
        </div>

        {/* Creator Profile Header */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
          <div className="p-6">
            <div className="flex items-center gap-4">
              {creatorAvatar && (
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{creatorName}</h1>
                {creatorDescription && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{creatorDescription}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Premium Content</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Unlock this exclusive content for $0.001 USDC
              </p>

            <div className="space-y-6">
              {/* Locked Content Preview */}
              {paymentState !== "success" && (
                <div className="relative">
                  <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                      <Lock className="w-16 h-16 text-slate-400" />
                    </div>
                    <div className="relative z-10 text-center p-8">
                        <p className="text-slate-300 mb-4">Content is locked</p>
                        <p className="text-sm text-slate-400">
                          Pay $0.001 USDC to unlock this premium content
                        </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Unlocked Content */}
              {paymentState === "success" && unlockedContent && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Content Unlocked!</span>
                  </div>
                  <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <div className="text-center p-8">
                      <Unlock className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2 text-slate-900 dark:text-slate-100">Thank you for your support!</p>
                      <a
                        href={unlockedContent}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Access Content →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Flow */}
              {paymentState === "idle" && (
                <button
                  onClick={handleUnlock}
                  disabled={!wallet.connected}
                  className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                    {wallet.connected ? "Unlock for $0.001 USDC" : "Connect Wallet to Unlock"}
                </button>
              )}

              {paymentState === "loading" && (
                <button
                  disabled
                  className="w-full bg-slate-400 dark:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </button>
              )}

              {paymentState === "processing" && (
                <button
                  disabled
                  className="w-full bg-slate-400 dark:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying payment...
                </button>
              )}

              {paymentState === "error" && error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  <button
                    onClick={() => {
                      setPaymentState("idle");
                      setError(null);
                    }}
                    className="mt-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-1.5 px-3 rounded transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
