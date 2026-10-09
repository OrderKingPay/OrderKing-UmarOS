const https = require('https');

const urls = [
  'https://orderkingpay.com/',
  'https://www.orderkingpay.com/',
  'https://orderking-customers.pages.dev/',
  'https://admin.orderkingpay.com/',
  'https://orderking-hdmaster.pages.dev/',
  'https://partner.orderkingpay.com/',
  'https://orderking-partners.pages.dev/',
  'https://rider.orderkingpay.com/',
  'https://orderking-riders.pages.dev/',
  'https://api.orderkingpay.com/',
  'https://apps-integration.pages.dev/'
];

console.log("INITIATING OMNI-DEPLOYMENT VERIFICATION SEQUENCE...");

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      resolve({ url, status: res.statusCode });
    });
    
    req.on('error', (e) => {
      resolve({ url, status: 'ERROR', message: e.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT' });
    });
  });
}

async function run() {
  for (const url of urls) {
    const result = await checkUrl(url);
    if (result.status === 200 || result.status === 301 || result.status === 302 || result.status === 308) {
      console.log(`[SUCCESS] ${result.url} -> HTTP ${result.status} (LIVE)`);
    } else {
      console.log(`[WARNING] ${result.url} -> ${result.status} ${result.message || ''}`);
    }
  }
}

run();
