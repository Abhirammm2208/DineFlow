import type { Request, Response } from 'express';
import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: bills, error } = await supabase
      .from('bills')
      .select('total_amount,completed_at,status')
      .eq('merchant_id', merchantId)
      .eq('status', 'completed')
      .gte('completed_at', since.toISOString());

    if (error) return res.status(400).json({ error: error.message });

    const revenue = (bills || []).reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0);

    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId);

    res.json({
      periodDays: 30,
      completedBills: bills?.length ?? 0,
      revenue,
      customers: customerCount ?? 0,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/revenue-chart', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const days = 7;
    const result: { date: string; revenue: number; bills: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from('bills')
        .select('total_amount')
        .eq('merchant_id', merchantId)
        .eq('status', 'completed')
        .gte('completed_at', start.toISOString())
        .lte('completed_at', end.toISOString());

      const revenue = (data || []).reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0);
      result.push({
        date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        revenue: Math.round(revenue * 100) / 100,
        bills: (data || []).length,
      });
    }

    res.json({ chart: result });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
