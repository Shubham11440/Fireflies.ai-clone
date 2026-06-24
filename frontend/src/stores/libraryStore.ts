import { create } from "zustand";

interface LibraryState {
  searchQuery: string;
  sort: "recent" | "title" | "duration";
  viewMode: "grid" | "list";
  setSearchQuery: (q: string) => void;
  setSort: (sort: "recent" | "title" | "duration") => void;
  setViewMode: (mode: "grid" | "list") => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  searchQuery: "",
  sort: "recent",
  viewMode: "grid",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSort: (sort) => set({ sort }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
