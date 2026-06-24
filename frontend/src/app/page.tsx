"use client";

import { useMeetings } from "@/api/queries/useMeetings";
import { useLibraryStore } from "@/stores/libraryStore";
import { MeetingCard } from "@/components/library/MeetingCard";
import { SearchBar } from "@/components/library/SearchBar";
import { SortControl } from "@/components/library/SortControl";
import { EmptyState } from "@/components/library/EmptyState";
import { Grid, List, Loader2 } from "lucide-react";

export default function LibraryPage() {
  const { searchQuery, sort, viewMode, setViewMode } = useLibraryStore();
  const { data, isLoading, error } = useMeetings({
    q: searchQuery || undefined,
    sort,
    limit: 50,
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meetings</h1>
          {data && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.total} meeting{data.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <SearchBar />
        <SortControl />
        <div className="flex items-center border border-border rounded-md">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-l-md transition-colors ${
              viewMode === "grid"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-r-md transition-colors ${
              viewMode === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-destructive font-medium">
            Failed to load meetings
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      ) : !data?.items.length ? (
        <EmptyState />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-3"
          }
        >
          {data.items.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
