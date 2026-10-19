import fs from 'node:fs';
import dns from 'node:dns/promises';

const targets = [
  'https://orderkingpay.com',
  'https://www.orderkingpay.com',
  'https://orderking-customers.pages.dev'
];

async function checkDns(hostname) {
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    return addresses;
  } catch (e) {
    return { error: e.message };
  }
}

async function probeUrl(url) {
  console.log(`\n======================================================`);
  console.log(`PROBING: ${url}`);
  console.log(`======================================================`);
  
  const parsed = new URL(url);
  const dnsResult = await checkDns(parsed.hostname);
  console.log(`DNS Lookup for ${parsed.hostname}:`, JSON.stringify(dnsResult));

  try {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OrderKingAudit/1.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log(`HTTP Status: ${res.status} ${res.statusText}`);
    console.log(`Headers:`);
    for (const [k, v] of res.headers.entries()) {
      console.log(`  ${k}: ${v}`);
    }

    if (res.status >= 300 && res.status < 400) {
      console.log(`Redirect Location: ${res.headers.get('location')}`);
      return;
    }

    const html = await res.text();
    console.log(`HTML Length: ${html.length} bytes`);
    
    // Extract title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    console.log(`Title: ${titleMatch ? titleMatch[1] : 'NOT FOUND'}`);

    // Extract script tags
    const scriptMatches = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
    console.log(`Script tags (${scriptMatches.length}):`, scriptMatches);

    // Extract link tags (css / icons)
    const linkMatches = [...html.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
    console.log(`Link tags (first 5):`, linkMatches.slice(0, 5));

    // Check for specific text / build indicators in HTML
    const hasRootDiv = html.includes('id="root"') || html.includes('id="app"');
    console.log(`Root div present: ${hasRootDiv}`);

    // Check service worker registration in HTML
    const hasSwRegister = html.includes('serviceWorker') || html.includes('sw.js');
    console.log(`Service Worker referenced in HTML: ${hasSwRegister}`);

    // Probe service worker specifically for this domain
    const swUrl = `${url.replace(/\/$/, '')}/sw.js`;
    console.log(`\nProbing SW at: ${swUrl}`);
    const swRes = await fetch(swUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
    });
    console.log(`SW Status: ${swRes.status}`);
    console.log(`SW Cache-Control: ${swRes.headers.get('cache-control')}`);
    console.log(`SW CF-Cache-Status: ${swRes.headers.get('cf-cache-status')}`);
    console.log(`SW ETag: ${swRes.headers.get('etag')}`);
    const swBody = await swRes.text();
    console.log(`SW Length: ${swBody.length}`);
    const versionMatch = swBody.match(/SW_VERSION\s*=\s*["']([^"']+)["']/);
    console.log(`SW_VERSION in live sw.js: ${versionMatch ? versionMatch[1] : 'NONE FOUND'}`);

  } catch (err) {
    console.error(`ERROR probing ${url}:`, err);
  }
}

async function run() {
  for (const target of targets) {
    await probeUrl(target);
  }
}

run();
