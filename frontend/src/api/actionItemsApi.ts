import { apiClient } from "@/lib/apiClient";
import type { ActionItem } from "@/types";

export interface createActionItemRequest {
  text: string;
  assignee?: string;
  due_date?: string;
}

export interface updateActionItemRequest {
  text?: string;
  assignee?: string;
  due_date?: string;
  is_completed?: boolean;
}

export async function fetchActionItems(meetingId: string): Promise<ActionItem[]> {
  const { data } = await apiClient.get<ActionItem[]>(
    `/api/meetings/${meetingId}/action-items`
  );
  return data;
}

export async function createActionItem(
  meetingId: string,
  body: createActionItemRequest
): Promise<ActionItem> {
  const { data } = await apiClient.post<ActionItem>(
    `/api/meetings/${meetingId}/action-items`,
    body
  );
  return data;
}

export async function updateActionItem(
  itemId: string,
  body: updateActionItemRequest
): Promise<ActionItem> {
  const { data } = await apiClient.patch<ActionItem>(
    `/api/action-items/${itemId}`,
    body
  );
  return data;
}

export async function deleteActionItem(itemId: string): Promise<void> {
  await apiClient.delete(`/api/action-items/${itemId}`);
}
