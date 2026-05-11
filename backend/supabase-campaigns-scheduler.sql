-- Safe migration: add scheduler columns to campaigns
-- Run this in the Supabase SQL Editor.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sent_at      TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS target_segment TEXT DEFAULT 'all';

-- Index so the scheduler can quickly find due campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled
  ON campaigns (merchant_id, status, scheduled_at)
  WHERE scheduled_at IS NOT NULL AND sent_at IS NULL;
