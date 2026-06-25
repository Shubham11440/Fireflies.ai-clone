import { create } from "zustand";

interface TranscriptSearchState {
  query: string;
  matchIds: string[];
  currentMatchIndex: number;
  setQuery: (query: string) => void;
  setMatchIds: (ids: string[]) => void;
  setCurrentMatchIndex: (index: number) => void;
  navigateMatch: (direction: "up" | "down") => void;
}

export const useTranscriptSearchStore = create<TranscriptSearchState>(
  (set, get) => ({
    query: "",
    matchIds: [],
    currentMatchIndex: 0,
    setQuery: (query) => set({ query, currentMatchIndex: 0 }),
    setMatchIds: (matchIds) => set({ matchIds, currentMatchIndex: 0 }),
    setCurrentMatchIndex: (currentMatchIndex) => set({ currentMatchIndex }),
    navigateMatch: (direction) => {
      const { matchIds, currentMatchIndex } = get();
      if (matchIds.length === 0) return;
      if (direction === "down") {
        set({
          currentMatchIndex: (currentMatchIndex + 1) % matchIds.length,
        });
      } else {
        set({
          currentMatchIndex:
            (currentMatchIndex - 1 + matchIds.length) % matchIds.length,
        });
      }
    },
  })
);
