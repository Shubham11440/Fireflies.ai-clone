import { create } from "zustand";

interface LibraryState {
  searchQuery: string;
  sort: "recent" | "title" | "duration";
  viewMode: "grid" | "list";
  selectedTopic: string | null;
  filterOpen: boolean;
  setSearchQuery: (q: string) => void;
  setSort: (sort: "recent" | "title" | "duration") => void;
  setViewMode: (mode: "grid" | "list") => void;
  setSelectedTopic: (topic: string | null) => void;
  setFilterOpen: (open: boolean) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  searchQuery: "",
  sort: "recent",
  viewMode: "grid",
  selectedTopic: null,
  filterOpen: false,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSort: (sort) => set({ sort }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedTopic: (selectedTopic) => set({ selectedTopic }),
  setFilterOpen: (filterOpen) => set({ filterOpen }),
}));
