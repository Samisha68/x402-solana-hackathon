"use client";

import { motion } from "framer-motion";
import { Trophy, Copy, Check, Sparkles, Share2, RefreshCcw } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

type Topic = "Solana Basics" | "Anchor Basics" | "PDAs & Programs" | "Transactions & Troubleshooting";

interface ScorecardProps {
  name: string;
  topic: Topic;
  correct: number;
  wrong: number;
  totalXP: number;
  rank: string;
  onRestart?: () => void; // optional for SPA flows; falls back to reload
}

function getTopicTitle(topic: Topic): string {
  const titles: Record<Topic, string> = {
    "Solana Basics": "Solana Basics Master",
    "Anchor Basics": "Anchor Basics Master",
    "PDAs & Programs": "PDAs & Programs Master",
    "Transactions & Troubleshooting": "Transactions & Troubleshooting Master",
  };
  return titles[topic];
}

export function Scorecard({ name, topic, correct, wrong, totalXP, rank, onRestart }: ScorecardProps) {
  const topicTitle = getTopicTitle(topic);
  const [copied, setCopied] = useState(false);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const total = correct + wrong;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  const shareText = useMemo(() => {
    return `I'm a ${topicTitle}! 🎯\n\nScored ${percentage}% (${correct}/${total} correct)\nTotal XP: ${totalXP}\n\nTry it yourself:`;
  }, [topicTitle, percentage, correct, total, totalXP]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleXShare = () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = encodeURIComponent(shareText);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
  };

  const handleRestart = () => {
    if (onRestart) return onRestart();
    if (typeof window !== "undefined") window.location.reload();
  };

  // Animate percentage counter
  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = percentage / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedPercentage(percentage);
        clearInterval(timer);
      } else {
        setAnimatedPercentage(Math.round(increment * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [percentage]);

  // Confetti burst (lightweight, no deps)
  useEffect(() => {
    // Gentle particle sparkles using emoji + absolute elements (no canvas lib)
    const root = document.getElementById("scorecard-aurora");
    if (!root) return;
    const particles = Array.from({ length: 18 }).map(() => {
      const el = document.createElement("div");
      el.textContent = "✦";
      el.style.position = "absolute";
      el.style.pointerEvents = "none";
      el.style.opacity = "0.0";
      el.style.filter = "drop-shadow(0 0 6px rgba(255,255,255,.4))";
      const x = 30 + Math.random() * 40; // 30–70%
      const y = 25 + Math.random() * 50; // 25–75%
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.style.transition = "transform 900ms cubic-bezier(.2,.8,.2,1), opacity 900ms ease";
      root.appendChild(el);
      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = `translate(${(Math.random() - 0.5) * 120}px, ${(Math.random() - 0.5) * 90}px) scale(${1 + Math.random() * 0.6}) rotate(${(Math.random() - 0.5) * 40}deg)`;
        setTimeout(() => {
          el.style.opacity = "0";
          setTimeout(() => el.remove(), 500);
        }, 900);
      });
      return el;
    });
    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  // Progress ring styles
  const ringSize = 164;
  const ringStroke = 12;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const progress = percentage / 100;
  const dashOffset = circumference * (1 - progress);

  // Color logic
  const scoreColor =
    percentage >= 90 ? "text-emerald-400" :
    percentage >= 70 ? "text-emerald-300" :
    percentage >= 50 ? "text-amber-300" :
    "text-rose-400";


  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative max-w-3xl mx-auto px-4 sm:px-6 pb-8"
    >
      {/* Aurora / Glow background */}
      <div
        id="scorecard-aurora"
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -inset-24 blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(60% 40% at 30% 20%, rgba(16,185,129,.18) 0%, transparent 60%), radial-gradient(50% 35% at 70% 30%, rgba(129,140,248,.14) 0%, transparent 60%), radial-gradient(40% 30% at 50% 80%, rgba(244,63,94,.10) 0%, transparent 60%)"
          }}
        />
      </div>

      <div
        className="relative rounded-3xl border border-neutral-800/80 bg-neutral-900/70 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)]"
      >
        {/* Top banner */}
        <div className="relative flex items-center justify-between px-6 sm:px-10 py-5 border-b border-neutral-800/70 bg-gradient-to-b from-neutral-900/70 to-neutral-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-neutral-300" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Well played, {name}</p>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-neutral-100">{topicTitle}</h2>
            </div>
          </div>

        </div>

        {/* Core grid */}
        <div className="p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Progress Ring Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="relative rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 sm:p-7"
            >
              <div className="flex items-center justify-center">
                <div className="relative" style={{ width: ringSize, height: ringSize }}>
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "conic-gradient(from 0deg, rgba(16,185,129,.25) 0% 30%, rgba(99,102,241,.20) 30% 60%, rgba(244,63,94,.18) 60% 100%)",
                      filter: "blur(16px)",
                      opacity: 0.45
                    }}
                  />
                  {/* Track */}
                  <svg width={ringSize} height={ringSize} className="rotate-[-90deg]">
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={ringRadius}
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth={ringStroke}
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Progress */}
                    <motion.circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={ringRadius}
                      stroke="url(#grad)"
                      strokeWidth={ringStroke}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference}
                      animate={{ strokeDashoffset: dashOffset }}
                      transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
                      style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,.35))" }}
                    />
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="50%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <motion.div
                      key={animatedPercentage}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={`text-5xl font-extrabold tracking-tight ${scoreColor}`}
                    >
                      {animatedPercentage}%
                    </motion.div>
                    <div className="mt-1 text-xs uppercase tracking-widest text-neutral-400">Accuracy</div>
                    <div className="mt-3 text-[11px] text-neutral-400">
                      {correct}/{total} correct
                    </div>
                  </div>
                </div>
              </div>

              {/* Inline stats */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-center">
                  <div className="text-xs text-neutral-400">Correct</div>
                  <div className="text-xl font-semibold text-emerald-300">{correct}</div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-center">
                  <div className="text-xs text-neutral-400">Wrong</div>
                  <div className="text-xl font-semibold text-rose-400">{wrong}</div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-center">
                  <div className="text-xs text-neutral-400">Total XP</div>
                  <div className="text-xl font-semibold text-violet-300">{totalXP}</div>
                </div>
              </div>
            </motion.div>

            {/* Topic Mastery & XP Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Topic Mastery</div>
                  <div className="text-2xl font-bold text-neutral-100">{topicTitle}</div>
                </div>
              </div>

              {/* XP Display */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span>Total XP</span>
                  <span className="text-lg font-semibold text-violet-300">{totalXP} XP</span>
                </div>
              </div>

              {/* Tips / praise */}
              <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                <div className="text-sm text-neutral-300">
                  {percentage >= 90 && "Phenomenal run — you're speedrunning the ladder."}
                  {percentage >= 70 && percentage < 90 && "Strong performance! A couple more perfect rounds to rank up."}
                  {percentage >= 50 && percentage < 70 && "Nice! Review missed questions and push past 70%."}
                  {percentage < 50 && "Good start. Keep practicing — momentum > perfection."}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleXShare}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              aria-label="Share score on X"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share on X</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              aria-label="Copy score to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="text-sm font-medium">{copied ? "Copied!" : "Copy"}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleRestart}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              aria-label="Retake quiz"
            >
              <RefreshCcw className="w-4 h-4" />
              <span className="text-sm font-medium">Take quiz again</span>
            </motion.button>
          </div>

          {/* Fine print */}
          <p className="mt-6 mb-4 text-center text-xs text-neutral-500">
            Pro tip: keep practicing to master all topics — consistency is key!
          </p>
        </div>
      </div>
    </motion.div>
  );
}
