"use client";

import { useState } from "react";
import type { CreateMeetingRequest } from "@/types";

interface Props {
  isLoading: boolean;
  onSubmit: (data: CreateMeetingRequest) => void;
}

export function CreateMeetingForm({ isLoading, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [durationMin, setDurationMin] = useState("60");
  const [participants, setParticipants] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      occurred_at: new Date(occurredAt).toISOString(),
      duration_sec: (parseFloat(durationMin) || 60) * 60,
      media_url: mediaUrl.trim() || null,
      participant_names: participants
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Meeting Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q3 Planning Meeting"
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            min="1"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Participants
        </label>
        <input
          type="text"
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder="Comma-separated names (e.g. Alice, Bob, Carol)"
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Media URL <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://example.com/recording.mp3"
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !title.trim()}
        className="w-full h-10 rounded-md bg-fireflies-yellow text-fireflies-navy font-semibold text-sm hover:bg-fireflies-yellow/90 disabled:opacity-50 transition-colors"
      >
        {isLoading ? "Creating..." : "Create Meeting"}
      </button>
    </div>
  );
}
