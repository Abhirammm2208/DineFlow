import type { Request, Response } from 'express';
import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Get all menu items for merchant
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .order('category');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get menu items by category
router.get('/category/:category', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { category } = req.params;

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create menu item
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { name, price, category, description, image_url } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const insertRow: Record<string, unknown> = {
      merchant_id: merchantId,
      name,
      price,
      category,
      is_active: true,
    };
    if (description != null) insertRow.description = description;
    if (image_url != null) insertRow.image_url = image_url;

    const { data, error } = await supabase
      .from('menu_items')
      .insert([insertRow])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update menu item
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;
    const { name, price, category, is_active, description, image_url, stock_qty } = req.body;

    const patch: Record<string, unknown> = { name, price, category, is_active };
    if (description !== undefined) patch.description = description;
    if (image_url !== undefined) patch.image_url = image_url;
    if (stock_qty !== undefined) patch.stock_qty = stock_qty;

    const { data, error } = await supabase
      .from('menu_items')
      .update(patch)
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete menu item
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;

    const { error } = await supabase
      .from('menu_items')
      .update({ is_active: false })
      .eq('id', id)
      .eq('merchant_id', merchantId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload image for menu item
router.post('/:id/upload-image', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;
    const { image_url, image_alt_text } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'Image data required' });
    }

    const { data, error } = await supabase
      .from('menu_items')
      .update({ image_url })
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error) {
      console.error('[Menu] image upload DB error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Image uploaded', item: data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
