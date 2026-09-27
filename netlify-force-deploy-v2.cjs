const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const sites = [
    { folder: 'HDmaster', name: 'orderking-hdmaster-prod' },
    { folder: 'orderking-customers', name: 'orderking-customers-prod' },
    { folder: 'orderking-partners', name: 'orderking-partners-prod' },
    { folder: 'orderking-riders', name: 'orderking-riders-prod' },
    { folder: 'Apps-integration-', name: 'orderking-integration-prod' }
];

const sitesJson = execSync('npx netlify-cli api listSites', { encoding: 'utf8' });
const allSites = JSON.parse(sitesJson);

for (const s of sites) {
    const siteObj = allSites.find(x => x.name === s.name);
    if (!siteObj) continue;
    
    const cwd = path.join('C:\\Users\\hasan\\OrderKing', s.folder);
    console.log(`\n=== Deploying ${s.folder} ===`);
    try {
        execSync(`npx netlify-cli link --id ${siteObj.id}`, { cwd, stdio: 'ignore' });
        
        // Manual env injection
        const envPath = path.join(cwd, '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.trim() && !line.startsWith('#')) {
                    const idx = line.indexOf('=');
                    if (idx > 0) {
                        const key = line.substring(0, idx).trim();
                        let val = line.substring(idx + 1).trim();
                        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
                        // Escape quotes for bash/powershell inside execSync
                        const safeVal = val.replace(/"/g, '\\"');
                        try {
                            execSync(`npx netlify-cli env:set ${key} "${safeVal}"`, { cwd, stdio: 'ignore' });
                        } catch (e) {
                            console.log(`Warning: Failed to set ${key}`);
                        }
                    }
                }
            }
        }
        
        console.log(`Building and Deploying...`);
        execSync(`npx netlify-cli deploy --prod --build`, { cwd, stdio: 'inherit' });
        console.log(`SUCCESS!`);
    } catch (e) {
        console.error(`ERROR on ${s.folder}:`, e.message);
    }
}
