"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import type { TranscriptLine } from "@/types";

/**
 * Computes the active transcript line based on player currentTime.
 * Uses binary search for O(log n) performance on long transcripts.
 */
export function useActiveLineTracker(lines: TranscriptLine[]) {
  const { currentTime, isPlaying, setActiveLineId } = usePlayerStore();
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!isPlaying || lines.length === 0) return;

    // Throttle to 250ms
    const now = Date.now();
    if (now - lastUpdateRef.current < 250) return;
    lastUpdateRef.current = now;

    // Binary search for the last line with start_offset <= currentTime
    let low = 0;
    let high = lines.length - 1;
    let result = -1;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      const offset = lines[mid].start_offset;
      if (offset !== null && offset <= currentTime) {
        result = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (result >= 0) {
      setActiveLineId(lines[result].id);
    }
  }, [currentTime, isPlaying, lines, setActiveLineId]);
}
