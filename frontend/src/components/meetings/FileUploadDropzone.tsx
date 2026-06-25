"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import type { CreateMeetingRequest } from "@/types";

interface Props {
  isLoading: boolean;
  onSubmit: (data: CreateMeetingRequest) => void;
}

export function FileUploadDropzone({ isLoading, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = [".txt", ".vtt", ".json"];

  const handleFile = useCallback((f: File) => {
    setFile(f);
    if (!title) {
      setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target?.result as string);
    };
    reader.readAsText(f);
  }, [title]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const getInputFormat = (): "txt" | "vtt" | "json" => {
    if (!file) return "txt";
    if (file.name.endsWith(".vtt")) return "vtt";
    if (file.name.endsWith(".json")) return "json";
    return "txt";
  };

  const handleSubmit = () => {
    if (!title.trim() || !fileContent) return;
    onSubmit({
      title: title.trim(),
      occurred_at: new Date().toISOString(),
      duration_sec: 0,
      participant_names: participants
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      transcript_content: fileContent,
      transcript_format: getInputFormat(),
    });
  };

  const clearFile = () => {
    setFile(null);
    setFileContent(null);
    if (inputRef.current) inputRef.current.value = "";
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

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
          dragOver
            ? "border-fireflies-yellow bg-fireflies-yellow/5"
            : file
            ? "border-green-300 bg-green-50"
            : "border-border hover:border-fireflies-yellow/50 hover:bg-muted/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedFormats.join(",")}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />

        {file ? (
          <>
            <FileText className="h-8 w-8 text-green-600 mb-2" />
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="absolute top-2 right-2 p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">
              Drop a file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .txt, .vtt, and .json transcript files
            </p>
          </>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !title.trim() || !fileContent}
        className="w-full h-10 rounded-md bg-fireflies-yellow text-fireflies-navy font-semibold text-sm hover:bg-fireflies-yellow/90 disabled:opacity-50 transition-colors"
      >
        {isLoading ? "Creating..." : "Create Meeting"}
      </button>
    </div>
  );
}
