import type { Request, Response } from 'express';
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

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { data, error } = await supabase.from('campaigns').select('*').eq('merchant_id', merchantId);

    if (error) {
      return res.json({ campaigns: SEED.map((s, i) => ({ id: `seed-${i}`, merchant_id: merchantId, ...s })) });
    }

    if (!data?.length) {
      return res.json({ campaigns: SEED.map((s, i) => ({ id: `seed-${i}`, merchant_id: merchantId, ...s })) });
    }

    res.json({ campaigns: data });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { title, description, status, scheduled_at, target_segment } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const row: Record<string, unknown> = {
      merchant_id: merchantId,
      title,
      description: description || '',
      status: status || 'draft',
      icon: 'megaphone',
      stat_primary_label: 'Status',
      stat_primary_value: 'New',
      stat_secondary_label: 'Created',
      stat_secondary_value: new Date().toLocaleDateString(),
      target_segment: target_segment || 'all',
    };
    if (scheduled_at) {
      row.scheduled_at = scheduled_at;
      row.status = 'scheduled';
    }

    const { data, error } = await supabase.from('campaigns').insert([row]).select().single();

    if (error) {
      return res.status(400).json({ error: error.message, hint: 'Run supabase-campaigns-scheduler.sql if columns are missing.' });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/campaigns/:id — update status or schedule
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;
    const { status, scheduled_at, target_segment } = req.body;

    const patch: Record<string, unknown> = {};
    if (status) patch.status = status;
    if (scheduled_at !== undefined) patch.scheduled_at = scheduled_at || null;
    if (target_segment) patch.target_segment = target_segment;
    if (status === 'draft' || status === 'active') patch.sent_at = null;

    const { data, error } = await supabase
      .from('campaigns')
      .update(patch)
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/campaigns/:id/broadcast — manually trigger broadcast immediately
router.post('/:id/broadcast', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    const { broadcastCampaign } = await import('../services/campaignScheduler.js');
    const result = await broadcastCampaign(String(id), String(merchantId));
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
