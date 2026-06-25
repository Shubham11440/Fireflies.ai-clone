import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTopics,
  addTopicToMeeting,
  removeTopicFromMeeting,
} from "@/api/topicsApi";
import { useToast } from "@/components/ui/use-toast";

export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: fetchTopics,
  });
}

export function useAddTopic(meetingId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (name: string) => addTopicToMeeting(meetingId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      qc.invalidateQueries({ queryKey: ["meeting", meetingId] });
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "Topic added", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to add topic", variant: "error" });
    },
  });
}

export function useRemoveTopic(meetingId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (topicId: string) => removeTopicFromMeeting(meetingId, topicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      qc.invalidateQueries({ queryKey: ["meeting", meetingId] });
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "Topic removed", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to remove topic", variant: "error" });
    },
  });
}
