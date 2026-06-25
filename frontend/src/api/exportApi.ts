import { apiClient } from "@/lib/apiClient";

export type ExportFormat = "md" | "txt" | "pdf";
export type ExportContent = "all" | "transcript" | "summary";

export async function exportMeeting(
  meetingId: string,
  format: ExportFormat,
  content: ExportContent = "all"
): Promise<{ blob: Blob; filename: string }> {
  const response = await apiClient.get(
    `/api/meetings/${meetingId}/export`,
    {
      params: { format, content },
      responseType: "blob",
    }
  );

  // Extract filename from Content-Disposition header
  const disposition = response.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `meeting.${format === "pdf" ? "html" : format}`;

  return { blob: response.data as Blob, filename };
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
