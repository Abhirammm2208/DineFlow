import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
// Search customer by phone
router.get('/search/:phone', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { phone } = req.params;
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('phone', phone)
            .single();
        if (error) {
            // Customer not found, return null
            return res.json(null);
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create new customer
router.post('/', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { name, phone } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone required' });
        }
        const { data, error } = await supabase
            .from('customers')
            .insert([
            {
                merchant_id: merchantId,
                name,
                phone,
                points_balance: 0,
                total_visits: 0,
                total_spend: 0,
            },
        ])
            .select()
            .single();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all customers for merchant
router.get('/', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('total_visits', { ascending: false });
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get customer details
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
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update customer
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { id } = req.params;
        const { name, phone, points_balance } = req.body;
        const { data, error } = await supabase
            .from('customers')
            .update({ name, phone, points_balance })
            .eq('merchant_id', merchantId)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=customers.js.map