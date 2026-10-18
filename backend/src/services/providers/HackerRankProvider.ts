import { ExternalHackathonProvider, ExternalHackathonInput } from './ExternalHackathonProvider';
import { normalizeLocationDetails } from '../../utils/locationNormalizer';

export class HackerRankProvider implements ExternalHackathonProvider {
  name = 'HackerRankProvider';

  private readonly BASE_API_URL = 'https://www.hackerrank.com/rest/contests/college?offset=0&limit=20';

  isEnabled(): boolean {
    return true;
  }

  async fetchHackathons(): Promise<ExternalHackathonInput[]> {
    console.log('[HackerRankProvider] Fetch started');
    const allParsed: ExternalHackathonInput[] = [];
    const seenExternalIds = new Set<string>();

    try {
      const response = await this.fetchWithRetry(this.BASE_API_URL, 3, 1000);
      if (!response.ok) {
        console.warn(`[HackerRankProvider] HTTP ${response.status}. Skipping.`);
        return [];
      }

      const data: any = await response.json();
      const rawContests = data.models || data.contests || (Array.isArray(data) ? data : []);
      console.log(`[HackerRankProvider] Discovered ${rawContests.length} contests`);

      for (const item of rawContests) {
        if (!item || (!item.slug && !item.name && !item.id)) continue;

        const normalized = this.normalizeHackerRankItem(item);
        if (normalized && !seenExternalIds.has(normalized.externalId)) {
          seenExternalIds.add(normalized.externalId);
          allParsed.push(normalized);
        }
      }
    } catch (err: any) {
      console.error(`❌ [HackerRankProvider] Error fetching contests: ${err.message}`);
    }

    console.log(`[HackerRankProvider] Total parsed hackathons: ${allParsed.length}`);
    console.log('[HackerRankProvider] Fetch completed');
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

  private normalizeHackerRankItem(item: any): ExternalHackathonInput | null {
    try {
      const slug = item.slug || item.name.toLowerCase().replace(/\s+/g, '-');
      const stableId = `hackerrank:${slug}`;
      const officialUrl = `https://www.hackerrank.com/contests/${slug}`;

      const title = item.name || 'HackerRank Contest';
      const description = (item.description || item.tagline || item.name || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const organizer = item.organization || 'HackerRank Host';

      const now = new Date();
      const endEpoch = item.epoch_endtime || item.endtime;
      const startEpoch = item.epoch_starttime || item.starttime;

      const eventStartDate = startEpoch ? new Date(startEpoch * 1000) : undefined;
      const eventEndDate = endEpoch ? new Date(endEpoch * 1000) : undefined;
      let registrationDeadline: Date | undefined = undefined;
      const eventDate = eventStartDate;

      const mode: 'Online' | 'Offline' | 'Hybrid' = 'Online';
      const locationStr = 'Online';
      const locationDetails = normalizeLocationDetails(locationStr, mode);

      const domainSet = new Set<string>();
      const blob = (title + ' ' + description).toLowerCase();

      if (/\b(ai|ml|machine learning|artificial intelligence)\b/i.test(blob)) domainSet.add('AI/ML');
      if (/\b(web|frontend|backend|fullstack|javascript|python|java|c\+\+)\b/i.test(blob)) domainSet.add('Web Development');
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
        registrationFeeType: 'free',
        registrationFee: 0,
        currency: 'USD',
        eligibilityType: 'open_to_everyone',
        eligibilityText: 'Open to Everyone',
        domains: Array.from(domainSet),
        image: item.banner || item.avatar || undefined,
        officialUrl,
        canonicalUrl: officialUrl,
        tags: ['HackerRank', 'Coding Challenge'],
        status,
        sourceProvider: 'hackerrank',
        sourceType: 'platform',
      };
    } catch (err: any) {
      console.warn(`[HackerRankProvider] Error normalizing item: ${err.message}`);
      return null;
    }
  }
}
