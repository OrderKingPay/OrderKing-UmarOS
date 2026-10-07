const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const scanPath = (dir, results = []) => {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('.turbo') && !fullPath.includes('dist')) {
                    scanPath(fullPath, results);
                }
            } else {
                results.push(fullPath);
            }
        }
    } catch(e) {}
    return results;
};

const allFiles = scanPath(process.cwd());

const findReferences = (regexStr) => {
    const regex = new RegExp(regexStr, 'i');
    return allFiles.filter(f => {
        if (!f.endsWith('.ts') && !f.endsWith('.tsx') && !f.endsWith('.json') && !f.endsWith('.md')) return false;
        try {
            const content = fs.readFileSync(f, 'utf8');
            return regex.test(content);
        } catch(e) { return false; }
    });
};

const checkImplementationState = (domain, keywordRegex, hasConfig) => {
    const refs = findReferences(keywordRegex);
    const hasImplementation = refs.some(f => f.includes('src') && (f.endsWith('.ts') || f.endsWith('.tsx')));
    
    if (!hasImplementation) return 'NOT AVAILABLE';
    if (hasConfig) return 'REQUIRES CREDENTIAL';
    return 'IMPLEMENTABLE NOW';
};

const report = {
    AI_Providers: {
        Gemini: checkImplementationState('Gemini', '@google/genai', true),
        OpenAI: checkImplementationState('OpenAI', 'openai', true),
        Anthropic: checkImplementationState('Anthropic', '@anthropic-ai', true)
    },
    Payments: {
        Stripe: checkImplementationState('Stripe', 'stripe', true),
        Razorpay: checkImplementationState('Razorpay', 'razorpay', true),
        CashFree: checkImplementationState('CashFree', 'cashfree', true)
    },
    Maps_Logistics: {
        GoogleMaps: checkImplementationState('GoogleMaps', 'google-map|maps.googleapis.com', true),
        Mapbox: checkImplementationState('Mapbox', 'mapbox', true),
        PostGIS: checkImplementationState('PostGIS', 'postgis|geometry|ST_MakePoint', false)
    },
    Databases: {
        Neon: checkImplementationState('Neon', '@neondatabase', true),
        PGLite: checkImplementationState('PGLite', 'pglite', false),
        Redis: checkImplementationState('Redis', 'redis|upstash', true),
    },
    Integrations: {
        WhatsApp: checkImplementationState('WhatsApp', 'whatsapp|twilio', true),
        BBPS: checkImplementationState('BBPS', 'bbps', true)
    }
};

fs.writeFileSync('capability_scan.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
