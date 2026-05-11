import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
/** GET /api/customers/search?q= — partial search (CRM / mobile) */
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const raw = String(req.query.q || '').trim().replace(/%/g, '');
        if (!raw) {
            return res.json([]);
        }
        const pattern = `%${raw}%`;
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('merchant_id', merchantId)
            .or(`name.ilike.${pattern},phone.ilike.${pattern}`)
            .limit(20);
        if (error)
            return res.status(400).json({ error: error.message });
        res.json(data || []);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/search/:phone', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { phone } = req.params;
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('phone', phone)
            .maybeSingle();
        if (error) {
            return res.json(null);
        }
        res.json(data);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { name, phone, email } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone required' });
        }
        const row = {
            merchant_id: merchantId,
            name,
            phone,
            points_balance: 0,
            total_visits: 0,
            total_spend: 0,
        };
        if (email)
            row.email = email;
        const { data, error } = await supabase.from('customers').insert([row]).select().single();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const segment = String(req.query.segment || 'all').toLowerCase();
        const search = String(req.query.q || '').trim().replace(/%/g, '');
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        console.log('[GET /customers]', { merchantId, segment, search, page, limit, from, to });
        let query = supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .eq('merchant_id', merchantId);
        if (search) {
            const pattern = `%${search}%`;
            query = query.or(`name.ilike.${pattern},phone.ilike.${pattern}`);
        }
        if (segment === 'vip') {
            query = query.gte('total_spend', 3000);
        }
        else if (segment === 'high_spenders') {
            query = query.gte('total_spend', 1500).lt('total_spend', 3000);
        }
        else if (segment === 'frequent') {
            query = query.gte('total_visits', 8);
        }
        else if (segment === 'at_risk') {
            query = query.gte('total_visits', 2).lte('total_spend', 150);
        }
        else if (segment === 'new') {
            query = query.lte('total_visits', 1);
        }
        // segment === 'all' => no additional filters
        query = query.order('created_at', { ascending: false }).range(from, to);
        let { data, error, count } = await query;
        console.log('[GET /customers] result:', { count, rows: data?.length, error: error?.message });
        // Fallback: if query fails (e.g. RLS or column issues), try simpler query
        if (error) {
            console.log('[GET /customers] Primary query failed, trying fallback:', error.message);
            const fallback = await supabase
                .from('customers')
                .select('*')
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: false })
                .range(from, to);
            data = fallback.data;
            error = fallback.error;
            count = data?.length ?? 0;
            console.log('[GET /customers] Fallback result:', { count, rows: data?.length, error: error?.message });
        }
        if (error) {
            console.error('[GET /customers] Final error:', error);
            return res.status(400).json({ error: error.message });
        }
        const rows = (data || []).map((c) => ({
            ...c,
            crm_status: c.crm_status || inferStatus(c),
            aov: c.total_visits > 0 ? Math.round((Number(c.total_spend) / c.total_visits) * 100) / 100 : 0,
        }));
        res.json({
            customers: rows,
            total: count ?? rows.length,
            page,
            limit,
        });
    }
    catch (err) {
        console.error('[GET /customers] Exception:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
function inferStatus(c) {
    if ((c.total_spend || 0) >= 3000)
        return 'vip';
    if ((c.total_visits || 0) <= 1)
        return 'new';
    if ((c.total_spend || 0) <= 150 && (c.total_visits || 0) >= 2)
        return 'at_risk';
    return 'active';
}
router.get('/:id/activity', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { id } = req.params;
        const { data, error } = await supabase
            .from('bills')
            .select('id,total_amount,status,completed_at,created_at,order_type,table_ref,points_earned')
            .eq('merchant_id', merchantId)
            .eq('customer_id', id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(15);
        if (error)
            return res.status(400).json({ error: error.message });
        const activity = (data || []).map((b) => ({
            id: b.id,
            date: b.completed_at || b.created_at,
            type: (b.order_type || 'dine-in').replace(/-/g, ' '),
            detail: b.table_ref ? `Table ${b.table_ref}` : 'Order',
            amount: Number(b.total_amount || 0),
            pointsEarned: b.points_earned ?? Math.floor(Number(b.total_amount || 0) * 0.05),
        }));
        res.json({ activity });
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/message', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { id } = req.params;
        const { channel, body: text } = req.body || {};
        const { data, error } = await supabase
            .from('customers')
            .select('id,name,phone')
            .eq('merchant_id', merchantId)
            .eq('id', id)
            .single();
        if (error || !data) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json({
            ok: true,
            queued: true,
            channel: channel || 'sms',
            preview: text || '',
            to: data.phone,
        });
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/top-items', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { id } = req.params;
        const { data: bills, error } = await supabase
            .from('bills')
            .select('items')
            .eq('merchant_id', merchantId)
            .eq('customer_id', id)
            .eq('status', 'completed')
            .limit(40);
        if (error)
            return res.status(400).json({ error: error.message });
        const counts = new Map();
        for (const bill of bills || []) {
            const items = bill.items;
            if (!Array.isArray(items))
                continue;
            for (const line of items) {
                const n = line.item_name || 'Item';
                counts.set(n, (counts.get(n) || 0) + (line.quantity || 1));
            }
        }
        const top = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, count]) => ({ name, count }));
        res.json({ topItems: top });
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { id } = req.params;
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('id', id)
            .single();
        if (error) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const c = data;
        const aov = c.total_visits > 0 ? Math.round((Number(c.total_spend) / c.total_visits) * 100) / 100 : 0;
        res.json({ ...c, crm_status: c.crm_status || inferStatus(c), aov });
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { id } = req.params;
        const { name, phone, points_balance, email, crm_status, loyalty_tier } = req.body;
        const patch = {};
        if (name !== undefined)
            patch.name = name;
        if (phone !== undefined)
            patch.phone = phone;
        if (points_balance !== undefined)
            patch.points_balance = points_balance;
        if (email !== undefined)
            patch.email = email;
        if (crm_status !== undefined)
            patch.crm_status = crm_status;
        if (loyalty_tier !== undefined)
            patch.loyalty_tier = loyalty_tier;
        const { data, error } = await supabase
            .from('customers')
            .update(patch)
            .eq('merchant_id', merchantId)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=customers.js.map