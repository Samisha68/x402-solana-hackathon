"use client";

import { motion } from "framer-motion";

interface ProgressDotsProps {
  current: number;
  total: number;
}

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === current;
        const isPast = index < current;
        
        return (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{
              scale: isActive ? 1.1 : isPast ? 1 : 0.8,
              opacity: isActive ? 1 : isPast ? 0.7 : 0.4,
            }}
            className={`w-2 h-2 rounded-full ${
              isActive || isPast
                ? "bg-neutral-400"
                : "bg-neutral-800"
            }`}
          />
        );
      })}
    </div>
  );
}
