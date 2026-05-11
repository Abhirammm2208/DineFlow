import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.toISOString();
}
function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x.toISOString();
}
/** GET /api/dashboard/stats?range=today */
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { data: billsTodayRows, error: e1 } = await supabase
            .from('bills')
            .select('id,total_amount,status,completed_at,created_at,customer_id')
            .eq('merchant_id', merchantId)
            .gte('created_at', startOfDay(today));
        if (e1)
            return res.status(400).json({ error: e1.message });
        const { data: completedTodayRows, error: e1b } = await supabase
            .from('bills')
            .select('id,total_amount,status,completed_at,customer_id')
            .eq('merchant_id', merchantId)
            .eq('status', 'completed')
            .gte('completed_at', startOfDay(today));
        if (e1b)
            return res.status(400).json({ error: e1b.message });
        const { data: billsYesterday, error: e2 } = await supabase
            .from('bills')
            .select('total_amount,status,completed_at')
            .eq('merchant_id', merchantId)
            .gte('completed_at', startOfDay(yesterday))
            .lte('completed_at', endOfDay(yesterday))
            .eq('status', 'completed');
        if (e2)
            return res.status(400).json({ error: e2.message });
        const pendingToday = (billsTodayRows || []).filter((b) => b.status === 'pending');
        const completedToday = completedTodayRows || [];
        const revenueToday = completedToday.reduce((s, b) => s + Number(b.total_amount || 0), 0);
        const revenueYesterday = (billsYesterday || []).reduce((s, b) => s + Number(b.total_amount || 0), 0);
        const billsCountToday = completedToday.length;
        const billsStartedToday = billsTodayRows?.length ?? 0;
        const revPct = revenueYesterday > 0 ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 : revenueToday > 0 ? 100 : 0;
        const { data: customers, error: e3 } = await supabase
            .from('customers')
            .select('id,total_visits,total_spend')
            .eq('merchant_id', merchantId);
        if (e3)
            return res.status(400).json({ error: e3.message });
        const returning = (customers || []).filter((c) => (c.total_visits || 0) >= 2).length;
        const totalC = (customers || []).length || 1;
        const returningPct = (returning / totalC) * 100;
        const { data: customersWeek, error: e4 } = await supabase
            .from('customers')
            .select('id,total_visits')
            .eq('merchant_id', merchantId)
            .lte('created_at', weekAgo.toISOString());
        if (e4)
            return res.status(400).json({ error: e4.message });
        const returningWeekAgo = (customersWeek || []).filter((c) => (c.total_visits || 0) >= 2).length;
        const tw = (customersWeek || []).length || 1;
        const returningPctWeekAgo = (returningWeekAgo / tw) * 100;
        const retDelta = returningPct - returningPctWeekAgo;
        const aov = billsCountToday > 0 ? revenueToday / billsCountToday : 0;
        const billsYesterdayCount = (billsYesterday || []).length || 0;
        const aovYesterday = billsYesterdayCount > 0 ? revenueYesterday / billsYesterdayCount : 0;
        const aovPct = aovYesterday > 0 ? ((aov - aovYesterday) / aovYesterday) * 100 : 0;
        res.json({
            todayRevenue: revenueToday,
            todayRevenueChangePct: Math.round(revPct * 10) / 10,
            billsToday: billsStartedToday,
            billsCompletedToday: billsCountToday,
            pendingBills: pendingToday.length,
            returningCustomersPct: Math.round(returningPct * 10) / 10,
            returningCustomersChangePct: Math.round(retDelta * 10) / 10,
            avgOrderValue: Math.round(aov * 100) / 100,
            avgOrderValueChangePct: Math.round(aovPct * 10) / 10,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/live-revenue', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const today = new Date();
        const { data, error } = await supabase
            .from('bills')
            .select('total_amount')
            .eq('merchant_id', merchantId)
            .eq('status', 'completed')
            .gte('completed_at', startOfDay(today));
        if (error)
            return res.status(400).json({ error: error.message });
        const live = (data || []).reduce((s, b) => s + Number(b.total_amount || 0), 0);
        res.json({ liveRevenue: live });
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/export', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { data: bills, error } = await supabase
            .from('bills')
            .select('id,total_amount,status,created_at,completed_at,customer_id')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false })
            .limit(200);
        if (error)
            return res.status(400).json({ error: error.message });
        const header = 'id,total_amount,status,created_at,completed_at,customer_id\n';
        const rows = (bills || [])
            .map((b) => `${b.id},${b.total_amount},${b.status},${b.created_at},${b.completed_at ?? ''},${b.customer_id ?? ''}`)
            .join('\n');
        res.json({ filename: `dineflow-export-${new Date().toISOString().slice(0, 10)}.csv`, csv: header + rows });
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=dashboard.js.map