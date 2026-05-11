import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
const SEED = [
    {
        title: 'Win Back Campaign',
        description: 'Targets customers inactive for 60+ days.',
        status: 'active',
        icon: 'heart',
        stat_primary_label: 'Conversion',
        stat_primary_value: '12.4%',
        stat_secondary_label: 'Revenue Gen.',
        stat_secondary_value: '$4,250',
    },
    {
        title: 'Weekend Special',
        description: 'Double points on appetizers and drinks.',
        status: 'active',
        icon: 'cocktail',
        stat_primary_label: 'Conversion',
        stat_primary_value: '20.7%',
        stat_secondary_label: 'Revenue Gen.',
        stat_secondary_value: '$12,850',
    },
    {
        title: 'Free Dessert Reward',
        description: 'Birthday reward for Gold and Platinum.',
        status: 'scheduled',
        icon: 'cupcake',
        stat_primary_label: 'Starts in',
        stat_primary_value: '2 Days',
        stat_secondary_label: 'Target Size',
        stat_secondary_value: '450 Users',
    },
    {
        title: 'Double Points Day',
        description: 'Boost traffic on slower weekdays.',
        status: 'draft',
        icon: 'target',
        stat_primary_label: 'Status',
        stat_primary_value: 'Needs Review',
        stat_secondary_label: 'Est. Cost',
        stat_secondary_value: '15k Pts',
    },
];
router.get('/', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { data, error } = await supabase.from('campaigns').select('*').eq('merchant_id', merchantId);
        if (error) {
            return res.json({ campaigns: SEED.map((s, i) => ({ id: `seed-${i}`, merchant_id: merchantId, ...s })) });
        }
        if (!data?.length) {
            return res.json({ campaigns: SEED.map((s, i) => ({ id: `seed-${i}`, merchant_id: merchantId, ...s })) });
        }
        res.json({ campaigns: data });
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', authMiddleware, async (req, res) => {
    try {
        const merchantId = req.merchantId;
        const { title, description, status } = req.body;
        if (!title)
            return res.status(400).json({ error: 'title required' });
        const { data, error } = await supabase
            .from('campaigns')
            .insert([
            {
                merchant_id: merchantId,
                title,
                description: description || '',
                status: status || 'draft',
                icon: 'megaphone',
                stat_primary_label: 'Status',
                stat_primary_value: 'New',
                stat_secondary_label: 'Created',
                stat_secondary_value: new Date().toLocaleDateString(),
            },
        ])
            .select()
            .single();
        if (error) {
            return res.status(400).json({ error: error.message, hint: 'Run supabase-migration-v2.sql if campaigns table is missing.' });
        }
        res.json(data);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=campaigns.js.map