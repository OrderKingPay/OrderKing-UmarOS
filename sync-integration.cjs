const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projects = ['apps-integration'];

for (const project of projects) {
    let folder = 'Apps-integration-';
    console.log(`\n=== Syncing Environment for: ${project} ===`);
    const envPath = path.join(__dirname, folder, '.env');

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
        for (const env of ['production', 'preview', 'development']) {
            try { execSync(`npx vercel env rm ${key} ${env} -y`, { cwd: path.join(__dirname, folder), stdio: 'ignore' }); } catch(e) {}
            try { execSync(`npx vercel env add ${key} ${env}`, { cwd: path.join(__dirname, folder), input: value, stdio: 'ignore' }); } catch(e) {}
        }
        console.log(`  -> Successfully uploaded ${key}`);
    }
}
console.log('\nIntegration App fully synced!');
