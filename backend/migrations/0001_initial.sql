-- ============================================================
-- Fireflies Clone — Initial Schema Migration
-- SQLite with WAL mode, foreign keys enforced
-- All PKs are TEXT UUIDs, timestamps are RFC3339 TEXT in UTC
-- ============================================================

-- ============================================================
-- users (single default user; modeled for schema completeness)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE,
    avatar_url    TEXT,
    created_at    TEXT NOT NULL
);

-- ============================================================
-- meetings (library + detail root)
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id),
    title         TEXT NOT NULL,
    occurred_at   TEXT NOT NULL,
    duration_sec  REAL NOT NULL DEFAULT 0,
    source        TEXT NOT NULL DEFAULT 'manual',
    media_url     TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_meetings_user_occurred ON meetings(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_title ON meetings(title);

-- ============================================================
-- transcript_lines (interactive transcript segments)
-- start_offset/end_offset = seconds from recording start
-- ============================================================
CREATE TABLE IF NOT EXISTS transcript_lines (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    seq           INTEGER NOT NULL,
    speaker       TEXT,
    text          TEXT NOT NULL,
    timestamp     TEXT,
    start_offset  REAL,
    end_offset    REAL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_transcript_meeting_seq
    ON transcript_lines(meeting_id, seq);
CREATE INDEX IF NOT EXISTS idx_transcript_fts ON transcript_lines(text);

-- Full-text search index across transcript text (SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS transcript_fts USING fts5(
    line_id UNINDEXED,
    meeting_id UNINDEXED,
    text,
    content='transcript_lines',
    content_rowid='rowid'
);

-- ============================================================
-- participants (library shows them; detached from speaker labels)
-- ============================================================
CREATE TABLE IF NOT EXISTS participants (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    email         TEXT,
    role          TEXT
);
CREATE INDEX IF NOT EXISTS idx_participants_meeting ON participants(meeting_id);

-- ============================================================
-- summary_processes (async summary state machine)
-- ============================================================
CREATE TABLE IF NOT EXISTS summary_processes (
    meeting_id      TEXT PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
    status          TEXT NOT NULL,
    provider        TEXT,
    model           TEXT,
    result          TEXT,
    error           TEXT,
    chunk_count     INTEGER NOT NULL DEFAULT 0,
    processing_time REAL NOT NULL DEFAULT 0,
    start_time      TEXT,
    end_time        TEXT,
    result_backup   TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

-- ============================================================
-- action_items (first-class; CRUD + completion)
-- ============================================================
CREATE TABLE IF NOT EXISTS action_items (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    text          TEXT NOT NULL,
    assignee      TEXT,
    due_date      TEXT,
    is_completed  INTEGER NOT NULL DEFAULT 0,
    source_line_id TEXT REFERENCES transcript_lines(id) ON DELETE SET NULL,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_actions_meeting ON action_items(meeting_id);

-- ============================================================
-- topics + meeting_topics (key topics/outline + tag filter)
-- ============================================================
CREATE TABLE IF NOT EXISTS topics (
    id            TEXT PRIMARY KEY,
    name          TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS meeting_topics (
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    topic_id      TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (meeting_id, topic_id)
);
CREATE INDEX IF NOT EXISTS idx_meeting_topics ON meeting_topics(topic_id);

-- ============================================================
-- chapters (key topics / outline / chapters)
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    start_offset  REAL,
    summary       TEXT,
    seq           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chapters_meeting ON chapters(meeting_id, seq);

-- ============================================================
-- meeting_notes (free-form user notes via BlockNote)
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_notes (
    meeting_id      TEXT PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
    notes_markdown  TEXT,
    notes_json      TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

-- ============================================================
-- highlights (soundbites) + comments (bonus)
-- ============================================================
CREATE TABLE IF NOT EXISTS highlights (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    line_id       TEXT NOT NULL REFERENCES transcript_lines(id) ON DELETE CASCADE,
    color         TEXT DEFAULT 'yellow',
    note          TEXT,
    created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS comments (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    line_id       TEXT NOT NULL REFERENCES transcript_lines(id) ON DELETE CASCADE,
    author        TEXT,
    body          TEXT NOT NULL,
    created_at    TEXT NOT NULL
);

-- ============================================================
-- chat (bonus: "ask a question about this meeting")
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_threads (
    id            TEXT PRIMARY KEY,
    meeting_id    TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_messages (
    id            TEXT PRIMARY KEY,
    thread_id     TEXT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    role          TEXT NOT NULL,
    content       TEXT NOT NULL,
    created_at    TEXT NOT NULL
);
