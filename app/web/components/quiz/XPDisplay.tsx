"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { loadState } from "@/lib/quest";

export function XPDisplay() {
  const [displayXP, setDisplayXP] = useState(0);
  const [actualXP, setActualXP] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const state = loadState();
    setDisplayXP(state.xp);
    setActualXP(state.xp);
  }, []);

  useEffect(() => {
    // Listen for storage changes
    const handleStorageChange = () => {
      const state = loadState();
      setActualXP(state.xp);
    };

    // Listen for XP reset events
    const handleXPReset = () => {
      const state = loadState();
      setActualXP(state.xp);
      setDisplayXP(state.xp); // Immediately update display too
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("xp-reset", handleXPReset);
    
    // Poll for same-tab updates
    const interval = setInterval(() => {
      const state = loadState();
      if (state.xp !== actualXP) {
        setActualXP(state.xp);
      }
    }, 100);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("xp-reset", handleXPReset);
      clearInterval(interval);
    };
  }, [actualXP]);

  // Animate XP counter
  useEffect(() => {
    if (actualXP === displayXP) return;

    const diff = actualXP - displayXP;
    const duration = Math.min(1000, Math.abs(diff) * 50); // Max 1 second, scales with diff
    const steps = Math.ceil(duration / 16); // ~60fps
    const increment = diff / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayXP(actualXP);
        clearInterval(timer);
      } else {
        setDisplayXP((prev) => {
          const next = prev + increment;
          // Round to avoid decimals, but ensure we reach target
          return currentStep === steps - 1 ? actualXP : Math.round(next);
        });
      }
    }, 16);

    return () => clearInterval(timer);
  }, [actualXP, displayXP]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/50">
        <TrendingUp className="w-4 h-4 text-neutral-400" />
        <span className="text-sm font-medium text-neutral-400">0 XP</span>
      </div>
    );
  }

  const xpDiff = actualXP - displayXP;

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/50 border border-neutral-800"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={xpDiff !== 0 ? { scale: [1, 1.2, 1], rotate: xpDiff > 0 ? [0, 5, -5, 0] : [0, -5, 5, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <TrendingUp className={`w-4 h-4 ${xpDiff < 0 ? "text-red-400" : "text-[#14F195]"}`} />
      </motion.div>
      <motion.span
        key={displayXP}
        className={`text-sm font-semibold tabular-nums ${xpDiff < 0 ? "text-red-400" : "text-[#14F195]"}`}
        animate={xpDiff !== 0 ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {displayXP} XP
      </motion.span>
      {xpDiff > 0 && (
        <motion.span
          className="text-xs font-bold text-green-400"
          initial={{ opacity: 0, scale: 0, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0, x: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          +{xpDiff}
        </motion.span>
      )}
      {xpDiff < 0 && (
        <motion.span
          className="text-xs font-bold text-red-400"
          initial={{ opacity: 0, scale: 0, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0, x: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {xpDiff}
        </motion.span>
      )}
    </motion.div>
  );
}

