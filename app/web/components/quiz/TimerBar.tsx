"use client";

import { motion } from "framer-motion";

interface TimerBarProps {
  timeLeft: number;
  total: number;
}

export function TimerBar({ timeLeft, total }: TimerBarProps) {
  const percentage = (timeLeft / total) * 100;
  const isLow = timeLeft <= 3;

  return (
    <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "linear" }}
        className={`h-full rounded-full ${
          isLow ? "bg-red-500" : "bg-neutral-600"
        }`}
      />
    </div>
  );
}

