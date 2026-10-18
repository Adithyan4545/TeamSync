async function testFetchSources() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, application/xhtml+xml, */*',
  };

  // 1. Devpost RSS / API
  try {
    const res = await fetch('https://devpost.com/api/hackathons?page=1', { headers });
    console.log(`Devpost API HTTP Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`Devpost returned ${data.hackathons?.length || 0} hackathons`);
    }
  } catch (err: any) {
    console.log(`Devpost error: ${err.message}`);
  }

  // 2. HackerRank Contests API
  try {
    const res = await fetch('https://www.hackerrank.com/rest/contests/college?offset=0&limit=10', { headers });
    console.log(`HackerRank API HTTP Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`HackerRank returned ${data.models?.length || 0} contests`);
    }
  } catch (err: any) {
    console.log(`HackerRank error: ${err.message}`);
  }

  // 3. Kaggle Competitions API / Public Feed
  try {
    const res = await fetch('https://www.kaggle.com/api/v1/competitions/list?search=hackathon', { headers });
    console.log(`Kaggle API HTTP Status: ${res.status}`);
  } catch (err: any) {
    console.log(`Kaggle error: ${err.message}`);
  }
}

testFetchSources().catch(console.error);
