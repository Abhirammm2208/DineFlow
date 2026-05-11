import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendNotification } from '../services/notificationService.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
// Create a new bill
router.post('/', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { customerId, items } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Bill must have at least one item' });
        }
        // Calculate total
        const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
        // Create bill record
        const { data, error } = await supabase
            .from('bills')
            .insert([
            {
                merchant_id: merchantId,
                customer_id: customerId || null,
                items: items,
                total_amount: totalAmount,
                status: 'pending',
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
// Get bills for merchant
router.get('/', authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get bill details
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { id } = req.params;
        const { data, error } = await supabase
            .from('bills')
            .select(`
        *,
        customers (name, phone)
      `)
            .eq('merchant_id', merchantId)
            .eq('id', id)
            .single();
        if (error) {
            return res.status(404).json({ error: 'Bill not found' });
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Punch (complete) a bill - This triggers customer notification
router.post('/:id/punch', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { id } = req.params;
        // Get bill details
        const { data: bill, error: billError } = await supabase
            .from('bills')
            .select(`
        *,
        customers (name, phone),
        merchants (name)
      `)
            .eq('merchant_id', merchantId)
            .eq('id', id)
            .single();
        if (billError || !bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }
        // Update bill status to completed
        const { data: updatedBill, error: updateError } = await supabase
            .from('bills')
            .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (updateError) {
            return res.status(400).json({ error: updateError.message });
        }
        // If customer exists, update their stats and send notification
        if (bill.customer_id) {
            const customer = bill.customers;
            // Update customer stats
            const { error: customerUpdateError } = await supabase
                .from('customers')
                .update({
                total_visits: (customer.total_visits || 0) + 1,
                total_spend: (customer.total_spend || 0) + bill.total_amount,
                points_balance: (customer.points_balance || 0) + Math.floor(bill.total_amount / 10), // 1 point per 10 rupees
            })
                .eq('id', bill.customer_id);
            // Send notification
            const notificationResult = await sendNotification(customer.phone, customer.name, bill.total_amount, bill.merchants.name, ['whatsapp', 'sms']);
            return res.json({
                bill: updatedBill,
                customer: customer,
                notification: notificationResult,
            });
        }
        res.json({
            bill: updatedBill,
            message: 'Bill completed successfully',
        });
    }
    catch (error) {
        console.error('Error punching bill:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get bill statistics for merchant
router.get('/stats/today', authMiddleware, async (req, res) => {
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
        const totalRevenue = bills.reduce((sum, bill) => sum + bill.total_amount, 0);
        const totalBills = bills.length;
        res.json({
            totalRevenue,
            totalBills,
            averageBillValue: totalBills > 0 ? totalRevenue / totalBills : 0,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=bills.js.map