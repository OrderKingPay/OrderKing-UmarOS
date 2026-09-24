import fs from 'fs';
const files = [
  'HDmaster/src/lib/auth/server.ts',
  'orderking-customers/src/lib/auth/server.ts',
  'orderking-partners/src/lib/auth/server.ts',
  'orderking-riders/src/lib/auth/server.ts',
  'Apps-integration-/src/lib/auth/server.ts'
];
for (const p of files) {
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf8');
    
    // Replace trustedOrigins definition
    const newTrustedOrigins = `const trustedOrigins: string[] = [
  ...(explicitBaseURL ? [explicitBaseURL] : []),
  ...LOCAL_DEV_ORIGINS,
  ...previewAllowedHosts,
  ...previewAllowedHosts.flatMap((host) => [\`https://\${host}\`, \`http://\${host}\`]),
  ...(process.env.VERCEL_URL ? [\`https://\${process.env.VERCEL_URL}\`] : []),
  ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [\`https://\${process.env.VERCEL_PROJECT_PRODUCTION_URL}\`] : []),
  'https://hdmaster.vercel.app',
  'https://orderking-customers.vercel.app',
  'https://orderking-partners.vercel.app',
  'https://orderking-riders.vercel.app',
  'https://apps-integration.vercel.app'
];`;
    c = c.replace(/const trustedOrigins: string\[\] = explicitBaseURL[\s\S]*?\.\.\.LOCAL_DEV_ORIGINS,\s*\];/m, newTrustedOrigins);
    
    // Also update baseURL allowedHosts to allow vercel.app
    c = c.replace(/allowedHosts: \[\.\.\.previewAllowedHosts, "localhost", "127\.0\.0\.1", "\[::1\]"\],/, 'allowedHosts: [...previewAllowedHosts, "localhost", "127.0.0.1", "[::1]", "*.vercel.app"],');

    fs.writeFileSync(p, c);
    console.log('Patched', p);
  }
}
