import type { Request, Response } from 'express';
import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import https from 'https';

const router = Router();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function telegramSend(chatId: string | number, text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!BOT_TOKEN) { resolve(); return; }
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, () => resolve());
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

// POST /api/telegram/webhook  — called by Telegram servers
router.post('/webhook', async (req: Request, res: Response) => {
  // Always respond 200 immediately so Telegram doesn't retry
  res.sendStatus(200);

  try {
    const message = req.body?.message;
    if (!message) return;

    const chatId: number = message.chat?.id;
    const text: string = (message.text || '').trim();
    const firstName: string = message.from?.first_name || 'there';

    if (!chatId) return;

    // /start  — just greet and ask for phone
    if (text === '/start') {
      await telegramSend(chatId,
        `👋 Hi *${firstName}*! Welcome to *DineFlow* notifications.\n\n` +
        `To receive your bill receipts here, send me your registered phone number:\n` +
        `\`/link 9876543210\``
      );
      return;
    }

    // /link <phone>  — link this chat to the customer record
    if (text.startsWith('/link')) {
      const parts = text.split(/\s+/);
      const rawPhone = (parts[1] || '').replace(/\D/g, '');

      if (!rawPhone || rawPhone.length < 8) {
        await telegramSend(chatId,
          `⚠️ Please send your phone number like this:\n\`/link 9876543210\``
        );
        return;
      }

      // Search all merchants for this phone number
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, merchant_id')
        .or(`phone.ilike.%${rawPhone}%`)
        .limit(5);

      if (error || !customers || customers.length === 0) {
        await telegramSend(chatId,
          `❌ No account found for *${rawPhone}*.\n\n` +
          `Ask the restaurant to add you as a customer first, then try again.`
        );
        return;
      }

      // Update all matching customer rows with this chat ID
      const ids = customers.map((c: any) => c.id);
      await supabase
        .from('customers')
        .update({ telegram_chat_id: String(chatId) })
        .in('id', ids);

      const names = [...new Set(customers.map((c: any) => c.name))].join(', ');
      await telegramSend(chatId,
        `✅ Linked! Hi *${names}*!\n\n` +
        `You'll now receive your bill receipts and offers here on Telegram. 🎉`
      );
      return;
    }

    // Unknown command
    await telegramSend(chatId,
      `I only understand:\n• /start — get started\n• /link <phone> — link your account`
    );
  } catch (err) {
    console.error('Telegram webhook error:', err);
  }
});

// POST /api/telegram/set-webhook  — call once to register the webhook URL with Telegram
router.post('/set-webhook', async (req: Request, res: Response) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl) return res.status(400).json({ error: 'webhookUrl required' });
  if (!BOT_TOKEN) return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' });

  const body = JSON.stringify({ url: webhookUrl });
  const apiRes = await new Promise<string>((resolve) => {
    const r = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/setWebhook`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (resp) => {
      let d = '';
      resp.on('data', (c) => { d += c; });
      resp.on('end', () => resolve(d));
    });
    r.on('error', (e) => resolve(JSON.stringify({ ok: false, description: e.message })));
    r.write(body);
    r.end();
  });

  res.json(JSON.parse(apiRes));
});

export default router;
