import { ExternalHackathonProvider, ExternalHackathonInput } from './ExternalHackathonProvider';
import { normalizeLocationDetails } from '../../utils/locationNormalizer';

export class DevpostProvider implements ExternalHackathonProvider {
  name = 'DevpostProvider';

  private readonly BASE_API_URL = 'https://devpost.com/api/hackathons?page=1';

  isEnabled(): boolean {
    return true;
  }

  async fetchHackathons(): Promise<ExternalHackathonInput[]> {
    console.log('[DevpostProvider] Fetch started');
    const allParsed: ExternalHackathonInput[] = [];
    const seenExternalIds = new Set<string>();

    try {
      const response = await this.fetchWithRetry(this.BASE_API_URL, 3, 1000);
      if (!response.ok) {
        console.warn(`[DevpostProvider] HTTP ${response.status}. Skipping.`);
        return [];
      }

      const data: any = await response.json();
      const rawHackathons = data.hackathons || [];
      console.log(`[DevpostProvider] Discovered ${rawHackathons.length} hackathons`);

      for (const item of rawHackathons) {
        if (!item || (!item.id && !item.title && !item.url)) continue;

        const normalized = this.normalizeDevpostItem(item);
        if (normalized && !seenExternalIds.has(normalized.externalId)) {
          seenExternalIds.add(normalized.externalId);
          allParsed.push(normalized);
        }
      }
    } catch (err: any) {
      console.error(`❌ [DevpostProvider] Error fetching events: ${err.message}`);
    }

    console.log(`[DevpostProvider] Total parsed hackathons: ${allParsed.length}`);
    console.log('[DevpostProvider] Fetch completed');
    return allParsed;
  }

  private async fetchWithRetry(url: string, retries: number, delayMs: number): Promise<Response> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, { method: 'GET', headers, signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.status === 429 && attempt < retries) {
          await new Promise((r) => setTimeout(r, delayMs * attempt));
          continue;
        }
        return res;
      } catch (err: any) {
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
    throw new Error('All retries failed');
  }

  private normalizeDevpostItem(item: any): ExternalHackathonInput | null {
    try {
      const rawUrl = item.url || item.web_page_url || '';
      if (!rawUrl || !rawUrl.startsWith('http')) return null;

      const cleanUrl = rawUrl.split('?')[0];
      const slugMatch = cleanUrl.match(/https?:\/\/([^.]+)\.devpost\.com/i) || cleanUrl.match(/\/hackathons\/([^/]+)/i);
      const slug = slugMatch ? slugMatch[1] : item.id ? String(item.id) : item.title.toLowerCase().replace(/\s+/g, '-');
      const stableId = `devpost:${slug}`;

      const title = item.title || 'Devpost Hackathon';
      const description = (item.tagline || item.description || title)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const organizer = item.organization_name || item.displayed_location?.location || 'Devpost Host';

      const now = new Date();
      const datesParts = item.submission_period_dates?.split('-');
      const startStr = datesParts?.[0]?.trim();
      const endStr = datesParts?.[1]?.trim() || item.submission_deadline;

      const eventStartDate = startStr ? new Date(startStr) : undefined;
      const eventEndDate = endStr ? new Date(endStr) : undefined;
      // Devpost API doesn't provide a distinct registration deadline, it's open until submission.
      let registrationDeadline: Date | undefined = undefined;
      const eventDate = eventStartDate;

      const isOnline = item.open_state === 'online' || item.is_online || (item.displayed_location?.location || '').toLowerCase().includes('online');
      const mode: 'Online' | 'Offline' | 'Hybrid' = isOnline ? 'Online' : 'Offline';

      const locationStr = isOnline ? 'Online' : item.displayed_location?.location || 'Offline';
      const locationDetails = normalizeLocationDetails(locationStr, mode);

      let prize: number | undefined = undefined;
      if (item.prize_amount) {
        const prizeNum = Number(String(item.prize_amount).replace(/[^0-9.]/g, ''));
        if (!isNaN(prizeNum) && prizeNum > 0) prize = prizeNum;
      }

      const domainSet = new Set<string>();
      const blob = (title + ' ' + description).toLowerCase();

      if (/\b(ai|ml|machine learning|artificial intelligence|llm|genai)\b/i.test(blob)) domainSet.add('AI/ML');
      if (/\b(web|frontend|backend|fullstack|react|node)\b/i.test(blob)) domainSet.add('Web Development');
      if (/\b(mobile|android|ios|flutter)\b/i.test(blob)) domainSet.add('Mobile Development');
      if (/\b(blockchain|web3|ethereum|solidity|crypto)\b/i.test(blob)) domainSet.add('Blockchain');
      if (/\b(cloud|aws|gcp|azure)\b/i.test(blob)) domainSet.add('Cloud');
      if (/\b(security|cybersecurity|ctf)\b/i.test(blob)) domainSet.add('Cybersecurity');
      if (domainSet.size === 0) domainSet.add('Other');

      let status: 'Registration Open' | 'Closed' = 'Registration Open';
      if (eventEndDate && eventEndDate < now) {
        status = 'Closed';
      }

      return {
        externalId: stableId,
        title,
        description,
        organizer,
        location: locationStr,
        locationDetails,
        mode,
        registrationDeadline: undefined,
        eventDate: eventDate && !isNaN(eventDate.getTime()) ? eventDate : undefined,
        eventStartDate: eventStartDate && !isNaN(eventStartDate.getTime()) ? eventStartDate : undefined,
        eventEndDate: eventEndDate && !isNaN(eventEndDate.getTime()) ? eventEndDate : undefined,
        prize,
        registrationFeeType: 'free',
        registrationFee: 0,
        currency: 'USD',
        eligibilityType: 'open_to_everyone',
        eligibilityText: 'Open to Everyone',
        domains: Array.from(domainSet),
        image: item.thumbnail_url || item.banner_url || undefined,
        officialUrl: cleanUrl,
        canonicalUrl: cleanUrl,
        tags: ['Devpost', 'Hackathon'],
        status,
        sourceProvider: 'devpost',
        sourceType: 'platform',
      };
    } catch (err: any) {
      console.warn(`[DevpostProvider] Error normalizing item: ${err.message}`);
      return null;
    }
  }
}
