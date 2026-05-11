-- DineFlow v2: extended fields for SaaS UI (run in Supabase SQL editor after base schema)

ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS crm_status TEXT DEFAULT 'active';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'member';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ;

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT 999;

ALTER TABLE bills ADD COLUMN IF NOT EXISTS order_label TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'dine-in';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS table_ref TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0.085;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_last_four TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS held BOOLEAN DEFAULT false;

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

-- Merchant settings columns (for persistent settings)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(6,4) DEFAULT 0.085;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS receipt_template TEXT DEFAULT 'standard';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS staff_roles TEXT[] DEFAULT ARRAY['admin','manager','cashier'];
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS points_rate DECIMAL(5,2) DEFAULT 5;
