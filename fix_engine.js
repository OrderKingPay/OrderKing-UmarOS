const fs = require('fs');

function replaceAll(file, search, replacement) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(search, replacement);
    fs.writeFileSync(file, content, 'utf8');
  }
}

// 1. config.ts
replaceAll('orderking-riders/src/lib/rider/config.ts', /export type LocaleCode = 'en' | 'bn';/g, "export type LocaleCode = string;\nexport const LOCALE_LABELS: Record<string, string> = { en: 'English', bn: 'Bengali', hi: 'Hindi', as: 'Assamese' };");

// 2. engine.ts
replaceAll('orderking-riders/src/lib/rider/engine.ts', /\.presentOffer\(/g, '.dispatchOffer(');
replaceAll('orderking-riders/src/lib/rider/engine.ts', /verifiedAt: null/g, 'verifiedAt: null, simulatedPlain: "00000"');

// 3. rider-fns.ts
// deliveryId -> orderId in arguments, earningPaise removed
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /earningPaise:/g, '// earningPaise:');
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /deliveryId:/g, 'orderId:');
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /deliveryId,/g, 'orderId,');
replaceAll('orderking-riders/src/lib/server/rider-fns.ts', /deliveryId/g, 'orderId');
// Oh wait, DispatchOffer requires deliveryId, not orderId? The error said: "Object literal may only specify known properties, but 'orderId' does not exist in type 'DispatchOffer'. Did you mean to write 'riderId'?"
// Wait, the error is it wants deliveryId! So changing deliveryId to orderId broke DispatchOffer!

