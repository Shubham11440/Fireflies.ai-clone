"use client";

import { useState } from "react";
import type { CreateMeetingRequest } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
      <div className="space-y-1.5">
        <Label>Meeting Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q3 Planning Meeting"
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
          placeholder="Comma-separated names (e.g. Alice, Bob, Carol)"
        />
      </div>

      <div className="space-y-1.5">
        <Label>
          Media URL <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://example.com/recording.mp3"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !title.trim()}
        className="w-full"
      >
        {isLoading ? "Creating..." : "Create Meeting"}
      </Button>
    </div>
  );
}
