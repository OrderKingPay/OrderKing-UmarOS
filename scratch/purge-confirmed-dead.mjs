import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const libOrderking = path.resolve(cwd, 'HDmaster/src/lib/orderking');

const deadDirs = [
  'campaigns',
  'command',
  'config',
  'dispatch',
  'economics',
  'edge',
  'fleet',
  'hardware',
  'integrations',
  'interoperability',
  'maps',
  'notifications',
  'ops',
  'plugins',
  'self-improvement',
  'support',
  'telemetry',
  'webhooks'
];

let deletedCount = 0;
for (const d of deadDirs) {
  const p = path.join(libOrderking, d);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`[DELETED DEAD DIRECTORY] ${p}`);
    deletedCount++;
  }
}

// Root bloat files
const rootBloat = [
  'qr.patch',
  'temp-vite-old.ts',
  'origin_pkg.json',
  'search.py',
  'Master_Workbook_Dump.md',
  'diff.patch',
  'api_matches.txt'
];

for (const f of rootBloat) {
  const p = path.resolve(cwd, f);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { force: true });
    console.log(`[DELETED ROOT BLOAT FILE] ${p}`);
    deletedCount++;
  }
}

console.log(`\nSuccessfully deleted ${deletedCount} dead items!`);
