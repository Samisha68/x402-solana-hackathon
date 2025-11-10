"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { loadState } from "@/lib/quest";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4021";

interface DailyQuest {
  id: string;
  q: string;
  topic: string;
}

interface DailyQuestCardProps {
  onPick?: (question: string) => void;
  dailyQuestId?: string; // Pass the daily quest ID to track completion
}

export function DailyQuestCard({ onPick, dailyQuestId }: DailyQuestCardProps) {
  const [daily, setDaily] = useState<DailyQuest | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Check if already completed today
    const state = loadState();
    const today = new Date().toISOString().split("T")[0];
    if (state.lastDaily === today) {
      setCompleted(true);
    }

    // Fetch daily quest
    fetch(`${API_URL}/rag/daily`)
      .then((res) => res.json())
      .then((data) => {
        if (data.id && data.q) {
          setDaily(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch daily quest:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Check if daily quest was completed (when dailyQuestId prop changes)
  useEffect(() => {
    if (dailyQuestId && daily && dailyQuestId === daily.id) {
      const state = loadState();
      const today = new Date().toISOString().split("T")[0];
      if (state.lastDaily === today) {
        setCompleted(true);
      }
    }
  }, [dailyQuestId, daily]);

  const handlePractice = () => {
    if (daily && onPick) {
      onPick(daily.q);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading daily quest...</span>
        </div>
      </div>
    );
  }

  if (!daily) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border solana-border shadow-lg shadow-purple-500/10 overflow-hidden">
      {/* Header with solid accent */}
      <div className="h-1.5 bg-[#9945FF]" />
      
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#14F195]" />
          <h3 className="text-sm font-semibold text-slate-100">
            Daily Quest
          </h3>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[#9945FF] uppercase tracking-wide font-medium">
            {daily.topic}
          </p>
          <p className="text-sm text-slate-300">
            {daily.q}
          </p>
        </div>

        <div className="pt-2">
          {completed ? (
            <div className="flex items-center gap-2 text-xs text-[#14F195]">
              <CheckCircle2 className="w-3 h-3" />
              <span>Daily quest completed! +5 XP</span>
            </div>
          ) : (
            <button
              onClick={handlePractice}
              className="w-full px-3 py-2 text-xs font-medium bg-[#9945FF] text-white hover:bg-[#8A3EE6] rounded transition-colors"
            >
              Practice this question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

