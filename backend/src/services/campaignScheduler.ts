import { supabase } from '../utils/supabase.js';
import { sendCampaignEmail, sendCampaignTelegram } from './notificationService.js';

/**
 * Broadcast a single campaign to all recent customers of a merchant.
 * "Recent" = visited at least once (total_visits >= 1).
 * target_segment controls the audience:
 *   all        — every customer
 *   vip        — total_visits >= 10
 *   frequent   — total_visits >= 5
 *   at_risk    — last_visit_at >= 30 days ago
 *   high_spenders — total_spend >= 5000
 */
export async function broadcastCampaign(
  campaignId: string,
  merchantId: string
): Promise<{ sent: number; failed: number }> {
  // 1. Fetch the campaign
  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('merchant_id', merchantId)
    .single();

  if (campErr || !campaign) {
    console.error(`[Campaign Scheduler] Campaign ${campaignId} not found:`, campErr?.message);
    return { sent: 0, failed: 0 };
  }

  // 2. Fetch merchant name
  const { data: merchant } = await supabase
    .from('merchants')
    .select('name')
    .eq('id', merchantId)
    .single();
  const merchantName = (merchant as any)?.name || 'Restaurant';

  // 3. Build customer query based on target_segment
  const segment = (campaign as any).target_segment || 'all';
  let query = supabase
    .from('customers')
    .select('id, name, email, telegram_chat_id, points_balance, total_visits, total_spend, last_visit_at')
    .eq('merchant_id', merchantId)
    .gte('total_visits', 1);

  if (segment === 'vip') {
    query = query.gte('total_visits', 10);
  } else if (segment === 'frequent') {
    query = query.gte('total_visits', 5);
  } else if (segment === 'high_spenders') {
    query = query.gte('total_spend', 5000);
  } else if (segment === 'at_risk') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.lte('last_visit_at', thirtyDaysAgo);
  }

  const { data: customers, error: custErr } = await query.limit(500);

  if (custErr || !customers?.length) {
    console.log(`[Campaign Scheduler] No customers found for campaign ${campaignId} (segment: ${segment})`);
    // Mark as sent anyway so it doesn't retry
    await supabase
      .from('campaigns')
      .update({ sent_at: new Date().toISOString(), status: 'active' })
      .eq('id', campaignId);
    return { sent: 0, failed: 0 };
  }

  console.log(`[Campaign Scheduler] Broadcasting "${campaign.title}" to ${customers.length} customers (segment: ${segment})`);

  // 4. Send notifications in parallel batches of 10
  let sent = 0;
  let failed = 0;
  const campaignTitle: string = (campaign as any).title;
  const campaignDesc: string | null = (campaign as any).description ?? null;

  const BATCH = 10;
  for (let i = 0; i < customers.length; i += BATCH) {
    const batch = customers.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((c: any) =>
        Promise.all([
          sendCampaignEmail(c.email, c.name, merchantName, campaignTitle, campaignDesc),
          sendCampaignTelegram(c.telegram_chat_id ?? null, c.name, merchantName, campaignTitle, campaignDesc),
        ])
      )
    );
    results.forEach((r: PromiseSettledResult<[boolean, boolean]>) => {
      if (r.status === 'fulfilled' && (r.value[0] || r.value[1])) {
        sent++;
      } else {
        failed++;
      }
    });
  }

  // 5. Mark campaign as sent
  await supabase
    .from('campaigns')
    .update({ sent_at: new Date().toISOString(), status: 'active' })
    .eq('id', campaignId);

  console.log(`[Campaign Scheduler] "${campaign.title}" — sent: ${sent}, failed: ${failed}`);
  return { sent, failed };
}

