"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface ResultBannerProps {
  correct: boolean;
  explanation: string;
  xpGained: number;
  onNext?: () => void;
  isExplanation?: boolean; // True when showing explanation after payment
}

export function ResultBanner({ correct, explanation, xpGained, onNext, isExplanation }: ResultBannerProps) {
  // If showing explanation after payment, use neutral style
  const showExplanation = isExplanation || (!correct && xpGained > 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border-2 p-6 sm:p-8 ${
        showExplanation
          ? "bg-neutral-900/60 border-neutral-700/50"
          : correct
          ? "bg-green-950/30 border-green-800/50"
          : "bg-orange-950/30 border-orange-800/50"
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        {showExplanation ? (
          <div className="w-6 h-6 flex-shrink-0 mt-0.5" /> // No icon for explanation
        ) : correct ? (
          <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h3 className={`text-lg font-semibold mb-2 ${
            showExplanation
              ? "text-neutral-300"
              : correct
              ? "text-green-400"
              : "text-orange-400"
          }`}>
            {showExplanation ? "Explanation" : correct ? "Correct!" : "Wrong Answer"}
          </h3>
          <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line">
            {explanation}
          </p>
        </div>
      </div>

      {xpGained !== 0 && (
        <div className="flex items-center justify-center mt-6 pt-6 border-t border-neutral-800">
          <div className={`text-sm ${xpGained < 0 ? "text-red-400" : "text-neutral-400"}`}>
            <span className={`font-semibold ${xpGained < 0 ? "text-red-300" : "text-neutral-300"}`}>
              {xpGained > 0 ? "+" : ""}{xpGained} XP
            </span> {xpGained < 0 ? "penalty" : "earned"}
          </div>
        </div>
      )}
    </motion.div>
  );
}

