"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Info } from "lucide-react";

type Topic = "Solana Basics" | "Anchor Basics" | "PDAs & Programs" | "Transactions & Troubleshooting";

interface WelcomeScreenProps {
  onStart: (name: string, topic: Topic) => void;
}

const TOPICS: { value: Topic; label: string; description: string }[] = [
  { value: "Solana Basics", label: "Solana Basics", description: "Accounts, programs, and instructions" },
  { value: "Anchor Basics", label: "Anchor Basics", description: "Context, accounts, and constraints" },
  { value: "PDAs & Programs", label: "PDAs & Programs", description: "Program Derived Addresses and program structure" },
  { value: "Transactions & Troubleshooting", label: "Transactions & Troubleshooting", description: "Transaction handling and common errors" },
];

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [name, setName] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showTour, setShowTour] = useState(false);

  const handleStart = () => {
    if (name.trim() && selectedTopic) {
      onStart(name.trim(), selectedTopic);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 sm:px-6"
    >
      <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 shadow-lg shadow-black/20 p-8 sm:p-12 text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-100">
            Welcome to CoinRush
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base">
            Choose a topic and test your knowledge with 10 questions. Learn and earn XP!
          </p>
        </div>

        {/* Warning */}
        <div className="bg-orange-950/30 border border-orange-800/50 rounded-xl p-4 text-left">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-300 mb-1">
                Important: Don't refresh!
              </p>
              <p className="text-xs text-orange-200/80">
                Your progress is stored locally. Refreshing the page will reset your quiz and you'll lose all progress.
              </p>
            </div>
          </div>
        </div>

        {/* Topic Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-neutral-300 text-left">
            Choose a topic
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOPICS.map((topic) => (
              <button
                key={topic.value}
                onClick={() => setSelectedTopic(topic.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedTopic === topic.value
                    ? "border-[#14F195] bg-[#14F195]/10"
                    : "border-neutral-800 bg-neutral-950/50 hover:border-neutral-700"
                }`}
              >
                <div className="font-semibold text-neutral-100 mb-1">{topic.label}</div>
                <div className="text-xs text-neutral-400">{topic.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Name Input */}
        <div className="space-y-3">
          <label htmlFor="name" className="block text-sm font-medium text-neutral-300 text-left">
            Enter your name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && selectedTopic) {
                handleStart();
              }
            }}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#14F195] focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        {/* Tour Button */}
        <button
          onClick={() => setShowTour(!showTour)}
          className="text-sm text-neutral-400 hover:text-neutral-300 underline"
        >
          {showTour ? "Hide" : "Show"} example tour
        </button>

        {/* Tour Content */}
        {showTour && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-neutral-950/50 rounded-xl p-6 text-left space-y-4 border border-neutral-800"
          >
            <h3 className="text-lg font-semibold text-neutral-200">How it works:</h3>
            <div className="space-y-3 text-sm text-neutral-400">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#14F195]/20 text-[#14F195] flex items-center justify-center font-semibold text-xs">
                  1
                </span>
                <p>You'll get <strong className="text-neutral-300">10 questions</strong> from your selected topic</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#14F195]/20 text-[#14F195] flex items-center justify-center font-semibold text-xs">
                  2
                </span>
                <p>Each question has a <strong className="text-neutral-300">10-second timer</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#14F195]/20 text-[#14F195] flex items-center justify-center font-semibold text-xs">
                  3
                </span>
                <p><strong className="text-green-400">Correct answer</strong>: +15 XP</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#14F195]/20 text-[#14F195] flex items-center justify-center font-semibold text-xs">
                  4
                </span>
                <p><strong className="text-red-400">Wrong answer</strong>: -5 XP, then pay to see explanation</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#14F195]/20 text-[#14F195] flex items-center justify-center font-semibold text-xs">
                  5
                </span>
                <p>After payment, you get <strong className="text-neutral-300">+5 XP</strong> and can continue</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#14F195]/20 text-[#14F195] flex items-center justify-center font-semibold text-xs">
                  6
                </span>
                <p>At the end, you'll get a <strong className="text-neutral-300">scorecard</strong> to share!</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!name.trim() || !selectedTopic}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
            name.trim() && selectedTopic
              ? "bg-[#14F195] text-black hover:bg-[#12D882] shadow-lg shadow-[#14F195]/20"
              : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
          }`}
        >
          <Play className="w-5 h-5" />
          Start Quiz
        </button>
      </div>
    </motion.div>
  );
}

