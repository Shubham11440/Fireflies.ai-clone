"use client";

import { ArrowUpDown } from "lucide-react";
import { useLibraryStore } from "@/stores/libraryStore";
import { Select } from "@/components/ui/select";

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
      <Select
        value={sort}
        onChange={(e) => setSort(e.target.value as typeof sort)}
        className="h-8 w-auto text-sm"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
