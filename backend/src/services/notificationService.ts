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
  const subject = `Your bill receipt from ${safeMerchantName}`;

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
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@abhiram.codes';
  const fromName = process.env.SMTP_FROM_NAME || 'DineFlow Billing';

  if (!resend) {
    console.log('[Email] RESEND_API_KEY not configured. Skipping email to:', toEmail);
    return false;
  }

  try {
    const { error } = await resend.emails.send({ from: `${fromName} <${fromEmail}>`, to: toEmail, subject, html, text });
    if (error) { console.error('Failed to send email:', error); return false; }
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
    lines.push(``);
    lines.push(`Who knows? On your next visit, you could unlock even bigger savings and exclusive offers. Your special deals are live now — don't let it go to waste, we're waiting to welcome you back!`);
    lines.push(``);
  } else {
    lines.push(`⭐ Keep visiting to earn reward points and unlock exclusive deals!`);
    lines.push(``);
  }

  if (safeCampaigns.length > 0) {
    lines.push(`🎉 *Active Offers for You:*`);
    lines.push(``);
    safeCampaigns.slice(0, 4).forEach((c) => {
      lines.push(`• *${c.title}*`);
      if (c.description) lines.push(`  ${c.description}`);
      lines.push(``);
    });
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
    ``,
  ];

  if (campaignDescription?.trim()) {
    lines.push(campaignDescription.trim());
    lines.push(``);
  }

  lines.push(`Hurry up — we are waiting to serve you! 🔥`);
  lines.push(``);
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
  const subject = `A message from ${safeMerchant}`;

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
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@abhiram.codes';
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

// ─── Win-Back Notification (Automated for 30+ days inactive customers) ─────────

export async function sendWinBackNotification(
  toEmail: string | null | undefined,
  telegramChatId: string | null | undefined,
  customerName: string | null | undefined,
  merchantName: string | null | undefined,
  pointsBalance: number,
  daysSinceVisit: number,
  customSubject?: string,
  customBody?: string
): Promise<void> {
  const safeName = customerName || 'there';
  const safeMerchant = merchantName || 'Restaurant';
  const discountPct = Math.min(Math.floor(pointsBalance / 100), 10);

  // Use custom template if provided, otherwise use default
  const subject = customSubject?.trim()
    ? customSubject.replace(/\{name\}/g, safeName).replace(/\{merchant\}/g, safeMerchant).replace(/\{points\}/g, String(pointsBalance)).replace(/\{discountPct\}/g, String(discountPct)).replace(/\{days\}/g, String(daysSinceVisit))
    : `We miss you at ${safeMerchant}! Your ${pointsBalance} points are waiting`;

  const defaultHtml = `
    <div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px 24px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
      <p style="margin:0 0 16px;font-size:15px;">Hey <strong>${escapeHtml(safeName)}</strong>! 👋</p>
      <p style="margin:0 0 16px;font-size:15px;">We noticed you haven't visited <strong>${escapeHtml(safeMerchant)}</strong> in ${daysSinceVisit} days — we miss you!</p>
      <div style="margin:0 0 20px;padding:18px 20px;border-radius:14px;background:#fef3c7;border:1px solid #fde68a;">
        <p style="margin:0;font-size:16px;font-weight:700;color:#92400e;">🎁 You have <strong>${pointsBalance} reward points</strong> waiting!</p>
        <p style="margin:8px 0 0;font-size:14px;color:#78350f;">That's worth a <strong>${discountPct}% discount</strong> on your next visit. We have exciting offers at the restaurant — visit for more details!</p>
      </div>
      <p style="margin:0 0 8px;font-size:15px;">We can't wait to serve you again! Hurry up and claim your rewards before they expire. 🔥</p>
      <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;">Powered by DineFlow</p>
    </div>
  `;
  const defaultText = `Hey ${safeName}! We noticed you haven't visited ${safeMerchant} in ${daysSinceVisit} days — we miss you! You have ${pointsBalance} reward points waiting, worth a ${discountPct}% discount on your next visit. We have exciting offers at the restaurant — visit for more details! We can't wait to serve you again. Hurry up and claim your rewards before they expire!`;

  const html = customBody?.trim()
    ? `<div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px 24px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
        ${customBody
          .replace(/\{name\}/g, escapeHtml(safeName))
          .replace(/\{merchant\}/g, escapeHtml(safeMerchant))
          .replace(/\{points\}/g, String(pointsBalance))
          .replace(/\{discountPct\}/g, String(discountPct))
          .replace(/\{days\}/g, String(daysSinceVisit))
          .replace(/\n/g, '<br>')}
        <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;">Powered by DineFlow</p>
       </div>`
    : defaultHtml;

  const text = customBody?.trim()
    ? customBody
        .replace(/\{name\}/g, safeName)
        .replace(/\{merchant\}/g, safeMerchant)
        .replace(/\{points\}/g, String(pointsBalance))
        .replace(/\{discountPct\}/g, String(discountPct))
        .replace(/\{days\}/g, String(daysSinceVisit))
    : defaultText;

  // Email
  if (toEmail?.trim()) {
    const resend = getResend();
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@abhiram.codes';
    const fromName = process.env.SMTP_FROM_NAME || 'DineFlow Billing';

    if (resend) {
      resend.emails.send({ from: `${fromName} <${fromEmail}>`, to: toEmail.trim(), subject, html, text })
        .then(() => console.log(`[WinBack] Email sent to ${toEmail}`))
        .catch((err: any) => console.error('[WinBack] Email failed:', err));
    }
  }

  // Telegram
  const defaultTelegramMsg = [
    `👋 *We miss you at ${safeMerchant}!*`,
    ``,
    `Hey *${safeName}*! 👋`,
    ``,
    `We noticed you haven't visited us in *${daysSinceVisit} days* — we can't wait to see you again!`,
    ``,
    `🎁 *Good news:* You have *${pointsBalance} reward points* waiting for you!`,
    `That's a *${discountPct}% discount* on your next visit.`,
    ``,
    `We have exciting offers at the restaurant — visit us for more details!`,
    ``,
    `Hurry up and claim your rewards before they expire 🔥`,
    `We can't wait to serve you!`,
    ``,
    `_Powered by DineFlow_`,
  ].join('\n');

  const telegramMsg = customBody?.trim()
    ? customBody
        .replace(/\{name\}/g, `*${safeName}*`)
        .replace(/\{merchant\}/g, `*${safeMerchant}*`)
        .replace(/\{points\}/g, `*${pointsBalance}*`)
        .replace(/\{discountPct\}/g, `*${discountPct}*`)
        .replace(/\{days\}/g, `*${daysSinceVisit}*`)
    : defaultTelegramMsg;

  if (telegramChatId?.trim() && telegramConfigured && telegramBotToken) {
    telegramPost(telegramBotToken, telegramChatId.trim(), telegramMsg)
      .catch((err) => console.error('[WinBack] Telegram failed:', err));
  }
}

// ─── Points Expiry Warning ───────────────────────────────────────────────────

export async function sendPointsExpiryWarning(
  toEmail: string | null | undefined,
  telegramChatId: string | null | undefined,
  customerName: string | null | undefined,
  merchantName: string | null | undefined,
  currentPoints: number
): Promise<void> {
  const safeName = customerName || 'there';
  const safeMerchant = merchantName || 'Restaurant';
  const discountPct = Math.min(Math.floor(currentPoints / 100), 10);

  // Email
  if (toEmail?.trim()) {
    const resend = getResend();
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@abhiram.codes';
    const fromName = process.env.SMTP_FROM_NAME || 'DineFlow Billing';

    if (resend) {
      const subject = `Your ${currentPoints} reward points are about to expire!`;
      const html = `
        <div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px 24px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
          <p style="margin:0 0 16px;font-size:15px;">Hey <strong>${escapeHtml(safeName)}</strong>! 👋</p>
          <p style="margin:0 0 16px;font-size:15px;">Your <strong>${currentPoints} reward points</strong> at <strong>${escapeHtml(safeMerchant)}</strong> are about to expire!</p>
          <div style="margin:0 0 20px;padding:18px 20px;border-radius:14px;background:#fef3c7;border:1px solid #fde68a;">
            <p style="margin:0;font-size:16px;font-weight:700;color:#92400e;">⚠️ You're eligible for a ${discountPct}% discount right now!</p>
            <p style="margin:8px 0 0;font-size:14px;color:#78350f;">Once you cross 1000 points without redeeming, your points will reset. Don't miss out!</p>
          </div>
          <p style="margin:0 0 8px;font-size:15px;">Hurry up — we can't wait to see you! Come grab your discount before it's gone. 🔥</p>
          <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;">Powered by DineFlow</p>
        </div>
      `;
      const text = `Hey ${safeName}! Your ${currentPoints} reward points at ${safeMerchant} are about to expire! You're eligible for a ${discountPct}% discount right now. Once you cross 1000 points without redeeming, your points will reset. Hurry up — come grab your discount before it's gone!`;

      resend.emails.send({ from: `${fromName} <${fromEmail}>`, to: toEmail.trim(), subject, html, text })
        .then(() => console.log(`[Points Expiry] Email sent to ${toEmail}`))
        .catch((err: any) => console.error('[Points Expiry] Email failed:', err));
    }
  }

  // Telegram
  if (telegramChatId?.trim() && telegramConfigured && telegramBotToken) {
    const message = [
      `⚠️ *Points Expiry Alert!*`,
      ``,
      `Hey *${safeName}*! 👋`,
      ``,
      `You have *${currentPoints} reward points* at *${safeMerchant}* — that's a *${discountPct}% discount* waiting for you!`,
      ``,
      `Once your points cross 1000 without redeeming, they'll expire and reset. Don't let that happen!`,
      ``,
      `Hurry up — we can't wait to see you! Come grab your discount before it's gone 🔥`,
      ``,
      `_Powered by DineFlow_`,
    ].join('\n');

    telegramPost(telegramBotToken, telegramChatId.trim(), message)
      .catch((err) => console.error('[Points Expiry] Telegram failed:', err));
  }
}
