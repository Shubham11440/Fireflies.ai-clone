import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchHighlights,
  createHighlight,
  deleteHighlight,
  type CreateHighlightRequest,
} from "@/api/highlightsApi";
import {
  fetchComments,
  createComment,
  deleteComment,
  type CreateCommentRequest,
} from "@/api/commentsApi";
import { useToast } from "@/components/ui/use-toast";

// ── Highlights ───────────────────────────────────────────────

export function useHighlights(meetingId: string) {
  return useQuery({
    queryKey: ["highlights", meetingId],
    queryFn: () => fetchHighlights(meetingId),
    enabled: !!meetingId,
  });
}

export function useCreateHighlight(meetingId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (req: CreateHighlightRequest) => createHighlight(meetingId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["highlights", meetingId] });
      toast({ title: "Line highlighted", variant: "success" });
    },
    onError: () => toast({ title: "Failed to highlight", variant: "error" }),
  });
}

export function useDeleteHighlight(meetingId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (highlightId: string) => deleteHighlight(meetingId, highlightId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["highlights", meetingId] });
      toast({ title: "Highlight removed", variant: "success" });
    },
    onError: () => toast({ title: "Failed to remove highlight", variant: "error" }),
  });
}

// ── Comments ─────────────────────────────────────────────────

export function useComments(meetingId: string) {
  return useQuery({
    queryKey: ["comments", meetingId],
    queryFn: () => fetchComments(meetingId),
    enabled: !!meetingId,
  });
}

export function useCreateComment(meetingId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (req: CreateCommentRequest) => createComment(meetingId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", meetingId] });
      toast({ title: "Comment added", variant: "success" });
    },
    onError: () => toast({ title: "Failed to add comment", variant: "error" }),
  });
}

export function useDeleteComment(meetingId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(meetingId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", meetingId] });
      toast({ title: "Comment deleted", variant: "success" });
    },
    onError: () => toast({ title: "Failed to delete comment", variant: "error" }),
  });
}
