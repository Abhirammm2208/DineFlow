import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const { data: bills, error } = await supabase
            .from('bills')
            .select('total_amount,completed_at,status')
            .eq('merchant_id', merchantId)
            .eq('status', 'completed')
            .gte('completed_at', since.toISOString());
        if (error)
            return res.status(400).json({ error: error.message });
        const revenue = (bills || []).reduce((s, b) => s + Number(b.total_amount || 0), 0);
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
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=analytics.js.map