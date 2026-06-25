"use client";

import { use } from "react";
import { useMeeting } from "@/api/queries/useMeeting";
import { AudioPlayer } from "@/components/transcript/AudioPlayer";
import { TranscriptPanel } from "@/components/transcript/TranscriptPanel";
import { TranscriptSearchBox } from "@/components/transcript/TranscriptSearchBox";
import { SummaryPanel } from "@/components/summary/SummaryPanel";
import { useTranscriptSearchStore } from "@/stores/transcriptSearchStore";
import { ArrowLeft, Clock, Users, Loader2, PanelRightOpen, PanelRightClose } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const speakerColors = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
];

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: meeting, isLoading, error } = useMeeting(id);
  const { matchIds, currentMatchIndex, setQuery, navigateMatch } =
    useTranscriptSearchStore();
  const [showSummary, setShowSummary] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-destructive font-medium">Failed to load meeting</p>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to meetings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">
              {meeting.title}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{formatDate(meeting.occurred_at)}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(meeting.duration_sec)}
              </span>
              {meeting.participants.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {meeting.participants.length} participants
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={showSummary ? "Hide summary panel" : "Show summary panel"}
          >
            {showSummary ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Participants */}
        {meeting.participants.length > 0 && (
          <div className="flex items-center gap-2 ml-9">
            {meeting.participants.map((p, i) => (
              <div
                key={p.id}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${speakerColors[i % speakerColors.length]}`}
                title={p.name}
              >
                {getInitials(p.name)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio player */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <AudioPlayer
          mediaUrl={meeting.media_url}
          durationSec={meeting.duration_sec}
        />
      </div>

      {/* Search bar */}
      <div className="px-6 py-2 border-b border-border shrink-0">
        <TranscriptSearchBox
          onSearch={setQuery}
          matchCount={matchIds.length}
          currentMatchIndex={currentMatchIndex}
          onNavigate={navigateMatch}
        />
      </div>

      {/* Content area: transcript + summary panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Transcript */}
        <div className="flex-1 overflow-hidden">
          <TranscriptPanel meetingId={id} />
        </div>

        {/* Summary panel sidebar */}
        {showSummary && (
          <div className="w-[380px] border-l border-border bg-card shrink-0">
            <SummaryPanel meetingId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
