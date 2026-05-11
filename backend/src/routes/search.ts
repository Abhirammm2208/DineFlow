import type { Request, Response } from 'express';
import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

/** GET /api/search?q= */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const raw = String(req.query.q || '').trim();
    const q = raw.replace(/%/g, '').replace(/,/g, ' ');
    if (!q) {
      return res.json({ customers: [], menuItems: [], bills: [] });
    }

    const pattern = `%${q}%`;

    const [{ data: customers, error: ec }, { data: menuItems, error: em }, { data: bills, error: eb }] =
      await Promise.all([
        supabase
          .from('customers')
          .select('id,name,phone,points_balance,total_spend,total_visits')
          .eq('merchant_id', merchantId)
          .or(`name.ilike.${pattern},phone.ilike.${pattern}`)
          .limit(12),
        supabase
          .from('menu_items')
          .select('id,name,price,category,description')
          .eq('merchant_id', merchantId)
          .eq('is_active', true)
          .or(`name.ilike.${pattern},category.ilike.${pattern}`)
          .limit(12),
        supabase
          .from('bills')
          .select('id,total_amount,status,order_label,created_at')
          .eq('merchant_id', merchantId)
          .ilike('order_label', pattern)
          .limit(8),
      ]);

    if (ec || em || eb) {
      return res.status(400).json({ error: ec?.message || em?.message || eb?.message });
    }

    res.json({
      customers: customers || [],
      menuItems: menuItems || [],
      bills: bills || [],
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
