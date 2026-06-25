import type { MediaSource } from "@/types";

const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|ogg|flac|aac|wma)(\?.*)?$/i;

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?.*v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function extractYoutubeId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

function isAudioUrl(url: string): boolean {
  return AUDIO_EXTENSIONS.test(url.split("?")[0]);
}

export function parseMediaUrl(
  raw: string | null | undefined,
  fileName?: string
): MediaSource | null {
  if (!raw) {
    if (fileName) {
      const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
      if (["mp3", "wav", "m4a", "ogg", "flac", "aac", "wma"].includes(ext)) {
        return { kind: "audio", url: raw ?? "", label: fileName };
      }
      return { kind: "file", url: raw ?? "", label: fileName };
    }
    return null;
  }

  const videoId = extractYoutubeId(raw);
  if (videoId) {
    return {
      kind: "youtube",
      url: `https://www.youtube.com/embed/${videoId}`,
      label: "YouTube",
    };
  }

  if (isAudioUrl(raw)) {
    return { kind: "audio", url: raw };
  }

  return { kind: "file", url: raw };
}
