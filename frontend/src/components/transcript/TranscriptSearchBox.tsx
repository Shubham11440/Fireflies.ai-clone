"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";

interface TranscriptSearchBoxProps {
  onSearch: (query: string) => void;
  matchCount: number;
  currentMatchIndex: number;
  onNavigate: (direction: "up" | "down") => void;
}

export function TranscriptSearchBox({
  onSearch,
  matchCount,
  currentMatchIndex,
  onNavigate,
}: TranscriptSearchBoxProps) {
  const [value, setValue] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 250);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  const handleClear = useCallback(() => {
    setValue("");
    onSearch("");
  }, [onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          onNavigate("up");
        } else {
          onNavigate("down");
        }
      }
      if (e.key === "Escape") {
        handleClear();
      }
    },
    [onNavigate, handleClear]
  );

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search in transcript..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-8 pl-8 pr-7 rounded-md border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Match navigator */}
      {value.length >= 2 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {matchCount > 0
              ? `${currentMatchIndex + 1} of ${matchCount}`
              : "No matches"}
          </span>
          <button
            onClick={() => onNavigate("up")}
            disabled={matchCount === 0}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onNavigate("down")}
            disabled={matchCount === 0}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
