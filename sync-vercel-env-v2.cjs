const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projects = [
    'hdmaster',
    'orderking-customers',
    'orderking-partners',
    'orderking-riders'
];

for (const project of projects) {
    // Some folders have capital letters locally, like HDmaster
    let folder = project;
    if (project === 'hdmaster') folder = 'HDmaster';

    console.log(`\n=== Syncing Environment for: ${project} ===`);
    const envPath = path.join(__dirname, folder, '.env');
    if (!fs.existsSync(envPath)) {
        console.log(`No .env found in ${folder}`);
        continue;
    }

    try {
        console.log(`Linking project ${project}...`);
        execSync(`npx vercel link --yes --project ${project}`, { 
            cwd: path.join(__dirname, folder), 
            stdio: 'ignore' 
        });
    } catch(e) {
        console.error(`Failed to link ${project}`);
        continue;
    }

    // Read the .env file
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;

        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;

        const key = line.substring(0, eqIdx).trim();
        let value = line.substring(eqIdx + 1).trim();

        if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.substring(1, value.length - 1);

        console.log(`Uploading ${key}...`);
        try {
            try {
                execSync(`npx vercel env rm ${key} production preview development -y`, { 
                    cwd: path.join(__dirname, folder), 
                    stdio: 'ignore' 
                });
            } catch(e) {}

            execSync(`npx vercel env add ${key} production,preview,development`, {
                cwd: path.join(__dirname, folder),
                input: value,
                stdio: ['pipe', 'ignore', 'ignore']
            });
            console.log(`  -> Successfully uploaded ${key}`);
        } catch (e) {
            console.error(`  -> Failed to upload ${key}`);
        }
    }
}
console.log('\nAll projects fully synced! Triggering deployments...');

for (const project of projects) {
    let folder = project === 'hdmaster' ? 'HDmaster' : project;
    try {
        console.log(`Deploying ${project}...`);
        execSync(`npx vercel --prod --yes`, {
            cwd: path.join(__dirname, folder),
            stdio: 'ignore'
        });
        console.log(` -> Successfully triggered deploy for ${project}`);
    } catch(e) {
        console.error(` -> Failed to deploy ${project}`);
    }
}
console.log('Done!');
