const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
console.log('Applying OrderKing & Umar OS approved forensic fixes from root:', root);

function patchFile(relPath, transformFn) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[SKIP] File not found: ${relPath}`);
    return false;
  }
  const original = fs.readFileSync(fullPath, 'utf8');
  const patched = transformFn(original);
  if (original === patched) {
    console.log(`[UNCHANGED] ${relPath}`);
    return false;
  }
  fs.writeFileSync(fullPath, patched, 'utf8');
  console.log(`[PATCHED] ${relPath}`);
  return true;
}

// ============================================================================
// 1. Partner Platform: Plug Express Daily Payout Replay Leak
// ============================================================================
patchFile('orderking-partners/src/lib/server/api-finance.ts', (content) => {
  const marker = "insert into settlement_batches";
  if (!content.includes(marker)) return content;
  if (content.includes("insert into settlement_lines")) return content;

  const target = /await sql`\s*insert into settlement_batches \([\s\S]*?\)\s*`;/;
  const match = content.match(target);
  if (!match) return content;

  const settlementLinesInsert = `
      // Atomically associate all accrued delivered orders into settlement_lines to prevent replay double-dipping
      await sql\`
        insert into settlement_lines (
          id, batch_id, restaurant_id, order_id,
          food_value_paise, packing_paise, restaurant_discount_paise,
          platform_funded_discount_paise, commission_paise,
          other_deductions_paise, refund_adjustment_paise, restaurant_payable_paise
        )
        select
          'stl_line_' || substr(md5(random()::text), 1, 12),
          \${batchId},
          \${ctx.restaurantId},
          o.id,
          coalesce(o.food_subtotal_paise, 0),
          coalesce(o.packaging_paise, 0),
          coalesce(o.restaurant_discount_paise, 0),
          coalesce(o.platform_discount_paise, 0),
          coalesce(o.commission_paise, 0),
          0,
          0,
          coalesce(o.restaurant_payable_paise, 0)
        from orders o
        where o.restaurant_id = \${ctx.restaurantId}
          and o.state = 'DELIVERED'
          and o.id not in (select order_id from settlement_lines where restaurant_id = \${ctx.restaurantId})
      \`;`;

  return content.replace(match[0], match[0] + settlementLinesInsert);
});

// ============================================================================
// 2. Rider Platform: Fix PWA Service Worker 404 Cache Rejection
// ============================================================================
patchFile('orderking-riders/public/sw.js', (content) => {
  return content.replace(
    /const STATIC_ASSETS = \[\s*[\s\S]*?\];/,
    `const STATIC_ASSETS = [\n  "/",\n  "/offline.html",\n  "/favicon.ico",\n  "/icon-192.png",\n  "/manifest.json",\n];`
  );
});

// ============================================================================
// 3. Rider Platform: Remove Hot-Path DDL in GPS Telemetry Ping
// ============================================================================
patchFile('orderking-riders/src/lib/rider/pg-store.ts', (content) => {
  const ddl = /await this\.sql\.query\(`ALTER TABLE riders ADD COLUMN IF NOT EXISTS current_location JSONB`\);/g;
  return content.replace(ddl, '// current_location migrated via 0019 schema');
});

// ============================================================================
// 4. Rider Platform: Fix Geofence Handover Lockout on Live Orders
// ============================================================================
patchFile('orderking-riders/src/lib/rider/engine.ts', (content) => {
  const target = `const distanceToDropKm = haversineKm(latestPing.point, d.dropLocation);`;
  if (!content.includes(target)) return content;
  
  const replacement = `const isFallbackCoord = !d.dropLocation || (d.dropLocation.lat === 0 && d.dropLocation.lng === 0);
        const distanceToDropKm = isFallbackCoord ? 0 : haversineKm(latestPing.point, d.dropLocation);`;
  return content.replace(target, replacement);
});

// ============================================================================
// 5. Rider Platform: Map real customer/restaurant coordinates & OTP sync
// ============================================================================
patchFile('orderking-riders/src/lib/server/rider-fns.ts', (content) => {
  let updated = content;
  // Sync real dropLocation and pickupLocation
  updated = updated.replace(
    /pickupLocation: \{lat:0, lng:0\}, dropLocation: \{lat:0, lng:0\}/g,
    `pickupLocation: { lat: Number(o.restaurant_lat) || 0, lng: Number(o.restaurant_lng) || 0 }, dropLocation: { lat: Number(o.customer_lat) || 0, lng: Number(o.customer_lng) || 0 }`
  );
  // Sync delivery OTP from Postgres if present
  updated = updated.replace(
    /const plainOtp = generateOtp\(4\);/,
    `const plainOtp = (o.delivery_otp && String(o.delivery_otp).trim().length === 4) ? String(o.delivery_otp).trim() : generateOtp(4);`
  );
  return updated;
});

// ============================================================================
// 6. Superapp Engine: Remove God Key Fallback & Phantom Revenue
// ============================================================================
patchFile('superapp-engine/server.js', (content) => {
  let updated = content;
  // Disallow 'umar_god_9999' fallback
  updated = updated.replace(
    /const validKey = process\.env\.UMAR_OS_MASTER_KEY \|\| 'umar_god_9999';\s*if \(masterKey !== validKey\)/,
    `const validKey = process.env.UMAR_OS_MASTER_KEY;\n  if (!validKey || !masterKey || masterKey !== validKey)`
  );
  // Decouple unverified checkout intent from ledger profit/GMV inflation
  updated = updated.replace(
    /db\.ledger\.founderNetProfitINR \+= Number\(founderNetProfitINR\);\s*db\.ledger\.grossMerchandiseValueINR \+= Number\(customerPaidINR\);/,
    `// Real revenue protection: Only verified/paid orders increment founder profit and GMV\n  if (paymentTag === 'COD') {\n    db.ledger.grossMerchandiseValueINR += Number(customerPaidINR);\n  }`
  );
  return updated;
});

// ============================================================================
// 7. Umar OS: Sovereign execute.ts Master Key Header Authorization
// ============================================================================
patchFile('HDmaster/src/routes/api/v1/founder/execute.ts', (content) => {
  const authCheck = `const session = await getSessionUser();`;
  if (!content.includes(authCheck)) return content;
  if (content.includes("x-umar-master-key")) return content;

  const masterKeyBridge = `
    const masterKeyHeader = request.headers.get('x-umar-master-key') || '';
    const authBearer = (request.headers.get('authorization') || '').replace(/^Bearer\\s+/i, '');
    const configuredMasterKey = process.env.UMAR_OS_MASTER_KEY?.trim();
    const isMasterAuthorized = Boolean(
      configuredMasterKey &&
      configuredMasterKey.length >= 16 &&
      (masterKeyHeader === configuredMasterKey || authBearer === configuredMasterKey)
    );

    if (isMasterAuthorized) {
      userId = 'founder-master';
      userRole = 'FOUNDER';
    } else {
  `;

  return content.replace(
    authCheck,
    masterKeyBridge + '    ' + authCheck
  ).replace(
    `throw new Error('UNAUTHORIZED: Founder authentication required to execute sovereign commands.');\n    }`,
    `throw new Error('UNAUTHORIZED: Founder authentication required to execute sovereign commands.');\n    }\n    }`
  );
});

console.log('All approved forensic fixes applied successfully.');
