import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  type MeetingsQueryParams,
} from "@/api/meetingsApi";
import type { CreateMeetingRequest, UpdateMeetingRequest } from "@/types";
import { useToast } from "@/components/ui/use-toast";

export function useMeetings(params: MeetingsQueryParams = {}) {
  return useQuery({
    queryKey: ["meetings", params],
    queryFn: () => fetchMeetings(params),
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (req: CreateMeetingRequest) => createMeeting(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "Meeting created", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to create meeting", variant: "error" });
    },
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateMeetingRequest & { id: string }) =>
      updateMeeting(id, req),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["meeting", variables.id] });
      toast({ title: "Meeting updated", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to update meeting", variant: "error" });
    },
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => deleteMeeting(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "Meeting deleted", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to delete meeting", variant: "error" });
    },
  });
}
