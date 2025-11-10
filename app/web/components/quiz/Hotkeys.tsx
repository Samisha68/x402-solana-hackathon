"use client";

import { useEffect } from "react";

interface HotkeysProps {
  onOptionSelect: (index: number) => void;
  onNext: () => void;
}

export function useHotkeys({ onOptionSelect, onNext }: HotkeysProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Option selection: 1-4
      if (e.key >= "1" && e.key <= "4") {
        const index = parseInt(e.key) - 1;
        onOptionSelect(index);
        return;
      }

      // Next: N or Enter
      if (e.key === "n" || e.key === "N" || e.key === "Enter") {
        onNext();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onOptionSelect, onNext]);
}

