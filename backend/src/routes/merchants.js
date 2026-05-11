import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { hashPin, verifyPin, generateToken } from '../utils/auth.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
// Register merchant
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, pin } = req.body;
        if (!name || !email || !phone || !pin) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Hash the PIN
        const pinHash = await hashPin(pin);
        // Create merchant in Supabase
        const { data, error } = await supabase.from('merchants').insert([
            {
                name,
                email,
                phone,
                pin_hash: pinHash,
            },
        ]).select().single();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        const token = generateToken(data.id);
        res.json({
            merchant: data,
            token,
            message: 'Merchant registered successfully',
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Login merchant with PIN
router.post('/login', async (req, res) => {
    try {
        const { email, pin } = req.body;
        if (!email || !pin) {
            return res.status(400).json({ error: 'Email and PIN required' });
        }
        // Find merchant by email
        const { data: merchants, error } = await supabase
            .from('merchants')
            .select('*')
            .eq('email', email)
            .single();
        if (error || !merchants) {
            return res.status(401).json({ error: 'Invalid email or PIN' });
        }
        // Verify PIN
        const isValidPin = await verifyPin(pin, merchants.pin_hash);
        if (!isValidPin) {
            return res.status(401).json({ error: 'Invalid email or PIN' });
        }
        const token = generateToken(merchants.id);
        res.json({
            merchant: {
                id: merchants.id,
                name: merchants.name,
                email: merchants.email,
                phone: merchants.phone,
            },
            token,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get merchant details
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { data, error } = await supabase
            .from('merchants')
            .select('id, name, email, phone, created_at')
            .eq('id', merchantId)
            .single();
        if (error) {
            return res.status(404).json({ error: 'Merchant not found' });
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update merchant profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { name, phone } = req.body;
        const { data, error } = await supabase
            .from('merchants')
            .update({ name, phone })
            .eq('id', merchantId)
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
//# sourceMappingURL=merchants.js.map