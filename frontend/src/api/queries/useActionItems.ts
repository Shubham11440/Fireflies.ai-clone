import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  type createActionItemRequest,
  type updateActionItemRequest,
} from "@/api/actionItemsApi";

export function useActionItems(meetingId: string) {
  return useQuery({
    queryKey: ["actionItems", meetingId],
    queryFn: () => fetchActionItems(meetingId),
    enabled: !!meetingId,
  });
}

export function useCreateActionItem(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: createActionItemRequest) =>
      createActionItem(meetingId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useUpdateActionItem(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: updateActionItemRequest }) =>
      updateActionItem(itemId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useDeleteActionItem(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteActionItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
