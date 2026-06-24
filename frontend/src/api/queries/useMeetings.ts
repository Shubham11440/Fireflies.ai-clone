import { useQuery } from "@tanstack/react-query";
import { fetchMeetings, type MeetingsQueryParams } from "@/api/meetingsApi";

export function useMeetings(params: MeetingsQueryParams = {}) {
  return useQuery({
    queryKey: ["meetings", params],
    queryFn: () => fetchMeetings(params),
  });
}
