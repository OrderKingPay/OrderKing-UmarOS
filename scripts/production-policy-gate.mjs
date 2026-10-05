import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const requiredCloudflare = [
  ['orderking-customers', 'orderking-customers'],
  ['orderking-partners', 'orderking-partners'],
  ['orderking-riders', 'orderking-riders'],
  ['HDmaster', 'orderking-hdmaster'],
  ['Apps-integration-', 'apps-integration'],
];

for (const [dir, project] of requiredCloudflare) {
  const p = join(root, dir, 'wrangler.toml');
  if (!existsSync(p)) { failures.push('Missing Cloudflare config: ' + dir + '/wrangler.toml'); continue; }
  const text = readFileSync(p, 'utf8');
  if (!text.includes('name = "' + project + '"')) failures.push('Wrong Cloudflare project name in ' + p);
  if (!text.includes('pages_build_output_dir = "dist"')) failures.push('Wrong Pages output in ' + p);
  if (!text.includes('compatibility_date = "2026-10-01"')) failures.push('Missing compatibility date in ' + p);
}

for (const [dir] of requiredCloudflare) {
  const p = join(root, dir, 'vite.config.ts');
  if (!existsSync(p)) { failures.push('Missing Vite config: ' + p); continue; }
  const text = readFileSync(p, 'utf8');
  if (/preset:\s*["'](?:netlify|vercel)["']/.test(text)) failures.push('Legacy deployment preset remains active in ' + p);
  if (!text.includes('preset: "cloudflare-pages"')) failures.push('Cloudflare Pages preset missing in ' + p);
}

const workflow = readFileSync(join(root, '.github/workflows/production-gate.yml'), 'utf8');
if (!workflow.includes('version: 12.8.1')) failures.push('Production Gate is not pinned to pnpm 12.8.1.');
if (!workflow.includes('node-version: 22')) failures.push('Production Gate is not using Node 22.');

const blockedPatterns = [
  ['|| "test_key"', 'placeholder Razorpay test key fallback in production source'],
  ['|| "test_secret"', 'placeholder Razorpay test secret fallback in production source'],
  ['safe empty fallback', 'silent database fallback'],
  ['0xOrderKingTreasury', 'fabricated crypto address'],
  ['Founder 1.5% Crypto FX Premium', 'fabricated crypto profit ledger'],
];

const sourceRoots = ['HDmaster', 'Apps-integration-', 'orderking-customers', 'orderking-partners', 'orderking-riders'];
const skip = new Set(['node_modules', '.git', 'dist']);
function scanDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) scanDir(p);
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      const text = readFileSync(p, 'utf8');
      for (const [needle, reason] of blockedPatterns) if (text.includes(needle)) failures.push(p + ': ' + reason);
    }
  }
}
for (const dir of sourceRoots) scanDir(join(root, dir));

if (!existsSync(join(root, 'docs/SECTION_12_REAL_PILOT_LAUNCH_GATE.md'))) failures.push('Section 12 launch gate document is missing.');

if (failures.length) {
  console.error('PRODUCTION POLICY GATE: BLOCKED');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}
console.log('PRODUCTION POLICY GATE: PASS');
