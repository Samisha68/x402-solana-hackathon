"use client";

import { useState, useEffect } from "react";
import { Trophy, Award, TrendingUp } from "lucide-react";
import { loadState, getRank, getTopicProgress, type Topic } from "@/lib/quest";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4021";

interface CatalogTopic {
  title: Topic;
  items: { id: string; q: string }[];
}

interface Catalog {
  topics: CatalogTopic[];
  count: number;
}

export function QuestPanel() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [state, setState] = useState(loadState());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load catalog
    fetch(`${API_URL}/rag/catalog`)
      .then((res) => res.json())
      .then((data) => {
        if (data.topics && data.count) {
          setCatalog(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch catalog:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for storage changes (when quest state updates)
    const handleStorageChange = () => {
      setState(loadState());
    };

    window.addEventListener("storage", handleStorageChange);
    // Also check frequently for same-tab updates (when XP is awarded)
    const interval = setInterval(() => {
      const newState = loadState();
      if (newState.xp !== state.xp || JSON.stringify(newState.unlocked) !== JSON.stringify(state.unlocked)) {
        setState(newState);
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [state.xp, state.unlocked]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Loading progress...
        </div>
      </div>
    );
  }

  const rank = getRank(state.xp);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border solana-border shadow-lg shadow-purple-500/10 p-4 space-y-4">
      {/* XP and Rank */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#14F195]" />
            <span className="text-sm font-medium text-[#14F195]">
              XP: {state.xp}
            </span>
          </div>
          <span className="text-xs text-[#9945FF] font-medium">
            {rank}
          </span>
        </div>
        
        {state.streak && state.streak > 0 && (
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Streak: {state.streak} days
          </div>
        )}
      </div>

      {/* Badges */}
      {state.badges.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-xs font-medium text-[#14F195] uppercase tracking-wide">
              Badges
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.badges.map((badge) => (
              <div
                key={badge}
                className="px-2 py-1 text-xs font-medium bg-[#9945FF]/10 border border-[#9945FF] text-[#14F195] rounded"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Progress */}
      {catalog && catalog.topics.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-xs font-medium text-[#14F195] uppercase tracking-wide">
              Progress by Topic
            </span>
          </div>
          <div className="space-y-2">
            {catalog.topics.map((topic) => {
              const progress = getTopicProgress(topic.title, topic.items.length);
              return (
                <div key={topic.title} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      {topic.title}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {progress.unlocked}/{progress.total}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#14F195] transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

