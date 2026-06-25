"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { MeetingDetail } from "@/types";

interface Props {
  meeting: MeetingDetail;
  isLoading: boolean;
  onSave: (data: {
    title?: string;
    occurred_at?: string;
    duration_sec?: number;
    participant_names?: string[];
  }) => void;
  onClose: () => void;
}

export function EditMeetingModal({ meeting, isLoading, onSave, onClose }: Props) {
  const [title, setTitle] = useState(meeting.title);
  const [occurredAt, setOccurredAt] = useState(
    meeting.occurred_at.slice(0, 16)
  );
  const [durationMin, setDurationMin] = useState(
    String(Math.round(meeting.duration_sec / 60))
  );
  const [participants, setParticipants] = useState(
    meeting.participants.map((p) => p.name).join(", ")
  );

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = () => {
    onSave({
      title: title.trim() || undefined,
      occurred_at: occurredAt ? new Date(occurredAt).toISOString() : undefined,
      duration_sec: (parseFloat(durationMin) || 0) * 60,
      participant_names: participants
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-lg shadow-lg border border-border w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Edit Meeting</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              placeholder="Comma-separated names"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
            className="px-4 h-9 rounded-md bg-fireflies-yellow text-fireflies-navy text-sm font-semibold hover:bg-fireflies-yellow/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
