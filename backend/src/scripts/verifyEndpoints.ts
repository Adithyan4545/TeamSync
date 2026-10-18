import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function verifyEndpoints() {
  console.log('===========================================================');
  console.log('VERIFYING PROVIDER ENDPOINTS LIVE');
  console.log('===========================================================\n');

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  // 1. UNSTOP ENDPOINTS
  console.log('--- 1. UNSTOP API TEST ---');
  const unstopUrls = [
    'https://unstop.com/api/public/opportunity/search-new?opportunity=hackathons&per_page=25&page=1',
    'https://unstop.com/api/public/opportunity/search-new?opportunity=hackathons&per_page=25&page=1&status=open',
    'https://unstop.com/api/public/opportunity/search-new?opportunity=hackathons&per_page=25&page=1&filters=open',
  ];

  for (const url of unstopUrls) {
    try {
      const res = await fetch(url, { headers });
      console.log(`Unstop URL: ${url} -> Status: ${res.status}`);
      if (res.ok) {
        const json: any = await res.json();
        const data = json?.data?.data || json?.data || [];
        console.log(`   Items returned: ${data.length}`);
        if (data.length > 0) {
          const sample = data[0];
          console.log(`   Sample item keys: ${Object.keys(sample).join(', ')}`);
          console.log(`   Sample title: "${sample.title}" | start_date: ${sample.start_date} | end_date: ${sample.end_date} | regnRequirements.end_regn_datetime: ${sample.regnRequirements?.end_regn_datetime}`);
        }
      }
    } catch (e: any) {
      console.log(`   Error: ${e.message}`);
    }
  }

  // 2. DEVFOLIO ENDPOINTS
  console.log('\n--- 2. DEVFOLIO API TEST ---');
  const devfolioUrls = [
    'https://api.devfolio.co/api/hackathons?type=open&limit=25&page=1',
    'https://api.devfolio.co/api/hackathons?type=upcoming&limit=25&page=1',
    'https://api.devfolio.co/api/hackathons?type=application_open&limit=25&page=1',
  ];

  for (const url of devfolioUrls) {
    try {
      const res = await fetch(url, { headers });
      console.log(`Devfolio URL: ${url} -> Status: ${res.status}`);
      if (res.ok) {
        const json: any = await res.json();
        const data = json.result || json.data || [];
        console.log(`   Items returned: ${data.length}`);
        if (data.length > 0) {
          const sample = data[0];
          console.log(`   Sample title: "${sample.name || sample.title}" | starts_at: ${sample.starts_at} | ends_at: ${sample.ends_at} | reg_ends_at: ${sample.hackathon_setting?.reg_ends_at}`);
        }
      }
    } catch (e: any) {
      console.log(`   Error: ${e.message}`);
    }
  }

  // 3. HACKEREARTH ENDPOINTS
  console.log('\n--- 3. HACKEREARTH API TEST ---');
  const hackerearthUrls = [
    'https://www.hackerearth.com/chrome-extension/events/',
    'https://www.hackerearth.com/api/events/upcoming/?format=json',
    'https://www.hackerearth.com/api/events/upcoming/?status=upcoming',
  ];

  for (const url of hackerearthUrls) {
    try {
      const res = await fetch(url, { headers });
      console.log(`HackerEarth URL: ${url} -> Status: ${res.status}`);
      if (res.ok) {
        const json: any = await res.json();
        const data = json.response || json.events || (Array.isArray(json) ? json : []);
        const dataLength = Array.isArray(data) ? data.length : typeof data === 'object' ? Object.keys(data).length : 0;
        console.log(`   Items returned: ${dataLength}`);
        const items = Array.isArray(data) ? data : Object.values(data);
        if (items.length > 0) {
          const sample: any = items[0];
          console.log(`   Sample title: "${sample.title}" | start: ${sample.start_tz || sample.start_timestamp} | end: ${sample.end_tz || sample.end_timestamp}`);
        }
      }
    } catch (e: any) {
      console.log(`   Error: ${e.message}`);
    }
  }

  // 4. MLH TEST
  console.log('\n--- 4. MLH HTML TEST ---');
  const mlhUrls = [
    'https://mlh.io/seasons/2026/events',
    'https://mlh.io/seasons/2025/events',
  ];

  for (const url of mlhUrls) {
    try {
      const res = await fetch(url, { headers: { ...headers, Accept: 'text/html' } });
      console.log(`MLH URL: ${url} -> Status: ${res.status}`);
      if (res.ok) {
        const html = await res.text();
        const eventBlocks = html.split(/itemType="https?:\/\/schema\.org\/Event"/gi).slice(1);
        console.log(`   Event blocks found in HTML: ${eventBlocks.length}`);
        if (eventBlocks.length > 0) {
          const sample = eventBlocks[0];
          const nameMatch = sample.match(/itemProp="name"\s*content="([^"]+)"/i) || sample.match(/utm_content=([^"&]+)/i);
          const startDateMatch = sample.match(/itemProp="startDate"\s*content="([^"]+)"/i);
          const endDateMatch = sample.match(/itemProp="endDate"\s*content="([^"]+)"/i);
          console.log(`   Sample title: "${nameMatch ? nameMatch[1] : 'Unknown'}" | startDate: ${startDateMatch ? startDateMatch[1] : 'N/A'} | endDate: ${endDateMatch ? endDateMatch[1] : 'N/A'}`);
        }
      }
    } catch (e: any) {
      console.log(`   Error: ${e.message}`);
    }
  }
}

verifyEndpoints().catch(console.error);
