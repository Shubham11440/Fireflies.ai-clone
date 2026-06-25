import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchTranscript } from "@/api/transcriptApi";

const PAGE_SIZE = 100;

export function useTranscript(meetingId: string) {
  return useInfiniteQuery({
    queryKey: ["transcript", meetingId],
    queryFn: ({ pageParam = 0 }) =>
      fetchTranscript(meetingId, PAGE_SIZE, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.has_more) {
        return allPages.length * PAGE_SIZE;
      }
      return undefined;
    },
    initialPageParam: 0,
    enabled: !!meetingId,
  });
}
