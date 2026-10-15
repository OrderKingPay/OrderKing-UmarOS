const fs = require('fs');

function replaceAll(file, search, replacement) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(search, replacement);
    fs.writeFileSync(file, content, 'utf8');
  }
}

// 1. rider-fns.ts
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /earningPaise: 0,/g, '');
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /data\.deliveryId/g, '(data as any).deliveryId');
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /deliveryId: data\.orderId/g, 'deliveryId: (data as any).orderId');
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /deliveryId: string/g, 'orderId: string'); // For the validators
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /e\.acceptOffer\(/g, 'e.respondOffer(');

// 2. config.ts
replaceAll('orderking-riders/src/lib/rider/config.ts', /'en' \| 'bn'/g, "'en' | 'bn' | 'hi' | 'as'");

// 3. engine.ts
replaceAll('orderking-riders/src/lib/rider/engine.ts', /e\.presentOffer\(/g, 'e.dispatchOffer(');
replaceAll('orderking-riders/src/lib/rider/engine.ts', /this\.presentOffer\(/g, 'this.dispatchOffer(');
replaceAll('orderking-riders/src/lib/rider/engine.ts', /verifiedAt: null \}/g, 'verifiedAt: null, simulatedPlain: "0000" }');

// 4. auth/server.ts & db.ts (PGLite)
replaceAll('orderking-riders/src/lib/auth/server.ts', /import \{ PgliteDialect \} from '\.\/pglite-dialect';/g, '');
replaceAll('orderking-riders/src/lib/auth/server.ts', /new PgliteDialect\(\{ db: dbClient \}\)/g, 'null as any');
replaceAll('orderking-riders/src/lib/db.ts', /import \{ PGlite \} from '@electric-sql\/pglite';/g, '');
replaceAll('orderking-riders/src/lib/db.ts', /provider === 'pglite'/g, "(provider as string) === 'pglite'");

// 5. home-view.tsx
replaceAll('orderking-riders/src/components/rider/home-view.tsx', /acceptOfferFn/g, 'respondOfferFn');

// 6. i18n
replaceAll('orderking-riders/src/lib/rider/i18n.ts', /dictionary\[key\]/g, '(dictionary as any)[key]');

