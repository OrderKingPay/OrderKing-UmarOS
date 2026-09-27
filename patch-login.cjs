const fs = require('fs');
const glob = require('fs').readdirSync;

const apps = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders', 'Apps-integration-'];

for (const app of apps) {
  const file = `${app}/src/routes/login.tsx`;
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('isVercel =')) {
    content = content.replace('function Login() {', 'function Login() {\n  const isVercel = typeof window !== "undefined" && window.location.hostname.includes("vercel.app");');
    content = content.replace('{authEnabled ? (', '{authEnabled && !isVercel ? (');
  }

  fs.writeFileSync(file, content, 'utf8');
}
console.log("Patched login pages.");
