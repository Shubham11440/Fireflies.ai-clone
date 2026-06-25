"use client";

import { useChapters, useGenerateChapters } from "@/api/queries/useChapters";
import { useSummary } from "@/api/queries/useSummary";
import { usePlayerStore } from "@/stores/playerStore";
import { useCallback } from "react";
import { Loader2, BookOpen, Sparkles } from "lucide-react";

interface ChaptersOutlineProps {
  meetingId: string;
}

export function ChaptersOutline({ meetingId }: ChaptersOutlineProps) {
  const { data: chapters, isLoading } = useChapters(meetingId);
  const { data: summary } = useSummary(meetingId);
  const { mutate: generateChapters, isPending } = useGenerateChapters(meetingId);
  const { seek } = usePlayerStore();

  const handleChapterClick = useCallback(
    (offset: number | null) => {
      if (offset != null) {
        seek(offset);
      }
    },
    [seek]
  );

  const isGeneratingChapters = isPending || (summary?.status === "processing" || summary?.status === "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chapters || chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No chapters yet.</p>
        {isGeneratingChapters ? (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating chapters with summary…
          </p>
        ) : (
          <button
            onClick={() => generateChapters()}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Generate chapters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-1">
      {chapters.map((chapter, i) => (
        <button
          key={chapter.id}
          onClick={() => handleChapterClick(chapter.start_offset)}
          className={`w-full text-left py-3 px-3 rounded-lg transition-colors ${
            chapter.start_offset != null
              ? "hover:bg-muted/50 cursor-pointer"
              : "cursor-default"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xs font-mono text-muted-foreground mt-0.5 w-5 text-right shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{chapter.title}</p>
              {chapter.summary && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {chapter.summary}
                </p>
              )}
            </div>
            {chapter.start_offset != null && (
              <span className="text-[10px] text-muted-foreground/60 mt-1 shrink-0 tabular-nums">
                {Math.floor(chapter.start_offset / 60)}:{String(Math.floor(chapter.start_offset % 60)).padStart(2, "0")}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
