import { ExternalHackathonProvider, ExternalHackathonInput } from './ExternalHackathonProvider';
import { normalizeLocationDetails } from '../../utils/locationNormalizer';

export class HackerEarthProvider implements ExternalHackathonProvider {
  name = 'HackerEarthProvider';

  private readonly BASE_API_URL = 'https://www.hackerearth.com/chrome-extension/events/';
  private readonly ALT_API_URL = 'https://www.hackerearth.com/api/events/upcoming/?format=json';

  isEnabled(): boolean {
    return true;
  }

  async fetchHackathons(): Promise<ExternalHackathonInput[]> {
    console.log('[HackerEarthProvider] Fetch started');
    const allParsed: ExternalHackathonInput[] = [];
    const seenExternalIds = new Set<string>();

    try {
      let rawEvents: any[] = [];
      const res = await this.fetchWithRetry(this.BASE_API_URL, 3, 1000);
      if (res.ok) {
        const data: any = await res.json();
        rawEvents = data.response || data.events || (Array.isArray(data) ? data : []);
      }

      if (rawEvents.length === 0) {
        console.log('[HackerEarthProvider] Primary API returned 0, trying secondary API...');
        const resAlt = await this.fetchWithRetry(this.ALT_API_URL, 3, 1000);
        if (resAlt.ok) {
          const dataAlt: any = await resAlt.json();
          rawEvents = Array.isArray(dataAlt.response)
            ? dataAlt.response
            : typeof dataAlt.response === 'object'
            ? Object.values(dataAlt.response)
            : [];
        }
      }

      console.log(`[HackerEarthProvider] Discovered ${rawEvents.length} raw HackerEarth events.`);

      for (const item of rawEvents) {
        if (!item || !item.title) continue;
        const normalized = this.normalizeHackerEarthItem(item);
        if (normalized && !seenExternalIds.has(normalized.externalId)) {
          seenExternalIds.add(normalized.externalId);
          allParsed.push(normalized);
        }
      }
    } catch (err: any) {
      console.error(`❌ [HackerEarthProvider] Error fetching events: ${err.message}`);
    }

    console.log(`[HackerEarthProvider] Total parsed hackathons: ${allParsed.length}`);
    console.log('[HackerEarthProvider] Fetch completed');
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

  private normalizeHackerEarthItem(item: any): ExternalHackathonInput | null {
    try {
      const url = item.url || item.subscribe || 'https://www.hackerearth.com/challenges/';
      const cleanUrl = url.split('?')[0];

      // Extract stable ID from URL slug or title
      const slugMatch = cleanUrl.match(/\/challenges\/[^/]+\/([^/]+)\/?$/) || cleanUrl.match(/\/challenges\/([^/]+)\/?$/);
      const slug = slugMatch ? slugMatch[1] : item.title.toLowerCase().replace(/\s+/g, '-');
      const stableId = `hackerearth:${slug}`;

      const title = item.title || 'HackerEarth Challenge';
      const description = (item.description || item.title || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const now = new Date();
      const startStr = item.start_tz || item.start_timestamp || item.date;
      const endStr = item.end_tz || item.end_timestamp || item.end_date;

      const eventStartDate = startStr ? new Date(startStr) : undefined;
      const eventEndDate = endStr ? new Date(endStr) : undefined;
      let registrationDeadline: Date | undefined = undefined;
      const eventDate = eventStartDate;

      const mode: 'Online' | 'Offline' | 'Hybrid' = 'Online';
      const location = item.location || 'Online';
      const organizer = item.company?.name || item.organizer || 'HackerEarth';

      const tagSet = new Set<string>(['HackerEarth', 'Hackathon']);
      if (item.challenge_type) tagSet.add(item.challenge_type);

      const domainSet = new Set<string>();
      const blob = (title + ' ' + description).toLowerCase();

      if (/\b(ai|ml|machine learning|artificial intelligence|deep learning)\b/i.test(blob)) domainSet.add('AI/ML');
      if (/\b(web|frontend|backend|fullstack|javascript|react)\b/i.test(blob)) domainSet.add('Web Development');
      if (/\b(mobile|android|ios|flutter)\b/i.test(blob)) domainSet.add('Mobile Development');
      if (/\b(blockchain|web3|ethereum|solidity|crypto)\b/i.test(blob)) domainSet.add('Blockchain');
      if (/\b(cloud|aws|azure|gcp)\b/i.test(blob)) domainSet.add('Cloud');
      if (/\b(cyber|security|ctf|hacking)\b/i.test(blob)) domainSet.add('Cybersecurity');
      if (domainSet.size === 0) domainSet.add('Other');

      let status: 'Registration Open' | 'Closed' = 'Registration Open';
      if (eventEndDate && eventEndDate < now) {
        status = 'Closed';
      }

      const locationDetails = normalizeLocationDetails(location, mode);

      return {
        externalId: stableId,
        title,
        description,
        organizer,
        location,
        locationDetails,
        mode,
        registrationDeadline,
        eventDate,
        eventStartDate,
        eventEndDate,
        registrationFeeType: 'free',
        registrationFee: 0,
        currency: 'USD',
        eligibilityType: item.college ? 'college_students' : 'open_to_everyone',
        eligibilityText: item.college ? 'College Students' : 'Open to Everyone',
        domains: Array.from(domainSet),
        image: item.cover_image || item.thumbnail || undefined,
        officialUrl: cleanUrl,
        canonicalUrl: cleanUrl,
        tags: Array.from(tagSet),
        status,
        sourceProvider: 'hackerearth',
      };
    } catch (err: any) {
      console.warn(`[HackerEarthProvider] Error normalizing item: ${err.message}`);
      return null;
    }
  }
}
