import type { Request, Response } from 'express';
import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendNotification } from '../services/notificationService.js';

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const {
      customerId,
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      order_type,
      table_ref,
      order_label,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Bill must have at least one item' });
    }

    const computedSubtotal = items.reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0);
    const sub = subtotal != null ? Number(subtotal) : computedSubtotal;
    const rate = taxRate != null ? Number(taxRate) : 0.085;
    const tax = taxAmount != null ? Number(taxAmount) : Math.round(sub * rate * 100) / 100;
    const total = totalAmount != null ? Number(totalAmount) : Math.round((sub + tax) * 100) / 100;

    const row: Record<string, unknown> = {
      merchant_id: merchantId,
      customer_id: customerId || null,
      items,
      total_amount: total,
      status: 'pending',
    };

    const extended: Record<string, unknown> = {
      subtotal: sub,
      tax_rate: rate,
      tax_amount: tax,
    };
    if (order_type != null) extended.order_type = order_type;
    if (table_ref != null) extended.table_ref = table_ref;
    if (order_label != null) extended.order_label = order_label;

    let { data, error } = await supabase.from('bills').insert([{ ...row, ...extended }]).select().single();

    if (error && String(error.message || '').includes('column')) {
      ({ data, error } = await supabase.from('bills').insert([row]).select().single());
    }

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('bills')
      .select('*')
      .eq('merchant_id', merchantId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats/today', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: bills, error } = await supabase
      .from('bills')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('status', 'completed')
      .gte('completed_at', today.toISOString());

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const list = bills || [];
    const totalRevenue = list.reduce((sum: number, bill: any) => sum + Number(bill.total_amount || 0), 0);
    const totalBills = list.length;

    res.json({
      totalRevenue,
      totalBills,
      averageBillValue: totalBills > 0 ? totalRevenue / totalBills : 0,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('bills')
      .select(
        `
        *,
        customers (name, phone)
      `
      )
      .eq('merchant_id', merchantId)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/hold', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;
    const { held } = req.body;

    const { data, error } = await supabase
      .from('bills')
      .update({ held: held !== false })
      .eq('merchant_id', merchantId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/punch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;
    const { payment_method, payment_last_four } = req.body || {};

    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select(
        `
        *,
        merchants (name)
      `
      )
      .eq('merchant_id', merchantId)
      .eq('id', id)
      .single();

    if (billError || !bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Fetch merchant's points_rate from profile (default 5%)
    let pointsRate = 5;
    try {
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('points_rate')
        .eq('id', merchantId)
        .single();
      if (merchantData && (merchantData as any).points_rate != null) {
        pointsRate = Number((merchantData as any).points_rate);
      }
    } catch {
      // Use default points_rate if column doesn't exist
    }
    const pointsEarned = Math.floor(Number(bill.total_amount || 0) * (pointsRate / 100));

    const updatePayload: Record<string, unknown> = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      points_earned: pointsEarned,
    };
    if (payment_method) updatePayload.payment_method = payment_method;
    if (payment_last_four) updatePayload.payment_last_four = payment_last_four;

    const { data: updatedBill, error: updateError } = await supabase
      .from('bills')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    let finalBill = updatedBill;
    let finalErr = updateError;
    if (finalErr && String(finalErr.message || '').includes('column')) {
      const r = await supabase
        .from('bills')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      finalBill = r.data;
      finalErr = r.error;
    }

    if (finalErr) {
      return res.status(400).json({ error: finalErr.message });
    }

    if (bill.customer_id) {
      const { data: customerRow, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', bill.customer_id)
        .single();

      if (!custErr && customerRow) {
        const c: any = customerRow;
        const newPoints = (c.points_balance || 0) + pointsEarned;

        const custPatch: Record<string, unknown> = {
          total_visits: (c.total_visits || 0) + 1,
          total_spend: Number(c.total_spend || 0) + Number(bill.total_amount || 0),
          points_balance: newPoints,
          last_visit_at: new Date().toISOString(),
        };

        let up = await supabase.from('customers').update(custPatch).eq('id', bill.customer_id);
        if (up.error && String(up.error.message || '').includes('column')) {
          delete custPatch.last_visit_at;
          up = await supabase.from('customers').update(custPatch).eq('id', bill.customer_id);
        }

        const { data: activeCampaigns } = await supabase
          .from('campaigns')
          .select('title,description')
          .eq('merchant_id', merchantId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(4);

        // Fire notification without blocking the response
        sendNotification(
          c.email,
          c.name,
          Number(bill.total_amount),
          (bill as any).merchants?.name || 'Restaurant',
          activeCampaigns || [],
          c.telegram_chat_id ?? null,
          newPoints
        ).catch((err) => console.error('[Bills] notification error:', err));

        return res.json({
          bill: finalBill,
          customer: { ...c, points_balance: newPoints },
          pointsEarned,
          newPointsBalance: newPoints,
          notification: { queued: true },
        });
      }
    }

    res.json({
      bill: finalBill,
      pointsEarned,
      message: 'Bill completed successfully',
    });
  } catch (error) {
    console.error('Error punching bill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
