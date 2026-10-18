import { ExternalHackathonProvider, ExternalHackathonInput } from './ExternalHackathonProvider';

export class CuratedFeedProvider implements ExternalHackathonProvider {
  name = 'CuratedGlobalFeed';

  isEnabled(): boolean {
    return false; // Disabled - static mock data removed
  }

  async fetchHackathons(): Promise<ExternalHackathonInput[]> {
    const now = Date.now();
    return [
      {
        externalId: 'ext-google-cloud-genai-2026',
        title: 'Google Cloud GenAI Global Hackathon 2026',
        description: 'Build futuristic multimodal AI agents and generative solutions using Gemini 1.5 Pro and Vertex AI.',
        organizer: 'Google Cloud & Devpost',
        location: 'Global (Online)',
        mode: 'Online',
        registrationDeadline: new Date(now + 30 * 24 * 60 * 60 * 1000),
        eventDate: new Date(now + 45 * 24 * 60 * 60 * 1000),
        eventStartDate: new Date(now + 45 * 24 * 60 * 60 * 1000),
        eventEndDate: new Date(now + 45 * 24 * 60 * 60 * 1000),
        prize: 50000,
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
        officialUrl: 'https://googlecloud.devpost.com',
        tags: ['AI/ML', 'Google Cloud', 'Python', 'Generative AI'],
        status: 'Registration Open',
      },
      {
        externalId: 'ext-ethglobal-ethsf-2026',
        title: 'ETHGlobal San Francisco 2026',
        description: 'The world’s flagship Ethereum hackathon bringing together top Web3 developers, researchers, and protocols.',
        organizer: 'ETHGlobal',
        location: 'San Francisco, CA',
        mode: 'Hybrid',
        registrationDeadline: new Date(now + 20 * 24 * 60 * 60 * 1000),
        eventDate: new Date(now + 35 * 24 * 60 * 60 * 1000),
        prize: 125000,
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
        officialUrl: 'https://ethglobal.com',
        tags: ['Web3', 'Blockchain', 'Solidity', 'Smart Contracts'],
        status: 'Registration Open',
      },
      {
        externalId: 'ext-mlh-global-hack-week-2026',
        title: 'MLH Global Hack Week 2026',
        description: 'Major League Hacking week-long global builder celebration with workshops, mini-challenges, and prizes.',
        organizer: 'Major League Hacking (MLH)',
        location: 'Online',
        mode: 'Online',
        registrationDeadline: new Date(now + 14 * 24 * 60 * 60 * 1000),
        eventDate: new Date(now + 21 * 24 * 60 * 60 * 1000),
        prize: 15000,
        image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
        officialUrl: 'https://globalhackweek.mlh.io',
        tags: ['Beginner Friendly', 'Open Source', 'Full Stack'],
        status: 'Registration Open',
      },
      {
        externalId: 'ext-hackmit-2026',
        title: 'HackMIT 2026 Flagship Hackathon',
        description: 'MIT’s premiere annual student hackathon welcoming 1,000+ innovators to build breakthrough technology.',
        organizer: 'MIT Technology Club',
        location: 'Cambridge, MA & Virtual',
        mode: 'Hybrid',
        registrationDeadline: new Date(now + 40 * 24 * 60 * 60 * 1000),
        eventDate: new Date(now + 60 * 24 * 60 * 60 * 1000),
        prize: 35000,
        image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
        officialUrl: 'https://hackmit.org',
        tags: ['Student', 'AI', 'Robotics', 'Web'],
        status: 'Upcoming',
      },
      {
        externalId: 'ext-devfolio-hackinout-2026',
        title: 'HackInOut Web3 & AI Summit 2026',
        description: 'Asia’s premier developer hackathon fostering innovative decentralized and artificial intelligence solutions.',
        organizer: 'Devfolio Community',
        location: 'Bengaluru, India',
        mode: 'Offline',
        registrationDeadline: new Date(now + 25 * 24 * 60 * 60 * 1000),
        eventDate: new Date(now + 40 * 24 * 60 * 60 * 1000),
        prize: 20000,
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
        officialUrl: 'https://devfolio.co',
        tags: ['Web3', 'AI', 'India', 'Hackathon'],
        status: 'Registration Open',
      },
      {
        externalId: 'ext-open-source-world-cup-2026',
        title: 'Global Open Source Championship 2026',
        description: 'Contribute to public goods and open source infrastructure to win bounties and developer recognition.',
        organizer: 'Open Source Initiative & GitHub',
        location: 'Global (Online)',
        mode: 'Online',
        registrationDeadline: new Date(now + 50 * 24 * 60 * 60 * 1000),
        eventDate: new Date(now + 70 * 24 * 60 * 60 * 1000),
        prize: 60000,
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
        officialUrl: 'https://github.com',
        tags: ['Open Source', 'GitHub', 'DevOps', 'TypeScript'],
        status: 'Registration Open',
      },
    ];
  }
}
