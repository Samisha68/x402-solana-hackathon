"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { wrapFetchWithPaymentSolana } from "@/lib/x402-solana";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4021";
const FACILITATOR_URL = process.env.NEXT_PUBLIC_FACILITATOR_URL || "https://facilitator.payai.network";

interface PaymentGateProps {
  questionId: string;
  sessionId: string;
  onComplete: (data: { xp: number; explanationFull: string }) => void;
}

export function PaymentGate({ questionId, sessionId, onComplete }: PaymentGateProps) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  const { connection } = useConnection();

  const handlePay = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const response = await wrapFetchWithPaymentSolana(
        `${API_URL}/quiz/settle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ questionId, sessionId }),
        },
        wallet,
        connection,
        FACILITATOR_URL,
        API_URL
      );

      if (response.ok) {
        // Payment successful - response body contains explanation
        try {
          const responseText = await response.text();
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error("Failed to parse payment response");
            // Still call onComplete with defaults so user can proceed
            onComplete({
              xp: 5,
              explanationFull: "Payment successful! You can now proceed to the next question.",
            });
            return;
          }
          
          onComplete({
            xp: data.xp || 5,
            explanationFull: data.explanationFull || data.explanation || "",
          });
        } catch (parseError) {
          console.error("Payment response error");
          // Still call onComplete with defaults so user can proceed
          onComplete({
            xp: 5,
            explanationFull: "Payment successful! You can now proceed to the next question.",
          });
        }
      } else {
        const responseText = await response.text().catch(() => "Unknown error");
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || `Payment failed with status ${response.status}` };
        }
        setError(errorData.error || `Payment failed with status ${response.status}`);
      }
    } catch (err) {
      console.error("Payment failed");
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-neutral-900/60 rounded-2xl border border-neutral-800 shadow-lg shadow-black/20 p-6 sm:p-8"
    >
      <div className="flex items-start gap-4 mb-6">
        <Lock className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-100 mb-2">
            Payment Required
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Wrong answer! Pay 0.001 USDC to reveal the solution and continue to the next question.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={paying || !wallet.connected}
        className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        {paying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Pay 0.001 USDC to Continue</span>
          </>
        )}
      </button>

      {!wallet.connected && (
        <p className="mt-4 text-xs text-center text-neutral-500">
          Please connect your wallet to proceed
        </p>
      )}
    </motion.div>
  );
}

