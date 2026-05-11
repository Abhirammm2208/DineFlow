import type { Request, Response } from 'express';
import { Router } from 'express';
import https from 'https';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

function callGeminiModel(prompt: string, model: string): Promise<string> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return Promise.reject(new Error('GEMINI_API_KEY not set'));
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 120, temperature: 0.85 },
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        try {
          console.log('[AI] Gemini raw response:', d.slice(0, 500));
          const json = JSON.parse(d);
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (!text) {
            console.error('[AI] Gemini empty text. Full response:', JSON.stringify(json, null, 2).slice(0, 800));
            reject(new Error('Gemini returned empty text'));
            return;
          }
          resolve(text.trim());
        } catch (e) { reject(new Error('Gemini parse error: ' + String(e))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const callGemini = (prompt: string) => callGeminiModel(prompt, 'gemini-1.5-flash');

function callOpenAI(prompt: string): Promise<string> {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return Promise.reject(new Error('OPENAI_API_KEY not set'));
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
      temperature: 0.85,
    });
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          resolve(json?.choices?.[0]?.message?.content?.trim() || '');
        } catch { reject(new Error('OpenAI parse error')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

console.log('[AI] Gemini configured:', Boolean(process.env.GEMINI_API_KEY), '| OpenAI configured:', Boolean(process.env.OPENAI_API_KEY));

// POST /api/ai/generate-campaign
router.post('/generate-campaign', authMiddleware, async (req: Request, res: Response) => {
  const { title, description, segment } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const segmentHint: Record<string, string> = {
    all: 'all customers',
    vip: 'our most loyal VIP customers',
    frequent: 'our frequent diners',
    high_spenders: 'our high-spending customers',
    at_risk: 'customers who haven\'t visited in a while and need to be won back',
  };

  const prompt = `You are writing a short, punchy promotional message for a restaurant campaign notification (Telegram/email).
Campaign: "${title}"
${description ? `Details: ${description}` : ''}
Target audience: ${segmentHint[segment] || 'all customers'}

Write ONLY the campaign offer description (2-3 sentences max). Make it exciting, personal, and end with urgency. No subject line, no greeting, no sign-off. Plain text only.`;

  try {
    let message = '';

    if (process.env.GEMINI_API_KEY) {
      try {
        message = await callGemini(prompt);
      } catch (geminiErr: any) {
        console.error('[AI] gemini-1.5-flash failed, trying 2.0-flash:', geminiErr.message);
        message = await callGeminiModel(prompt, 'gemini-2.0-flash');
      }
    } else if (process.env.OPENAI_API_KEY) {
      message = await callOpenAI(prompt);
    } else {
      // Fallback: template-based generation without AI
      message = `${title}${description ? ` — ${description}` : ''}. This is an exclusive offer just for you — available for a limited time only. Don't miss out, come visit us soon!`;
    }

    res.json({ message });
  } catch (err: any) {
    console.error('[AI] Generation failed:', err.message);
    res.status(500).json({ error: 'AI generation failed', message: `${title}${description ? ` — ${description}` : ''}. Exclusive offer — visit us soon!` });
  }
});

export default router;
