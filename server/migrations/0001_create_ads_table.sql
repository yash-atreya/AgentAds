CREATE TABLE IF NOT EXISTS ads (
  ad_id TEXT PRIMARY KEY,
  creator_address TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ads_creator ON ads (creator_address);
