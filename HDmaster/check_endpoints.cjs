const https = require('https');

const url = 'https://orderking-hdmaster.pages.dev';

https.get(url, (res) => {
  console.log(`Status Code for ${url}: ${res.statusCode}`);
  if (res.statusCode !== 200) {
    console.error('ERROR: Endpoint is not returning HTTP 200 OK. It is crashing.');
    process.exit(1);
  } else {
    console.log('SUCCESS: Endpoint is returning HTTP 200 OK.');
    process.exit(0);
  }
}).on('error', (e) => {
  console.error(`ERROR: Failed to hit endpoint: ${e.message}`);
  process.exit(1);
});
