import { useQuery } from "@tanstack/react-query";
import { globalSearch, type SearchType } from "@/api/searchApi";

export function useGlobalSearch(q: string, type: SearchType = "all", limit = 30) {
  return useQuery({
    queryKey: ["globalSearch", q, type, limit],
    queryFn: () => globalSearch(q, type, limit),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}
