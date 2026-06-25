import { apiClient } from "@/lib/apiClient";

export interface Highlight {
  id: string;
  meeting_id: string;
  line_id: string;
  color: string;
  note: string | null;
  created_at: string;
}

export interface CreateHighlightRequest {
  line_id: string;
  color?: string;
  note?: string;
}

export async function fetchHighlights(meetingId: string): Promise<{ items: Highlight[] }> {
  const { data } = await apiClient.get<{ items: Highlight[] }>(
    `/api/meetings/${meetingId}/highlights`
  );
  return data;
}

export async function createHighlight(
  meetingId: string,
  req: CreateHighlightRequest
): Promise<Highlight> {
  const { data } = await apiClient.post<Highlight>(
    `/api/meetings/${meetingId}/highlights`,
    req
  );
  return data;
}

export async function deleteHighlight(meetingId: string, highlightId: string): Promise<void> {
  await apiClient.delete(`/api/meetings/${meetingId}/highlights/${highlightId}`);
}
