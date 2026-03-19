-- Remove unique dedup constraint so the same viewer can view the same ad multiple times
DROP INDEX IF EXISTS idx_views_dedup;
CREATE INDEX IF NOT EXISTS idx_views_ad_viewer ON views (ad_id, viewer_address);
