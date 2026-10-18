import { ExternalHackathonProvider, ExternalHackathonInput } from './ExternalHackathonProvider';
import { normalizeLocationDetails } from '../../utils/locationNormalizer';

export class UnstopProvider implements ExternalHackathonProvider {
  name = 'UnstopProvider';

  private readonly BASE_API_URL = 'https://unstop.com/api/public/opportunity/search-new?opportunity=hackathons&per_page=25';

  isEnabled(): boolean {
    return true; // Enabled as live production external hackathon provider
  }

  async fetchHackathons(): Promise<ExternalHackathonInput[]> {
    console.log('[UnstopProvider] Fetch started');
    const maxPages = Number(process.env.HACKATHON_MAX_PAGES || process.env.UNSTOP_MAX_PAGES) || 20;
    const allParsed: ExternalHackathonInput[] = [];
    const seenExternalIds = new Set<string>();

    let totalDiscovered = 0;

    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = `${this.BASE_API_URL}&page=${page}`;
      console.log(`[UnstopProvider] Requesting Page ${page} of max ${maxPages}...`);

      try {
        const response = await this.fetchWithRetry(pageUrl, 3, 1000);
        console.log(`[UnstopProvider] Response received for page ${page}`);

        if (!response.ok) {
          if (response.status === 403) {
            console.warn('[UnstopProvider] Access blocked: 403. Stopping further pagination.');
            break;
          }
          if (response.status === 429) {
            console.warn('[UnstopProvider] Rate limited: 429. Stopping further pagination.');
            break;
          }
          console.warn(`[UnstopProvider] HTTP Error on page ${page}: ${response.status} ${response.statusText}`);
          break;
        }

        const data: any = await response.json();
        const rawListings = data?.data?.data || (Array.isArray(data?.data) ? data.data : []);
        const lastPage = data?.data?.last_page || data?.last_page || maxPages;

        if (!Array.isArray(rawListings) || rawListings.length === 0) {
          console.log(`[UnstopProvider] Page ${page} returned 0 listings. Stopping pagination early.`);
          break;
        }

        totalDiscovered += rawListings.length;
        console.log(`[UnstopProvider] Page ${page}: Found ${rawListings.length} listings (Total discovered so far: ${totalDiscovered})`);

        let pageParsedCount = 0;
        for (const item of rawListings) {
          if (!item || !item.id || !item.title) continue;

          const normalized = this.normalizeUnstopItem(item);
          if (normalized && !seenExternalIds.has(normalized.externalId)) {
            seenExternalIds.add(normalized.externalId);
            allParsed.push(normalized);
            pageParsedCount++;
          }
        }

        console.log(`[UnstopProvider] Page ${page}: Parsed ${pageParsedCount} new unique hackathons.`);

        if (page >= lastPage) {
          console.log(`[UnstopProvider] Reached last available page (${lastPage}). Stopping pagination.`);
          break;
        }

        // Respectful delay between page fetches
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err: any) {
        console.error(`❌ [UnstopProvider] Error fetching page ${page}: ${err.message || err}`);
        break;
      }
    }

    console.log(`[UnstopProvider] Total parsed & deduplicated hackathons across pages: ${allParsed.length}`);
    console.log('[UnstopProvider] Fetch completed');

    return allParsed;
  }

  private async fetchWithRetry(url: string, retries: number, delayMs: number): Promise<Response> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://unstop.com/hackathons',
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.status === 429 && attempt < retries) {
          console.warn(`[UnstopProvider] Rate limited (429). Retrying in ${delayMs * attempt}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
          continue;
        }

        return res;
      } catch (err: any) {
        if (attempt === retries) throw err;
        console.warn(`[UnstopProvider] Attempt ${attempt} failed: ${err.message}. Retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }

    throw new Error('All retry attempts failed');
  }

  private normalizeUnstopItem(item: any): ExternalHackathonInput | null {
    try {
      const stableId = item.id ? `unstop:${item.id}` : `unstop:${item.short_id || item.title.toLowerCase().replace(/\s+/g, '-')}`;

      // Clean HTML from details
      const rawDescription = item.details || item.seo_details?.description || item.title || '';
      const cleanDescription = rawDescription
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Organizer
      const organizer = item.organisation?.name || item.company?.name || 'Unstop Host';

      // Dates — Accurate extraction
      const now = new Date();
      
      const rawRegDeadline = item.regnRequirements?.end_regn_datetime || item.regnRequirements?.end_regn_date;
      const rawEventStart = item.start_date;
      const rawEventEnd = item.end_date;

      const registrationDeadline = rawRegDeadline ? new Date(rawRegDeadline) : undefined;
      const eventStartDate = rawEventStart ? new Date(rawEventStart) : undefined;
      const eventEndDate = rawEventEnd ? new Date(rawEventEnd) : undefined;
      const eventDate = eventStartDate; // Keep for backward compatibility

      // Mode & Location
      const regionStr = (item.region || '').toLowerCase();
      let mode: 'Online' | 'Offline' | 'Hybrid' = 'Online';
      if (regionStr.includes('offline')) {
        mode = 'Offline';
      } else if (regionStr.includes('hybrid')) {
        mode = 'Hybrid';
      } else {
        mode = 'Online';
      }

      let location = 'Online';
      if (typeof item.address_with_country_logo === 'string' && item.address_with_country_logo) {
        location = item.address_with_country_logo;
      } else if (item.address_with_country_logo && typeof item.address_with_country_logo === 'object') {
        location = item.address_with_country_logo.name || item.address_with_country_logo.city || item.address_with_country_logo.address || item.region || 'Online';
      } else if (Array.isArray(item.locations) && item.locations.length > 0) {
        const locNames = item.locations.map((l: any) => (typeof l === 'string' ? l : l.city || l.name || l.country)).filter(Boolean);
        if (locNames.length > 0) location = locNames.join(', ');
      } else if (typeof item.region === 'string' && item.region) {
        location = item.region.charAt(0).toUpperCase() + item.region.slice(1);
      }

      // Prize
      let prize: number | undefined = undefined;
      if (Array.isArray(item.prizes) && item.prizes.length > 0) {
        const totalCash = item.prizes.reduce((sum: number, p: any) => sum + (Number(p.cash) || 0), 0);
        if (totalCash > 0) {
          prize = totalCash;
        }
      }

      // Registration Fee Extraction
      let registrationFeeType: 'free' | 'paid' | 'unknown' = 'unknown';
      let registrationFee: number | null = null;
      let currency: string | null = 'INR';

      if (item.isPaid === 0 || item.isPaid === false) {
        registrationFeeType = 'free';
        registrationFee = 0;
      } else if (item.isPaid === 1 || item.isPaid === true) {
        registrationFeeType = 'paid';
        const feeNum = Number(item.regnRequirements?.fee || item.fee || item.price);
        registrationFee = !isNaN(feeNum) && feeNum > 0 ? feeNum : null;
      } else {
        const descLower = cleanDescription.toLowerCase();
        if (descLower.includes('free registration') || descLower.includes('no registration fee') || descLower.includes('free entry')) {
          registrationFeeType = 'free';
          registrationFee = 0;
        } else {
          registrationFeeType = 'unknown';
        }
      }

      // Tags & Required Skills
      const tagSet = new Set<string>();
      tagSet.add('Unstop');
      tagSet.add('Hackathon');

      if (Array.isArray(item.tags)) {
        item.tags.forEach((t: any) => {
          const name = typeof t === 'string' ? t : t.name;
          if (name) tagSet.add(name);
        });
      }

      if (Array.isArray(item.required_skills)) {
        item.required_skills.forEach((s: any) => {
          const skillName = typeof s === 'string' ? s : s.skill_name || s.skill;
          if (skillName) tagSet.add(skillName);
        });
      }

      const tags = Array.from(tagSet);

      // Extract Eligibility
      const { eligibilityType, eligibilityText } = this.extractEligibility(item, cleanDescription);

      // Extract Controlled Domains
      const domains = this.extractDomains(item, tags, item.title);

      // Image
      const image =
        item.banner_mobile?.image_url ||
        item.logoUrl2 ||
        item.organisation?.logoUrl2 ||
        item.thumb ||
        undefined;

      // Official Link
      let officialUrl = 'https://unstop.com/hackathons';
      if (item.seo_url) {
        officialUrl = item.seo_url;
      } else if (item.public_url) {
        officialUrl = item.public_url.startsWith('http') ? item.public_url : `https://unstop.com/${item.public_url}`;
      }

      // Status Calculation
      let status: 'Registration Open' | 'Closed' = 'Registration Open';
      if (registrationDeadline && registrationDeadline < now) {
        status = 'Closed';
      }

      const locationDetails = normalizeLocationDetails(
        item.address_with_country_logo || item.locations || location,
        mode
      );

      return {
        externalId: stableId,
        title: item.title,
        description: cleanDescription,
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
        currency,
        eligibilityType,
        eligibilityText,
        domains,
        image,
        officialUrl,
        canonicalUrl: officialUrl,
        tags,
        status,
        sourceProvider: 'unstop',
      };
    } catch (err: any) {
      console.warn(`[UnstopProvider] Error normalizing item ${item?.id}: ${err.message}`);
      return null;
    }
  }

  private extractEligibility(item: any, cleanDescription: string): {
    eligibilityType: 'students' | 'college_students' | 'working_professionals' | 'open_to_everyone' | 'unknown';
    eligibilityText: string | null;
  } {
    const rawText = item.regnRequirements?.eligibility || item.eligibility || item.filters?.eligibility || item.job_detail?.eligibility || '';
    const textStr = typeof rawText === 'string' ? rawText.replace(/<[^>]+>/g, ' ').trim() : '';
    const combined = (textStr + ' ' + cleanDescription).toLowerCase();

    if (combined.includes('college student') || combined.includes('university student') || combined.includes('undergraduate') || combined.includes('postgraduate') || combined.includes('engineering student') || combined.includes('mba student')) {
      return { eligibilityType: 'college_students', eligibilityText: textStr || 'College & University Students' };
    }
    if (combined.includes('working professional') || combined.includes('experienced professional') || combined.includes('corporate employee')) {
      return { eligibilityType: 'working_professionals', eligibilityText: textStr || 'Working Professionals' };
    }
    if (combined.includes('school student') || combined.includes('k-12') || combined.includes('student')) {
      return { eligibilityType: 'students', eligibilityText: textStr || 'Students' };
    }
    if (combined.includes('open to all') || combined.includes('open to everyone') || combined.includes('anyone') || combined.includes('all developers') || combined.includes('public')) {
      return { eligibilityType: 'open_to_everyone', eligibilityText: textStr || 'Open to Everyone' };
    }

    return { eligibilityType: 'open_to_everyone', eligibilityText: textStr || 'Open to Everyone' };
  }

  private extractDomains(item: any, tags: string[], title: string): string[] {
    const domainSet = new Set<string>();

    // Generic tags/skills that should NOT trigger domain classification
    const genericTags = new Set([
      'unstop', 'hackathon', 'problem solving', 'innovation management', 'creativity',
      'adaptability', 'logical reasoning', 'benchmarking', 'communication skills',
      'teamwork and collaboration', 'teamwork', 'storytelling', 'design thinking',
      'audience engagement', 'presentation design', 'sdlc', 'software development life cycle',
      'ideation', 'proposal writing', 'analytical skills', 'critical thinking', 'mathematical skills',
      'agile methodologies (scrum)', 'agile', 'scrum', 'debugging tools', 'customer handling', 'negotiation'
    ]);

    const specificTags = tags.filter((t) => !genericTags.has(t.toLowerCase()));
    const classificationBlob = (specificTags.join(' ') + ' ' + title).trim();

    // 1. AI/ML
    if (/\b(Artificial Intelligence|AI|Machine Learning|ML|Deep Learning|Generative AI|LLM|Large Language Model|NLP|Natural Language Processing|Computer Vision)\b/i.test(classificationBlob)) {
      domainSet.add('AI/ML');
    }

    // 2. Web Development
    if (/\b(HTML|CSS|JavaScript|React|Angular|Vue|Next\.js|Node\.js|Express|Web Development|Full Stack|Frontend|Backend)\b/i.test(classificationBlob)) {
      domainSet.add('Web Development');
    }

    // 3. Mobile Development
    if (/\b(Android|iOS|Flutter|React Native|Kotlin|Swift|Mobile Development|Mobile App)\b/i.test(classificationBlob)) {
      domainSet.add('Mobile Development');
    }

    // 4. Cloud
    if (/\b(AWS|Amazon Web Services|Google Cloud|GCP|Microsoft Azure|Azure|Cloud Computing|Cloud Architecture|\bCloud\b)\b/i.test(classificationBlob)) {
      domainSet.add('Cloud');
    }

    // 5. Cybersecurity
    if (/\b(Cyber Security|Cybersecurity|Information Security|Ethical Hacking|Penetration Testing|Network Security|SOC|Threat Detection|CTF|Capture The Flag|Bug Bounty)\b/i.test(classificationBlob)) {
      domainSet.add('Cybersecurity');
    }

    // 6. Blockchain
    if (/\b(Blockchain|Web3|Ethereum|Solidity|Smart Contracts|DeFi|NFT|Crypto)\b/i.test(classificationBlob)) {
      domainSet.add('Blockchain');
    }

    // 7. Data Science
    if (/\b(Data Science|Data Analysis|Data Analytics|Statistics|Data Visualization|Pandas|NumPy)\b/i.test(classificationBlob)) {
      domainSet.add('Data Science');
    }

    // 8. IoT
    if (/\b(Internet of Things|IoT|Embedded Systems|Sensors|Arduino|Raspberry Pi|ESP32)\b/i.test(classificationBlob)) {
      domainSet.add('IoT');
    }

    // 9. FinTech
    if (/\b(FinTech|Financial Technology|Banking Technology|Payments|Digital Payments|Insurance Technology|Trading Technology)\b/i.test(classificationBlob)) {
      domainSet.add('FinTech');
    }

    // 10. HealthTech
    if (/\b(HealthTech|Healthcare Technology|Medical Technology|MedTech|Digital Health|Clinical Technology)\b/i.test(classificationBlob)) {
      domainSet.add('HealthTech');
    }

    // 11. EdTech
    if (/\b(EdTech|Education Technology|Learning Technology|E-learning)\b/i.test(classificationBlob)) {
      domainSet.add('EdTech');
    }

    // 12. Open Source
    if (/\b(Open Source|Open Source Contribution)\b/i.test(classificationBlob)) {
      domainSet.add('Open Source');
    }

    // 13. AR/VR
    if (/\b(AR|VR|AR\/VR|Augmented Reality|Virtual Reality|Mixed Reality|Spatial Computing|Unity3D|Unreal Engine)\b/i.test(classificationBlob)) {
      domainSet.add('AR/VR');
    }

    // 14. Game Development
    if (/\b(Game Development|Game Design|Game Programming|Unity|Unreal Engine|Godot)\b/i.test(classificationBlob)) {
      domainSet.add('Game Development');
    }

    if (domainSet.size === 0) {
      domainSet.add('Other');
    }

    return Array.from(domainSet);
  }
}
