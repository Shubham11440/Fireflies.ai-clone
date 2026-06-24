"use client";

import { Search, X } from "lucide-react";
import { useLibraryStore } from "@/stores/libraryStore";
import { useCallback, useEffect, useState } from "react";

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useLibraryStore();
  const [localValue, setLocalValue] = useState(searchQuery);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localValue);
    }, 250);
    return () => clearTimeout(timer);
  }, [localValue, setSearchQuery]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    setSearchQuery("");
  }, [setSearchQuery]);

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search meetings..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full h-9 pl-9 pr-8 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
