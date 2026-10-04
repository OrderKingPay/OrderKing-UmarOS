const fs = require('fs');
const apps = ['orderking-customers', 'orderking-riders', 'orderking-partners', 'HDmaster', 'Apps-integration-'];
let count = 0;

for (const app of apps) {
  const path = `C:/Users/hasan/OrderKing/${app}/src/lib/auth/client.ts`;
  if (!fs.existsSync(path)) continue;
  let code = fs.readFileSync(path, 'utf8');
  if (code.includes('baseURL: getBaseURL()')) continue;

  const replaceCode = `const getBaseURL = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (typeof process !== "undefined" && process.env) {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return \`https://\${process.env.VERCEL_PROJECT_PRODUCTION_URL}\`;
    if (process.env.VERCEL_URL) return \`https://\${process.env.VERCEL_URL}\`;
  }
  return process.env.BETTER_AUTH_URL || "http://localhost:8080";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),`;

  code = code.replace(/export const authClient = createAuthClient\(\{\s*/, replaceCode + '\n  ');
  fs.writeFileSync(path, code);
  console.log('Fixed', path);
  count++;
}
console.log('Total fixed:', count);
