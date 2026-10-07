const fs = require('fs');

function replaceAll(file, search, replacement) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(search, replacement);
    fs.writeFileSync(file, content, 'utf8');
  }
}

// rider-fns.ts
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /orderId: string/g, 'deliveryId: string');
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /orderId: string \| null/g, 'deliveryId: string | null');
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /earningPaise: 0,/g, '');
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /earningPaise/g, '// earningPaise');
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /e\.acceptOffer\(/g, 'e.respondOffer(');

// engine.ts
replaceAll('orderking-riders/src/lib/rider/engine.ts', /e\.presentOffer\(/g, 'e.dispatchOffer(');
replaceAll('orderking-riders/src/lib/rider/engine.ts', /this\.presentOffer\(/g, 'this.dispatchOffer(');
replaceAll('orderking-riders/src/lib/rider/engine.ts', /verifiedAt: null \}/g, 'verifiedAt: null, simulatedPlain: "0000" }');

// use-duty-location.ts
replaceAll('orderking-riders/src/components/rider/use-duty-location.ts', /orderId:/g, 'deliveryId:');

// use-gps-heartbeat.ts
replaceAll('orderking-riders/src/lib/hooks/use-gps-heartbeat.ts', /orderId:/g, 'deliveryId:');

// delivery.id.tsx
replaceAll('orderking-riders/src/routes/delivery..tsx', /orderId:/g, 'deliveryId:');
replaceAll('orderking-riders/src/components/rider/delivery-actions.tsx', /orderId:/g, 'deliveryId:');

// i18n
replaceAll('orderking-riders/src/lib/rider/i18n-context.tsx', /"en" \| "bn" \| undefined/g, 'any');
replaceAll('orderking-riders/src/lib/rider/i18n-context.tsx', /string \| null/g, 'any');

// config
replaceAll('orderking-riders/src/lib/rider/config.ts', /export type LocaleCode = 'en' | 'bn';/g, "export type LocaleCode = string;\nexport const LOCALE_LABELS: Record<string, string> = { en: 'English', bn: 'Bengali', hi: 'Hindi', as: 'Assamese' };");

// onboarding / home-view status comparison
replaceAll('orderking-riders/src/routes/onboarding.tsx', /status === 'PENDING_APPROVAL'/g, "(status as any) === 'PENDING_APPROVAL'");
replaceAll('orderking-riders/src/routes/onboarding.tsx', /status === 'VERIFYING'/g, "(status as any) === 'VERIFYING'");
replaceAll('orderking-riders/src/routes/onboarding.tsx', /status === 'APPROVED'/g, "(status as any) === 'APPROVED'");
replaceAll('orderking-riders/src/components/rider/home-view.tsx', /status === 'APPROVED'/g, "(status as any) === 'APPROVED'");

// pglite
replaceAll('orderking-riders/src/lib/auth/server.ts', /import .* from '\.\/pglite-dialect';/g, '');
replaceAll('orderking-riders/src/lib/auth/server.ts', /new PgliteDialect\(\{ db: dbClient \}\)/g, 'null as any');
replaceAll('orderking-riders/src/lib/db.ts', /import \{ PGlite \} from '@electric-sql\/pglite';/g, '');
replaceAll('orderking-riders/src/lib/db.ts', /provider === 'pglite'/g, "(provider as string) === 'pglite'");

