import { apiClient } from "@/lib/apiClient";

export interface Comment {
  id: string;
  meeting_id: string;
  line_id: string;
  author: string;
  body: string;
  created_at: string;
}

export interface CreateCommentRequest {
  line_id: string;
  body: string;
  author?: string;
}

export async function fetchComments(meetingId: string): Promise<{ items: Comment[] }> {
  const { data } = await apiClient.get<{ items: Comment[] }>(
    `/api/meetings/${meetingId}/comments`
  );
  return data;
}

export async function createComment(
  meetingId: string,
  req: CreateCommentRequest
): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(
    `/api/meetings/${meetingId}/comments`,
    req
  );
  return data;
}

export async function deleteComment(meetingId: string, commentId: string): Promise<void> {
  await apiClient.delete(`/api/meetings/${meetingId}/comments/${commentId}`);
}
