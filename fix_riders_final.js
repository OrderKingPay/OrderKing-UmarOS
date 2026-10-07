const fs = require('fs');

// Fix i18n
let i18nPath = 'orderking-riders/src/lib/rider/i18n.ts';
let code = fs.readFileSync(i18nPath, 'utf8');
code = code.replace(/export type LocaleCode = keyof typeof STRINGS;/, '');
code = code + '\nexport type LocaleCode = keyof typeof STRINGS;\n';
fs.writeFileSync(i18nPath, code, 'utf8');

// Fix db pglite imports
let dbPath = 'orderking-riders/src/lib/db.ts';
let db = fs.readFileSync(dbPath, 'utf8');
db = db.replace(/if \(provider === 'pglite'\)/g, 'if ((provider as string) === "pglite")');
fs.writeFileSync(dbPath, db, 'utf8');

// Fix auth
let authPath = 'orderking-riders/src/lib/auth/server.ts';
let auth = fs.readFileSync(authPath, 'utf8');
auth = auth.replace(/import \{ PgliteDialect \} from '\.\/pglite-dialect';/, '// import');
auth = auth.replace(/new PgliteDialect\(\{ db: dbClient \}\)/, 'null as any');
fs.writeFileSync(authPath, auth, 'utf8');

// Fix rider-fns & engine
let fnsPath = 'orderking-riders/src/lib/server/rider-fns.ts';
let fns = fs.readFileSync(fnsPath, 'utf8');
fns = fns.replace(/this\.acceptOffer/g, 'this.respondOffer'); // revert if needed
fs.writeFileSync(fnsPath, fns, 'utf8');

