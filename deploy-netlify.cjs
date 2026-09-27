const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projects = [
    { folder: 'orderking-customers', name: 'orderking-customers-prod' },
    { folder: 'orderking-partners', name: 'orderking-partners-prod' },
    { folder: 'orderking-riders', name: 'orderking-riders-prod' },
    { folder: 'Apps-integration-', name: 'orderking-integration-prod' }
];

for (const p of projects) {
    const cwd = path.join('C:\\Users\\hasan\\OrderKing', p.folder);
    console.log(`\n=== Starting Netlify Deployment for ${p.folder} ===`);

    try {
        console.log(`Creating Site ${p.name}...`);
        try {
            execSync(`npx netlify-cli sites:create --name ${p.name} --account-slug orderkingpay`, { cwd, stdio: 'ignore' });
        } catch (e) {
            console.log(`Site might already exist or linking failed (this is usually fine if it linked).`);
        }

        console.log(`Importing Environment Variables...`);
        const envPath = path.join(cwd, '.env');
        if (fs.existsSync(envPath)) {
            execSync(`npx netlify-cli env:import .env`, { cwd, stdio: 'inherit' });
        } else {
            console.log(`No .env file found in ${p.folder}`);
        }

        console.log(`Deploying ${p.folder} to Production...`);
        execSync(`npx netlify-cli deploy --prod`, { cwd, stdio: 'inherit' });
        
        console.log(`Successfully deployed ${p.folder}!`);
    } catch (e) {
        console.error(`ERROR deploying ${p.folder}:`, e.message);
    }
}
console.log('\n=== All Netlify Deployments Triggered! ===');
