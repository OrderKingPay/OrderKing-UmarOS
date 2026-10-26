import fs from 'node:fs';
import path from 'node:path';

const CLIENT_DIRS = [
  'HDmaster/dist/client',
  'HDmaster/dist/assets',
  'HDmaster/public',
  'orderking-customers/dist/client',
  'orderking-customers/dist/assets',
  'orderking-customers/public',
  'orderking-partners/dist/client',
  'orderking-partners/dist/assets',
  'orderking-partners/public',
  'orderking-riders/dist/client',
  'orderking-riders/dist/assets',
  'orderking-riders/public',
  'dist/client',
  'dist/assets'
];

const SERVER_DIRS = [
  'HDmaster/dist/_worker.js',
  'orderking-customers/dist/_worker.js',
  'orderking-partners/dist/_worker.js',
  'orderking-riders/dist/_worker.js'
];

const clientLeaks = [];
const serverLeaks = [];
let clientScanned = 0;
let serverScanned = 0;

function scanClientContent(filePath, content) {
  // 1. Private keys
  if (content.includes('BEGIN PRIVATE KEY') || content.includes('BEGIN RSA PRIVATE KEY') || content.includes('BEGIN EC PRIVATE KEY') || content.includes('BEGIN OPENSSH PRIVATE KEY')) {
    clientLeaks.push({ file: filePath, type: 'Private Key', detail: 'Contains private key block' });
  }

  // 2. Razorpay secret key
  if (content.includes('rzp_live_secret') || content.includes('rzp_test_secret')) {
    clientLeaks.push({ file: filePath, type: 'Razorpay Secret Key', detail: 'Contains razorpay secret' });
  }

  // 3. Stripe secret key (sk_live / sk_test)
  if (content.includes('sk_live_') || content.includes('sk_test_')) {
    const match = content.match(/sk_(?:live|test)_[0-9a-zA-Z]{24,}/);
    if (match) {
      clientLeaks.push({ file: filePath, type: 'Stripe Secret Key', detail: match[0].slice(0, 15) + '...' });
    }
  }

  // 4. OpenAI / Anthropic API keys
  if (content.includes('sk-proj-') || content.includes('sk-ant-')) {
    const match = content.match(/sk-(?:proj|ant)-[0-9a-zA-Z_-]{20,}/);
    if (match) {
      clientLeaks.push({ file: filePath, type: 'AI Secret Key', detail: match[0].slice(0, 15) + '...' });
    }
  }

  // 5. Database passwords in connection strings
  if (content.includes('postgres://') || content.includes('postgresql://')) {
    const match = content.match(/postgres(?:ql)?:\/\/[a-zA-Z0-9_-]+:([^@\s'"]+)@[a-zA-Z0-9.-]+/);
    if (match && match[1] && match[1] !== 'password' && match[1] !== 'your_password' && match[1] !== '[PASSWORD]') {
      clientLeaks.push({ file: filePath, type: 'Postgres Live Credentials', detail: 'Database connection string with non-placeholder password' });
    }
  }

  // 6. Supabase Service Role Key (elevated bypass token)
  if (content.includes('service_role')) {
    const jwtIdx = content.indexOf('eyJ');
    if (jwtIdx !== -1) {
      const tokenCandidate = content.slice(jwtIdx, jwtIdx + 800).split(/["'\s;,]/)[0];
      const parts = tokenCandidate.split('.');
      if (parts.length >= 2) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          if (payload.role === 'service_role') {
            clientLeaks.push({ file: filePath, type: 'Supabase Service Role Key', detail: 'Leaked elevated service_role JWT in client bundle' });
          }
        } catch {}
      }
    }
  }

  // 7. Plaintext secret assignments in client
  const secretKeywords = ['ORDERKING_JWT_SECRET', 'SUPABASE_SERVICE_ROLE_KEY', 'ORDERKING_SERVICE_TOKEN'];
  for (const kw of secretKeywords) {
    if (content.includes(kw)) {
      // Client bundle must not even reference or embed server-only environment variable names or values
      clientLeaks.push({ file: filePath, type: 'Server Secret Reference In Client Bundle', detail: kw });
    }
  }

  // BETTER_AUTH_SECRET: Client bundle must not reference server secret in app code.
  // We sanitize only the third-party @better-auth/core environment getter stub in vendor code before testing.
  const strippedBetterAuth = content.replace(/get\s+BETTER_AUTH_SECRET\(\)\s*\{\s*return\s+[a-zA-Z0-9_$]+\([`'"]BETTER_AUTH_SECRET[`'"]\)\s*\}/g, '');
  if (strippedBetterAuth.includes('BETTER_AUTH_SECRET')) {
    clientLeaks.push({ file: filePath, type: 'Server Secret Reference In Client Bundle', detail: 'BETTER_AUTH_SECRET' });
  }
}

function scanServerContent(filePath, content) {
  // Check server chunks for hardcoded literal secrets (not process.env references)
  if (content.includes('BEGIN PRIVATE KEY') || content.includes('BEGIN RSA PRIVATE KEY')) {
    serverLeaks.push({ file: filePath, type: 'Private Key', detail: 'Hardcoded private key block' });
  }

  if (content.includes('rzp_live_secret_') || content.includes('rzp_test_secret_')) {
    serverLeaks.push({ file: filePath, type: 'Hardcoded Razorpay Secret', detail: 'Hardcoded secret in server bundle' });
  }

  if (content.includes('sk_live_') || content.includes('sk_test_')) {
    const match = content.match(/sk_(?:live|test)_[0-9a-zA-Z]{24,}/);
    if (match) {
      serverLeaks.push({ file: filePath, type: 'Hardcoded Stripe Secret', detail: match[0].slice(0, 15) + '...' });
    }
  }
}

function walk(dir, isClient) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, isClient);
    } else {
      const ext = path.extname(full).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.woff', '.woff2', '.ttf'].includes(ext)) continue;
      const content = fs.readFileSync(full, 'utf8');
      if (isClient) {
        clientScanned++;
        scanClientContent(full, content);
      } else {
        serverScanned++;
        scanServerContent(full, content);
      }
    }
  }
}

for (const d of CLIENT_DIRS) {
  walk(d, true);
}

for (const d of SERVER_DIRS) {
  walk(d, false);
}

console.log(`Audited ${clientScanned} client bundles/public assets and ${serverScanned} server worker chunks.`);
console.log(`Client Leaks: ${clientLeaks.length}`);
console.log(`Server Hardcoded Secrets: ${serverLeaks.length}`);

if (clientLeaks.length > 0 || serverLeaks.length > 0) {
  console.error('CRITICAL LEAKS FOUND:');
  if (clientLeaks.length > 0) console.error('CLIENT LEAKS:', JSON.stringify(clientLeaks, null, 2));
  if (serverLeaks.length > 0) console.error('SERVER LEAKS:', JSON.stringify(serverLeaks, null, 2));
  process.exit(1);
} else {
  console.log('AUDIT RESULT: 100% CLEAN. Zero secrets leaked in client bundles or public build outputs.');
}
