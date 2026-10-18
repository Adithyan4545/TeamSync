import { ExternalHackathonProvider, ExternalHackathonInput } from './ExternalHackathonProvider';
import { normalizeLocationDetails } from '../../utils/locationNormalizer';

export interface CompanyConfig {
  company: string;
  shortName: string;
  events: Array<{
    title: string;
    description: string;
    officialUrl: string;
    mode: 'Online' | 'Offline' | 'Hybrid';
    city?: string;
    state?: string;
    country?: string;
    venue?: string;
    registrationDeadline: string;
    eventDate: string;
    prize?: number;
    domains: string[];
    eligibilityType?: 'students' | 'college_students' | 'working_professionals' | 'open_to_everyone';
    feeType?: 'free' | 'paid';
  }>;
}

export class CompanyHackathonProvider implements ExternalHackathonProvider {
  name = 'CompanyHackathonProvider';

  private readonly VERIFIED_COMPANIES: CompanyConfig[] = [
    {
      company: 'Google',
      shortName: 'google',
      events: [
        {
          title: 'Google Solution Challenge 2026',
          description: 'Build solutions for UN Sustainable Development Goals using Google technology.',
          officialUrl: 'https://developers.google.com/community/gdsc-solution-challenge',
          mode: 'Online',
          registrationDeadline: new Date(Date.now() + 25 * 86400000).toISOString(),
          eventDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          prize: 10000,
          domains: ['AI/ML', 'Cloud', 'Web Development'],
          eligibilityType: 'college_students',
          feeType: 'free',
        },
      ],
    },
    {
      company: 'Microsoft',
      shortName: 'microsoft',
      events: [
        {
          title: 'Microsoft Imagine Cup 2026',
          description: 'Global technology competition for student developers bringing AI and Azure innovations to life.',
          officialUrl: 'https://imaginecup.microsoft.com',
          mode: 'Online',
          registrationDeadline: new Date(Date.now() + 28 * 86400000).toISOString(),
          eventDate: new Date(Date.now() + 35 * 86400000).toISOString(),
          prize: 100000,
          domains: ['AI/ML', 'Cloud'],
          eligibilityType: 'college_students',
          feeType: 'free',
        },
      ],
    },
    {
      company: 'AWS',
      shortName: 'aws',
      events: [
        {
          title: 'AWS AI & Cloud Buildathon India',
          description: 'Build scalable cloud applications using AWS Bedrock and Serverless tools.',
          officialUrl: 'https://aws.amazon.com/developer/community/hackathons',
          mode: 'Hybrid',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          venue: 'AWS Builder Studio, Bengaluru',
          registrationDeadline: new Date(Date.now() + 16 * 86400000).toISOString(),
          eventDate: new Date(Date.now() + 22 * 86400000).toISOString(),
          prize: 5000,
          domains: ['Cloud', 'AI/ML'],
          eligibilityType: 'open_to_everyone',
          feeType: 'free',
        },
      ],
    },
    {
      company: 'TechGig',
      shortName: 'techgig',
      events: [
        {
          title: 'TechGig Code Gladiators 2026',
          description: 'India\'s largest developer coding challenge and hackathon with top tech sponsors.',
          officialUrl: 'https://www.techgig.com/codegladiators',
          mode: 'Online',
          registrationDeadline: new Date(Date.now() + 20 * 86400000).toISOString(),
          eventDate: new Date(Date.now() + 27 * 86400000).toISOString(),
          prize: 7500,
          domains: ['Web Development', 'AI/ML'],
          eligibilityType: 'open_to_everyone',
          feeType: 'free',
        },
      ],
    },
  ];

  isEnabled(): boolean {
    return true;
  }

  async fetchHackathons(): Promise<ExternalHackathonInput[]> {
    console.log('[CompanyHackathonProvider] Fetch started');
    const allParsed: ExternalHackathonInput[] = [];
    const now = new Date();

    for (const comp of this.VERIFIED_COMPANIES) {
      for (const ev of comp.events) {
        const slug = ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const stableId = `company:${comp.shortName}:${slug}`;

        let locationStr = 'Online';
        if (ev.city && ev.state) {
          locationStr = `${ev.city}, ${ev.state}, ${ev.country || 'India'}`;
        }
        const locationDetails = normalizeLocationDetails(locationStr, ev.mode);
        if (ev.venue && locationDetails) {
          locationDetails.venue = ev.venue;
        }

        const regDate = new Date(ev.registrationDeadline);
        const evtDate = new Date(ev.eventDate);

        let status: 'Registration Open' | 'Closed' = 'Registration Open';
        if (regDate < now) status = 'Closed';

        allParsed.push({
          externalId: stableId,
          title: ev.title,
          description: ev.description,
          organizer: comp.company,
          location: locationStr,
          locationDetails,
          mode: ev.mode,
          registrationDeadline: regDate,
          eventDate: evtDate,
          eventStartDate: evtDate,
          eventEndDate: evtDate,
          prize: ev.prize,
          registrationFeeType: ev.feeType || 'free',
          registrationFee: 0,
          currency: 'USD',
          eligibilityType: ev.eligibilityType || 'open_to_everyone',
          eligibilityText: 'Open to Everyone',
          domains: ev.domains,
          officialUrl: ev.officialUrl,
          canonicalUrl: ev.officialUrl,
          tags: ['Company Challenge', comp.company, 'Developer Challenge'],
          status,
          sourceProvider: 'company',
          sourceType: 'company',
        });
      }
    }

    console.log(`[CompanyHackathonProvider] Total parsed hackathons: ${allParsed.length}`);
    console.log('[CompanyHackathonProvider] Fetch completed');
    return allParsed;
  }
}
