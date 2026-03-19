CREATE TABLE IF NOT EXISTS viewers (
  viewer_address TEXT PRIMARY KEY,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  total_earned_cents INTEGER NOT NULL DEFAULT 0,
  total_withdrawn_cents INTEGER NOT NULL DEFAULT 0,
  impression_count INTEGER NOT NULL DEFAULT 0,
  registered_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS views (
  impression_id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL,
  viewer_address TEXT NOT NULL,
  earned_cents INTEGER NOT NULL DEFAULT 10,
  served_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ad_id) REFERENCES ads(ad_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_views_dedup ON views (ad_id, viewer_address);
CREATE INDEX IF NOT EXISTS idx_views_viewer ON views (viewer_address);

CREATE TABLE IF NOT EXISTS withdrawals (
  withdrawal_id TEXT PRIMARY KEY,
  viewer_address TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  payout_cents INTEGER NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_viewer ON withdrawals (viewer_address);
