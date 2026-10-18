import { ExternalHackathonProvider, ExternalHackathonInput } from './ExternalHackathonProvider';
import { normalizeLocationDetails } from '../../utils/locationNormalizer';

export class DevfolioProvider implements ExternalHackathonProvider {
  name = 'DevfolioProvider';

  private readonly BASE_API_URL = 'https://api.devfolio.co/api/hackathons?type=open';

  isEnabled(): boolean {
    return true;
  }

  async fetchHackathons(): Promise<ExternalHackathonInput[]> {
    console.log('[DevfolioProvider] Fetch started');
    const maxPages = Number(process.env.DEVFOLIO_MAX_PAGES) || 5;
    const allParsed: ExternalHackathonInput[] = [];
    const seenExternalIds = new Set<string>();

    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = `${this.BASE_API_URL}&page=${page}&limit=25`;
      console.log(`[DevfolioProvider] Requesting Page ${page}...`);

      try {
        const response = await this.fetchWithRetry(pageUrl, 3, 1000);
        if (!response.ok) {
          console.warn(`[DevfolioProvider] HTTP ${response.status} on page ${page}. Stopping pagination.`);
          break;
        }

        const data: any = await response.json();
        const items = data.result || data.data || [];
        if (!Array.isArray(items) || items.length === 0) {
          console.log(`[DevfolioProvider] Page ${page} returned 0 items. Stopping pagination.`);
          break;
        }

        let pageCount = 0;
        for (const item of items) {
          if (!item || (!item.uuid && !item.name && !item.slug)) continue;
          const normalized = this.normalizeDevfolioItem(item);
          if (normalized && !seenExternalIds.has(normalized.externalId)) {
            seenExternalIds.add(normalized.externalId);
            allParsed.push(normalized);
            pageCount++;
          }
        }

        console.log(`[DevfolioProvider] Page ${page}: Parsed ${pageCount} unique items.`);
        if (page >= (data.pages || maxPages)) break;

        await new Promise((res) => setTimeout(res, 300));
      } catch (err: any) {
        console.error(`❌ [DevfolioProvider] Error fetching page ${page}: ${err.message}`);
        break;
      }
    }

    console.log(`[DevfolioProvider] Total parsed hackathons: ${allParsed.length}`);
    console.log('[DevfolioProvider] Fetch completed');
    return allParsed;
  }

  private async fetchWithRetry(url: string, retries: number, delayMs: number): Promise<Response> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://devfolio.co/hackathons',
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

  private normalizeDevfolioItem(item: any): ExternalHackathonInput | null {
    try {
      const stableId = item.uuid
        ? `devfolio:${item.uuid}`
        : `devfolio:${item.slug || item.name.toLowerCase().replace(/\s+/g, '-')}`;

      const title = item.name || 'Devfolio Hackathon';
      const description = (item.desc || item.tagline || item.name || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const organizer = item.organizer?.name || item.setting?.organisation_name || 'Devfolio Host';

      const now = new Date();
      const rawRegDeadline = item.hackathon_setting?.reg_ends_at;
      const rawEventStart = item.starts_at || item.hackathon_setting?.starts_at;
      const rawEventEnd = item.ends_at || item.hackathon_setting?.ends_at;

      const registrationDeadline = rawRegDeadline ? new Date(rawRegDeadline) : undefined;
      const eventStartDate = rawEventStart ? new Date(rawEventStart) : undefined;
      const eventEndDate = rawEventEnd ? new Date(rawEventEnd) : undefined;
      const eventDate = eventStartDate;

      const mode: 'Online' | 'Offline' | 'Hybrid' = item.is_online
        ? 'Online'
        : item.hackathon_setting?.is_hybrid
        ? 'Hybrid'
        : 'Offline';

      const location = item.location || (mode === 'Online' ? 'Online' : item.city ? `${item.city}, ${item.country || ''}` : 'Offline');

      let prize: number | undefined = undefined;
      if (Array.isArray(item.prizes) && item.prizes.length > 0) {
        const total = item.prizes.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
        if (total > 0) prize = total;
      }

      const registrationFeeType: 'free' | 'paid' | 'unknown' = item.hackathon_setting?.paid ? 'paid' : 'free';
      const registrationFee = registrationFeeType === 'free' ? 0 : null;

      const tagSet = new Set<string>(['Devfolio', 'Hackathon']);
      if (Array.isArray(item.themes)) {
        item.themes.forEach((t: any) => {
          if (t.name) tagSet.add(t.name);
        });
      }
      const tags = Array.from(tagSet);

      const domainSet = new Set<string>();
      const blob = (title + ' ' + description + ' ' + tags.join(' ')).toLowerCase();

      if (/\b(ai|ml|machine learning|artificial intelligence|llm|deep learning)\b/i.test(blob)) domainSet.add('AI/ML');
      if (/\b(web|frontend|backend|fullstack|react|node|javascript)\b/i.test(blob)) domainSet.add('Web Development');
      if (/\b(mobile|android|ios|flutter|react native)\b/i.test(blob)) domainSet.add('Mobile Development');
      if (/\b(blockchain|web3|solidity|ethereum|crypto|nft|defi)\b/i.test(blob)) domainSet.add('Blockchain');
      if (/\b(cloud|aws|gcp|azure)\b/i.test(blob)) domainSet.add('Cloud');
      if (/\b(security|cybersecurity|ctf|hacking)\b/i.test(blob)) domainSet.add('Cybersecurity');
      if (domainSet.size === 0) domainSet.add('Other');

      const subdomain = item.hackathon_setting?.subdomain || item.slug || item.uuid;
      const officialUrl = subdomain ? `https://${subdomain}.devfolio.co` : 'https://devfolio.co/hackathons';
      const image = item.cover_img || item.hackathon_setting?.logo || item.favicon || undefined;

      let status: 'Registration Open' | 'Closed' = 'Registration Open';
      if (registrationDeadline && registrationDeadline < now) {
        status = 'Closed';
      } else if (item.ends_at && new Date(item.ends_at) < now) {
        status = 'Closed';
      }

      const locationDetails = normalizeLocationDetails(
        item.city ? `${item.city}, ${item.country || 'India'}` : location,
        mode
      );

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
        prize,
        registrationFeeType,
        registrationFee,
        currency: 'USD',
        eligibilityType: item.is_university_hackathon ? 'college_students' : 'open_to_everyone',
        eligibilityText: item.is_university_hackathon ? 'University Students' : 'Open to Everyone',
        domains: Array.from(domainSet),
        image,
        officialUrl,
        canonicalUrl: officialUrl,
        tags,
        status,
        sourceProvider: 'devfolio',
      };
    } catch (err: any) {
      console.warn(`[DevfolioProvider] Error normalizing item: ${err.message}`);
      return null;
    }
  }
}
