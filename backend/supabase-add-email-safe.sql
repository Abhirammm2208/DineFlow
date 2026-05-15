-- DineFlow: Safe idempotent migration to add email support
-- Run this in the Supabase SQL Editor. All statements use IF NOT EXISTS / IF EXISTS guards.

-- 1) Add email column to customers if missing
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2) Add crm_status and loyalty_tier if missing (used by the app)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS crm_status TEXT DEFAULT 'active';

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'member';

-- 3) Add last_visit_at and last_winback_sent_at if missing
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS last_winback_sent_at TIMESTAMPTZ;

-- 4) Create index on email for fast search (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_customers_email'
  ) THEN
    CREATE INDEX idx_customers_email ON customers(email);
  END IF;
END
$$;

-- 5) Create index on merchant_id + email for merchant-scoped email lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_customers_merchant_email'
  ) THEN
    CREATE INDEX idx_customers_merchant_email ON customers(merchant_id, email);
  END IF;
END
$$;

-- 6) Ensure bills columns used by punch flow exist
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS order_label TEXT,
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'dine-in',
ADD COLUMN IF NOT EXISTS table_ref TEXT,
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0.085,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_last_four TEXT,
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS held BOOLEAN DEFAULT false;

-- 7) Ensure campaigns table exists
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  icon TEXT,
  stat_primary_label TEXT,
  stat_primary_value TEXT,
  stat_secondary_label TEXT,
  stat_secondary_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_merchant ON campaigns(merchant_id);

-- 8) Ensure merchant settings columns exist
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(6,4) DEFAULT 0.085,
ADD COLUMN IF NOT EXISTS receipt_template TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS staff_roles TEXT[] DEFAULT ARRAY['admin','manager','cashier'],
ADD COLUMN IF NOT EXISTS points_rate DECIMAL(5,2) DEFAULT 5,
ADD COLUMN IF NOT EXISTS winback_subject TEXT,
ADD COLUMN IF NOT EXISTS winback_body TEXT;

-- 9) Ensure menu_items v2 columns exist
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT 999;

-- 10) Sync updated_at on customers when rows change
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_customers_updated_at'
  ) THEN
    CREATE TRIGGER set_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;
