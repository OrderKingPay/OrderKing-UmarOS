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

console.log("Fetching site IDs from Netlify...");
const sitesJson = execSync('npx netlify-cli api listSites', { encoding: 'utf8' });
const allSites = JSON.parse(sitesJson);

for (const s of sites) {
    const siteObj = allSites.find(x => x.name === s.name);
    if (!siteObj) {
        console.log(`Site ${s.name} not found!`);
        continue;
    }
    const siteId = siteObj.id;
    const cwd = path.join('C:\\Users\\hasan\\OrderKing', s.folder);
    console.log(`\n=== Deploying ${s.folder} (Site ID: ${siteId}) ===`);
    
    try {
        console.log(`Linking...`);
        execSync(`npx netlify-cli link --id ${siteId}`, { cwd, stdio: 'ignore' });
        
        console.log(`Importing env...`);
        if (fs.existsSync(path.join(cwd, '.env'))) {
            execSync(`npx netlify-cli env:import .env`, { cwd, stdio: 'ignore' });
        }
        
        console.log(`Deploying to production... (this takes 60 seconds)`);
        execSync(`npx netlify-cli deploy --prod --build`, { cwd, stdio: 'inherit' });
        
        console.log(`SUCCESS: ${s.name} is LIVE!`);
    } catch (e) {
        console.error(`Failed to deploy ${s.folder}:`, e.message);
    }
}
