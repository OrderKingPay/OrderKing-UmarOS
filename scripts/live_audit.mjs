import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

async function fetchDetails(url) {
  console.log(`\n========================================\nFETCHING: ${url}\n========================================`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    const headers = {};
    for (const [k, v] of res.headers.entries()) {
      headers[k] = v;
    }

    const text = await res.text();
    return {
      status: res.status,
      headers,
      text
    };
  } catch (err) {
    return { error: err.message };
  }
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function auditSite(siteName, baseUrl, localDistDir) {
  console.log(`\n>>> AUDITING SITE: ${siteName} (${baseUrl})`);
  console.log(`Local dist directory: ${localDistDir}`);

  // 1. Fetch index.html
  const liveHtml = await fetchDetails(baseUrl);
  console.log(`Status: ${liveHtml.status}`);
  console.log(`Headers:`, {
    'cache-control': liveHtml.headers['cache-control'],
    'etag': liveHtml.headers['etag'],
    'last-modified': liveHtml.headers['last-modified'],
    'cf-ray': liveHtml.headers['cf-ray'],
    'cf-cache-status': liveHtml.headers['cf-cache-status'],
    'server': liveHtml.headers['server'],
    'content-type': liveHtml.headers['content-type']
  });

  // Read local index.html if exists
  const localIndexPath = path.join(localDistDir, 'index.html');
  const localClientIndexPath = path.join(localDistDir, 'client', 'index.html');
  let localHtmlContent = null;
  let localHtmlPathUsed = null;
  if (fs.existsSync(localIndexPath)) {
    localHtmlContent = fs.readFileSync(localIndexPath, 'utf8');
    localHtmlPathUsed = localIndexPath;
  } else if (fs.existsSync(localClientIndexPath)) {
    localHtmlContent = fs.readFileSync(localClientIndexPath, 'utf8');
    localHtmlPathUsed = localClientIndexPath;
  }

  // Extract script / link tags from live HTML
  const scriptRegex = /<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const linkRegex = /<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi;

  const liveScripts = [];
  let match;
  while ((match = scriptRegex.exec(liveHtml.text)) !== null) {
    liveScripts.push(match[1]);
  }

  const liveLinks = [];
  while ((match = linkRegex.exec(liveHtml.text)) !== null) {
    liveLinks.push(match[1]);
  }

  console.log(`Live HTML scripts found:`, liveScripts);
  console.log(`Live HTML links found:`, liveLinks.slice(0, 10));

  // Extract scripts from local HTML
  const localScripts = [];
  if (localHtmlContent) {
    while ((match = scriptRegex.exec(localHtmlContent)) !== null) {
      localScripts.push(match[1]);
    }
    console.log(`Local HTML scripts found (${localHtmlPathUsed}):`, localScripts);
  } else {
    console.log(`No local index.html found directly at root or client! Checking dist files...`);
  }

  // Compare Live script bundles against local dist files
  console.log(`\n--- Script Bundle Forensic Verification ---`);
  for (const scriptPath of liveScripts) {
    const fullScriptUrl = scriptPath.startsWith('http') ? scriptPath : `${baseUrl.replace(/\/$/, '')}${scriptPath.startsWith('/') ? '' : '/'}${scriptPath}`;
    console.log(`Fetching live script: ${fullScriptUrl}`);
    const scriptRes = await fetchDetails(fullScriptUrl);
    if (scriptRes.error) {
      console.log(`  ERROR fetching script: ${scriptRes.error}`);
      continue;
    }
    const liveHash = sha256(scriptRes.text);
    console.log(`  Live HTTP Status: ${scriptRes.status}, Size: ${scriptRes.text.length} chars, SHA256: ${liveHash}`);
    console.log(`  Cache-Control: ${scriptRes.headers['cache-control']}, CF-Cache-Status: ${scriptRes.headers['cf-cache-status']}, CF-Ray: ${scriptRes.headers['cf-ray']}`);

    // Try finding local file
    const cleanPath = scriptPath.split('?')[0].replace(/^\//, '');
    let localCandidates = [
      path.join(localDistDir, cleanPath),
      path.join(localDistDir, 'client', cleanPath),
      path.join(localDistDir, path.basename(cleanPath)),
      path.join(localDistDir, 'assets', path.basename(cleanPath)),
      path.join(localDistDir, 'client', 'assets', path.basename(cleanPath))
    ];
    let foundLocal = null;
    for (const cand of localCandidates) {
      if (fs.existsSync(cand)) {
        foundLocal = cand;
        break;
      }
    }

    if (foundLocal) {
      const localBuffer = fs.readFileSync(foundLocal);
      const localHash = sha256(localBuffer);
      console.log(`  Local match candidate: ${foundLocal}`);
      console.log(`  Local Size: ${localBuffer.length} bytes, SHA256: ${localHash}`);
      if (liveHash === localHash) {
        console.log(`  >>> VERIFICATION: 100% IDENTICAL MATCH! <<<`);
      } else {
        console.log(`  >>> MISMATCH DETECTED! Live hash != Local hash <<<`);
      }
    } else {
      console.log(`  Local file NOT FOUND among candidates.`);
    }
  }

  // 2. Inspect Service Worker
  console.log(`\n--- Service Worker Inspection ---`);
  const swUrl = `${baseUrl.replace(/\/$/, '')}/sw.js`;
  const swRes = await fetchDetails(swUrl);
  console.log(`SW URL: ${swUrl}, Status: ${swRes.status}`);
  if (swRes.text) {
    console.log(`SW Headers:`, {
      'cache-control': swRes.headers['cache-control'],
      'etag': swRes.headers['etag'],
      'cf-ray': swRes.headers['cf-ray'],
      'cf-cache-status': swRes.headers['cf-cache-status']
    });
    console.log(`SW Length: ${swRes.text.length}`);
    const hasSkipWaiting = swRes.text.includes('skipWaiting') || swRes.text.includes('SKIP_WAITING');
    const hasClientsClaim = swRes.text.includes('clients.claim') || swRes.text.includes('clientsClaim');
    const hasNetworkFirst = swRes.text.includes('NetworkFirst') || swRes.text.includes('network-first') || swRes.text.includes('NetworkOnly');
    console.log(`SW Features: skipWaiting=${hasSkipWaiting}, clientsClaim=${hasClientsClaim}, networkFirst/networkOnly=${hasNetworkFirst}`);

    // Check against local sw.js if any
    let localSwCandidates = [
      path.join(localDistDir, 'sw.js'),
      path.join(localDistDir, 'client', 'sw.js'),
      path.join(localDistDir, '..', 'public', 'sw.js'),
      path.join(localDistDir, '..', 'sw.js')
    ];
    for (const cand of localSwCandidates) {
      if (fs.existsSync(cand)) {
        const localSw = fs.readFileSync(cand, 'utf8');
        console.log(`Local SW candidate found at: ${cand} (Length: ${localSw.length})`);
        console.log(`Local SW SHA256: ${sha256(localSw)}, Live SW SHA256: ${sha256(swRes.text)}`);
        if (sha256(localSw) === sha256(swRes.text)) {
          console.log(`>>> SW VERIFICATION: 100% IDENTICAL MATCH! <<<`);
        } else {
          console.log(`>>> SW DIFFERS FROM LOCAL ${cand} <<<`);
        }
      }
    }
    console.log(`First 500 chars of live SW:\n${swRes.text.slice(0, 500)}`);
  }
}

async function run() {
  await auditSite('OrderKing Customers', 'https://orderkingpay.com', path.resolve('orderking-customers/dist'));
  await auditSite('OrderKing Partners', 'https://partner.orderkingpay.com', path.resolve('orderking-partners/dist'));
}

run();
