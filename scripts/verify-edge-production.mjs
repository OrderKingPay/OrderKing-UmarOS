import https from 'https';
import fs from 'fs';
import path from 'path';

async function probeUrl(urlStr) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    try {
      const parsedUrl = new URL(urlStr);
      const req = https.request(parsedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'OrderKing-Edge-Verifier/2.0 (Supreme-Engineer-OMEGA; 183f728c)'
        },
        timeout: 10000
      }, (res) => {
        let size = 0;
        res.on('data', chunk => { size += chunk.length; });
        res.on('end', () => {
          resolve({
            url: urlStr,
            status: res.statusCode,
            statusMessage: res.statusMessage,
            cfRay: res.headers['cf-ray'] || 'n/a',
            server: res.headers['server'] || 'n/a',
            contentType: res.headers['content-type'] || 'n/a',
            contentLength: size,
            latencyMs: Date.now() - startTime,
            ok: res.statusCode >= 200 && res.statusCode < 400
          });
        });
      });
      req.on('error', (err) => {
        resolve({
          url: urlStr,
          status: 'ERROR',
          error: err.message,
          latencyMs: Date.now() - startTime,
          ok: false
        });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({
          url: urlStr,
          status: 'TIMEOUT',
          error: 'Probe timed out after 10s',
          latencyMs: Date.now() - startTime,
          ok: false
        });
      });
      req.end();
    } catch (err) {
      resolve({
        url: urlStr,
        status: 'PARSE_ERROR',
        error: err.message,
        latencyMs: Date.now() - startTime,
        ok: false
      });
    }
  });
}

async function verifyEdgeFaultBarriers() {
  const apps = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders'];
  const results = [];
  for (const app of apps) {
    const workerPath = path.resolve(app, 'dist/_worker.js/index.js');
    const routesPath = path.resolve(app, 'dist/_routes.json');
    const headersPath = path.resolve(app, 'dist/_headers');
    
    const workerExists = fs.existsSync(workerPath);
    let has1101Trap = false;
    if (workerExists) {
      const code = fs.readFileSync(workerPath, 'utf8');
      has1101Trap = code.includes('Trapped unhandled SSR exception');
    }
    const routesExists = fs.existsSync(routesPath);
    const headersExists = fs.existsSync(headersPath);

    results.push({
      app,
      workerExists,
      has1101Trap,
      routesExists,
      headersExists
    });
  }
  return results;
}

async function run() {
  console.log('===============================================================');
  console.log(' SUPREME ENGINEER OMEGA (183f728c) - PRODUCTION EDGE AUDIT');
  console.log('===============================================================');

  // 1. Audit Dist Fault-Barriers
  console.log('\n[1/3] AUDITING EDGE WORKER DISTRIBUTIONS & 1101 FAULT-BARRIERS:');
  const edgeConfigs = await verifyEdgeFaultBarriers();
  console.table(edgeConfigs);

  // 2. Probe Live Production Endpoints
  console.log('\n[2/3] PROBING LIVE PRODUCTION DOMAINS (CLOUDFLARE ANYCAST):');
  const domains = [
    'https://orderkingpay.com',
    'https://partner.orderkingpay.com',
    'https://rider.orderkingpay.com',
    'https://rider.orderkingpay.com/login',
    'https://admin.orderkingpay.com',
    'https://admin.orderkingpay.com/login',
    'https://orderking-customers.pages.dev',
    'https://orderking-partners.pages.dev',
    'https://orderking-riders.pages.dev',
    'https://orderking-hdmaster.pages.dev',
    'https://hdmaster.pages.dev'
  ];
  const probeResults = [];
  for (const d of domains) {
    const res = await probeUrl(d);
    probeResults.push(res);
  }
  console.table(probeResults.map(p => ({
    URL: p.url,
    Status: p.status,
    CfRay: p.cfRay,
    Server: p.server,
    Size: `${(p.contentLength / 1024).toFixed(1)} KB`,
    Latency: `${p.latencyMs}ms`
  })));

  // 3. Fault Injection Probe: ensure non-existent route returns 404 (clean) not 1101
  console.log('\n[3/3] FAULT BARRIER PROBE (NON-EXISTENT ROUTES):');
  const faultProbes = [
    'https://orderkingpay.com/__probe_404_test_audit',
    'https://partner.orderkingpay.com/__probe_404_test_audit',
    'https://rider.orderkingpay.com/__probe_404_test_audit',
    'https://admin.orderkingpay.com/__probe_404_test_audit'
  ];
  const faultResults = [];
  for (const fp of faultProbes) {
    const res = await probeUrl(fp);
    faultResults.push(res);
  }
  console.table(faultResults.map(p => ({
    URL: p.url,
    Status: p.status,
    CfRay: p.cfRay,
    ZeroError1101: p.status !== 1101 && p.status !== 500,
    Latency: `${p.latencyMs}ms`
  })));

  console.log('\n>>> AUDIT EXECUTION COMPLETE <<<');
}

run().catch(console.error);
