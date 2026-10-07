const fs = require('fs');

let f1 = 'orderking-partners/src/lib/auth/server.ts';
if (fs.existsSync(f1)) {
  let c1 = fs.readFileSync(f1, 'utf8');
  c1 = c1.replace(/import \{ pgliteDialect \} from '\.\/pglite-dialect';/g, "// import { pgliteDialect } from './pglite-dialect';");
  c1 = c1.replace(/import \{ PgliteDialect \} from '\.\/pglite-dialect';/g, "// import { PgliteDialect } from './pglite-dialect';");
  fs.writeFileSync(f1, c1, 'utf8');
}

let f2 = 'orderking-partners/src/lib/db.ts';
if (fs.existsSync(f2)) {
  let c2 = fs.readFileSync(f2, 'utf8');
  c2 = c2.replace(/import \{ PGlite \} from '@electric-sql\/pglite';/g, "// import { PGlite } from '@electric-sql/pglite';");
  c2 = c2.replace(/provider === 'pglite'/g, "(provider as string) === 'pglite'");
  c2 = c2.replace(/dbSource === "pglite"/g, "(dbSource as string) === 'pglite'");
  c2 = c2.replace(/__pgliteInstance__\?: Promise<import\("@electric-sql\/pglite"\)\.PGlite>;/g, "__pgliteInstance__?: Promise<any>;");
  fs.writeFileSync(f2, c2, 'utf8');
}

let f3 = 'orderking-partners/src/lib/i18n/index.ts';
if (fs.existsSync(f3)) {
  let c3 = fs.readFileSync(f3, 'utf8');
  c3 = c3.replace(/export const strings =/g, "export const strings: any =");
  fs.writeFileSync(f3, c3, 'utf8');
}
