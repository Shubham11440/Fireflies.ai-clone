import { apiClient } from "@/lib/apiClient";

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatThread {
  thread_id: string;
  meeting_id: string;
  created_at: string;
}

export async function createOrGetThread(meetingId: string): Promise<ChatThread> {
  const { data } = await apiClient.post<ChatThread>(
    `/api/meetings/${meetingId}/chat`
  );
  return data;
}

export async function postMessage(
  threadId: string,
  question: string
): Promise<{ user: ChatMessage; assistant: ChatMessage }> {
  const { data } = await apiClient.post<{ user: ChatMessage; assistant: ChatMessage }>(
    `/api/chat/${threadId}/messages`,
    { question }
  );
  return data;
}

export async function fetchMessages(threadId: string): Promise<{ messages: ChatMessage[] }> {
  const { data } = await apiClient.get<{ messages: ChatMessage[] }>(
    `/api/chat/${threadId}/messages`
  );
  return data;
}
