import { Resend } from 'resend';
import https from 'https';

type CampaignBrief = {
  title: string;
  description?: string | null;
};

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function escapeHtml(input: string | null | undefined) {
  if (input == null) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCampaigns(campaigns: CampaignBrief[]) {
  if (!campaigns.length) {
    return 'We will keep sharing the best offers with you soon.';
  }

  const lines = campaigns
    .slice(0, 4)
    .map((campaign) => `• ${campaign.title || 'Offer'}${campaign.description ? ` — ${campaign.description}` : ''}`)
    .join('\n');

  return `Current active offers:\n${lines}`;
}

function buildEmailContent(
  customerName: string | null | undefined,
  billAmount: number,
  merchantName: string | null | undefined,
  campaigns: CampaignBrief[],
  pointsBalance: number = 0
) {
  const safeCustomerName = customerName || 'Valued Customer';
  const safeMerchantName = merchantName || 'Restaurant';
  const safeCampaigns = campaigns.filter((c) => c.title != null);
  const amountText = billAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const campaignText = formatCampaigns(safeCampaigns);
  const subject = `Thanks for dining at ${safeMerchantName} — you have ${pointsBalance} reward points!`;

  const pointsLine = pointsBalance > 0
    ? `You currently have ${pointsBalance} reward points waiting for you. Use them on your next visit for exclusive savings!`
    : `Keep visiting to earn reward points and unlock exclusive deals!`;

  const text = [
    `Hi ${safeCustomerName},`,
    '',
    `Thank you for visiting ${safeMerchantName}. Your bill amount was ₹${amountText}.`,
    '',
    `👋 ${pointsLine}`,
    '',
    'We’d love to welcome you back soon. Here are a few active offers waiting for you:',
    campaignText,
    '',
    'Come back soon for another great experience.',
  ].join('\n');

  const campaignsHtml = safeCampaigns.length
    ? `<ul style="margin:12px 0 0;padding-left:18px;">${safeCampaigns
        .slice(0, 4)
        .map(
          (campaign) =>
            `<li style="margin:0 0 8px;">${escapeHtml(campaign.title)}${campaign.description ? ` - ${escapeHtml(campaign.description)}` : ''}</li>`
        )
        .join('')}</ul>`
    : '<p style="margin:12px 0 0;">We will keep sharing the best offers with you soon.</p>';

  const pointsHtml = pointsBalance > 0
    ? `<div style="margin:16px 0;padding:16px;border-radius:14px;background:#fffbeb;border:1px solid #fde68a;">
        <p style="margin:0;font-size:15px;color:#92400e;">
          👋 Hey! You currently have <strong>${pointsBalance} reward points</strong> waiting for you 🎉<br/>
          Who knows? On your next visit, you could unlock even bigger savings and exclusive offers.
          Your special deals are live now — don't let it go to waste, we're waiting to welcome you back! 🍽️
        </p>
      </div>`
    : `<p style="margin:16px 0;color:#6b7280;">Keep visiting to earn reward points and unlock exclusive deals!</p>`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;background:#ffffff;">
      <h2 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Thank you, ${escapeHtml(safeCustomerName)}!</h2>
      <p style="margin:0 0 12px;">Thanks for dining at <strong>${escapeHtml(safeMerchantName)}</strong>. Your bill amount was <strong>₹${escapeHtml(amountText)}</strong>.</p>
      ${pointsHtml}
      <p style="margin:12px 0 8px;font-weight:600;">Active offers for you:</p>
      ${campaignsHtml}
      <div style="margin:20px 0 0;padding:16px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;">
        <p style="margin:0;color:#166534;font-weight:700;">Come back soon for a fresh meal, better memories, and a little something extra waiting for you.</p>
      </div>
    </div>
  `;

  return { subject, text, html };
}

export async function sendEmailNotification(
  toEmail: string,
  customerName: string,
  billAmount: number,
  merchantName: string,
  campaigns: CampaignBrief[] = [],
  pointsBalance: number = 0
): Promise<boolean> {
  if (!toEmail?.trim()) {
    console.log('No customer email available. Skipping email notification.');
    return false;
  }

  const { subject, text, html } = buildEmailContent(customerName, billAmount, merchantName, campaigns, pointsBalance);

  const resend = getResend();
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = process.env.SMTP_FROM_NAME || 'DineFlow Billing';

  if (!resend) {
    console.log('[Email] RESEND_API_KEY not configured. Skipping email to:', toEmail);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject,
      html,
      text,
    });
    if (error) {
      console.error('Failed to send email:', error);
      return false;
    }
    console.log(`Email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// ─── Telegram ────────────────────────────────────────────────────────────────

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramConfigured = Boolean(telegramBotToken);

function buildTelegramMessage(
  customerName: string | null | undefined,
  billAmount: number,
  merchantName: string | null | undefined,
  campaigns: CampaignBrief[],
  pointsBalance: number = 0
): string {
  const safeName = customerName || 'Valued Customer';
  const safeMerchant = merchantName || 'Restaurant';
  const safeCampaigns = campaigns.filter((c) => c.title != null);
  const amountText = billAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const lines: string[] = [
    `🍽️ *Thank you for dining at ${safeMerchant}!*`,
    ``,
    `👤 Hi *${safeName}*,`,
    `💰 Your bill: *₹${amountText}*`,
    ``,
  ];

  if (pointsBalance > 0) {
    lines.push(`👋 Hey! You currently have *${pointsBalance} reward points* waiting for you 🎉`);
    lines.push(`Who knows? On your next visit, you could unlock even bigger savings and exclusive offers. Your special deals are live now — don't let it go to waste, we're waiting to welcome you back!`);
    lines.push(``);
  } else {
    lines.push(`⭐ Keep visiting to earn reward points and unlock exclusive deals!`);
    lines.push(``);
  }

  if (safeCampaigns.length > 0) {
    lines.push(`🎉 *Active Offers for You:*`);
    safeCampaigns.slice(0, 4).forEach((c) => {
      lines.push(`• ${c.title}${c.description ? ` — ${c.description}` : ''}`);
    });
    lines.push(``);
  }

  lines.push(`Come back soon! 😊`);
  lines.push(`_Powered by DineFlow_`);

  return lines.join('\n');
}

function telegramPost(botToken: string, chatId: string, text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.ok) {
            console.log(`Telegram message sent to chat ${chatId}`);
            resolve(true);
          } else {
            console.error('Telegram API error:', parsed.description);
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Telegram request failed:', err.message);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

export async function sendTelegramNotification(
  chatId: string | null | undefined,
  customerName: string | null | undefined,
  billAmount: number,
  merchantName: string | null | undefined,
  campaigns: CampaignBrief[] = [],
  pointsBalance: number = 0
): Promise<boolean> {
  if (!chatId?.trim()) {
    console.log('No Telegram chat ID. Skipping Telegram notification.');
    return false;
  }

  const message = buildTelegramMessage(customerName, billAmount, merchantName, campaigns, pointsBalance);

  if (!telegramConfigured || !telegramBotToken) {
    console.log('TELEGRAM_BOT_TOKEN not configured. Message would be:');
    console.log(message);
    return false;
  }

  return telegramPost(telegramBotToken, chatId.trim(), message);
}

// ─── Campaign-only broadcast (no bill amount, lean message) ───────────────────

function buildCampaignTelegramMessage(
  customerName: string | null | undefined,
  merchantName: string | null | undefined,
  campaignTitle: string,
  campaignDescription: string | null | undefined
): string {
  const safeName = customerName || 'there';
  const safeMerchant = merchantName || 'Restaurant';

  const lines: string[] = [
    `🍽️ *${safeMerchant}*`,
    ``,
    `👋 Hey *${safeName}*!`,
    ``,
    `🎉 *${campaignTitle}*`,
  ];

  if (campaignDescription?.trim()) {
    lines.push(campaignDescription.trim());
  }

  lines.push(``);
  lines.push(`Hurry up — we are waiting to serve you! 🔥`);
  lines.push(`_Powered by DineFlow_`);

  return lines.join('\n');
}

export async function sendCampaignTelegram(
  chatId: string | null | undefined,
  customerName: string | null | undefined,
  merchantName: string | null | undefined,
  campaignTitle: string,
  campaignDescription?: string | null
): Promise<boolean> {
  if (!chatId?.trim()) return false;
  if (!telegramConfigured || !telegramBotToken) return false;
  const message = buildCampaignTelegramMessage(customerName, merchantName, campaignTitle, campaignDescription);
  return telegramPost(telegramBotToken, chatId.trim(), message);
}

export async function sendCampaignEmail(
  toEmail: string | null | undefined,
  customerName: string | null | undefined,
  merchantName: string | null | undefined,
  campaignTitle: string,
  campaignDescription?: string | null
): Promise<boolean> {
  if (!toEmail?.trim()) return false;

  const safeName = customerName || 'there';
  const safeMerchant = merchantName || 'Restaurant';
  const subject = `${safeMerchant} has a special offer for you!`;

  const text = [
    `Hey ${safeName}!`,
    ``,
    `${safeMerchant} here — we have something special for you:`,
    ``,
    `${campaignTitle}`,
    campaignDescription?.trim() ? campaignDescription.trim() : '',
    ``,
    `Hurry up — we are waiting to serve you!`,
  ].filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n');

  const descHtml = campaignDescription?.trim()
    ? `<p style="margin:8px 0 0;color:#374151;">${escapeHtml(campaignDescription.trim())}</p>`
    : '';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:580px;margin:0 auto;padding:28px;background:#ffffff;">
      <p style="margin:0 0 16px;font-size:15px;">Hey <strong>${escapeHtml(safeName)}</strong>!</p>
      <p style="margin:0 0 16px;font-size:15px;"><strong>${escapeHtml(safeMerchant)}</strong> here — we have something special for you:</p>
      <div style="margin:0 0 20px;padding:18px 20px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;">
        <p style="margin:0;font-size:16px;font-weight:700;color:#166534;">${escapeHtml(campaignTitle)}</p>
        ${descHtml}
      </div>
      <p style="margin:0;font-size:15px;font-weight:700;color:#dc2626;">Hurry up — we are waiting to serve you! 🔥</p>
      <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;">Powered by DineFlow</p>
    </div>
  `;

  const resend = getResend();
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = process.env.SMTP_FROM_NAME || 'DineFlow Billing';

  if (!resend) {
    console.log(`[Campaign Email] RESEND_API_KEY not configured. Skipping email to ${toEmail}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({ from: `${fromName} <${fromEmail}>`, to: toEmail, subject, text, html });
    if (error) { console.error('[Campaign Email] Failed:', error); return false; }
    console.log(`[Campaign Email] Sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('[Campaign Email] Failed:', err);
    return false;
  }
}

// ─── Unified send ─────────────────────────────────────────────────────────────

export async function sendNotification(
  toEmail: string | null | undefined,
  customerName: string | null | undefined,
  billAmount: number,
  merchantName: string | null | undefined,
  campaigns: CampaignBrief[] = [],
  telegramChatId?: string | null,
  pointsBalance: number = 0
): Promise<{ email: boolean; telegram: boolean }> {
  const [email, telegram] = await Promise.all([
    sendEmailNotification(toEmail as string, customerName as string, billAmount, merchantName as string, campaigns, pointsBalance),
    sendTelegramNotification(telegramChatId, customerName, billAmount, merchantName, campaigns, pointsBalance),
  ]);
  return { email, telegram };
}
