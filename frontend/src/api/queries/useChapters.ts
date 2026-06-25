import { useQuery } from "@tanstack/react-query";
import { fetchChapters } from "@/api/chaptersApi";

export function useChapters(meetingId: string) {
  return useQuery({
    queryKey: ["chapters", meetingId],
    queryFn: () => fetchChapters(meetingId),
    enabled: !!meetingId,
  });
}
