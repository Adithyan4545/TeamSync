import { ExternalHackathon } from '../models/ExternalHackathon';
import { SyncAudit, IProviderStatus } from '../models/SyncAudit';
import { ExternalHackathonProvider, ExternalHackathonInput } from './providers/ExternalHackathonProvider';
import { UnstopProvider } from './providers/UnstopProvider';
import { DevfolioProvider } from './providers/DevfolioProvider';
import { HackerEarthProvider } from './providers/HackerEarthProvider';
import { MLHProvider } from './providers/MLHProvider';
import { DevpostProvider } from './providers/DevpostProvider';
import { HackerRankProvider } from './providers/HackerRankProvider';
import { CollegeHackathonProvider } from './providers/CollegeHackathonProvider';
import { CompanyHackathonProvider } from './providers/CompanyHackathonProvider';

// Registered External Providers for Multi-Source Discovery
const registeredProviders: ExternalHackathonProvider[] = [
  new UnstopProvider(),
  new DevfolioProvider(),
  new HackerEarthProvider(),
  new MLHProvider(),
  new DevpostProvider(),
  new HackerRankProvider(),
  new CollegeHackathonProvider(),
  new CompanyHackathonProvider(),
];

/**
 * Add a new custom provider at runtime.
 */
export const registerExternalProvider = (provider: ExternalHackathonProvider): void => {
  registeredProviders.push(provider);
};

let isSyncInProgress = false;

/**
 * Synchronize external hackathons across all enabled providers:
 * - Runs each enabled provider independently with error isolation (fault tolerance).
 * - Deduplicates by externalId or canonicalUrl.
 * - Multi-source tagging in sourceProviders array.
 * - Upserts / updates MongoDB records without deleting existing documents on provider timeouts/403s.
 * - Automatically marks expired events as 'Closed'.
 * - Guarded against concurrent overlapping sync jobs.
 */
export const syncExternalHackathons = async (): Promise<any> => {
  if (isSyncInProgress) {
    console.warn('⚠️ [ExternalHackathonService] Sync is already in progress. Skipping concurrent run.');
    return { error: 'Sync already in progress' };
  }

  isSyncInProgress = true;
  const syncStartedAt = new Date();
  
  let newRecords = 0;
  let updatedRecords = 0;
  let closedRecords = 0;
  let duplicatesPrevented = 0;
  
  const providerStatus: Record<string, IProviderStatus> = {};
  const syncErrors: string[] = [];

  try {
    const enabledProviders = registeredProviders.filter((p) => p.isEnabled());
    const now = new Date();

    for (const provider of enabledProviders) {
      const pName = provider.name.replace('Provider', '').toLowerCase();
      providerStatus[pName] = { status: 'success', fetched: 0, inserted: 0, updated: 0, duplicates: 0 };
      
      try {
        console.log(`🌐 [ExternalHackathonService] Running provider: ${provider.name}`);
        const items: ExternalHackathonInput[] = await provider.fetchHackathons();
        providerStatus[pName].fetched = items.length;

        for (const item of items) {
          if (!item.externalId || !item.title) continue;

          // 1. Deduplication lookup by externalId or canonicalUrl or exact officialUrl
          let existing = await ExternalHackathon.findOne({ externalId: item.externalId });
          if (!existing && item.canonicalUrl) {
            existing = await ExternalHackathon.findOne({ canonicalUrl: item.canonicalUrl });
          }
          if (!existing && item.officialUrl) {
            existing = await ExternalHackathon.findOne({ officialUrl: item.officialUrl });
          }

          const isExpired = item.registrationDeadline && item.registrationDeadline < now;
          const status = isExpired ? 'Closed' : item.status || 'Registration Open';
          const pName = item.sourceProvider || provider.name.replace('Provider', '').toLowerCase();
          const sType = item.sourceType || 'platform';
          
          if (!providerStatus[pName]) {
            providerStatus[pName] = { status: 'success', fetched: 0, inserted: 0, updated: 0, duplicates: 0 };
          }

          if (existing) {
            existing.title = item.title;
            existing.description = item.description || existing.description;
            existing.organizer = item.organizer || existing.organizer;
            existing.location = item.location || existing.location;
            existing.locationDetails = item.locationDetails || existing.locationDetails;
            existing.mode = item.mode || existing.mode;
            existing.registrationDeadline = item.registrationDeadline !== undefined ? item.registrationDeadline : existing.registrationDeadline;
            existing.eventDate = item.eventDate !== undefined ? item.eventDate : existing.eventDate;
            existing.prize = item.prize !== undefined ? item.prize : existing.prize;
            existing.registrationFeeType = item.registrationFeeType || existing.registrationFeeType;
            existing.registrationFee = item.registrationFee !== undefined ? item.registrationFee : existing.registrationFee;
            existing.currency = item.currency || existing.currency;
            existing.eligibilityType = item.eligibilityType || existing.eligibilityType;
            existing.eligibilityText = item.eligibilityText || existing.eligibilityText;
            existing.domains = item.domains && item.domains.length > 0 ? item.domains : existing.domains;
            existing.image = item.image || existing.image;
            existing.officialUrl = item.officialUrl || existing.officialUrl;
            existing.canonicalUrl = item.canonicalUrl || existing.canonicalUrl;
            existing.tags = Array.from(new Set([...(existing.tags || []), ...(item.tags || [])]));
            existing.status = status;
            existing.sourceType = sType;
            existing.lastSynced = now;
            existing.lastSyncedAt = now;

            // Preserve multi-source provider array
            const currentProviders = new Set(existing.sourceProviders || [existing.sourceProvider || 'unstop']);
            currentProviders.add(pName);
            existing.sourceProviders = Array.from(currentProviders);

            await existing.save();
            updatedRecords++;
            providerStatus[pName].updated! += 1;
            duplicatesPrevented++;
            providerStatus[pName].duplicates! += 1;
          } else {
            const newExt = new ExternalHackathon({
              ...item,
              status,
              sourceProvider: pName,
              sourceProviders: [pName],
              sourceType: sType,
              discoveryDate: now,
              lastSyncedAt: now,
              lastSynced: now,
              source: 'external',
            });
            await newExt.save();
            newRecords++;
            providerStatus[pName].inserted! += 1;
          }
        }
      } catch (providerError: any) {
        console.error(
          `❌ [ExternalHackathonService] Provider '${provider.name}' threw an error and was skipped:`,
          providerError?.message || providerError
        );
        const pNameFallback = provider.name.replace('Provider', '').toLowerCase();
        if (!providerStatus[pNameFallback]) {
          providerStatus[pNameFallback] = { status: 'failed', fetched: 0, inserted: 0, updated: 0, duplicates: 0 };
        }
        providerStatus[pNameFallback].status = 'failed';
        providerStatus[pNameFallback].error = providerError?.message || 'Unknown error';
        syncErrors.push(`Provider ${pNameFallback} failed: ${providerStatus[pNameFallback].error}`);
        // Fault isolation: continue with next provider
      }
    }

    // Mark expired hackathons as Closed (if registrationDeadline < now)
    const expiredResult = await ExternalHackathon.updateMany(
      {
        registrationDeadline: { $lt: now },
        status: { $ne: 'Closed' },
      },
      { $set: { status: 'Closed', lastSyncedAt: now, lastSynced: now } }
    );
    closedRecords = expiredResult.modifiedCount || 0;

    // Calculate Active Hackathons & 35-day count
    const allHackathons = await ExternalHackathon.find({}, { registrationDeadline: 1, eventStartDate: 1, status: 1 });
    
    let totalActiveHackathons = 0;
    let next35DayCount = 0;
    let registrationDeadlineAvailable = 0;
    let registrationDeadlineMissing = 0;
    
    const days35FromNow = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

    for (const h of allHackathons) {
      const hasReg = !!h.registrationDeadline;
      if (hasReg) registrationDeadlineAvailable++;
      else registrationDeadlineMissing++;

      let isActive = false;
      if (h.registrationDeadline && h.registrationDeadline >= now) isActive = true;
      if (h.eventStartDate && h.eventStartDate >= now) isActive = true;
      if (['Registration Open', 'Upcoming', 'Ongoing'].includes(h.status || '')) isActive = true;
      
      if (isActive) totalActiveHackathons++;

      let in35 = false;
      if (h.registrationDeadline && h.registrationDeadline <= days35FromNow && h.registrationDeadline >= now) in35 = true;
      if (!h.registrationDeadline && h.eventStartDate && h.eventStartDate <= days35FromNow && h.eventStartDate >= now) in35 = true;
      if (isActive && h.eventStartDate && h.eventStartDate <= days35FromNow) in35 = true;
      
      if (in35) next35DayCount++;
    }

    const targetActiveHackathons = 400;
    const targetReached = totalActiveHackathons >= targetActiveHackathons;

    if (!targetReached) {
      console.warn(`⚠️ [ExternalHackathonService] Active hackathons (${totalActiveHackathons}) is below target (${targetActiveHackathons}). Source APIs might be providing limited data.`);
    }

    const syncCompletedAt = new Date();

    const audit = new SyncAudit({
      syncStartedAt,
      syncCompletedAt,
      totalActiveHackathons,
      newRecords,
      updatedRecords,
      duplicatesPrevented,
      closedRecords,
      registrationDeadlineAvailable,
      registrationDeadlineMissing,
      next35DayCount,
      targetActiveHackathons,
      targetReached,
      providerStatus,
      syncErrors
    });
    
    await audit.save();

    console.log(
      `✅ [ExternalHackathonService] Sync completed. New: ${newRecords}, Updated: ${updatedRecords}, Active: ${totalActiveHackathons}/${targetActiveHackathons}`
    );

    return audit.toJSON();
  } finally {
    isSyncInProgress = false;
  }
};
