CREATE TABLE IF NOT EXISTS wallpaper_downloads (
  wallpaper_id TEXT PRIMARY KEY,
  download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
