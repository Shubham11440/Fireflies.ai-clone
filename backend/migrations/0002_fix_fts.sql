-- Fix FTS5 table: convert from content-sync to standalone
-- The content-sync approach caused issues with JOINs and MATCH queries

-- Drop the old content-sync FTS table
DROP TABLE IF EXISTS transcript_fts;

-- Recreate as standalone FTS5 table (stores its own data)
CREATE VIRTUAL TABLE transcript_fts USING fts5(
    line_id UNINDEXED,
    meeting_id UNINDEXED,
    text
);

-- Re-populate from transcript_lines
INSERT INTO transcript_fts (line_id, meeting_id, text)
SELECT id, meeting_id, text FROM transcript_lines;
