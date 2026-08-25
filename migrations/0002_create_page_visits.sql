CREATE TABLE IF NOT EXISTS page_visits (
  page_id TEXT PRIMARY KEY,
  visit_count INTEGER NOT NULL DEFAULT 0 CHECK (visit_count >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
