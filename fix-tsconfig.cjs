const fs = require('fs');

const apps = ["HDmaster", "orderking-customers", "orderking-partners", "orderking-riders", "Apps-integration-"];

for (const app of apps) {
    const path = `C:/Users/hasan/OrderKing/${app}/tsconfig.json`;
    if (!fs.existsSync(path)) continue;
    
    let content = fs.readFileSync(path, 'utf8');
    // Remove ignoreDeprecations line entirely
    content = content.replace(/\s*"ignoreDeprecations":\s*"[^"]*",?\n?/g, '\n');
    // Remove baseUrl line entirely
    content = content.replace(/\s*"baseUrl":\s*"\.",?\n?/g, '\n');
    
    fs.writeFileSync(path, content);
    console.log(`Fixed tsconfig for ${app}`);
}
