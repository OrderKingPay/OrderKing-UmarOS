const fs = require('fs');

const apps = ['orderking-customers', 'orderking-partners', 'orderking-riders', 'HDmaster', 'Apps-integration-'];

for (const app of apps) {
    const p = app + '/src/routes/__root.tsx';
    if (fs.existsSync(p)) {
        let c = fs.readFileSync(p, 'utf8');
        c = c.replace(/href:\s*['"].*?(favicon\.svg|logo\.jpg|favicon\.ico)['"]/g, "href: '/icon-192.png'");
        c = c.replace(/type:\s*['"]image\/jpeg['"]/g, "type: 'image/png'");
        fs.writeFileSync(p, c);
    }
}
