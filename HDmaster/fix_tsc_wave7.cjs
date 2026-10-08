const fs = require('fs');
const file1 = 'src/lib/orderking/config/feature-flags.server.ts';
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace(/const sql = getSql\(\);/g, 'const sql = await getSql();');
fs.writeFileSync(file1, code1);

const file2 = 'src/lib/orderking/command/founder-command-router.server.ts';
let code2 = fs.readFileSync(file2, 'utf8');
// remove .unsafe
code2 = code2.replace(/sql\.unsafe/g, 'sql');
code2 = code2.replace(/await getSql\(\)/g, 'await getSql()'); // Just in case
if (!code2.includes('const sql = await getSql()')) {
    code2 = code2.replace(/const sql = getSql\(\)/g, 'const sql = await getSql()');
}
fs.writeFileSync(file2, code2);

const file3 = 'src/routes/api/ai/chat.ts';
if (fs.existsSync(file3)) {
    let code3 = fs.readFileSync(file3, 'utf8');
    // Fix return type by wrapping JSON in Response
    code3 = code3.replace(/return limitRes;/g, 'return new Response(JSON.stringify(limitRes), { status: 429, headers: { "Content-Type": "application/json" } });');
    // Fix string to number
    code3 = code3.replace(/checkRateLimit\(ip, 5, '10m'\)/g, 'checkRateLimit(ip, 5, 10 * 60 * 1000)');
    code3 = code3.replace(/checkRateLimit\(ip, 5, '1m'\)/g, 'checkRateLimit(ip, 5, 60 * 1000)');
    code3 = code3.replace(/checkRateLimit\(ip, 5, "10m"\)/g, 'checkRateLimit(ip, 5, 10 * 60 * 1000)');
    // If there's an IP check where string is passed instead of windowMs
    code3 = code3.replace(/checkRateLimit\(.*?,.*?,.*?['"].*?['"].*?\)/g, "checkRateLimit(ip, 10, 60000)"); // rough fallback
    fs.writeFileSync(file3, code3);
}
