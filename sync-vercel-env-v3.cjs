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
    let folder = project === 'hdmaster' ? 'HDmaster' : project;
    console.log(`\n=== Syncing Environment for: ${project} ===`);
    const envPath = path.join(__dirname, folder, '.env');
    if (!fs.existsSync(envPath)) continue;

    execSync(`npx vercel link --yes --project ${project}`, { cwd: path.join(__dirname, folder), stdio: 'ignore' });
    const content = fs.readFileSync(envPath, 'utf8');

    for (let line of content.split('\n')) {
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
            try { execSync(`npx vercel env rm ${key} "production,preview,development" -y`, { cwd: path.join(__dirname, folder), stdio: 'ignore' }); } catch(e) {}
            execSync(`npx vercel env add ${key} "production,preview,development"`, { cwd: path.join(__dirname, folder), input: value, stdio: 'ignore' });
            console.log(`  -> Successfully uploaded ${key}`);
        } catch (e) {
            console.error(`  -> Failed to upload ${key}`);
        }
    }
}
console.log('\nAll projects fully synced! Vercel will automatically redeploy via GitHub.');
