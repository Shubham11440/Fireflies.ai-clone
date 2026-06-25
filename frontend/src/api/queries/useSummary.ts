import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { fetchSummary, generateSummary, updateSummary } from "@/api/summaryApi";
import { useToast } from "@/components/ui/use-toast";
import { useNotificationsStore } from "@/stores/notificationsStore";

export function useSummary(meetingId: string) {
  const prevStatus = useRef<string | null>(null);
  const addNotification = useNotificationsStore((s) => s.addNotification);

  const query = useQuery({
    queryKey: ["summary", meetingId],
    queryFn: () => fetchSummary(meetingId),
    enabled: !!meetingId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "processing") {
        return 2000;
      }
      return false;
    },
  });

  useEffect(() => {
    const status = query.data?.status;
    if (!status) return;

    if (
      prevStatus.current &&
      (prevStatus.current === "processing" || prevStatus.current === "pending") &&
      status === "completed"
    ) {
      addNotification({
        type: "summary",
        title: "Summary ready",
        message: query.data?.result?.meeting_name || "Your meeting summary is ready to view",
        meeting_id: meetingId,
      });
    }

    prevStatus.current = status;
  }, [query.data?.status, meetingId, addNotification, query.data?.result?.meeting_name]);

  return query;
}

export function useGenerateSummary(meetingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => generateSummary(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", meetingId] });
      toast({ title: "Summary generation started", variant: "info" });
    },
    onError: () => {
      toast({ title: "Failed to generate summary", variant: "error" });
    },
  });
}

export function useUpdateSummary(meetingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (result: Record<string, unknown>) =>
      updateSummary(meetingId, result),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", meetingId] });
      toast({ title: "Summary saved", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to save summary", variant: "error" });
    },
  });
}
