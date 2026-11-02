const https = require('https');

async function test() {
  const targetUrl = process.argv[2] || 'https://0b8654bc.orderking-customers.pages.dev';
  console.log('Testing target:', targetUrl);
  const res = await fetch(targetUrl);
  const html = await res.text();
  console.log('Status:', res.status);
  
  const matches = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
  console.log('Script bundles found:', matches.length);
  for (const scriptUrl of matches) {
    const fullUrl = scriptUrl.startsWith('http') ? scriptUrl : targetUrl + scriptUrl;
    console.log('Fetching bundle:', fullUrl);
    const sRes = await fetch(fullUrl);
    const js = await sRes.text();
    console.log('Bundle length:', js.length);
    console.log('  Contains "Current GPS Position":', js.includes('Current GPS Position'));
    console.log('  Contains "Restaurants at this exact pin":', js.includes('Restaurants at this exact pin'));
    console.log('  Contains "Active KingPay Services":', js.includes('Active KingPay Services'));
    console.log('  Contains "Browse Flagship Hub":', js.includes('Browse Flagship Hub'));
    console.log('  Contains "Doorstep food delivery expanding to this area soon":', js.includes('Doorstep food delivery expanding to this area soon'));
  }
}

test().catch(console.error);
