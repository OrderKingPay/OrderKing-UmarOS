const { execSync } = require('child_process');
const apps = [
    { dir: "HDmaster", siteId: "1809652e-8dad-44ba-8bfa-67bafbfb2dfd" },
    { dir: "orderking-customers", siteId: "6729d1aa-430b-47ea-9eae-d02df111a0e8" }
];
for (const app of apps) {
    const appDir = `C:/Users/hasan/OrderKing/${app.dir}`;
    console.log(`\n=== Deploying ${app.dir} ===`);
    const result = execSync(`npx netlify-cli deploy --build --prod --site ${app.siteId}`, { cwd: appDir, encoding: 'utf8', timeout: 600000, stdio: 'pipe' });
    console.log(`SUCCESS: ${app.dir}`);
}
console.log('\n=== DONE ===');
