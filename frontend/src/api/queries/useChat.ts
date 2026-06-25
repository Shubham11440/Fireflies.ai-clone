import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createOrGetThread,
  postMessage,
  fetchMessages,
  type ChatMessage,
} from "@/api/chatApi";

export function useChat(meetingId: string) {
  const qc = useQueryClient();

  // Auto-create/get thread on mount
  const threadQuery = useQuery({
    queryKey: ["chatThread", meetingId],
    queryFn: () => createOrGetThread(meetingId),
    enabled: !!meetingId,
  });

  const threadId = threadQuery.data?.thread_id;

  // Fetch message history
  const messagesQuery = useQuery({
    queryKey: ["chatMessages", threadId],
    queryFn: () => fetchMessages(threadId!),
    enabled: !!threadId,
  });

  // Post message mutation — optimistic update
  const postMutation = useMutation({
    mutationFn: (question: string) => postMessage(threadId!, question),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chatMessages", threadId] });
    },
  });

  return {
    threadId,
    messages: messagesQuery.data?.messages ?? [],
    isLoadingThread: threadQuery.isLoading,
    isLoadingMessages: messagesQuery.isLoading,
    isSending: postMutation.isPending,
    sendMessage: (q: string) => postMutation.mutateAsync(q),
    error: postMutation.error,
  };
}
