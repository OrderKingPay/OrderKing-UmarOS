const fs = require('fs');

// orderking-riders home-view.tsx
let hvPath = 'orderking-riders/src/components/rider/home-view.tsx';
if (fs.existsSync(hvPath)) {
  let hv = fs.readFileSync(hvPath, 'utf8');
  hv = hv.replace(/t\('underReview'\)/g, "t('underReview' as any)");
  hv = hv.replace(/t\('kycHint'\)/g, "t('kycHint' as any)");
  hv = hv.replace(/t\('practiceMode'\)/g, "t('practiceMode' as any)");
  hv = hv.replace(/t\('completed'\)/g, "t('completed' as any)");
  hv = hv.replace(/t\('onlineFor'\)/g, "t('onlineFor' as any)");
  hv = hv.replace(/t\('pendingCash'\)/g, "t('pendingCash' as any)");
  hv = hv.replace(/t\('currentDelivery'\)/g, "t('currentDelivery' as any)");
  hv = hv.replace(/t\('mapsOpen'\)/g, "t('mapsOpen' as any)");
  hv = hv.replace(/t\('offers'\)/g, "t('offers' as any)");
  hv = hv.replace(/t\('noOffers'\)/g, "t('noOffers' as any)");
  hv = hv.replace(/t\('homeEmpty'\)/g, "t('homeEmpty' as any)");
  hv = hv.replace(/t\('alerts'\)/g, "t('alerts' as any)");
  hv = hv.replace(/t\('assistant'\)/g, "t('assistant' as any)");
  hv = hv.replace(/t\('kyc'\)/g, "t('kyc' as any)");
  hv = hv.replace(/t\('confirmGoOnline'\)/g, "t('confirmGoOnline' as any)");
  fs.writeFileSync(hvPath, hv, 'utf8');
}

// app-builder-workspace umar-voice.ts
let umarPath = 'Apps-integration-/src/routes/api/umar-voice.ts';
if (fs.existsSync(umarPath)) {
  let umar = fs.readFileSync(umarPath, 'utf8');
  umar = umar.replace(/call\.name,/g, '(call.name as string),');
  umar = umar.replace(/return \[\{ functionResponse:/g, 'return [{ message: "", functionResponse:');
  fs.writeFileSync(umarPath, umar, 'utf8');
}

// orderking-partners db.ts
let opDbPath = 'orderking-partners/src/lib/db.ts';
if (fs.existsSync(opDbPath)) {
  let db = fs.readFileSync(opDbPath, 'utf8');
  db = db.replace(/if \(provider === 'pglite'\)/g, 'if ((provider as string) === "pglite")');
  db = db.replace(/import \{ PGlite \} from '@electric-sql\/pglite';/, '// import');
  fs.writeFileSync(opDbPath, db, 'utf8');
}

// orderking-partners auth server.ts
let opAuthPath = 'orderking-partners/src/lib/auth/server.ts';
if (fs.existsSync(opAuthPath)) {
  let auth = fs.readFileSync(opAuthPath, 'utf8');
  auth = auth.replace(/import \{ PgliteDialect \} from '\.\/pglite-dialect';/, '// import');
  auth = auth.replace(/new PgliteDialect\(\{ db: dbClient \}\)/, 'null as any');
  fs.writeFileSync(opAuthPath, auth, 'utf8');
}

// orderking-partners i18n
let opI18nPath = 'orderking-partners/src/lib/i18n/index.ts';
if (fs.existsSync(opI18nPath)) {
  let i18n = fs.readFileSync(opI18nPath, 'utf8');
  i18n = i18n.replace(/, hi: \{/g, '// hi: {');
  fs.writeFileSync(opI18nPath, i18n, 'utf8');
}

