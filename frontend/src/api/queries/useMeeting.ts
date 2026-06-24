import { useQuery } from "@tanstack/react-query";
import { fetchMeeting } from "@/api/meetingsApi";

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ["meeting", id],
    queryFn: () => fetchMeeting(id),
    enabled: !!id,
  });
}
