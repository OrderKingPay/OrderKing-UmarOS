import fs from 'fs';

const apps = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders', 'Apps-integration-'];
apps.forEach(app => {
  const file = app + '/src/routes/__root.tsx';
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Force favicon to /logo.jpg
    content = content.replace(/href: config\.brand\.faviconUrl \|\| \"\/favicon\.svg\"/g, 'href: "/logo.jpg"');
    content = content.replace(/href: \"\/favicon\.svg\"/g, 'href: "/logo.jpg"');
    content = content.replace(/type: \"image\/svg\+xml\"/g, 'type: "image/jpeg"');
    
    // Force Apple Touch Icon
    if (!content.includes('apple-touch-icon')) {
      content = content.replace(/links: \[/, 'links: [\n          { rel: "apple-touch-icon", href: "/logo.jpg" },');
    }
    
    fs.writeFileSync(file, content);
    console.log("Patched " + file);
  }
});
