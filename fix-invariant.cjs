const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixAuthInvariant(dir) {
    const file = path.join(dir, 'scripts', 'check-auth-invariant.mjs');
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        if (!content.includes('process.env.VITE_SUPABASE_URL')) {
            content = content.replace(
                /if \(\!env\.VITE_SUPABASE_URL\)/,
                'if (!env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL)'
            );
            fs.writeFileSync(file, content);
            console.log(`Fixed ${file}`);
        }
    }
}

const apps = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders', 'Apps-integration-'];
for (const app of apps) {
    const appDir = path.join('C:\\Users\\hasan\\OrderKing', app);
    if (fs.existsSync(appDir)) {
        fixAuthInvariant(appDir);
    }
}
