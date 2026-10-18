import cron from 'node-cron';
import { syncExternalHackathons } from '../services/externalHackathonService';

let jobInitialized = false;

export const initHackathonSyncJob = () => {
  if (jobInitialized) {
    console.log('⚠️ [HackathonSyncJob] Scheduler already initialized. Skipping.');
    return;
  }

  jobInitialized = true;
  console.log('✅ [HackathonSyncJob] Initializing 3-hour hackathon sync scheduler.');

  // Schedule to run every 3 hours: "0 */3 * * *"
  cron.schedule('0 */3 * * *', async () => {
    console.log('⏰ [HackathonSyncJob] Running scheduled sync (3-hour interval)');
    try {
      await syncExternalHackathons();
    } catch (error) {
      console.error('❌ [HackathonSyncJob] Scheduled sync failed:', error);
    }
  });
};
