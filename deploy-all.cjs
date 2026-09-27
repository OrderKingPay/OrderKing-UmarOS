const { execSync } = require('child_process');

const apps = [
    { dir: "HDmaster", siteId: "1809652e-8dad-44ba-8bfa-67bafbfb2dfd" },
    { dir: "orderking-customers", siteId: "6729d1aa-430b-47ea-9eae-d02df111a0e8" },
    { dir: "orderking-partners", siteId: "41d88672-0551-488b-a6ee-1c6009d196d3" },
    { dir: "orderking-riders", siteId: "06046c0e-6c0b-4779-9f04-b9e24e8b48aa" },
    { dir: "Apps-integration-", siteId: "23fafe24-cdf2-4dc6-86e8-78455d9547e2" }
];

for (const app of apps) {
    const appDir = `C:/Users/hasan/OrderKing/${app.dir}`;
    try {
        console.log(`\n=== Deploying ${app.dir} ===`);
        const result = execSync(
            `npx netlify-cli deploy --build --prod --site ${app.siteId} --dir . --message "Production deploy - Zomato killer platform"`,
            { cwd: appDir, encoding: 'utf8', timeout: 600000, stdio: 'pipe' }
        );
        console.log(`SUCCESS: ${app.dir}`);
        console.log(result);
    } catch (err) {
        console.log(`ERROR in ${app.dir}:`);
        console.log(err.stdout || err.message);
    }
}
