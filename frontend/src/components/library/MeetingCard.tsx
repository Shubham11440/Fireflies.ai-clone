"use client";

import Link from "next/link";
import { Clock, FileText } from "lucide-react";
import type { MeetingListItem } from "@/types";

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
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

const statusColors: Record<string, string> = {
  completed: "bg-green-500",
  processing: "bg-yellow-500",
  pending: "bg-blue-500",
  failed: "bg-red-500",
};

export function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  const participants = meeting.participant_names
    ? meeting.participant_names.split(",")
    : [];
  const topics = meeting.topic_names ? meeting.topic_names.split(",") : [];

  return (
    <Link
      href={`/m/${meeting.id}`}
      className="group block rounded-lg border border-border bg-card p-4 hover:shadow-md transition-all duration-200 hover:border-fireflies-yellow/30"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-foreground group-hover:text-fireflies-yellow transition-colors line-clamp-2">
          {meeting.title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`w-2 h-2 rounded-full ${
              statusColors[meeting.summary_status || ""] || "bg-gray-300"
            }`}
            title={`Summary: ${meeting.summary_status || "none"}`}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(meeting.occurred_at)}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
          {formatDuration(meeting.duration_sec)}
        </span>
      </div>

      {/* Participants */}
      {participants.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex -space-x-1.5">
            {participants.slice(0, 3).map((name) => (
              <div
                key={name}
                className="w-6 h-6 rounded-full bg-fireflies-navy text-white flex items-center justify-center text-[9px] font-bold border-2 border-card"
                title={name}
              >
                {getInitials(name)}
              </div>
            ))}
          </div>
          {participants.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{participants.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Topics */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-fireflies-yellow/10 text-fireflies-yellow border border-fireflies-yellow/20"
            >
              {topic.trim()}
            </span>
          ))}
          {topics.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] text-muted-foreground">
              +{topics.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>{meeting.action_item_count} action items</span>
        </div>
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
          {meeting.source}
        </span>
      </div>
    </Link>
  );
}
