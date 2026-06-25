import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  type createActionItemRequest,
  type updateActionItemRequest,
} from "@/api/actionItemsApi";
import { useToast } from "@/components/ui/use-toast";

export function useActionItems(meetingId: string) {
  return useQuery({
    queryKey: ["actionItems", meetingId],
    queryFn: () => fetchActionItems(meetingId),
    enabled: !!meetingId,
  });
}

export function useCreateActionItem(meetingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (body: createActionItemRequest) =>
      createActionItem(meetingId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "Action item added", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to add action item", variant: "error" });
    },
  });
}

export function useUpdateActionItem(meetingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: updateActionItemRequest }) =>
      updateActionItem(itemId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "Action item updated", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to update action item", variant: "error" });
    },
  });
}

export function useDeleteActionItem(meetingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (itemId: string) => deleteActionItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "Action item deleted", variant: "success" });
    },
    onError: () => {
      toast({ title: "Failed to delete action item", variant: "error" });
    },
  });
}
