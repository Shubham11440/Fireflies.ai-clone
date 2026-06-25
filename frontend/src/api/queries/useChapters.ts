import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchChapters, generateChapters } from "@/api/chaptersApi";
import { useToast } from "@/components/ui/use-toast";

export function useChapters(meetingId: string) {
  return useQuery({
    queryKey: ["chapters", meetingId],
    queryFn: () => fetchChapters(meetingId),
    enabled: !!meetingId,
  });
}

export function useGenerateChapters(meetingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => generateChapters(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters", meetingId] });
      toast({ title: "Chapters generated", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to generate chapters", variant: "error" });
    },
  });
}
