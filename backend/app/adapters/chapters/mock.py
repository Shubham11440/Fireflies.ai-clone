"""Mock chapter provider — splits transcript into time-based segments with no LLM call."""
from __future__ import annotations

from backend.app.logging.logger import CustomLogger


TARGET_CHAPTERS = 5


class MockChapterProvider:
    """Deterministic, zero-config chapter generation from transcript timestamps."""

    def generate_chapters(
        self, transcript_lines: list[dict], *, logger: CustomLogger
    ) -> list[dict]:
        if not transcript_lines:
            return []

        lines_with_offset = [
            (line.get("start_offset", 0) or 0, line)
            for line in transcript_lines
        ]
        lines_with_offset.sort(key=lambda x: x[0])

        total_duration = lines_with_offset[-1][0] if lines_with_offset else 0
        if total_duration <= 0:
            total_duration = max(
                (line.get("end_offset", 0) or 0) for _, line in lines_with_offset
            )

        num_chapters = min(TARGET_CHAPTERS, len(lines_with_offset))
        if num_chapters <= 1:
            first_line = lines_with_offset[0][1]
            speaker = first_line.get("speaker", "Speaker")
            text = (first_line.get("text", "") or "")[:80]
            return [
                {
                    "title": f"{speaker}: {text}".strip() or "Meeting Start",
                    "start_offset": lines_with_offset[0][0],
                    "summary": first_line.get("text", ""),
                }
            ]

        segment_duration = total_duration / num_chapters
        chapters = []

        for i in range(num_chapters):
            seg_start = i * segment_duration
            seg_end = (i + 1) * segment_duration if i < num_chapters - 1 else total_duration

            # Find the first line in this segment
            first_line = None
            for offset, line in lines_with_offset:
                if offset >= seg_start - 1:
                    first_line = (offset, line)
                    break
            if first_line is None:
                first_line = lines_with_offset[0]

            speaker = first_line[1].get("speaker", "Speaker")
            text = (first_line[1].get("text", "") or "")[:80]
            title = f"{speaker}: {text}".strip() or f"Part {i + 1}"

            # Collect all text in this segment for summary
            segment_texts = []
            for offset, line in lines_with_offset:
                if seg_start - 1 <= offset < seg_end:
                    t = line.get("text", "")
                    if t:
                        segment_texts.append(t)
            summary = " ".join(segment_texts)[:200]

            chapters.append({
                "title": title,
                "start_offset": round(first_line[0], 1),
                "summary": summary or None,
            })

        return chapters
