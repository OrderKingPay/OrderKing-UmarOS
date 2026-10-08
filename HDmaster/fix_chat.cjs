const fs = require('fs');
const file = 'src/routes/api/ai/chat.ts';
if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    // The security agent exported checkRateLimit and createRateLimitMiddleware.
    // Let's replace the import and usage.
    code = code.replace(/enforceRateLimit/g, 'checkRateLimit');
    fs.writeFileSync(file, code);
}
