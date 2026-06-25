import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotes, updateNotes } from "@/api/summaryApi";

export function useNotes(meetingId: string) {
  return useQuery({
    queryKey: ["notes", meetingId],
    queryFn: () => fetchNotes(meetingId),
    enabled: !!meetingId,
  });
}

export function useUpdateNotes(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes: { notes_markdown?: string; notes_json?: string }) =>
      updateNotes(meetingId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", meetingId] });
    },
  });
}
