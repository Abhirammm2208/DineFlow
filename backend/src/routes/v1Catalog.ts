import type { Request, Response } from 'express';
import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

/** GET /api/v1/categories */
router.get('/categories', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { data, error } = await supabase
      .from('menu_items')
      .select('category')
      .eq('merchant_id', merchantId)
      .eq('is_active', true);

    if (error) return res.status(400).json({ error: error.message });

    const counts = new Map<string, number>();
    for (const row of data || []) {
      const c = String((row as any).category || 'General');
      counts.set(c, (counts.get(c) || 0) + 1);
    }

    const categories = Array.from(counts.entries()).map(([name, itemCount]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      itemCount,
    }));

    res.json({ categories });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /api/v1/products?category=Pizza&filter=vegetarian */
router.get('/products', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const category = req.query.category ? String(req.query.category) : '';
    const filter = req.query.filter ? String(req.query.filter).toLowerCase() : '';

    let query = supabase
      .from('menu_items')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    let items = data || [];
    if (filter && filter !== 'all') {
      items = items.filter((it: any) => {
        const blob = `${it.name} ${it.description || ''} ${it.category}`.toLowerCase();
        return blob.includes(filter);
      });
    }

    const products = items.map((it: any) => ({
      ...it,
      stock_status: (it.stock_qty ?? 1) > 0 ? 'in_stock' : 'sold_out',
    }));

    res.json({ products });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /api/v1/tables — static list for UI selector */
router.get('/tables', authMiddleware, async (_req: Request, res: Response) => {
  const tables = Array.from({ length: 24 }, (_, i) => ({
    id: `T-${i + 1}`,
    label: `T-${i + 1}`,
  }));
  res.json({ tables });
});

export default router;
