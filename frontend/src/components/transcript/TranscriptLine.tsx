"use client";

import { useState } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import type { TranscriptLine as TranscriptLineType } from "@/types";
import { AnnotationToolbar, COLOR_LEFT_BORDER } from "@/components/bonus/AnnotationToolbar";
import type { Highlight } from "@/api/highlightsApi";
import type { Comment } from "@/api/commentsApi";

function formatTimestamp(offset: number | null): string {
  if (offset === null || offset === undefined) return "";
  const m = Math.floor(offset / 60);
  const s = Math.floor(offset % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getSpeakerColor(speaker: string | null): string {
  if (!speaker) return "bg-muted text-muted-foreground";
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  ];
  const hash = speaker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getSpeakerInitials(speaker: string | null): string {
  if (!speaker) return "?";
  return speaker
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface TranscriptLineProps {
  line: TranscriptLineType;
  meetingId: string;
  searchHighlight?: { start: number; end: number }[];
  highlight?: Highlight;
  comments?: Comment[];
}

export function TranscriptLine({
  line,
  meetingId,
  searchHighlight,
  highlight,
  comments = [],
}: TranscriptLineProps) {
  const { activeLineId, seek } = usePlayerStore();
  const isActive = activeLineId === line.id;
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (line.start_offset !== null) {
      seek(line.start_offset);
    }
  };

  const renderText = () => {
    if (!searchHighlight || searchHighlight.length === 0) {
      return line.text;
    }

    const sorted = [...searchHighlight].sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const h of sorted) {
      if (h.start > lastIndex) {
        parts.push(
          <span key={`pre-${lastIndex}`}>{line.text.slice(lastIndex, h.start)}</span>
        );
      }
      parts.push(
        <mark
          key={`mark-${h.start}`}
          className="bg-fireflies-yellow/30 text-foreground rounded px-0.5"
        >
          {line.text.slice(h.start, h.end)}
        </mark>
      );
      lastIndex = h.end;
    }

    if (lastIndex < line.text.length) {
      parts.push(<span key="post">{line.text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  // Build left border class based on highlight color
  const highlightBorderClass = highlight
    ? `border-l-4 ${COLOR_LEFT_BORDER[highlight.color] ?? "border-l-yellow-400"}`
    : isActive
    ? "border-l-2 border-fireflies-yellow"
    : "border-l-2 border-transparent";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-150 ${highlightBorderClass} ${
        isActive && !highlight ? "bg-fireflies-yellow/5" : ""
      } ${highlight ? "bg-opacity-10" : "hover:bg-muted/50"}`}
    >
      {/* Speaker avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getSpeakerColor(
          line.speaker
        )}`}
        onClick={handleClick}
      >
        {getSpeakerInitials(line.speaker)}
      </div>

      <div className="flex-1 min-w-0" onClick={handleClick}>
        {/* Speaker name + timestamp */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-foreground">
            {line.speaker || "Unknown"}
          </span>
          {line.start_offset !== null && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {formatTimestamp(line.start_offset)}
            </span>
          )}
        </div>

        {/* Text */}
        <p className="text-sm text-foreground/90 leading-relaxed">
          {renderText()}
        </p>
      </div>

      {/* Annotation toolbar — appears on hover */}
      <div
        className={`shrink-0 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <AnnotationToolbar
          meetingId={meetingId}
          lineId={line.id}
          existingHighlight={highlight}
          commentCount={comments.length}
        />
      </div>
    </div>
  );
}
