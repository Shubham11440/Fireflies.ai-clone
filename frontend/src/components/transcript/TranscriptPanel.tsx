"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranscript } from "@/api/queries/useTranscript";
import { useActiveLineTracker } from "@/api/queries/useActiveLineTracker";
import { usePlayerStore } from "@/stores/playerStore";
import { TranscriptLine } from "./TranscriptLine";
import { Loader2, ChevronDown } from "lucide-react";

interface TranscriptPanelProps {
  meetingId: string;
  searchMatchIds?: Set<string>;
}

export function TranscriptPanel({
  meetingId,
  searchMatchIds,
}: TranscriptPanelProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const lastAutoScrollRef = useRef<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTranscript(meetingId);

  const { activeLineId, isPlaying } = usePlayerStore();

  // Flatten all pages into a single array
  const allLines = data?.pages.flatMap((page) => page.lines) ?? [];

  // Track active line from player currentTime (bidirectional sync)
  useActiveLineTracker(allLines);

  const virtualizer = useVirtualizer({
    count: allLines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  // Auto-scroll to active line (only when playing)
  useEffect(() => {
    if (!isPlaying || !activeLineId || !isAutoScrolling) return;

    const idx = allLines.findIndex((l) => l.id === activeLineId);
    if (idx === -1) return;

    // Throttle auto-scroll to every 300ms
    const now = Date.now();
    if (now - lastAutoScrollRef.current < 300) return;
    lastAutoScrollRef.current = now;

    virtualizer.scrollToIndex(idx, {
      align: "center",
      behavior: "smooth",
    });
  }, [activeLineId, isPlaying, allLines, virtualizer, isAutoScrolling]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = useCallback(() => {
    setIsAutoScrolling(false);
  }, []);

  // Re-enable auto-scroll when user clicks a line
  const handleLineClick = useCallback(() => {
    setIsAutoScrolling(true);
  }, []);

  // Load more on scroll to bottom
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const handleScrollEnd = () => {
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    el.addEventListener("scroll", handleScrollEnd);
    return () => el.removeEventListener("scroll", handleScrollEnd);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allLines.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No transcript available.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {allLines.length} lines
        </span>
        {!isAutoScrolling && isPlaying && (
          <button
            onClick={() => {
              setIsAutoScrolling(true);
              if (activeLineId) {
                const idx = allLines.findIndex((l) => l.id === activeLineId);
                if (idx !== -1) {
                  virtualizer.scrollToIndex(idx, { align: "center" });
                }
              }
            }}
            className="flex items-center gap-1 text-xs text-fireflies-yellow hover:text-fireflies-yellow/80 transition-colors"
          >
            <ChevronDown className="h-3 w-3" />
            Scroll to current
          </button>
        )}
      </div>

      {/* Virtualized list */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const line = allLines[virtualRow.index];
            return (
              <div
                key={line.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={handleLineClick}
              >
                <TranscriptLine line={line} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Load more indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-2 border-t border-border">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
