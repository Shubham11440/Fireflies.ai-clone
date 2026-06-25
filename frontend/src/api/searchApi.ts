import { apiClient } from "@/lib/apiClient";

export type SearchType = "all" | "transcript" | "summary" | "action_item";

export interface SearchHit {
  meeting_id: string;
  title: string;
  type: "transcript" | "summary" | "action_item";
  line_id: string | null;
  snippet: string;
  offset: number | null;
}

export interface SearchResponse {
  items: SearchHit[];
  total: number;
}

export async function globalSearch(
  q: string,
  type: SearchType = "all",
  limit = 30
): Promise<SearchResponse> {
  const { data } = await apiClient.get<SearchResponse>("/api/search", {
    params: { q, type, limit },
  });
  return data;
}
