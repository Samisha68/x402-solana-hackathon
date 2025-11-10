"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4021";

interface CatalogItem {
  id: string;
  q: string;
  topic?: string;
}

interface CatalogLevel {
  level: number;
  name: string;
  items: CatalogItem[];
}

interface Catalog {
  levels: CatalogLevel[];
  count: number;
}

interface ExamplesModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (question: string) => void;
}

export function ExamplesModal({ open, onClose, onSelect }: ExamplesModalProps) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`${API_URL}/rag/catalog`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("Catalog data received:", data);
          // Support both new format (levels) and old format (topics) for backward compatibility
          if (data && data.count) {
            if (data.levels && Array.isArray(data.levels)) {
              // New format with levels
              setCatalog(data);
            } else if (data.topics && Array.isArray(data.topics)) {
              // Old format with topics - convert to levels format
              console.warn("Received old catalog format (topics), converting to levels");
              // For now, just set empty levels - user needs to restart server
              setCatalog({ levels: [], count: data.count });
            } else {
              console.error("Invalid catalog data structure - missing levels or topics:", data);
            }
          } else {
            console.error("Invalid catalog data - missing count:", data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch catalog:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  if (!open) return null;

  // Filter levels and items based on search
  const filteredCatalog = catalog && catalog.levels && Array.isArray(catalog.levels)
    ? {
        ...catalog,
        levels: catalog.levels
          .map((level) => ({
            ...level,
            items: (level.items || []).filter((item) =>
              item.q.toLowerCase().includes(searchQuery.toLowerCase())
            ),
          }))
          .filter((level) => level.items && level.items.length > 0),
      }
    : null;

  const handleSelect = (question: string) => {
    onSelect(question);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg border solana-border shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Solana accent */}
        <div className="h-1 bg-[#9945FF]" />
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-[#14F195]">
            Browse Examples
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-lg bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#9945FF] focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center text-sm text-slate-600 dark:text-slate-400 py-8">
              Loading examples...
            </div>
          ) : filteredCatalog && filteredCatalog.levels.length > 0 ? (
            filteredCatalog.levels.map((level) => (
              <div key={level.level} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#14F195] uppercase tracking-wide">
                    Level {level.level}: {level.name}
                  </h3>
                  <span className="text-xs text-slate-500">({level.items.length} questions)</span>
                </div>
                <div className="space-y-1">
                  {level.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.q)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-[#9945FF]/10 hover:text-[#14F195] rounded transition-all border border-transparent hover:border-[#9945FF]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span>{item.q}</span>
                        {item.topic && (
                          <span className="text-xs text-[#9945FF] flex-shrink-0">{item.topic}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-slate-600 dark:text-slate-400 py-8">
              {searchQuery ? "No questions match your search." : "No examples available."}
            </div>
          )}
        </div>

        {/* Footer */}
        {catalog && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
            {catalog.count} questions available
          </div>
        )}
      </div>
    </div>
  );
}

