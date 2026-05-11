-- Safe migration: add telegram_chat_id to customers
-- Run this in the Supabase SQL Editor.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT DEFAULT NULL;

-- Index for quick lookup if needed
CREATE INDEX IF NOT EXISTS idx_customers_telegram_chat_id
  ON customers (merchant_id, telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;
