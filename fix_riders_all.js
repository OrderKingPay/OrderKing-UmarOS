const fs = require('fs');

// Fix i18n
let i18nPath = 'orderking-riders/src/lib/rider/i18n.ts';
let code = fs.readFileSync(i18nPath, 'utf8');
code = code.replace(/,\s+hi:\s*\{[^]+$/, '\n};\nexport type LocaleCode = keyof typeof STRINGS;\n');
code = code.replace(/import type \{ LocaleCode \}.+;/, '');
fs.writeFileSync(i18nPath, code, 'utf8');

// Fix config locales
let configPath = 'orderking-riders/src/lib/rider/config.ts';
let conf = fs.readFileSync(configPath, 'utf8');
conf = conf.replace(/export const LOCALES: \{ value: LocaleCode; label: string \}\[] = \[[^\]]+\];/, 
  "export const LOCALES: { value: string; label: string }[] = [{value: 'en', label: 'English'}, {value: 'bn', label: 'বাংলা'}];");
fs.writeFileSync(configPath, conf, 'utf8');

// Fix engine
let enginePath = 'orderking-riders/src/lib/rider/engine.ts';
let eng = fs.readFileSync(enginePath, 'utf8');
eng = eng.replace(/this\.presentOffer/g, 'this.dispatchOffer');
eng = eng.replace(/this\.respondOffer/g, 'this.acceptOffer');
eng = eng.replace(/simulatedPlain:/g, '// simulatedPlain:');
fs.writeFileSync(enginePath, eng, 'utf8');

// Fix OTP in engine
eng = eng.replace(/\{ deliveryId, hash, salt, attempts: 0, verifiedAt: null \}/, 
"{ deliveryId, hash, salt, attempts: 0, verifiedAt: null, simulatedPlain: otp }");
fs.writeFileSync(enginePath, eng, 'utf8');

// Fix rider-fns
let fnsPath = 'orderking-riders/src/lib/server/rider-fns.ts';
let fns = fs.readFileSync(fnsPath, 'utf8');
fns = fns.replace(/valuePaise/g, 'earningPaise');
fns = fns.replace(/orderId/g, 'deliveryId');
fns = fns.replace(/respondOffer/g, 'acceptOffer');
fns = fns.replace(/otpForSimulation/g, 'generateOtp');
fs.writeFileSync(fnsPath, fns, 'utf8');

// Fix db pglite imports
let dbPath = 'orderking-riders/src/lib/db.ts';
let db = fs.readFileSync(dbPath, 'utf8');
db = db.replace(/import \{ PGlite \} from '@electric-sql\/pglite';/, '// import');
db = db.replace(/import \{ PgliteDialect \} from '\.\/pglite-dialect';/, '// import');
fs.writeFileSync(dbPath, db, 'utf8');

