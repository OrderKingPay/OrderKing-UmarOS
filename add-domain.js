// Secure Cloudflare Domain Provisioning Script
// Reads tokens strictly from environment variables to prevent credential exposure

const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const projectName = process.env.CLOUDFLARE_PROJECT_NAME || 'orderking-customers';
const domain = process.argv[2] || process.env.DOMAIN_NAME || 'www.orderkingpay.com';

if (!token || !accountId) {
  console.error('[SECURITY ERROR] CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set in environment variables.');
  process.exit(1);
}

fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: domain })
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
