"use client";

import { ArrowUpDown } from "lucide-react";
import { useLibraryStore } from "@/stores/libraryStore";

const sortOptions = [
  { value: "recent", label: "Recent" },
  { value: "title", label: "Title A-Z" },
  { value: "duration", label: "Longest" },
] as const;

export function SortControl() {
  const { sort, setSort } = useLibraryStore();

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value as typeof sort)}
        className="h-8 rounded-md border border-input bg-background text-sm px-2 focus:outline-none focus:ring-2 focus:ring-ring/20"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
