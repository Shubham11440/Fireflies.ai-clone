import { apiClient } from "@/lib/apiClient";
import type { Topic } from "@/types";

export async function fetchTopics(): Promise<Topic[]> {
  const { data } = await apiClient.get<Topic[]>("/api/topics");
  return data;
}

export async function addTopicToMeeting(
  meetingId: string,
  name: string
): Promise<{ meeting_id: string; topic_id: string; name: string }> {
  const { data } = await apiClient.post(
    `/api/meetings/${meetingId}/topics`,
    { name }
  );
  return data;
}

export async function removeTopicFromMeeting(
  meetingId: string,
  topicId: string
): Promise<void> {
  await apiClient.delete(`/api/meetings/${meetingId}/topics/${topicId}`);
}
