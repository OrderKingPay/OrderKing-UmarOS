const fs = require('fs');
const path = require('path');

const premiumCrownSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <circle cx="256" cy="256" r="240" fill="#0F172A" />
  <path d="M128 352h256v48H128zm0-32l-48-160 80 48 96-128 96 128 80-48-48 160z" fill="url(#goldGradient)" filter="url(#glow)"/>
  <circle cx="80" cy="160" r="24" fill="#FDE047" />
  <circle cx="256" cy="80" r="32" fill="#FDE047" />
  <circle cx="432" cy="160" r="24" fill="#FDE047" />
</svg>
`;

const apps = ['orderking-customers', 'orderking-partners', 'orderking-riders', 'orderking-hdmaster', 'Apps-integration-'];

apps.forEach(app => {
  const publicDir = path.join(__dirname, app, 'public');
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, 'favicon.svg'), premiumCrownSvg.trim());
    console.log('Wrote favicon.svg to', app);
    
    // Attempt to update __root.tsx or index.html to point to favicon.svg instead of favicon.ico
    const rootPath = path.join(__dirname, app, 'src', 'routes', '__root.tsx');
    if (fs.existsSync(rootPath)) {
      let content = fs.readFileSync(rootPath, 'utf8');
      content = content.replace(/href="\/favicon\.ico"/g, 'href="/favicon.svg"');
      fs.writeFileSync(rootPath, content);
      console.log('Updated __root.tsx in', app);
    }
  }
});
