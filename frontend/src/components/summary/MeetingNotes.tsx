"use client";

import { useNotes, useUpdateNotes } from "@/api/queries/useNotes";
import { BlockNoteEditor } from "./BlockNoteEditor";
import { Loader2 } from "lucide-react";

interface MeetingNotesProps {
  meetingId: string;
}

export function MeetingNotes({ meetingId }: MeetingNotesProps) {
  const { data: notes, isLoading } = useNotes(meetingId);
  const updateNotesMutation = useUpdateNotes(meetingId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <BlockNoteEditor
        initialContent={notes?.notes_markdown || ""}
        onSave={(markdown) =>
          updateNotesMutation.mutate({ notes_markdown: markdown })
        }
        isSaving={updateNotesMutation.isPending}
      />
    </div>
  );
}
