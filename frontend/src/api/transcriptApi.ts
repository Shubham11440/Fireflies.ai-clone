import { apiClient } from "@/lib/apiClient";
import type { TranscriptResponse } from "@/types";

export interface TranscriptSearchParams {
  q: string;
}

export interface TranscriptSearchResultItem {
  line_id: string;
  meeting_id: string;
  seq: number;
  speaker: string | null;
  text: string;
  start_offset: number | null;
}

export interface TranscriptSearchResponse {
  items: TranscriptSearchResultItem[];
  total: number;
}

export async function fetchTranscript(
  meetingId: string,
  limit = 100,
  offset = 0
): Promise<TranscriptResponse> {
  const { data } = await apiClient.get<TranscriptResponse>(
    `/api/meetings/${meetingId}/transcript`,
    { params: { limit, offset } }
  );
  return data;
}

export async function searchTranscript(
  meetingId: string,
  q: string
): Promise<TranscriptSearchResponse> {
  const { data } = await apiClient.get<TranscriptSearchResponse>(
    `/api/meetings/${meetingId}/transcript/search`,
    { params: { q } }
  );
  return data;
}
