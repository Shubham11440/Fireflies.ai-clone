"""Transcript import parsers for .txt, .vtt, and .json formats."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class ParsedLine:
    text: str
    speaker: Optional[str] = None
    timestamp: Optional[str] = None
    start_offset: Optional[float] = None
    end_offset: Optional[float] = None


def parse_vtt(content: str) -> list[ParsedLine]:
    """Parse WebVTT format into transcript lines with timing."""
    lines: list[ParsedLine] = []
    blocks = re.split(r"\n\n+", content.strip())

    for block in blocks:
        block_lines = block.strip().split("\n")
        if len(block_lines) < 2:
            continue
        if block_lines[0].startswith("WEBVTT"):
            continue

        ts_match = None
        text_start = 0
        for i, line in enumerate(block_lines):
            ts_match = re.match(
                r"(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})", line
            )
            if ts_match:
                text_start = i + 1
                break

        if not ts_match:
            continue

        start = _vtt_to_seconds(ts_match.group(1))
        end = _vtt_to_seconds(ts_match.group(2))
        text = " ".join(block_lines[text_start:]).strip()

        if text:
            lines.append(ParsedLine(text=text, start_offset=start, end_offset=end))

    return lines


def _vtt_to_seconds(ts: str) -> float:
    parts = ts.split(":")
    h, m = int(parts[0]), int(parts[1])
    s_parts = parts[2].split(".")
    s = int(s_parts[0])
    ms = int(s_parts[1]) if len(s_parts) > 1 else 0
    return h * 3600 + m * 60 + s + ms / 1000.0


def parse_json(content: str) -> list[ParsedLine]:
    """Parse JSON transcript. Accepts array of {speaker, text, start, end}
    or object with a transcript/lines array."""
    data = json.loads(content)

    if isinstance(data, dict):
        data = data.get("transcript") or data.get("lines") or data.get("segments") or []

    lines: list[ParsedLine] = []
    for item in data:
        if not isinstance(item, dict) or not item.get("text"):
            continue
        lines.append(
            ParsedLine(
                text=item["text"],
                speaker=item.get("speaker"),
                start_offset=_to_float(item.get("start")),
                end_offset=_to_float(item.get("end")),
            )
        )
    return lines


def _to_float(val) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def parse_txt(content: str) -> list[ParsedLine]:
    """Parse plain text. Each non-empty line becomes a transcript line.
    Speaker detection: lines matching 'Speaker: text' or 'Name: text'."""
    lines: list[ParsedLine] = []
    raw_lines = [l.strip() for l in content.strip().split("\n") if l.strip()]

    total_chars = sum(len(l) for l in raw_lines)
    if total_chars == 0:
        return lines

    default_duration = 60.0
    elapsed = 0.0

    for raw in raw_lines:
        speaker = None
        text = raw
        m = re.match(r"^([A-Za-z][\w\s]{0,30}?):\s*(.+)$", raw)
        if m:
            speaker = m.group(1).strip()
            text = m.group(2).strip()

        char_ratio = len(raw) / total_chars if total_chars > 0 else 1 / len(raw_lines)
        line_duration = char_ratio * default_duration
        start = elapsed
        end = elapsed + line_duration
        elapsed = end

        lines.append(ParsedLine(text=text, speaker=speaker, start_offset=start, end_offset=end))

    return lines


def assign_sequential_offsets(lines: list[ParsedLine], duration_sec: float) -> list[ParsedLine]:
    """Assign proportional sequential offsets to lines that lack timing."""
    if not lines:
        return lines

    total_chars = sum(len(l.text) for l in lines)
    if total_chars == 0:
        total_chars = len(lines)

    elapsed = 0.0
    for line in lines:
        if line.start_offset is None or line.end_offset is None:
            char_ratio = len(line.text) / total_chars if total_chars > 0 else 1 / len(lines)
            line_duration = char_ratio * duration_sec
            line.start_offset = elapsed
            line.end_offset = elapsed + line_duration
        elapsed = line.end_offset or elapsed

    return lines
