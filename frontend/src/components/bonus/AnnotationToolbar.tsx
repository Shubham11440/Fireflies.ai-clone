"use client";

import { useState } from "react";
import { MessageSquare, Highlighter, Trash2, X, Send } from "lucide-react";
import {
  useHighlights,
  useCreateHighlight,
  useDeleteHighlight,
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/api/queries/useHighlights";
import type { Highlight } from "@/api/highlightsApi";
import type { Comment } from "@/api/commentsApi";

// ── Color palette ────────────────────────────────────────────

const HIGHLIGHT_COLORS: { value: string; label: string; bg: string; border: string }[] = [
  { value: "yellow", label: "Yellow", bg: "bg-yellow-300", border: "border-yellow-400" },
  { value: "green",  label: "Green",  bg: "bg-green-300",  border: "border-green-400" },
  { value: "blue",   label: "Blue",   bg: "bg-blue-300",   border: "border-blue-400" },
  { value: "pink",   label: "Pink",   bg: "bg-pink-300",   border: "border-pink-400" },
  { value: "purple", label: "Purple", bg: "bg-purple-300", border: "border-purple-400" },
];

const COLOR_LEFT_BORDER: Record<string, string> = {
  yellow: "border-l-yellow-400",
  green:  "border-l-green-400",
  blue:   "border-l-blue-400",
  pink:   "border-l-pink-400",
  purple: "border-l-purple-400",
};

// ── CommentThread ─────────────────────────────────────────────

interface CommentThreadProps {
  meetingId: string;
  lineId: string;
  comments: Comment[];
  onClose: () => void;
}

function CommentThread({ meetingId, lineId, comments, onClose }: CommentThreadProps) {
  const [draft, setDraft] = useState("");
  const createComment = useCreateComment(meetingId);
  const deleteComment = useDeleteComment(meetingId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    createComment.mutate({ line_id: lineId, body: draft.trim() });
    setDraft("");
  };

  return (
    <div className="absolute right-0 top-8 z-30 w-72 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <span className="text-xs font-semibold text-foreground">Comments</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Thread */}
      <div className="max-h-48 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No comments yet</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="px-3 py-2 border-b border-border/50 group">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground">{c.author}</span>
              <button
                onClick={() => deleteComment.mutate(c.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2 border-t border-border">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        <button
          type="submit"
          disabled={!draft.trim() || createComment.isPending}
          className="text-fireflies-yellow disabled:opacity-40 hover:opacity-70 transition-opacity"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

// ── AnnotationToolbar ─────────────────────────────────────────

interface AnnotationToolbarProps {
  meetingId: string;
  lineId: string;
  existingHighlight?: Highlight;
  commentCount: number;
}

export function AnnotationToolbar({
  meetingId,
  lineId,
  existingHighlight,
  commentCount,
}: AnnotationToolbarProps) {
  const [showColors, setShowColors] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const createHighlight = useCreateHighlight(meetingId);
  const deleteHighlight = useDeleteHighlight(meetingId);
  const { data: commentsData } = useComments(meetingId);

  const lineComments = commentsData?.items.filter((c) => c.line_id === lineId) ?? [];

  const handleHighlight = (color: string) => {
    if (existingHighlight) {
      deleteHighlight.mutate(existingHighlight.id);
    } else {
      createHighlight.mutate({ line_id: lineId, color });
    }
    setShowColors(false);
  };

  return (
    <div className="relative flex items-center gap-0.5 ml-2">
      {/* Highlight button */}
      <button
        onClick={() => {
          if (existingHighlight) {
            deleteHighlight.mutate(existingHighlight.id);
          } else {
            setShowColors((s) => !s);
            setShowComments(false);
          }
        }}
        title={existingHighlight ? "Remove highlight" : "Highlight line"}
        className={`p-1 rounded transition-colors ${
          existingHighlight
            ? "text-fireflies-yellow"
            : "text-muted-foreground hover:text-fireflies-yellow"
        }`}
      >
        <Highlighter className="h-3.5 w-3.5" />
      </button>

      {/* Color picker */}
      {showColors && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowColors(false)} />
          <div className="absolute right-0 top-7 z-20 flex gap-1.5 bg-popover border border-border rounded-lg p-2 shadow-lg">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleHighlight(c.value)}
                title={c.label}
                className={`w-5 h-5 rounded-full ${c.bg} border-2 ${c.border} hover:scale-110 transition-transform`}
              />
            ))}
          </div>
        </>
      )}

      {/* Comment button */}
      <button
        onClick={() => {
          setShowComments((s) => !s);
          setShowColors(false);
        }}
        title="Comments"
        className={`relative p-1 rounded transition-colors ${
          commentCount > 0
            ? "text-blue-500"
            : "text-muted-foreground hover:text-blue-500"
        }`}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {commentCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 px-0.5 rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center leading-none">
            {commentCount}
          </span>
        )}
      </button>

      {/* Comment thread popover */}
      {showComments && (
        <CommentThread
          meetingId={meetingId}
          lineId={lineId}
          comments={lineComments}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}

// ── Exports for TranscriptLine ───────────────────────────────

export { HIGHLIGHT_COLORS, COLOR_LEFT_BORDER };
export type { Highlight };
