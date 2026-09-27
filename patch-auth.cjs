const fs = require('fs');
const glob = require('fs').readdirSync; // not actually glob, but we can just list the apps

const apps = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders', 'Apps-integration-'];

for (const app of apps) {
  const file = `${app}/src/lib/auth/server.ts`;
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Replace dynamic baseURL allowedHosts
  content = content.replace(
    /allowedHosts: \[\.\.\.previewAllowedHosts, "localhost", "127\.0\.0\.1", "\[::1\]", "\*\.vercel\.app"\],/,
    `allowedHosts: [
      ...previewAllowedHosts, 
      "localhost", 
      "127.0.0.1", 
      "[::1]",
      ...(process.env.VERCEL_URL ? [process.env.VERCEL_URL] : []),
      ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [process.env.VERCEL_PROJECT_PRODUCTION_URL] : []),
      "hdmaster.vercel.app",
      "orderking-customers.vercel.app",
      "orderking-partners.vercel.app",
      "orderking-riders.vercel.app",
      "apps-integration.vercel.app"
    ],`
  );

  fs.writeFileSync(file, content, 'utf8');
}
console.log("Patched auth servers.");
