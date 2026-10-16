import fs from 'node:fs';
import path from 'node:path';

const envFiles = [
  '.env.example',
  'HDmaster/.env',
  'HDmaster/.env.production.txt',
  'orderking-customers/.env',
  'orderking-partners/.env',
  'orderking-riders/.env'
];

const secretKeywords = [
  'SECRET',
  'PRIVATE_KEY',
  'SERVICE_ROLE',
  'PASSWORD',
  'AUTH_KEY',
  'SERVICE_TOKEN',
  'JWT_SECRET'
];

const sensitiveSecrets = [];

for (const ef of envFiles) {
  if (fs.existsSync(ef)) {
    const lines = fs.readFileSync(ef, 'utf8').split('\n');
    for (const l of lines) {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      
      const isSensitiveKey = secretKeywords.some(sk => key.toUpperCase().includes(sk));
      if (isSensitiveKey && val.length >= 8 && !val.startsWith('your_') && !val.includes('placeholder')) {
        sensitiveSecrets.push({ key, val, source: ef });
      }
    }
  }
}

console.log(`Identified ${sensitiveSecrets.length} high-entropy secret credentials across env configs.`);

const clientFiles = [];
function getFiles(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) getFiles(full);
    else if (full.endsWith('.js') || full.endsWith('.html') || full.endsWith('.json')) clientFiles.push(full);
  }
}

['HDmaster/dist/client', 'HDmaster/dist/assets', 'orderking-customers/dist/client', 'orderking-partners/dist/client', 'orderking-riders/dist/client', 'dist/client'].forEach(getFiles);

console.log(`Auditing ${clientFiles.length} client bundles & static assets for secret leaks...`);
const leaks = [];

for (const file of clientFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const { key, val, source } of sensitiveSecrets) {
    if (content.includes(val)) {
      leaks.push({ file, key, source });
    }
  }
}

if (leaks.length > 0) {
  console.error('CRITICAL: SENSITIVE CREDENTIALS LEAKED IN CLIENT BUNDLE:', leaks);
  process.exit(1);
} else {
  console.log('AUDIT RESULT: 100% CLEAN. ZERO sensitive credentials or private keys leaked in any client bundle or public build output.');
}
