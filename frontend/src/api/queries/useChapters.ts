import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchChapters, generateChapters } from "@/api/chaptersApi";
import { useToast } from "@/components/ui/use-toast";
import { useNotificationsStore } from "@/stores/notificationsStore";

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
  const addNotification = useNotificationsStore((s) => s.addNotification);
  return useMutation({
    mutationFn: () => generateChapters(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters", meetingId] });
      toast({ title: "Chapters generated", variant: "success" });
      addNotification({
        type: "chapter",
        title: "Chapters ready",
        message: "Your meeting chapters have been generated",
        meeting_id: meetingId,
      });
    },
    onError: () => {
      toast({ title: "Failed to generate chapters", variant: "error" });
      addNotification({
        type: "chapter",
        title: "Chapter generation failed",
        message: "Failed to generate meeting chapters",
        meeting_id: meetingId,
      });
    },
  });
}
