"use client";

import { useState } from "react";
import type { CreateMeetingRequest } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  isLoading: boolean;
  onSubmit: (data: CreateMeetingRequest) => void;
}

export function TranscriptPasteInput({ isLoading, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [participants, setParticipants] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !transcript.trim()) return;
    onSubmit({
      title: title.trim(),
      occurred_at: new Date().toISOString(),
      duration_sec: 0,
      participant_names: participants
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      transcript_content: transcript,
      transcript_format: "txt",
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

      <div className="space-y-1.5">
        <Label>Participants</Label>
        <Input
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder="Comma-separated names (e.g. Alice, Bob, Carol)"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Transcript</Label>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={"Paste your transcript here...\n\nSupported formats:\n- Plain text (each line becomes a transcript segment)\n- Speaker: text (auto-detects speaker labels)"}
          rows={14}
          className="font-mono resize-y"
        />
        <p className="text-xs text-muted-foreground">
          {transcript.split("\n").filter((l) => l.trim()).length} lines detected
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !title.trim() || !transcript.trim()}
        className="w-full"
      >
        {isLoading ? "Creating..." : "Create Meeting"}
      </Button>
    </div>
  );
}
