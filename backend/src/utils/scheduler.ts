import * as cron from 'node-cron';
import { syncExternalHackathons } from '../services/externalHackathonService';

let cronJob: cron.ScheduledTask | null = null;
let initialized = false;

export const startScheduler = (): void => {
  if (initialized) {
    console.log('⚠️ [Scheduler] Sync cron job already initialized. Skipping.');
    return;
  }
  
  initialized = true;

  console.log(`⏰ [Scheduler] Initializing node-cron scheduler for external hackathons (0 */3 * * *)`);

  // Run immediately on startup (optional but usually good, wait user said "Every 3 hours", didn't strictly forbid startup sync, but I'll skip it unless needed. Actually I'll just run it once)
  // Let's just schedule it
  cronJob = cron.schedule('0 */3 * * *', async () => {
    console.log('⏰ [Scheduler] Triggering scheduled 3-hour hackathon sync...');
    try {
      await syncExternalHackathons();
    } catch (err) {
      console.error('❌ [Scheduler] Scheduled external hackathon sync failed:', err);
    }
  });
};

export const stopScheduler = (): void => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    initialized = false;
  }
};
