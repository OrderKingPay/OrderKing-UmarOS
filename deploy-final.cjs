const { execSync } = require('child_process');

const apps = [
    { dir: "orderking-customers", siteId: "6729d1aa-430b-47ea-9eae-d02df111a0e8" },
    { dir: "Apps-integration-", siteId: "23fafe24-cdf2-4dc6-86e8-78455d9547e2" }
];

for (const app of apps) {
    const appDir = `C:/Users/hasan/OrderKing/${app.dir}`;
    try {
        console.log(`\n=== Deploying ${app.dir} ===`);
        const result = execSync(
            `npx netlify-cli deploy --build --prod --site ${app.siteId}`,
            { cwd: appDir, encoding: 'utf8', timeout: 600000, stdio: 'pipe' }
        );
        console.log(`SUCCESS: ${app.dir}`);
        const match = result.match(/Production URL:\s*(.+)/);
        if (match) console.log(match[0]);
    } catch (err) {
        console.log(`ERROR in ${app.dir}:`);
        const out = (err.stdout || '') + (err.stderr || '') + err.message;
        const lines = out.split('\n');
        console.log(lines.slice(-20).join('\n'));
    }
}
console.log('\n=== DONE ===');
