import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { demoBills, demoCampaigns, demoCustomers, demoMerchant, demoMenuItems } from '../dist/data/demoSeed.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET;

if (!supabaseUrl || !supabaseSecret) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecret);

async function insertWithFallback(table, extendedRows, baseRows, context) {
  const first = await supabase.from(table).insert(extendedRows).select();
  if (!first.error) {
    return first;
  }

  const fallback = await supabase.from(table).insert(baseRows).select();
  if (fallback.error) {
    console.error(`${context} seed failed:`, fallback.error.message);
    process.exit(1);
  }

  return fallback;
}

async function seed() {
  const pinHash = await bcrypt.hash(demoMerchant.pin, 10);

  const { data: merchantRows, error: merchantLookupError } = await supabase
    .from('merchants')
    .select('id')
    .eq('email', demoMerchant.email)
    .limit(1);

  if (merchantLookupError) {
    console.error('Could not read merchants table:', merchantLookupError.message);
    process.exit(1);
  }

  let merchantId = merchantRows?.[0]?.id;

  if (!merchantId) {
    const extended = [
      {
        name: demoMerchant.name,
        email: demoMerchant.email,
        phone: demoMerchant.phone,
        pin_hash: pinHash,
        tax_rate: demoMerchant.tax_rate,
        receipt_template: demoMerchant.receipt_template,
        staff_roles: demoMerchant.staff_roles,
      },
    ];
    const base = [
      {
        name: demoMerchant.name,
        email: demoMerchant.email,
        phone: demoMerchant.phone,
        pin_hash: pinHash,
      },
    ];
    const { data, error } = await insertWithFallback('merchants', extended, base, 'Merchant');

    if (error || !data?.[0]) {
      console.error('Merchant seed failed:', error?.message || 'unknown error');
      process.exit(1);
    }

    merchantId = data[0].id;
  }

  const { count: existingMenuCount } = await supabase
    .from('menu_items')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId);

  if (!existingMenuCount) {
    const extended = demoMenuItems.map((item) => ({
      merchant_id: merchantId,
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      is_active: true,
      stock_qty: 999,
    }));
    const base = demoMenuItems.map((item) => ({
      merchant_id: merchantId,
      name: item.name,
      price: item.price,
      category: item.category,
      is_active: true,
    }));
    await insertWithFallback('menu_items', extended, base, 'Menu');
  }

  const { count: existingCustomerCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId);

  if (!existingCustomerCount) {
    const extended = demoCustomers.map((customer) => ({
      merchant_id: merchantId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      points_balance: customer.points_balance,
      total_visits: customer.total_visits,
      total_spend: customer.total_spend,
      crm_status: customer.crm_status,
      loyalty_tier: customer.loyalty_tier,
      last_visit_at: customer.last_visit_at,
    }));
    const base = demoCustomers.map((customer) => ({
      merchant_id: merchantId,
      name: customer.name,
      phone: customer.phone,
      points_balance: customer.points_balance,
      total_visits: customer.total_visits,
      total_spend: customer.total_spend,
    }));
    await insertWithFallback('customers', extended, base, 'Customer');
  }

  const { count: existingCampaignCount } = await supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId);

  if (!existingCampaignCount) {
    try {
      await supabase.from('campaigns').insert(
        demoCampaigns.map((campaign) => ({
          merchant_id: merchantId,
          ...campaign,
        }))
      );
    } catch {
      // Campaigns table may be absent in older schemas; skip without blocking demo setup.
    }
  }

  const { count: existingBillCount } = await supabase
    .from('bills')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId);

  if (!existingBillCount) {
    const { data: customerLookup, error: customerLookupError } = await supabase
      .from('customers')
      .select('id,phone')
      .eq('merchant_id', merchantId);

    if (customerLookupError) {
      console.error('Could not read customers for bill seed:', customerLookupError.message);
      process.exit(1);
    }

    const customerIdByPhone = new Map((customerLookup || []).map((customer) => [customer.phone, customer.id]));

    const { data: menuLookup, error: menuLookupError } = await supabase
      .from('menu_items')
      .select('id,name,price')
      .eq('merchant_id', merchantId);

    if (menuLookupError) {
      console.error('Could not read menu for bill seed:', menuLookupError.message);
      process.exit(1);
    }

    const menuByName = new Map((menuLookup || []).map((item) => [item.name, item]));

    const extended = demoBills.map((bill, index) => {
      const chosenItems = index % 2 === 0
        ? ['Paneer Tikka', 'Dal Tadka', 'Idli Sambar']
        : ['Chicken Tikka', 'Chicken Biryani', 'Lassi Mango'];

      const items = chosenItems
        .map((name, itemIndex) => {
          const menuItem = menuByName.get(name);
          if (!menuItem) return null;
          const quantity = itemIndex === 0 ? 1 : 2;
          const subtotal = Number(menuItem.price) * quantity;
          return {
            menu_item_id: menuItem.id,
            item_name: menuItem.name,
            price: Number(menuItem.price),
            quantity,
            subtotal,
          };
        })
        .filter(Boolean);

      const customerId = customerIdByPhone.get(bill.customer_phone) || null;
      const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      const taxRate = 0.085;
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

      return {
        merchant_id: merchantId,
        customer_id: customerId,
        items,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: bill.status,
        created_at: bill.created_at,
        completed_at: bill.completed_at,
        order_type: index % 3 === 0 ? 'dine-in' : index % 3 === 1 ? 'takeaway' : 'delivery',
        table_ref: index % 3 === 0 ? `T-${(index % 12) + 1}` : null,
        order_label: `ORD-${String(index + 1).padStart(4, '0')}`,
        payment_method: bill.status === 'completed' ? 'UPI' : null,
        payment_last_four: bill.status === 'completed' ? '4242' : null,
        points_earned: bill.status === 'completed' ? Math.floor(totalAmount) : 0,
        held: bill.status !== 'completed',
      };
    });

    const base = demoBills.map((bill, index) => {
      const chosenItems = index % 2 === 0
        ? ['Paneer Tikka', 'Dal Tadka', 'Idli Sambar']
        : ['Chicken Tikka', 'Chicken Biryani', 'Lassi Mango'];

      const items = chosenItems
        .map((name, itemIndex) => {
          const menuItem = menuByName.get(name);
          if (!menuItem) return null;
          const quantity = itemIndex === 0 ? 1 : 2;
          const subtotal = Number(menuItem.price) * quantity;
          return {
            menu_item_id: menuItem.id,
            item_name: menuItem.name,
            price: Number(menuItem.price),
            quantity,
            subtotal,
          };
        })
        .filter(Boolean);

      const customerId = customerIdByPhone.get(bill.customer_phone) || null;
      const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      const totalAmount = Math.round((subtotal * 1.085) * 100) / 100;

      return {
        merchant_id: merchantId,
        customer_id: customerId,
        items,
        total_amount: totalAmount,
        status: bill.status,
        created_at: bill.created_at,
        completed_at: bill.completed_at,
      };
    });

    await insertWithFallback('bills', extended, base, 'Bill');
  }

  console.log('Demo data seeded for', demoMerchant.email);
}

seed().catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});
