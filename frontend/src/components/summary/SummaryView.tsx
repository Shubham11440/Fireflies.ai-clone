"use client";

import type { SummaryProcessResponse, SummarySection, SummaryBlock } from "@/types";
import { useGenerateSummary } from "@/api/queries/useSummary";
import { FileText, Users, CheckCircle, ArrowRight, Lightbulb, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

function BlockRenderer({ block }: { block: SummaryBlock }) {
  switch (block.type) {
    case "heading1":
      return <h3 className="text-base font-bold text-foreground mt-4 mb-2">{block.content}</h3>;
    case "heading2":
      return <h4 className="text-sm font-semibold text-foreground mt-3 mb-1">{block.content}</h4>;
    case "bullet":
      return (
        <div className="flex gap-2 py-1">
          <span className="text-fireflies-yellow mt-1">•</span>
          <span className="text-sm text-foreground/90">{block.content}</span>
        </div>
      );
    default:
      return <p className="text-sm text-foreground/90 py-1">{block.content}</p>;
  }
}

function SectionCard({
  section,
  icon: Icon,
}: {
  section: SummarySection;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (!section || !section.blocks || section.blocks.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-fireflies-yellow" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {section.title}
        </h3>
      </div>
      <div className="pl-6">
        {section.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}

interface SummaryViewProps {
  meetingId: string;
  summary: SummaryProcessResponse | undefined;
}

const STATUS_MESSAGES = [
  "Analyzing transcript…",
  "Extracting action items…",
  "Writing summary…",
  "Identifying key decisions…",
  "Organizing topics…",
];

function SummaryGeneratingState({ status }: { status: string }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-4">
        <Loader2 className="h-8 w-8 animate-spin text-fireflies-yellow" />
        <div className="absolute inset-0 rounded-full bg-fireflies-yellow/10 animate-ping" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        {status === "pending" ? "Queued…" : "Generating summary…"}
      </p>
      <p className="text-xs text-muted-foreground transition-opacity duration-500">
        {STATUS_MESSAGES[msgIndex]}
      </p>
      {/* Progress shimmer */}
      <div className="w-48 h-1 bg-muted rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-fireflies-yellow/60 rounded-full animate-[shimmer_2s_ease-in-out_infinite] w-1/3" />
      </div>
    </div>
  );
}

export function SummaryView({ meetingId, summary }: SummaryViewProps) {
  const generateMutation = useGenerateSummary(meetingId);

  if (summary && (summary.status === "pending" || summary.status === "processing")) {
    return <SummaryGeneratingState status={summary.status} />;
  }

  if (!summary || summary.status === "none") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No summary generated yet.</p>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="mt-4 px-4 py-2 rounded-md bg-fireflies-yellow text-fireflies-navy text-sm font-semibold hover:bg-fireflies-yellow/90 disabled:opacity-50 transition-colors"
        >
          {generateMutation.isPending ? "Generating…" : "Generate Summary"}
        </button>
      </div>
    );
  }

  if (summary.status === "failed") {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm font-medium text-destructive">Summary generation failed</p>
          <p className="text-xs text-muted-foreground mt-1">{summary.error}</p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="mt-3 px-4 py-2 rounded-md bg-fireflies-yellow text-fireflies-navy text-sm font-semibold hover:bg-fireflies-yellow/90 disabled:opacity-50 transition-colors"
        >
          {generateMutation.isPending ? "Retrying…" : "Retry Generation"}
        </button>
      </div>
    );
  }

  const result = summary.result;
  if (!result) return null;

  return (
    <div className="p-4 space-y-2">
      <SectionCard section={result.people} icon={Users} />
      <SectionCard section={result.session_summary} icon={FileText} />
      <SectionCard section={result.key_decisions} icon={Lightbulb} />
      <SectionCard section={result.action_items} icon={CheckCircle} />
      <SectionCard section={result.next_steps} icon={ArrowRight} />
    </div>
  );
}
