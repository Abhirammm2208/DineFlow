import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { sendNotification } from '../services/notificationService.js';
const router = Router();
// GET /api/test-email?to=someone@domain.com&merchantId=<id>&name=Priya&amount=450
router.get('/', async (req, res) => {
    try {
        const to = String(req.query.to || '').trim();
        const merchantId = String(req.query.merchantId || '').trim();
        const name = String(req.query.name || 'Customer');
        const amount = Number(req.query.amount || 0);
        if (!to)
            return res.status(400).json({ error: 'to query param required' });
        let merchantName = 'Restaurant';
        if (merchantId) {
            const { data: m } = await supabase.from('merchants').select('name').eq('id', merchantId).maybeSingle();
            if (m && m.name)
                merchantName = m.name;
        }
        const { data: activeCampaigns } = await supabase
            .from('campaigns')
            .select('title,description')
            .eq('merchant_id', merchantId || '')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(4);
        const result = await sendNotification(to, name, amount, merchantName, activeCampaigns || []);
        res.json({ ok: true, result });
    }
    catch (err) {
        console.error('Test email error:', err);
        res.status(500).json({ error: 'Failed to send test email' });
    }
});
export default router;
//# sourceMappingURL=testEmail.js.map