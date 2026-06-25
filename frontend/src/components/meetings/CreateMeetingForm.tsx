"use client";

import { useState, useRef } from "react";
import type { CreateMeetingRequest } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Video, Link2, Upload } from "lucide-react";

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
  const [mediaTab, setMediaTab] = useState<"youtube" | "file">("youtube");
  const [mediaUrl, setMediaUrl] = useState("");
  const [localFile, setLocalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      {/* Media picker */}
      <div className="space-y-1.5">
        <Label>
          Media <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <div className="flex gap-1 bg-muted rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setMediaTab("youtube")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              mediaTab === "youtube"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link2 className="h-3 w-3" />
            YouTube link
          </button>
          <button
            type="button"
            onClick={() => setMediaTab("file")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              mediaTab === "file"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="h-3 w-3" />
            File
          </button>
        </div>
        {mediaTab === "youtube" ? (
          <Input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
        ) : (
          <div className="space-y-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*"
              onChange={(e) => setLocalFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 border border-border rounded-md text-sm text-muted-foreground hover:border-fireflies-yellow/50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              {localFile ? localFile.name : "Select file"}
            </button>
            <p className="text-[11px] text-muted-foreground">
              Session-only — plays in browser but won&apos;t be stored on the server.
            </p>
          </div>
        )}
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
