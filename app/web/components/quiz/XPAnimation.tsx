"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface XPAnimationProps {
  xpGained: number;
  trigger: number; // Change this to trigger animation
}

export function XPAnimation({ xpGained, trigger }: XPAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (xpGained !== 0 && trigger > 0) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [xpGained, trigger]);

  const isPositive = xpGained > 0;
  const bgColor = isPositive ? "bg-green-500/20 border-green-500/30" : "bg-red-500/20 border-red-500/30";
  const textColor = isPositive ? "text-green-400" : "text-red-400";
  const dotColor = isPositive ? "bg-green-400" : "bg-red-400";

  return (
    <AnimatePresence>
      {show && xpGained !== 0 && (
        <motion.div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${bgColor} backdrop-blur-sm border shadow-lg`}>
            <motion.span
              className={`text-lg font-bold ${textColor}`}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, times: [0, 0.5, 1] }}
            >
              {xpGained > 0 ? "+" : ""}{xpGained} XP
            </motion.span>
            <motion.div
              className={`w-2 h-2 rounded-full ${dotColor}`}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

