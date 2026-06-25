"use client";

import { useTopics } from "@/api/queries/useTopics";
import { useLibraryStore } from "@/stores/libraryStore";
import { X, Tag } from "lucide-react";

export function FilterDrawer() {
  const { data: topics } = useTopics();
  const { selectedTopic, setSelectedTopic, filterOpen, setFilterOpen } =
    useLibraryStore();

  if (!filterOpen) return null;

  return (
    <div className="mb-4 p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Filter by Topic
          </span>
        </div>
        <button
          onClick={() => setFilterOpen(false)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTopic(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedTopic === null
              ? "bg-fireflies-yellow text-fireflies-navy border-fireflies-yellow"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
            }`}
        >
          All
        </button>
        {topics?.map((topic) => (
          <button
            key={topic.id}
            onClick={() =>
              setSelectedTopic(selectedTopic === topic.name ? null : topic.name)
            }
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedTopic === topic.name
                ? "bg-fireflies-yellow text-fireflies-navy border-fireflies-yellow"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
              }`}
          >
            {topic.name}
            {topic.meeting_count > 0 && (
              <span className="ml-1 opacity-60">{topic.meeting_count}</span>
            )}
          </button>
        ))}
        {topics && topics.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No topics yet. Add topics from meeting details.
          </p>
        )}
      </div>
    </div>
  );
}
