"use client";

import { useState, useEffect } from "react";
import { useNotes, useUpdateNotes } from "@/api/queries/useNotes";
import { Loader2, Save } from "lucide-react";

interface MeetingNotesProps {
  meetingId: string;
}

export function MeetingNotes({ meetingId }: MeetingNotesProps) {
  const { data: notes, isLoading } = useNotes(meetingId);
  const updateNotesMutation = useUpdateNotes(meetingId);
  const [text, setText] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (notes) {
      setText(notes.notes_markdown || "");
      setIsDirty(false);
    }
  }, [notes]);

  const handleSave = () => {
    updateNotesMutation.mutate(
      { notes_markdown: text },
      { onSuccess: () => setIsDirty(false) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">Your meeting notes</span>
        <button
          onClick={handleSave}
          disabled={!isDirty || updateNotesMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-fireflies-yellow text-fireflies-navy text-xs font-semibold hover:bg-fireflies-yellow/90 disabled:opacity-50 transition-colors"
        >
          {updateNotesMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Save
        </button>
      </div>

      {/* Editor placeholder — Phase 5 replaces with BlockNote */}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setIsDirty(true);
        }}
        placeholder="Start typing your notes here..."
        className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
