"use client";

import { motion } from "framer-motion";

interface QuestionCardProps {
  question: {
    id: string;
    question: string;
    options: { id: string; text: string }[];
    level: number;
  };
  selectedOption: string | null;
  onSelect: (optionId: string) => void;
  disabled: boolean;
}

export function QuestionCard({ question, selectedOption, onSelect, disabled }: QuestionCardProps) {
  return (
    <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 shadow-lg shadow-black/20 p-6 sm:p-8">
      {/* Question */}
      <h2 className="text-xl sm:text-2xl font-semibold text-neutral-100 mb-6 leading-relaxed">
        {question.question}
      </h2>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === option.id;
          return (
            <motion.button
              key={option.id}
              onClick={() => !disabled && onSelect(option.id)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              className={`w-full text-left px-4 py-3 sm:py-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? "bg-neutral-800 border-neutral-600 text-neutral-100"
                  : "bg-neutral-950/50 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900/50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-800 text-neutral-400 font-semibold flex items-center justify-center text-sm">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 text-sm sm:text-base">{option.text}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

