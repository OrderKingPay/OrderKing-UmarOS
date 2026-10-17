const urls = [
  'https://admin.orderkingpay.com',
  'https://orderking-hdmaster.pages.dev',
  'https://www.orderkingpay.com',
  'https://orderkingpay.com',
  'https://orderking-customers.pages.dev',
  'https://partner.orderkingpay.com',
  'https://rider.orderkingpay.com',
  'https://api.orderkingpay.com/health'
];

async function check() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'manual' });
      const text = await res.text();
      const scripts = text.match(/src="[^"]+"/g) || [];
      const hasBanner = text.includes('Operating in Local Zero-Lag Cache Mode') || text.includes('You are offline');
      const hasFooter = text.includes('UltraLuxury') || text.includes('OrderKing Sovereign Ecosystem') || text.includes('The 10x Sovereign Advantage');
      console.log(`URL: ${url}`);
      console.log(`  Status: ${res.status}, Length: ${text.length}`);
      console.log(`  Has Offline Banner Text: ${hasBanner}`);
      console.log(`  Has UltraLuxury Footer Text: ${hasFooter}`);
      console.log(`  Scripts: ${scripts.slice(0, 3).join(', ')}`);
      console.log(`  CF-Ray: ${res.headers.get('cf-ray')}`);
    } catch (e) {
      console.log(`URL: ${url} -> ERROR: ${e.message}`);
    }
  }
}

check();
