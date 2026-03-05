import { orderService } from './services/order.service.js';

/**
 * Auto-confirm old deliveries cron job
 * Runs daily to update payment status for COD orders delivered 3+ days ago
 */
export async function runAutoConfirmCron() {
  try {
    console.log('[CRON] Running auto-confirm old deliveries...');
    const result = await orderService.autoConfirmOldDeliveries();
    console.log(`[CRON] ${result.message}`);
  } catch (error) {
    console.error('[CRON] Error in auto-confirm cron:', error);
  }
}

// Run every day at midnight
const DAILY_MS = 24 * 60 * 60 * 1000;

export function startCronJobs() {
  console.log('[CRON] Starting scheduled jobs...');

  // Run immediately on startup
  runAutoConfirmCron();

  // Then run every 24 hours
  setInterval(runAutoConfirmCron, DAILY_MS);

  console.log('[CRON] Scheduled jobs started successfully');
}
