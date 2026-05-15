import { supabase } from '../utils/supabase.js';
import { sendWinBackNotification } from './notificationService.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Track last run date to avoid duplicate daily checks
let lastRunDate: string | null = null;

/**
 * Check and send win-back messages to customers not visited in 30+ days
 * Runs once per day to minimize DB load
 */
export async function runDailyWinBackCheck(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  // Skip if already ran today
  if (lastRunDate === today) {
    console.log('[WinBack Scheduler] Already ran today, skipping...');
    return;
  }
  
  console.log('[WinBack Scheduler] Starting daily win-back check...');
  
  try {
    // Get all merchants
    const { data: merchants, error: merchantError } = await supabase
      .from('merchants')
      .select('id, name');
    
    if (merchantError || !merchants) {
      console.error('[WinBack Scheduler] Error fetching merchants:', merchantError);
      return;
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();
    
    for (const merchant of merchants) {
      await processMerchantWinBacks(merchant.id, merchant.name || 'Restaurant', cutoffDate);
    }
    
    lastRunDate = today;
    console.log('[WinBack Scheduler] Daily check completed successfully');
  } catch (error) {
    console.error('[WinBack Scheduler] Error in daily check:', error);
  }
}

async function processMerchantWinBacks(merchantId: string, merchantName: string, cutoffDate: string): Promise<void> {
  // Fetch merchant's winback template settings
  const { data: merchantData } = await supabase
    .from('merchants')
    .select('winback_subject, winback_body')
    .eq('id', merchantId)
    .single();

  const customTemplate = {
    subject: merchantData?.winback_subject || '',
    body: merchantData?.winback_body || '',
  };

  // Find customers who haven't visited in 30+ days and haven't been notified in the last 7 days
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('merchant_id', merchantId)
    .or(`last_visit_at.lt.${cutoffDate},last_visit_at.is.null`)
    .gt('points_balance', 0)  // Only customers with points
    .limit(100);
  
  if (error) {
    console.error(`[WinBack Scheduler] Error fetching customers for merchant ${merchantId}:`, error);
    return;
  }
  
  if (!customers || customers.length === 0) {
    console.log(`[WinBack Scheduler] No inactive customers with points for merchant ${merchantName}`);
    return;
  }
  
  console.log(`[WinBack Scheduler] Found ${customers.length} inactive customers for ${merchantName}`);
  
  for (const customer of customers) {
    // Skip if notified in last 7 days (avoid spam)
    const lastWinBackSent = customer.last_winback_sent_at;
    if (lastWinBackSent) {
      const daysSinceLastWinBack = (Date.now() - new Date(lastWinBackSent).getTime()) / ONE_DAY_MS;
      if (daysSinceLastWinBack < 7) {
        console.log(`[WinBack Scheduler] Skipping ${customer.name} — notified ${Math.floor(daysSinceLastWinBack)} days ago`);
        continue;
      }
    }
    
    // Calculate days since last visit
    const lastVisit = customer.last_visit_at;
    const daysSinceVisit = lastVisit 
      ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / ONE_DAY_MS)
      : 30; // If never visited, assume 30 days
    
    // Send win-back notification with custom template if available
    await sendWinBackNotification(
      customer.email,
      customer.telegram_chat_id,
      customer.name,
      merchantName,
      customer.points_balance || 0,
      daysSinceVisit,
      customTemplate.subject || undefined,
      customTemplate.body || undefined
    );
    
    // Update last_winback_sent_at
    await supabase
      .from('customers')
      .update({ last_winback_sent_at: new Date().toISOString() })
      .eq('id', customer.id);
    
    console.log(`[WinBack Scheduler] Win-back sent to ${customer.name} (${daysSinceVisit} days inactive)`);
  }
}

/**
 * Start the daily scheduler
 * Runs immediately on startup, then checks every hour if a new day started
 */
export function startWinBackScheduler(): void {
  console.log('[WinBack Scheduler] Initializing...');
  
  // Run immediately on startup
  runDailyWinBackCheck();
  
  // Check every hour if we need to run (in case server restarts, etc.)
  setInterval(() => {
    const now = new Date();
    // Run at 10 AM local time
    if (now.getHours() === 10) {
      runDailyWinBackCheck();
    }
  }, 60 * 60 * 1000); // Check every hour
  
  console.log('[WinBack Scheduler] Started — will run daily at 10 AM');
}
