import { apiClient } from "@/lib/apiClient";

export interface LlmStatusResponse {
  provider: string;
  is_mock: boolean;
}

export async function fetchLlmStatus(): Promise<LlmStatusResponse> {
  const { data } = await apiClient.get<LlmStatusResponse>("/api/llm/status");
  return data;
}
