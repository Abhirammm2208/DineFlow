import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Merchant } from '../utils/supabase.js';
import { supabase } from '../utils/supabase.js';
import { hashPin, verifyPin, generateToken } from '../utils/auth.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Register merchant
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, pin } = req.body;

    if (!name || !email || !phone || !pin) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash the PIN
    const pinHash = await hashPin(pin);

    const baseMerchant = {
      name,
      email,
      phone,
      pin_hash: pinHash,
    };

    const extendedMerchant = {
      ...baseMerchant,
      tax_rate: 0.085,
      receipt_template: 'standard',
      staff_roles: ['admin', 'manager', 'cashier'],
    };

    // Create merchant in Supabase, falling back to the base schema if needed.
    let { data, error } = await supabase.from('merchants').insert([extendedMerchant]).select().single();

    if (error) {
      ({ data, error } = await supabase.from('merchants').insert([baseMerchant]).select().single());
    }

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const token = generateToken(data.id);
    res.json({
      merchant: data,
      token,
      message: 'Merchant registered successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login merchant with PIN
router.post('/login', async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get merchant details
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    // Try to select extended columns first
    let { data, error } = await supabase
      .from('merchants')
      .select('id, name, email, phone, created_at, tax_rate, receipt_template, staff_roles, points_rate, winback_subject, winback_body')
      .eq('id', merchantId)
      .single();

    // Fallback if extended columns don't exist
    if (error && String(error.message || '').includes('column')) {
      ({ data, error } = await supabase
        .from('merchants')
        .select('id, name, email, phone, created_at')
        .eq('id', merchantId)
        .single());
    }

    if (error) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Return actual DB values with sensible fallbacks
    res.json({
      ...data,
      tax_rate: (data as any).tax_rate ?? 0.085,
      receipt_template: (data as any).receipt_template || 'standard',
      staff_roles: (data as any).staff_roles || ['admin', 'manager', 'cashier'],
      points_rate: (data as any).points_rate ?? 5,
      winback_subject: (data as any).winback_subject || '',
      winback_body: (data as any).winback_body || '',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update merchant profile
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const { name, phone, tax_rate, receipt_template, staff_roles, points_rate, winback_subject, winback_body } = req.body;

    const basePayload: Record<string, unknown> = {};
    const extraPayload: Record<string, unknown> = {};

    if (name !== undefined) basePayload.name = name;
    if (phone !== undefined) basePayload.phone = phone;
    if (tax_rate !== undefined) extraPayload.tax_rate = Number(tax_rate);
    if (receipt_template !== undefined) extraPayload.receipt_template = receipt_template;
    if (points_rate !== undefined) extraPayload.points_rate = Number(points_rate);
    if (winback_subject !== undefined) extraPayload.winback_subject = winback_subject;
    if (winback_body !== undefined) extraPayload.winback_body = winback_body;
    if (staff_roles !== undefined) extraPayload.staff_roles = Array.isArray(staff_roles)
      ? staff_roles
      : String(staff_roles)
          .split(',')
          .map((role: string) => role.trim())
          .filter(Boolean);

    let { data, error } = await supabase
      .from('merchants')
      .update({ ...basePayload, ...extraPayload })
      .eq('id', merchantId)
      .select()
      .single();

    if (error && String(error.message || '').includes('column')) {
      ({ data, error } = await supabase
        .from('merchants')
        .update(basePayload)
        .eq('id', merchantId)
        .select()
        .single());
    }

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Return the actual saved data with fallbacks
    res.json({
      ...data,
      tax_rate: (data as any).tax_rate ?? tax_rate ?? 0.085,
      receipt_template: (data as any).receipt_template || receipt_template || 'standard',
      points_rate: (data as any).points_rate ?? points_rate ?? 5,
      winback_subject: (data as any).winback_subject || winback_subject || '',
      winback_body: (data as any).winback_body || winback_body || '',
      staff_roles: (data as any).staff_roles || (Array.isArray(staff_roles)
        ? staff_roles
        : typeof staff_roles === 'string'
          ? String(staff_roles)
              .split(',')
              .map((role: string) => role.trim())
              .filter(Boolean)
          : ['admin', 'manager', 'cashier']),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
