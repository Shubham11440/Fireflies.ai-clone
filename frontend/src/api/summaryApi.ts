import { apiClient } from "@/lib/apiClient";
import type { SummaryProcessResponse } from "@/types";

export interface NotesResponse {
  meeting_id: string;
  notes_markdown: string | null;
  notes_json: string | null;
}

export async function fetchSummary(meetingId: string): Promise<SummaryProcessResponse> {
  const { data } = await apiClient.get<SummaryProcessResponse>(
    `/api/meetings/${meetingId}/summary`
  );
  return data;
}

export async function generateSummary(meetingId: string): Promise<{ status: string }> {
  const { data } = await apiClient.post<{ status: string }>(
    `/api/meetings/${meetingId}/summary`
  );
  return data;
}

export async function updateSummary(
  meetingId: string,
  result: Record<string, unknown>
): Promise<{ status: string }> {
  const { data } = await apiClient.put<{ status: string }>(
    `/api/meetings/${meetingId}/summary`,
    { result }
  );
  return data;
}

export async function fetchNotes(meetingId: string): Promise<NotesResponse> {
  const { data } = await apiClient.get<NotesResponse>(
    `/api/meetings/${meetingId}/notes`
  );
  return data;
}

export async function updateNotes(
  meetingId: string,
  notes: { notes_markdown?: string; notes_json?: string }
): Promise<{ status: string }> {
  const { data } = await apiClient.put<{ status: string }>(
    `/api/meetings/${meetingId}/notes`,
    notes
  );
  return data;
}
