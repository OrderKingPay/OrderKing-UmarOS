const { execSync } = require('child_process');

const projects = [
    { name: 'HDmaster', id: 'prj_VBAq00VVY15iJeYqdyD9M6EKmnia' },
    { name: 'orderking-customers', id: 'prj_XpA4dVXV3SDk1dLvPjG41Ql4cuHK' },
    { name: 'orderking-partners', id: 'prj_88Non9Fj2Wj3gOv5Fxy5oqj01IJc' },
    { name: 'orderking-riders', id: 'prj_o8VbqkihN97qixlGyMXmkrPp7xzz' },
    { name: 'Apps-integration-', id: 'prj_yPHdsG1138hOlmvIWoelWojnbnx4' }
];

console.log("Starting manual deployments for all 5 apps...");

for (const p of projects) {
    console.log(`\nDeploying ${p.name}...`);
    try {
        const cmd = `npx vercel --prod --yes --cwd "C:\\Users\\hasan\\OrderKing"`;
        const env = Object.assign({}, process.env, { 
            VERCEL_ORG_ID: 'team_O6yPVgIVJ76P6dr4OhCeVTnT', 
            VERCEL_PROJECT_ID: p.id 
        });
        const out = execSync(cmd, { env: env, encoding: 'utf8' });
        console.log(`Successfully deployed ${p.name}:\n${out}`);
    } catch (e) {
        console.error(`Failed to deploy ${p.name}:`);
        console.error(e.stderr || e.stdout || e.message);
    }
}
console.log("All deployments complete.");
