import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSummary, generateSummary, updateSummary } from "@/api/summaryApi";

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
  return useMutation({
    mutationFn: () => generateSummary(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", meetingId] });
    },
  });
}

export function useUpdateSummary(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (result: Record<string, unknown>) =>
      updateSummary(meetingId, result),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", meetingId] });
    },
  });
}
