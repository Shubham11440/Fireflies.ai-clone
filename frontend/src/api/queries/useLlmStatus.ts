import { useQuery } from "@tanstack/react-query";
import { fetchLlmStatus } from "@/api/llmApi";

export function useLlmStatus() {
  return useQuery({
    queryKey: ["llmStatus"],
    queryFn: fetchLlmStatus,
    staleTime: 5 * 60 * 1000,
  });
}
