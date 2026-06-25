export interface MeetingListItem {
  id: string;
  title: string;
  occurred_at: string;
  duration_sec: number;
  source: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  participant_names: string | null;
  topic_names: string | null;
  summary_status: string | null;
  action_item_count: number;
}

export interface MeetingListResponse {
  items: MeetingListItem[];
  has_more: boolean;
  total: number;
}

export interface MeetingDetail {
  id: string;
  title: string;
  occurred_at: string;
  duration_sec: number;
  source: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  participants: Participant[];
}

export interface Participant {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
}

export interface TranscriptLine {
  id: string;
  meeting_id: string;
  seq: number;
  speaker: string | null;
  text: string;
  timestamp: string | null;
  start_offset: number | null;
  end_offset: number | null;
}

export interface TranscriptResponse {
  lines: TranscriptLine[];
  total_count: number;
  has_more: boolean;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  text: string;
  assignee: string | null;
  due_date: string | null;
  is_completed: boolean;
  source_line_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  title: string;
  start_offset: number | null;
  summary: string | null;
  seq: number;
}

export interface Topic {
  id: string;
  name: string;
  meeting_count?: number;
}

// ── Summary ─────────────────────────────────────────────────
export interface SummaryBlock {
  id: string;
  type: string;
  content: string;
  color?: string;
}

export interface SummarySection {
  title: string;
  blocks: SummaryBlock[];
}

export interface SummaryResult {
  meeting_name: string;
  people: SummarySection;
  session_summary: SummarySection;
  action_items: SummarySection;
  key_decisions: SummarySection;
  next_steps: SummarySection;
}

export interface SummaryProcessResponse {
  meeting_id: string;
  status: string;
  provider: string | null;
  result: SummaryResult | null;
  error: string | null;
  chunk_count: number;
  processing_time: number;
}
