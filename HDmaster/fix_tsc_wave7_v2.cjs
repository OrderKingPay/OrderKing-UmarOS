const fs = require('fs');
const file2 = 'src/lib/orderking/command/founder-command-router.server.ts';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(/result = await sql\(intent\.params\.query as string\);/g, 'result = "Query execution disabled to protect DB";');
fs.writeFileSync(file2, code2);

const file3 = 'src/routes/api/ai/chat.ts';
if (fs.existsSync(file3)) {
    let code3 = fs.readFileSync(file3, 'utf8');
    // The previous fix replaced return limitRes with new Response...
    // Let's just completely replace the whole rate limit block to make it compile 100%.
    code3 = code3.replace(/const limitRes = checkRateLimit.*?;/g, 'const limitRes = checkRateLimit(ip, 5, 60000);');
    code3 = code3.replace(/if \(\!limitRes\.allowed\).*?\{[\s\S]*?\}/g, 'if (!limitRes.allowed) { return new Response(JSON.stringify(limitRes), { status: 429 }); }');
    fs.writeFileSync(file3, code3);
}
