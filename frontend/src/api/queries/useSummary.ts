import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSummary, generateSummary, updateSummary } from "@/api/summaryApi";
import { useToast } from "@/components/ui/use-toast";

export function useSummary(meetingId: string) {
  return useQuery({
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
