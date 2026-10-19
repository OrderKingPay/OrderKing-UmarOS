import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import crypto from 'node:crypto';

const TARGETS = [
  {
    name: 'OrderKing Customer Production (Apex)',
    domain: 'orderkingpay.com',
    url: 'https://orderkingpay.com',
    localDist: path.resolve('orderking-customers/dist')
  },
  {
    name: 'OrderKing Customer Pages Edge',
    domain: 'orderking-customers.pages.dev',
    url: 'https://orderking-customers.pages.dev',
    localDist: path.resolve('orderking-customers/dist')
  },
  {
    name: 'OrderKing Partner Production',
    domain: 'partner.orderkingpay.com',
    url: 'https://partner.orderkingpay.com',
    localDist: path.resolve('orderking-partners/dist')
  },
  {
    name: 'OrderKing Partner Pages Edge',
    domain: 'orderking-partners.pages.dev',
    url: 'https://orderking-partners.pages.dev',
    localDist: path.resolve('orderking-partners/dist')
  }
];

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function checkDns(hostname) {
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    return addresses;
  } catch (e) {
    return { error: e.message };
  }
}

async function auditTarget(target) {
  console.log(`\n======================================================================`);
  console.log(` AUDITING: ${target.name} [${target.url}]`);
  console.log(`======================================================================`);

  const dnsRes = await checkDns(target.domain);
  console.log(`[DNS] ${target.domain}:`, JSON.stringify(dnsRes));

  // 1. Root page
  try {
    const res = await fetch(target.url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OrderKing-Supreme-Auditor/2.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log(`\n[ROOT] Status: ${res.status} ${res.statusText}`);
    console.log(`[ROOT] Edge Headers:`);
    const rootHeaders = {};
    for (const [k, v] of res.headers.entries()) {
      rootHeaders[k] = v;
      if (['cache-control', 'cf-ray', 'cf-cache-status', 'etag', 'content-type', 'x-content-type-options', 'content-security-policy'].includes(k.toLowerCase())) {
        console.log(`   ${k}: ${v}`);
      }
    }

    const html = await res.text();
    console.log(`[ROOT] HTML Size: ${html.length} bytes`);
    
    // Check title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    console.log(`[ROOT] Title: ${titleMatch ? titleMatch[1] : 'N/A'}`);

    // Check script bundles
    const scripts = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
    console.log(`[ROOT] Scripts:`, scripts);

    // 2. Service Worker check
    const swUrl = `${target.url.replace(/\/$/, '')}/sw.js`;
    console.log(`\n[SW] Probing Service Worker: ${swUrl}`);
    const swRes = await fetch(swUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 OrderKing-Supreme-Auditor/2.0',
        'Cache-Control': 'no-cache'
      }
    });

    console.log(`[SW] Status: ${swRes.status}`);
    console.log(`[SW] Cache-Control: ${swRes.headers.get('cache-control')}`);
    console.log(`[SW] CF-Cache-Status: ${swRes.headers.get('cf-cache-status')}`);
    console.log(`[SW] ETag: ${swRes.headers.get('etag')}`);
    const swText = await swRes.text();
    console.log(`[SW] Body Length: ${swText.length} bytes`);

    // Check SW Cache Invalidation strategy
    const hasSkipWaiting = swText.includes('skipWaiting()');
    const hasClaim = swText.includes('clients.claim()');
    const versionMatch = swText.match(/(?:SW_VERSION|CACHE_NAME|VERSION)\s*=\s*['"]([^'"]+)['"]/i);
    console.log(`[SW] Version identifier: ${versionMatch ? versionMatch[1] : 'Found custom service worker logic'}`);
    console.log(`[SW] Skip waiting present: ${hasSkipWaiting}`);
    console.log(`[SW] Clients claim present: ${hasClaim}`);

    // 3. Web Manifest check
    const manifestUrl = `${target.url.replace(/\/$/, '')}/manifest.webmanifest`;
    try {
      const mRes = await fetch(manifestUrl);
      console.log(`\n[MANIFEST] ${manifestUrl} -> Status: ${mRes.status}`);
      if (mRes.ok) {
        const mJson = await mRes.json();
        console.log(`[MANIFEST] App Name: ${mJson.name}, Short: ${mJson.short_name}, Start URL: ${mJson.start_url}`);
      }
    } catch (e) {
      console.log(`[MANIFEST] check error: ${e.message}`);
    }

    // 4. Check for mock/fake code keywords in live scripts
    console.log(`\n[FORENSIC] Auditing loaded scripts for fake/mock signatures...`);
    for (const s of scripts) {
      const scriptUrl = s.startsWith('http') ? s : `${target.url.replace(/\/$/, '')}${s.startsWith('/') ? '' : '/'}${s}`;
      const sRes = await fetch(scriptUrl);
      if (sRes.ok) {
        const sBody = await sRes.text();
        const hasMockData = /mockRestaurants|fakeOrder|mockOrders|dummyDatabase|isMockMode\s*=\s*true/i.test(sBody);
        console.log(`   Script: ${s} (${sBody.length} bytes) - Suspicious Mock Keywords: ${hasMockData ? 'FLAGGED!' : 'CLEAN (Zero mock code)'}`);
      }
    }

  } catch (err) {
    console.error(`[ERROR] Auditing ${target.name}:`, err);
  }
}

async function run() {
  for (const t of TARGETS) {
    await auditTarget(t);
  }
}

run();
