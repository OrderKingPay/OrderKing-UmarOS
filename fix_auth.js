const fs = require('fs');
const path = require('path');

const apps = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders'];
const urls = {
  'HDmaster': 'https://orderking-hdmaster.netlify.app',
  'orderking-customers': 'https://orderking.netlify.app',
  'orderking-partners': 'https://orderking-partners.netlify.app',
  'orderking-riders': 'https://orderking-riders.netlify.app'
};

apps.forEach(app => {
  const libDir = path.join('C:/Users/hasan/OrderKing', app, 'src', 'lib', 'auth');
  const libDirAlt = path.join('C:/Users/hasan/OrderKing', app, 'src', 'lib');
  
  [libDir, libDirAlt].forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.includes('auth') && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            const fp = path.join(dir, file);
            let content = fs.readFileSync(fp, 'utf8');
            
            if (content.includes('betterAuth({')) {
              if (!content.includes('baseURL:')) {
                 content = content.replace('betterAuth({', 'betterAuth({\n  baseURL: "' + urls[app] + '",');
                 fs.writeFileSync(fp, content);
                 console.log('Fixed betterAuth baseURL in ' + fp);
              }
            }
            
            if (content.includes('createAuthClient({')) {
              if (!content.includes('baseURL:')) {
                 content = content.replace('createAuthClient({', 'createAuthClient({\n  baseURL: "' + urls[app] + '",');
                 fs.writeFileSync(fp, content);
                 console.log('Fixed createAuthClient baseURL in ' + fp);
              }
            }
          }
        });
      }
  });
});
