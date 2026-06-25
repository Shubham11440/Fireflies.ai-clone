"use client";

import { useCallback } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { Loader2, Save } from "lucide-react";

interface BlockNoteEditorProps {
  initialContent?: string;
  onSave: (markdown: string) => void;
  isSaving?: boolean;
}

export function BlockNoteEditor({
  initialContent,
  onSave,
  isSaving,
}: BlockNoteEditorProps) {
  const editor = useCreateBlockNote({
    initialContent: initialContent
      ? [{ type: "paragraph", content: initialContent }]
      : [{ type: "paragraph" }],
  });

  const handleSave = useCallback(() => {
    const markdown = editor.blocksToMarkdownLossy(editor.document);
    onSave(markdown);
  }, [editor, onSave]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end px-4 py-2 border-b border-border">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-fireflies-yellow text-fireflies-navy text-xs font-semibold hover:bg-fireflies-yellow/90 disabled:opacity-50 transition-colors"
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Save
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <BlockNoteView
          editor={editor}
          theme="light"
          className="min-h-full"
        />
      </div>
    </div>
  );
}
