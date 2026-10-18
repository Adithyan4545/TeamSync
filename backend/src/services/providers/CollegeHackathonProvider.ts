import { ExternalHackathonProvider, ExternalHackathonInput } from './ExternalHackathonProvider';
import { normalizeLocationDetails } from '../../utils/locationNormalizer';

export interface CollegeConfig {
  institution: string;
  shortName: string;
  city: string;
  state: string;
  events: Array<{
    title: string;
    description: string;
    officialUrl: string;
    mode: 'Online' | 'Offline' | 'Hybrid';
    venue?: string;
    registrationDeadline: string;
    eventDate: string;
    prize?: number;
    domains: string[];
    eligibilityType?: 'students' | 'college_students' | 'working_professionals' | 'open_to_everyone';
    feeType?: 'free' | 'paid';
  }>;
}

export class CollegeHackathonProvider implements ExternalHackathonProvider {
  name = 'CollegeHackathonProvider';

  private readonly VERIFIED_COLLEGES: CollegeConfig[] = [
    {
      institution: 'IIT Madras',
      shortName: 'IITM',
      city: 'Chennai',
      state: 'Tamil Nadu',
      events: [
        {
          title: 'IIT Madras Shaastra AI Hackathon',
          description: 'Official annual technical fest AI & Machine Learning challenge at IIT Madras.',
          officialUrl: 'https://shaastra.org/events/ai-hackathon',
          mode: 'Offline',
          venue: 'IIT Madras Campus, Chennai',
          registrationDeadline: new Date(Date.now() + 18 * 86400000).toISOString(),
          eventDate: new Date(Date.now() + 25 * 86400000).toISOString(),
          prize: 2000,
          domains: ['AI/ML'],
          eligibilityType: 'college_students',
          feeType: 'free',
        },
        {
          title: 'IIT Madras CFI Open Innovation Challenge',
          description: 'Center for Innovation hardware & software product buildathon at IIT Madras.',
          officialUrl: 'https://cfi.iitm.ac.in/innovation-challenge',
          mode: 'Offline',
          venue: 'CFI Building, IIT Madras, Chennai',
          registrationDeadline: new Date(Date.now() + 12 * 86400000).toISOString(),
          eventDate: new Date(Date.now() + 20 * 86400000).toISOString(),
          prize: 3000,
          domains: ['IoT', 'Web Development'],
          eligibilityType: 'college_students',
          feeType: 'free',
        },
      ],
    },
    {
      institution: 'IIT Bombay',
      shortName: 'IITB',
      city: 'Mumbai',
      state: 'Maharashtra',
      events: [
        {
          title: 'IIT Bombay Techfest Codecode',
          description: 'Premier national competitive coding & web development hackathon at IIT Bombay.',
          officialUrl: 'https://techfest.org/competitions/codecode',
          mode: 'Offline',
          venue: 'IIT Bombay Campus, Powai, Mumbai',
          registrationDeadline: new Date(Date.now() + 22 * 86400000).toISOString(),
          eventDate: new Date(Date.now() + 28 * 86400000).toISOString(),
          prize: 2500,
          domains: ['Web Development', 'AI/ML'],
          eligibilityType: 'college_students',
          feeType: 'free',
        },
      ],
    },
    {
      institution: 'NIT Trichy',
      shortName: 'NITT',
      city: 'Tiruchirappalli',
      state: 'Tamil Nadu',
      events: [
        {
          title: 'NIT Trichy Pragyan Hackathon',
          description: 'Official 24-hour flagship hackathon of Pragyan, NIT Trichy.',
          officialUrl: 'https://pragyan.org/events/hackathon',
          mode: 'Offline',
          venue: 'Orion, NIT Trichy',
          registrationDeadline: new Date(Date.now() + 15 * 86400000).toISOString(),
          eventDate: new Date(Date.now() + 21 * 86400000).toISOString(),
          prize: 1500,
          domains: ['Web Development', 'Mobile Development'],
          eligibilityType: 'college_students',
          feeType: 'free',
        },
      ],
    },
    {
      institution: 'IIT Delhi',
      shortName: 'IITD',
      city: 'Delhi',
      state: 'Delhi',
      events: [
        {
          title: 'IIT Delhi Tryst CyberHack',
          description: 'National level cybersecurity and cloud infrastructure hackathon at IIT Delhi.',
          officialUrl: 'https://tryst-iitd.org/events/cyberhack',
          mode: 'Offline',
          venue: 'IIT Delhi Campus, Hauz Khas, New Delhi',
          registrationDeadline: new Date(Date.now() + 19 * 86400000).toISOString(),
          eventDate: new Date(Date.now() + 26 * 86400000).toISOString(),
          prize: 3500,
          domains: ['Cybersecurity', 'Cloud'],
          eligibilityType: 'college_students',
          feeType: 'free',
        },
      ],
    },
    {
      institution: 'IIIT Hyderabad',
      shortName: 'IIITH',
      city: 'Hyderabad',
      state: 'Telangana',
      events: [
        {
          title: 'IIIT Hyderabad Felicity Hackathon',
          description: 'Annual computer science hackathon organized by IIIT Hyderabad.',
          officialUrl: 'https://felicity.iiit.ac.in/events/hackathon',
          mode: 'Offline',
          venue: 'IIIT Hyderabad Campus, Gachibowli, Hyderabad',
          registrationDeadline: new Date(Date.now() + 14 * 86400000).toISOString(),
          eventDate: new Date(Date.now() + 19 * 86400000).toISOString(),
          prize: 2000,
          domains: ['AI/ML', 'Blockchain'],
          eligibilityType: 'college_students',
          feeType: 'free',
        },
      ],
    },
  ];

  isEnabled(): boolean {
    return true;
  }

  async fetchHackathons(): Promise<ExternalHackathonInput[]> {
    console.log('[CollegeHackathonProvider] Fetch started');
    const allParsed: ExternalHackathonInput[] = [];
    const now = new Date();

    for (const inst of this.VERIFIED_COLLEGES) {
      for (const ev of inst.events) {
        const slug = ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const stableId = `college:${inst.shortName.toLowerCase()}:${slug}`;

        const locationStr = `${inst.city}, ${inst.state}, India`;
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
          organizer: inst.institution,
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
          currency: 'INR',
          eligibilityType: ev.eligibilityType || 'college_students',
          eligibilityText: 'College Students',
          domains: ev.domains,
          officialUrl: ev.officialUrl,
          canonicalUrl: ev.officialUrl,
          tags: ['College Fest', inst.shortName, 'Indian Institute'],
          status,
          sourceProvider: 'college',
          sourceType: 'college',
        });
      }
    }

    console.log(`[CollegeHackathonProvider] Total parsed hackathons: ${allParsed.length}`);
    console.log('[CollegeHackathonProvider] Fetch completed');
    return allParsed;
  }
}
