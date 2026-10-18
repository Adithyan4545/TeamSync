import { ExternalHackathonProvider, ExternalHackathonInput } from './ExternalHackathonProvider';

export class RSSProvider implements ExternalHackathonProvider {
  name = 'RSSFeedProvider';

  isEnabled(): boolean {
    return Boolean(process.env.HACKATHON_RSS_FEED_URL);
  }

  async fetchHackathons(): Promise<ExternalHackathonInput[]> {
    const rssUrl = process.env.HACKATHON_RSS_FEED_URL;
    if (!rssUrl) return [];

    try {
      const response = await fetch(rssUrl);
      if (!response.ok) {
        throw new Error(`RSS feed returned status ${response.status}`);
      }
      const text = await response.text();
      // Basic RSS item extraction
      const items: ExternalHackathonInput[] = [];
      const itemRegex = /<item>([\s+S]*?)<\/item>/gi;
      let match: RegExpExecArray | null;

      while ((match = itemRegex.exec(text)) !== null) {
        const itemXml = match[1];
        const title = itemXml.match(/<title>(.*?)<\/title>/i)?.[1] || 'External Event';
        const link = itemXml.match(/<link>(.*?)<\/link>/i)?.[1] || rssUrl;
        const description = itemXml.match(/<description>(.*?)<\/description>/i)?.[1]?.replace(/<[^>]+>/g, '') || '';
        const pubDateStr = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1];
        const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

        items.push({
          externalId: `rss-${Buffer.from(link).toString('hex').slice(0, 16)}`,
          title,
          description,
          organizer: 'RSS Feed Partner',
          mode: 'Online',
          registrationDeadline: new Date(pubDate.getTime() + 14 * 24 * 60 * 60 * 1000),
          eventDate: new Date(pubDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          officialUrl: link,
          tags: ['RSS', 'Hackathon'],
          status: 'Registration Open',
        });
      }

      return items;
    } catch (err: any) {
      console.warn(`⚠️ [RSSProvider] Ingestion failed: ${err.message}`);
      return [];
    }
  }
}
