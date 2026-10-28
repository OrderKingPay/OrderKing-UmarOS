import https from 'https';

async function probe(urlStr, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const start = Date.now();
    try {
      const u = new URL(urlStr);
      const req = https.request(u, {
        method,
        headers: {
          'User-Agent': 'OrderKing-Edge-Verifier/2.0 (183f728c-OMEGA)',
          ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {})
        },
        timeout: 10000
      }, (res) => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          let parsed = null;
          try { parsed = JSON.parse(raw); } catch {}
          resolve({
            url: urlStr,
            status: res.statusCode,
            cfRay: res.headers['cf-ray'] || 'n/a',
            cacheControl: res.headers['cache-control'] || 'n/a',
            xCache: res.headers['x-orderking-cache'] || 'n/a',
            xEdgeTime: res.headers['x-edge-response-time-ms'] || 'n/a',
            latencyMs: Date.now() - start,
            data: parsed,
            size: raw.length
          });
        });
      });
      req.on('error', err => resolve({ url: urlStr, status: 'ERR', error: err.message, latencyMs: Date.now() - start }));
      req.on('timeout', () => { req.destroy(); resolve({ url: urlStr, status: 'TIMEOUT', latencyMs: Date.now() - start }); });
      if (body) req.write(body);
      req.end();
    } catch (e) {
      resolve({ url: urlStr, status: 'PARSE_ERR', error: e.message, latencyMs: Date.now() - start });
    }
  });
}

async function run() {
  console.log('===============================================================');
  console.log(' PROBING LIVE PRODUCTION CLOUDFLARE EDGE CORRIDOR TARIFFS');
  console.log('===============================================================');

  // 1. Batch top 50 corridors
  console.log('\n[1/4] Probing GET /api/travel/corridor-tariffs (Batch Top 50)...');
  const batchRes = await probe('https://orderkingpay.com/api/travel/corridor-tariffs');
  console.log('Status:', batchRes.status);
  console.log('CF-Ray:', batchRes.cfRay);
  console.log('Cache-Control:', batchRes.cacheControl);
  console.log('X-OrderKing-Cache:', batchRes.xCache);
  console.log('Total Corridors Returned:', batchRes.data?.total);
  console.log('Network Latency:', `${batchRes.latencyMs}ms`);

  // 2. Specific corridor DEL-BOM
  console.log('\n[2/4] Probing GET /api/travel/corridor-tariffs?corridor=DEL-BOM...');
  const delBomRes = await probe('https://orderkingpay.com/api/travel/corridor-tariffs?corridor=DEL-BOM');
  console.log('Status:', delBomRes.status);
  console.log('Corridor:', delBomRes.data?.corridor);
  console.log('Cache Status:', delBomRes.data?.cacheStatus);
  console.log('TBO Net Rate:', delBomRes.data?.tariff?.sovereign?.tboNetRatePaise, 'paise (₹' + (delBomRes.data?.tariff?.sovereign?.tboNetRatePaise / 100) + ')');
  console.log('MakeMyTrip:', delBomRes.data?.tariff?.competitors?.makeMyTripPaise, 'paise (₹' + (delBomRes.data?.tariff?.competitors?.makeMyTripPaise / 100) + ')');
  console.log('Savings vs MMT:', delBomRes.data?.tariff?.sovereign?.totalSavingsVersusMmtPaise, 'paise (₹' + (delBomRes.data?.tariff?.sovereign?.totalSavingsVersusMmtPaise / 100) + ')');
  console.log('Gold Reward:', delBomRes.data?.tariff?.sovereign?.goldMilligramsEarned, 'mg');

  // 3. Specific corridors CCU-GAU and BLR-DEL
  console.log('\n[3/4] Probing Flagship Corridors CCU-GAU & BLR-DEL...');
  const ccuGau = await probe('https://orderkingpay.com/api/travel/corridor-tariffs?corridor=CCU-GAU');
  console.log('CCU-GAU -> Status:', ccuGau.status, 'TBO Net:', ccuGau.data?.tariff?.sovereign?.tboNetRatePaise, 'paise');
  const blrDel = await probe('https://orderkingpay.com/api/travel/corridor-tariffs?corridor=BLR-DEL');
  console.log('BLR-DEL -> Status:', blrDel.status, 'TBO Net:', blrDel.data?.tariff?.sovereign?.tboNetRatePaise, 'paise');

  // 4. Flight search fast-path with corridor tariffs
  console.log('\n[4/4] Probing POST /api/travel/flight-search for DEL-BOM...');
  const flightSearchRes = await probe('https://orderkingpay.com/api/travel/flight-search', 'POST', JSON.stringify({
    origin: 'DEL',
    destination: 'BOM',
    departureDate: '2026-11-01',
    passengers: 1
  }));
  console.log('Flight Search Status:', flightSearchRes.status);
  console.log('Flight Search Source:', flightSearchRes.data?.source);
  console.log('Flight Options Count:', flightSearchRes.data?.count);
  console.log('Corridor Tariff Attached:', flightSearchRes.data?.corridorTariff?.corridorId);
  console.log('Edge Cache Status:', flightSearchRes.data?.edgeCache?.status);

  // 5. Fault Barrier Probe (404 test)
  console.log('\n[5/5] Probing Fault Barrier (Non-Existent Route)...');
  const faultRes = await probe('https://orderkingpay.com/__probe_404_kv_audit');
  console.log('Fault Route Status:', faultRes.status);
  console.log('CF-Ray:', faultRes.cfRay);
  console.log('ZeroError1101:', faultRes.status !== 1101 && faultRes.status !== 500);

  console.log('\n>>> PROBE COMPLETE <<<');
}

run().catch(console.error);
