"use client";

import { useState, useRef } from "react";
import { Video, Link2, Upload, X } from "lucide-react";
import { useUpdateMeeting } from "@/api/queries/useMeetings";

interface AddMediaPopoverProps {
  meetingId: string;
  onMediaAdded: (url: string, kind: "youtube" | "file") => void;
  onClose: () => void;
}

export function AddMediaPopover({
  meetingId,
  onMediaAdded,
  onClose,
}: AddMediaPopoverProps) {
  const [tab, setTab] = useState<"youtube" | "file">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateMeeting();

  const handleYoutubeSubmit = () => {
    if (!youtubeUrl.trim()) return;
    updateMutation.mutate(
      { id: meetingId, media_url: youtubeUrl.trim() },
      {
        onSuccess: () => {
          onMediaAdded(youtubeUrl.trim(), "youtube");
          onClose();
        },
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setFileName(file.name);
    onMediaAdded(objectUrl, "file");
    onClose();
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Add media</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-muted rounded-md p-0.5">
        <button
          onClick={() => setTab("youtube")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            tab === "youtube"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="h-3 w-3" />
          YouTube link
        </button>
        <button
          onClick={() => setTab("file")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            tab === "file"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Video className="h-3 w-3" />
          Video/audio file
        </button>
      </div>

      {tab === "youtube" ? (
        <div className="space-y-3">
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-fireflies-yellow"
            onKeyDown={(e) => e.key === "Enter" && handleYoutubeSubmit()}
          />
          <p className="text-[11px] text-muted-foreground">
            Paste a YouTube watch or share URL. Will be saved to the meeting.
          </p>
          <button
            onClick={handleYoutubeSubmit}
            disabled={!youtubeUrl.trim() || updateMutation.isPending}
            className="w-full px-3 py-2 text-sm font-medium rounded-md bg-fireflies-yellow text-fireflies-navy hover:bg-fireflies-yellow/90 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Add YouTube link"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-border rounded-lg hover:border-fireflies-yellow/50 transition-colors"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {fileName || "Click to select file"}
            </span>
          </button>
          <p className="text-[11px] text-muted-foreground">
            Session-only — the file plays in-browser but won&apos;t be stored on the server.
          </p>
        </div>
      )}
    </div>
  );
}
