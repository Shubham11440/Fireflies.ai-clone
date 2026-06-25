import { apiClient } from "@/lib/apiClient";
import type { Chapter } from "@/types";

export async function fetchChapters(meetingId: string): Promise<Chapter[]> {
  const { data } = await apiClient.get<Chapter[]>(
    `/api/meetings/${meetingId}/chapters`
  );
  return data;
}

export async function generateChapters(meetingId: string): Promise<Chapter[]> {
  const { data } = await apiClient.post<Chapter[]>(
    `/api/meetings/${meetingId}/chapters/generate`
  );
  return data;
}
