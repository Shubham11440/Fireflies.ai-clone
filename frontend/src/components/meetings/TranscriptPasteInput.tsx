"use client";

import { useState } from "react";
import type { CreateMeetingRequest } from "@/types";

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
          Transcript
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={"Paste your transcript here...\n\nSupported formats:\n- Plain text (each line becomes a transcript segment)\n- Speaker: text (auto-detects speaker labels)"}
          rows={14}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-y"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {transcript.split("\n").filter((l) => l.trim()).length} lines detected
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !title.trim() || !transcript.trim()}
        className="w-full h-10 rounded-md bg-fireflies-yellow text-fireflies-navy font-semibold text-sm hover:bg-fireflies-yellow/90 disabled:opacity-50 transition-colors"
      >
        {isLoading ? "Creating..." : "Create Meeting"}
      </button>
    </div>
  );
}
