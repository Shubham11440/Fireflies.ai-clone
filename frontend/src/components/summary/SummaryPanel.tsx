"use client";

import { useSummaryStore } from "@/stores/summaryStore";
import { useSummary } from "@/api/queries/useSummary";
import { SummaryView } from "./SummaryView";
import { ActionItemsList } from "./ActionItemsList";
import { ChaptersOutline } from "./ChaptersOutline";
import { StructuredNotesEditor } from "./StructuredNotesEditor";
import { SummaryStatusBanner } from "./SummaryStatusBanner";
import { Loader2 } from "lucide-react";

const tabs = [
  { id: "summary" as const, label: "Summary" },
  { id: "action-items" as const, label: "Action Items" },
  { id: "outline" as const, label: "Outline" },
  { id: "notes" as const, label: "Notes" },
];

interface SummaryPanelProps {
  meetingId: string;
}

export function SummaryPanel({ meetingId }: SummaryPanelProps) {
  const { activeTab, setActiveTab } = useSummaryStore();
  const { data: summary, isLoading } = useSummary(meetingId);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex px-4 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-fireflies-yellow text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Status banner */}
      {summary && summary.status !== "completed" && summary.status !== "none" && (
        <SummaryStatusBanner status={summary.status} />
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {activeTab === "summary" && (
              <SummaryView meetingId={meetingId} summary={summary} />
            )}
            {activeTab === "action-items" && (
              <ActionItemsList meetingId={meetingId} />
            )}
            {activeTab === "outline" && (
              <ChaptersOutline meetingId={meetingId} />
            )}
            {activeTab === "notes" && (
              <StructuredNotesEditor meetingId={meetingId} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
