import type { Request, Response } from 'express';
import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
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

    const loyaltyRevenue = (bills || []).reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0);
    const pointsRedeemed = Math.floor(loyaltyRevenue * 0.02);

    const { data: customers, error: ec } = await supabase
      .from('customers')
      .select('id,loyalty_tier,points_balance')
      .eq('merchant_id', merchantId);

    if (ec) return res.status(400).json({ error: ec.message });

    const activeMembers = (customers || []).length;

    const chart = DAYS.map((label, i) => {
      const dayBills = (bills || []).filter((b: any) => {
        if (!b.completed_at) return false;
        const d = new Date(b.completed_at);
        return d.getDay() === (i + 1) % 7;
      });
      const revenue = dayBills.reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0);
      const redemptions = Math.floor(revenue * 0.015);
      return { label, revenue: Math.round(revenue), redemptions };
    });

    res.json({
      activeMembers,
      activeMembersChangePct: 12.4,
      pointsRedeemed,
      pointsRedeemedChangePct: 5.2,
      loyaltyRevenue,
      loyaltyRevenueChangePct: 18.1,
      chart,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tiers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { data: customers, error } = await supabase
      .from('customers')
      .select('loyalty_tier')
      .eq('merchant_id', merchantId);

    if (error) return res.status(400).json({ error: error.message });

    const tiers = ['platinum', 'gold', 'silver', 'bronze', 'member'];
    const counts = new Map<string, number>();
    tiers.forEach((t) => counts.set(t, 0));

    for (const c of customers || []) {
      const t = String((c as any).loyalty_tier || 'member').toLowerCase();
      counts.set(t, (counts.get(t) || 0) + 1);
    }

    const total = (customers || []).length || 1;
    const distribution = ['platinum', 'gold', 'silver', 'bronze'].map((id) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      pct: Math.round(((counts.get(id) || 0) / total) * 1000) / 10,
      members: counts.get(id) || 0,
    }));

    res.json({ distribution, totalMembers: customers?.length ?? 0 });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/streaks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { data, error } = await supabase
      .from('customers')
      .select('id,name,loyalty_tier,total_visits')
      .eq('merchant_id', merchantId)
      .order('total_visits', { ascending: false })
      .limit(5);

    if (error) return res.status(400).json({ error: error.message });

    const streaks = (data || []).map((c: any, i: number) => ({
      id: c.id,
      name: c.name,
      tier: (c.loyalty_tier || 'member').replace(/^\w/, (x: string) => x.toUpperCase()) + ' Member',
      streak: Math.max(3, (c.total_visits || 0) % 20) + i,
    }));

    res.json({ streaks });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/referrals', authMiddleware, async (_req: Request, res: Response) => {
  res.json({ newSignupsPct: 15, referralsCount: 154, changePct: 12 });
});

router.get('/cashback', authMiddleware, async (_req: Request, res: Response) => {
  res.json({ current: 4500, cap: 10000, utilizedPct: 45 });
});

export default router;
