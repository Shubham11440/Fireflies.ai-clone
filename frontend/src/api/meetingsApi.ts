import { apiClient } from "@/lib/apiClient";
import type {
  MeetingListResponse,
  MeetingDetail,
  CreateMeetingRequest,
  CreateMeetingResponse,
  UpdateMeetingRequest,
} from "@/types";

export interface MeetingsQueryParams {
  q?: string;
  participant?: string;
  topic?: string;
  sort?: "recent" | "title" | "duration";
  limit?: number;
  offset?: number;
}

export async function fetchMeetings(
  params: MeetingsQueryParams = {}
): Promise<MeetingListResponse> {
  const { data } = await apiClient.get<MeetingListResponse>("/api/meetings", {
    params,
  });
  return data;
}

export async function fetchMeeting(id: string): Promise<MeetingDetail> {
  const { data } = await apiClient.get<MeetingDetail>(
    `/api/meetings/${id}`
  );
  return data;
}

export async function createMeeting(
  req: CreateMeetingRequest
): Promise<CreateMeetingResponse> {
  const { data } = await apiClient.post<CreateMeetingResponse>(
    "/api/meetings",
    req
  );
  return data;
}

export async function updateMeeting(
  id: string,
  req: UpdateMeetingRequest
): Promise<MeetingDetail> {
  const { data } = await apiClient.patch<MeetingDetail>(
    `/api/meetings/${id}`,
    req
  );
  return data;
}

export async function deleteMeeting(id: string): Promise<void> {
  await apiClient.delete(`/api/meetings/${id}`);
}
