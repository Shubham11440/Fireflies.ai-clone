import { useQuery } from "@tanstack/react-query";
import { searchTranscript } from "@/api/transcriptApi";

export function useTranscriptSearch(meetingId: string, q: string) {
  return useQuery({
    queryKey: ["transcriptSearch", meetingId, q],
    queryFn: () => searchTranscript(meetingId, q),
    enabled: !!meetingId && q.length >= 2,
    staleTime: 5000,
  });
}
