"use client";

import { useState, useEffect } from "react";
import type { MeetingDetail } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  meeting: MeetingDetail;
  isLoading: boolean;
  open: boolean;
  onSave: (data: {
    title?: string;
    occurred_at?: string;
    duration_sec?: number;
    participant_names?: string[];
  }) => void;
  onClose: () => void;
}

export function EditMeetingModal({
  meeting,
  isLoading,
  open,
  onSave,
  onClose,
}: Props) {
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
    if (open) {
      setTitle(meeting.title);
      setOccurredAt(meeting.occurred_at.slice(0, 16));
      setDurationMin(String(Math.round(meeting.duration_sec / 60)));
      setParticipants(meeting.participants.map((p) => p.name).join(", "));
    }
  }, [open, meeting]);

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Meeting</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
