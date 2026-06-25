import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  type MeetingsQueryParams,
} from "@/api/meetingsApi";
import type { CreateMeetingRequest, UpdateMeetingRequest } from "@/types";

export function useMeetings(params: MeetingsQueryParams = {}) {
  return useQuery({
    queryKey: ["meetings", params],
    queryFn: () => fetchMeetings(params),
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateMeetingRequest) => createMeeting(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateMeetingRequest & { id: string }) =>
      updateMeeting(id, req),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["meeting", variables.id] });
    },
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMeeting(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
