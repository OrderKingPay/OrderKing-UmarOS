import https from 'node:https';

async function fetchUrl(url) {
  const res = await fetch(url, { redirect: 'manual' });
  const text = await res.text();
  console.log(`[${res.status}] ${url} (length: ${text.length})`);
  const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    console.log(`  Title: ${titleMatch[1]}`);
  }
  if (res.headers.get('location')) {
    console.log(`  Redirect Location: ${res.headers.get('location')}`);
  }
}

async function main() {
  console.log('Testing Partner & Rider routes on live Cloudflare edge...');
  await fetchUrl('https://partner.orderkingpay.com/onboarding');
  await fetchUrl('https://partner.orderkingpay.com/login');
  await fetchUrl('https://rider.orderkingpay.com/onboarding');
  await fetchUrl('https://rider.orderkingpay.com/login');
  await fetchUrl('https://admin.orderkingpay.com/login');
  await fetchUrl('https://orderkingpay.com');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
