/**
 * Gamification helpers for x402 Answers
 * Stores progress in localStorage (no backend DB needed)
 */

export type Topic =
  | "Anchor Basics"
  | "PDAs"
  | "Errors"
  | "Transactions"
  | "Tokens"
  | "Programs";

export type Level = 1 | 2 | 3 | 4;

export const LEVEL_NAMES: Record<Level, string> = {
  1: "Wallet Warmer",
  2: "Account Whisperer",
  3: "PDA Prodigy",
  4: "Anchor Adept",
};

export const LEVEL_XP_RANGES: Record<Level, { min: number; max: number }> = {
  1: { min: 0, max: 49 },
  2: { min: 50, max: 99 },
  3: { min: 100, max: 199 },
  4: { min: 200, max: Infinity },
};

/**
 * Get level from XP
 */
export function getLevel(xp: number): Level {
  if (xp < 50) return 1;
  if (xp < 100) return 2;
  if (xp < 200) return 3;
  return 4;
}

export interface QuestState {
  xp: number;
  unlocked: Record<string, string[]>; // topic -> id[]
  badges: string[];
  lastDaily?: string; // ISO date string
  streak?: number;
}

const STORAGE_KEY = "x402-quest-state";

/**
 * Load quest state from localStorage
 */
export function loadState(): QuestState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // Ignore parse errors
  }
  return {
    xp: 0,
    unlocked: {},
    badges: [],
    streak: 0,
  };
}

/**
 * Reset quest state (for new quiz sessions)
 */
export function resetQuestState(): QuestState {
  const newState: QuestState = {
    xp: 0,
    unlocked: {},
    badges: [],
    streak: 0,
  };
  saveState(newState);
  return newState;
}

/**
 * Save quest state to localStorage
 */
export function saveState(state: QuestState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Get rank based on XP
 */
export function getRank(xp: number): string {
  if (xp < 50) return "Wallet Warmer";
  if (xp < 100) return "Account Whisperer";
  if (xp < 200) return "PDA Prodigy";
  return "Anchor Adept";
}

/**
 * Award unlock for a topic/question and update XP
 */
export function awardUnlock(
  topic: Topic,
  id: string
): { xp: number; rank: string; unlocked: Record<string, string[]>; badges: string[] } {
  const state = loadState();
  
  // Initialize topic if needed
  if (!state.unlocked[topic]) {
    state.unlocked[topic] = [];
  }
  
  // Add ID if new
  if (!state.unlocked[topic].includes(id)) {
    state.unlocked[topic].push(id);
    state.xp += 10;
  }
  
  // Check for badges
  const newBadges = checkBadges(state, topic);
  state.badges = Array.from(new Set([...state.badges, ...newBadges]));
  
  saveState(state);
  
  return {
    xp: state.xp,
    rank: getRank(state.xp),
    unlocked: state.unlocked,
    badges: state.badges,
  };
}

/**
 * Record daily quest completion
 */
export function recordDailyCompletion(todayISO: string): {
  xp: number;
  rank: string;
  streak: number;
} {
  const state = loadState();
  const today = todayISO.split("T")[0]; // YYYY-MM-DD
  
  // Check if already completed today
  if (state.lastDaily === today) {
    return {
      xp: state.xp,
      rank: getRank(state.xp),
      streak: state.streak || 0,
    };
  }
  
  // Calculate streak
  let streak = state.streak || 0;
  if (state.lastDaily) {
    const lastDate = new Date(state.lastDaily);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      streak += 1;
    } else if (daysDiff > 1) {
      // Streak broken
      streak = 1;
    }
    // daysDiff === 0 means same day, already handled above
  } else {
    // First daily
    streak = 1;
  }
  
  state.xp += 5;
  state.lastDaily = today;
  state.streak = streak;
  
  // Check for daily learner badge
  if (streak >= 3 && !state.badges.includes("Daily Learner")) {
    state.badges.push("Daily Learner");
  }
  
  saveState(state);
  
  return {
    xp: state.xp,
    rank: getRank(state.xp),
    streak,
  };
}

/**
 * Check for badge eligibility
 */
export function checkBadges(state: QuestState, topic?: Topic): string[] {
  const newBadges: string[] = [];
  
  // PDA Master: all PDAs topic unlocked
  if (topic === "PDAs" || !topic) {
    const pdaUnlocked = state.unlocked["PDAs"] || [];
    // Check if all PDAs entries are unlocked (approximate: if >= 5)
    if (pdaUnlocked.length >= 5 && !state.badges.includes("PDA Master")) {
      newBadges.push("PDA Master");
    }
  }
  
  // Rent-Ready: any rent-related error unlocked
  if (topic === "Errors" || !topic) {
    const errorUnlocked = state.unlocked["Errors"] || [];
    const rentRelated = errorUnlocked.filter((id) =>
      id.includes("rent") || id.includes("lamport")
    );
    if (rentRelated.length > 0 && !state.badges.includes("Rent-Ready")) {
      newBadges.push("Rent-Ready");
    }
  }
  
  // Daily Learner: 3-day streak (handled in recordDailyCompletion)
  
  return newBadges;
}

/**
 * Get progress for a topic
 */
export function getTopicProgress(topic: Topic, totalCount: number): {
  unlocked: number;
  total: number;
  percentage: number;
} {
  const state = loadState();
  const unlocked = state.unlocked[topic]?.length || 0;
  
  return {
    unlocked,
    total: totalCount,
    percentage: totalCount > 0 ? Math.round((unlocked / totalCount) * 100) : 0,
  };
}

