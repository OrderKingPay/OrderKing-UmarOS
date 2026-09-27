const https = require('https');
https.get('https://orderking-hdmaster.netlify.app', (res) => {
  console.log('StatusCode:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Body:', data.substring(0, 300)));
});
