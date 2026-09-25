import fs from 'fs';
const file = 'orderking-customers/src/components/market/shell.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('to="/search" icon={Search} label={t("common.search")}', 'to="/king-pay" icon={Zap} label="King Pay"');
content = content.replace('active={path.startsWith("/search")}', 'active={path.startsWith("/king-pay")} highlight={true}');
fs.writeFileSync(file, content);

// Also remove sampleCatalogueBanner
const homeFile = 'orderking-customers/src/components/market/home-feed.tsx';
if (fs.existsSync(homeFile)) {
  let homeContent = fs.readFileSync(homeFile, 'utf8');
  homeContent = homeContent.replace(/config\.marketplace\.sampleCatalogueBanner/g, 'false');
  fs.writeFileSync(homeFile, homeContent);
}

// Remove LaunchMode development logic from defaults.ts to disable it entirely
const defaultsFile = 'orderking-customers/src/lib/config/defaults.ts';
if (fs.existsSync(defaultsFile)) {
  let defaultsContent = fs.readFileSync(defaultsFile, 'utf8');
  defaultsContent = defaultsContent.replace(/sampleCatalogueBanner:\s*true/g, 'sampleCatalogueBanner: false');
  defaultsContent = defaultsContent.replace(/launchMode:\s*"development"/g, 'launchMode: "production"');
  fs.writeFileSync(defaultsFile, defaultsContent);
}
