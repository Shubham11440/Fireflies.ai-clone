import { create } from "zustand";

type SummaryTab = "summary" | "action-items" | "outline" | "notes";

interface SummaryState {
  activeTab: SummaryTab;
  setActiveTab: (tab: SummaryTab) => void;
}

export const useSummaryStore = create<SummaryState>((set) => ({
  activeTab: "summary",
  setActiveTab: (activeTab) => set({ activeTab }),
}));
