import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials');
  console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SECRET:', supabaseKey ? 'SET' : 'NOT SET');
  console.error('Current env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SECRET in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface Merchant {
  id: string;
  name: string;
  email: string;
  phone: string;
  pin_hash: string;
  tax_rate?: number | null;
  receipt_template?: string | null;
  staff_roles?: string[] | null;
  created_at: string;
}

export interface Customer {
  id: string;
  merchant_id: string;
  phone: string;
  name: string;
  points_balance: number;
  total_visits: number;
  total_spend: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  merchant_id: string;
  name: string;
  price: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface Bill {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  items: BillItem[];
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
}

export interface BillItem {
  menu_item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}
