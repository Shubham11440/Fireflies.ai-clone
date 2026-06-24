import { apiClient } from "@/lib/apiClient";
import type { MeetingListResponse, MeetingDetail } from "@/types";

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
