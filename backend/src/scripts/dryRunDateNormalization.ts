import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function dryRun() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  console.log(`Current Time (now): ${now.toISOString()}`);
  console.log(`35-Day Window End: ${windowEnd.toISOString()}\n`);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
  };

  // 1. UNSTOP DRY RUN
  console.log('--- UNSTOP DRY RUN ---');
  let unstop35 = 0;
  let unstopOpen = 0;

  for (let page = 1; page <= 5; page++) {
    const url = `https://unstop.com/api/public/opportunity/search-new?opportunity=hackathons&per_page=25&page=${page}`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data: any = await res.json();
      const items = data?.data?.data || [];
      for (const item of items) {
        // Unstop registration deadline is item.end_date or item.regnRequirements?.end_regn_datetime
        const deadlineStr = item.end_date || item.regnRequirements?.end_regn_datetime;
        const regDeadline = deadlineStr ? new Date(deadlineStr) : null;
        const startStr = item.start_date;
        const startDate = startStr ? new Date(startStr) : null;

        const isRegOpen = regDeadline ? regDeadline >= now : true;
        const isEventCompleted = regDeadline ? regDeadline < now : false;

        if (isRegOpen && !isEventCompleted) {
          unstopOpen++;
          if (regDeadline && regDeadline >= now && regDeadline <= windowEnd) {
            unstop35++;
          }
        }
      }
    }
  }
  console.log(`Unstop (first 5 pages): Currently Open = ${unstopOpen}, 35-Day Eligible = ${unstop35}`);

  // 2. DEVFOLIO DRY RUN
  console.log('\n--- DEVFOLIO DRY RUN ---');
  let devfolio35 = 0;
  let devfolioOpen = 0;

  const devfolioRes = await fetch('https://api.devfolio.co/api/hackathons?type=open&limit=25&page=1', { headers });
  if (devfolioRes.ok) {
    const data: any = await devfolioRes.json();
    const items = data.result || [];
    for (const item of items) {
      const regEnds = item.hackathon_setting?.reg_ends_at || item.ends_at;
      const starts = item.starts_at;
      const ends = item.ends_at;

      const regDeadline = regEnds ? new Date(regEnds) : null;
      const eventStart = starts ? new Date(starts) : null;
      const eventEnd = ends ? new Date(ends) : null;

      const isRegClosed = regDeadline ? regDeadline < now : false;
      const isEventCompleted = eventEnd ? eventEnd < now : false;

      if (!isRegClosed && !isEventCompleted) {
        devfolioOpen++;
        const in35 = (regDeadline && regDeadline >= now && regDeadline <= windowEnd) || (eventStart && eventStart >= now && eventStart <= windowEnd);
        if (in35) devfolio35++;
      }
    }
  }
  console.log(`Devfolio (Page 1): Currently Open = ${devfolioOpen}, 35-Day Eligible = ${devfolio35}`);
}

dryRun().catch(console.error);
