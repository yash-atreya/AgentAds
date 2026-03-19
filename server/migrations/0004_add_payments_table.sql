CREATE TABLE IF NOT EXISTS payments (
  payment_id TEXT PRIMARY KEY,
  tx_hash TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  ad_id TEXT,
  amount_cents INTEGER NOT NULL,
  payer_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_tx_hash ON payments (tx_hash);
CREATE INDEX IF NOT EXISTS idx_payments_ad_id ON payments (ad_id);
