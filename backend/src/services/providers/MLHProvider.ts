import { ExternalHackathonProvider, ExternalHackathonInput } from './ExternalHackathonProvider';
import { normalizeLocationDetails } from '../../utils/locationNormalizer';

export class MLHProvider implements ExternalHackathonProvider {
  name = 'MLHProvider';

  private readonly SEASONS = ['2026', '2025'];

  isEnabled(): boolean {
    return true;
  }

  async fetchHackathons(): Promise<ExternalHackathonInput[]> {
    console.log('[MLHProvider] Fetch started');
    const allParsed: ExternalHackathonInput[] = [];
    const seenExternalIds = new Set<string>();

    for (const season of this.SEASONS) {
      const pageUrl = `https://mlh.io/seasons/${season}/events`;
      console.log(`[MLHProvider] Fetching MLH Season ${season} events...`);

      try {
        const response = await this.fetchWithRetry(pageUrl, 3, 1000);
        if (!response.ok) {
          console.warn(`[MLHProvider] Season ${season} returned HTTP ${response.status}`);
          continue;
        }

        const html = await response.text();
        const parsed = this.parseMlhHtml(html);
        console.log(`[MLHProvider] Season ${season}: Found ${parsed.length} events.`);

        for (const item of parsed) {
          if (item && !seenExternalIds.has(item.externalId)) {
            seenExternalIds.add(item.externalId);
            allParsed.push(item);
          }
        }
      } catch (err: any) {
        console.error(`❌ [MLHProvider] Error fetching Season ${season}: ${err.message}`);
      }
    }

    console.log(`[MLHProvider] Total parsed hackathons: ${allParsed.length}`);
    console.log('[MLHProvider] Fetch completed');
    return allParsed;
  }

  private async fetchWithRetry(url: string, retries: number, delayMs: number): Promise<Response> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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

  private parseMlhHtml(html: string): ExternalHackathonInput[] {
    const results: ExternalHackathonInput[] = [];
    const now = new Date();

    const blocks = html.split(/itemType="https?:\/\/schema\.org\/Event"/gi).slice(1);

    for (const block of blocks) {
      try {
        const urlMatch = block.match(/itemProp="url"\s*content="([^"]+)"/i) || block.match(/href="([^"]+)"/i);
        const startDateMatch = block.match(/itemProp="startDate"\s*content="([^"]+)"/i);
        const endDateMatch = block.match(/itemProp="endDate"\s*content="([^"]+)"/i);
        const imageMatch = block.match(/itemProp="image"\s*content="([^"]+)"/i);
        const modeMatch = block.match(/itemProp="eventAttendanceMode"\s*content="([^"]+)"/i);

        let officialUrl = urlMatch ? urlMatch[1] : '';
        if (officialUrl.includes('utm_source')) {
          officialUrl = officialUrl.split('?')[0];
        }
        if (!officialUrl) continue;

        // Title from utm_content or html block
        let title = '';
        const utmContentMatch = block.match(/utm_content=([^"&]+)/i);
        if (utmContentMatch) {
          title = decodeURIComponent(utmContentMatch[1].replace(/\+/g, ' '));
        }

        if (!title) {
          const nameMatch = block.match(/itemProp="name"\s*content="([^"]+)"/i);
          if (nameMatch) title = nameMatch[1];
        }

        if (!title) continue;

        // Stable ID
        const slug = officialUrl.replace(/^https?:\/\//, '').replace(/[/?#]/g, '-');
        const stableId = `mlh:${slug}`;

        const startDate = startDateMatch ? new Date(startDateMatch[1]) : undefined;
        const endDate = endDateMatch ? new Date(endDateMatch[1]) : undefined;

        const mode: 'Online' | 'Offline' | 'Hybrid' = modeMatch && modeMatch[1].includes('Online') ? 'Online' : 'Offline';

        let status: 'Registration Open' | 'Closed' = 'Registration Open';
        if (endDate && endDate < now) {
          status = 'Closed';
        } else if (startDate && startDate < now) {
          status = 'Closed';
        }

        const domainSet = new Set<string>();
        const blob = title.toLowerCase();
        if (/\b(ai|ml|genai|gpt|machine learning)\b/i.test(blob)) domainSet.add('AI/ML');
        if (/\b(web|hacks|code)\b/i.test(blob)) domainSet.add('Web Development');
        if (domainSet.size === 0) domainSet.add('Other');

        const locationStr = mode === 'Online' ? 'Online' : 'Global / MLH Member Campus';
        const locationDetails = normalizeLocationDetails(locationStr, mode);

        results.push({
          externalId: stableId,
          title,
          description: `Official MLH Member Hackathon: ${title}`,
          organizer: 'Major League Hacking (MLH)',
          location: locationStr,
          locationDetails,
          mode,
          registrationDeadline: undefined, // Follow strict rule: do not fallback to event start date
          eventDate: startDate,
          eventStartDate: startDate,
          eventEndDate: endDate,
          registrationFeeType: 'free',
          registrationFee: 0,
          currency: 'USD',
          eligibilityType: 'open_to_everyone',
          eligibilityText: 'Students & Developers',
          domains: Array.from(domainSet),
          image: imageMatch ? imageMatch[1] : undefined,
          officialUrl,
          canonicalUrl: officialUrl,
          tags: ['MLH', 'Official', 'Hackathon'],
          status,
          sourceProvider: 'mlh',
        });
      } catch (err: any) {
        console.warn(`[MLHProvider] Error parsing block: ${err.message}`);
      }
    }

    return results;
  }
}
