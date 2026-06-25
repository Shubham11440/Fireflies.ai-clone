"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { MeetingDetail } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-card rounded-lg shadow-lg border border-border w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Edit Meeting</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Participants</Label>
            <Input
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="Comma-separated names"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
