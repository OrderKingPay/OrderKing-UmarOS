import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'fc53b6fd613df944a3a46606cfbf21d0';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const PROJECT_NAME = process.argv[2] || process.env.CLOUDFLARE_PROJECT_NAME || 'orderking-customers';

const appPaths = {
  'orderking-customers': 'orderking-customers/dist',
  'orderking-hdmaster': 'HDmaster/dist',
  'orderking-partners': 'orderking-partners/dist',
  'orderking-riders': 'orderking-riders/dist',
  'apps-integration': 'Apps-integration-/dist'
};

const distPath = appPaths[PROJECT_NAME] || `${PROJECT_NAME}/dist`;
const resolvedDist = resolve(process.cwd(), distPath);

console.log(`[Cloudflare Pages Deployer] Target Project: ${PROJECT_NAME}`);
console.log(`[Cloudflare Pages Deployer] Account ID: ${ACCOUNT_ID}`);
console.log(`[Cloudflare Pages Deployer] Dist Path: ${resolvedDist}`);

if (!existsSync(resolvedDist)) {
  console.error(`[ERROR] Build output directory does not exist: ${resolvedDist}`);
  console.error(`Please run the build first (e.g. pnpm --filter ${PROJECT_NAME} run build)`);
  process.exit(1);
}

if (!API_TOKEN) {
  console.log('\n[INFO] No CLOUDFLARE_API_TOKEN detected in environment.');
  console.log('Attempting deployment using existing Wrangler session...\n');
}

try {
  const env = {
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
    ...(API_TOKEN ? { CLOUDFLARE_API_TOKEN: API_TOKEN } : {})
  };

  const cmd = `npx wrangler pages deploy "${distPath}" --project-name="${PROJECT_NAME}" --branch=main --commit-dirty=true`;
  console.log(`Executing: ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', env });
  console.log(`\n✅ [SUCCESS] Deployment of ${PROJECT_NAME} to Cloudflare Pages completed!`);
} catch (err) {
  console.error(`\n❌ [DEPLOYMENT FAILED] ${err.message}`);
  if (!API_TOKEN) {
    console.error('\nTIP: To authenticate, run:');
    console.error('  1. npx wrangler login');
    console.error('  OR');
    console.error('  2. Set $env:CLOUDFLARE_API_TOKEN="<your_cloudflare_api_token>" and re-run.');
  }
  process.exit(1);
}
