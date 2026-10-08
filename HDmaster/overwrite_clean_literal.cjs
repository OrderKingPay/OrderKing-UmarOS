const fs = require('fs');

// 1. Demand Forecaster Fix
const forecasterCode = `import { getSql } from '@/lib/db';

export async function forecastNextHourDemand(zoneId: string): Promise<number> {
    const sql = await getSql();
    
    // Simulate complex demand forecasting by returning a baseline calculation
    // Instead of raw sql string passing which breaks Neon types, we use safe templating.
    const result = await sql\`
        SELECT count(id) as recent_orders 
        FROM orders 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
    \`;
    
    const recentOrders = result[0]?.recent_orders ? Number(result[0].recent_orders) : 0;
    
    // Simple Exponential Smoothing logic mock:
    const alpha = 0.3;
    const historicalBaseline = 10; 
    
    const projectedDemand = (alpha * recentOrders) + ((1 - alpha) * historicalBaseline);
    
    // Convert projected orders to required riders (assuming 1 rider handles ~2 orders/hr)
    const requiredRiders = Math.max(1, Math.ceil(projectedDemand / 2));
    
    return requiredRiders;
}
`;
fs.writeFileSync('src/lib/orderking/data/demand-forecaster.ts', forecasterCode);

// 2. Active Defense Fix
const defenseCode = `import { getSql } from '@/lib/db';

const ipBanCache = new Set<string>();
const violationCounts = new Map<string, number>();

export async function defenseShield(req: any, res: any, next: any) {
    const ip = req.headers['x-forwarded-for'] || '127.0.0.1';
    
    if (ipBanCache.has(ip)) {
        return res.status(403).json({ error: "Access Denied: IP Banned" });
    }

    try {
        const sql = await getSql();
        const check = await sql\`SELECT 1 FROM ip_bans WHERE ip_address = \${ip} LIMIT 1\`;
        if (check.length > 0) {
            ipBanCache.add(ip);
            return res.status(403).json({ error: "Access Denied: IP Banned" });
        }
    } catch (e) {
        // fail open if DB is down
    }

    next();
}

export async function flagViolation(ip: string, reason: string) {
    const count = (violationCounts.get(ip) || 0) + 1;
    violationCounts.set(ip, count);

    if (count >= 5 && !ipBanCache.has(ip)) {
        ipBanCache.add(ip);
        try {
            const sql = await getSql();
            await sql\`INSERT INTO ip_bans (ip_address, reason, created_at) VALUES (\${ip}, \${reason}, NOW()) ON CONFLICT DO NOTHING\`;
        } catch(e) {}
    }
}
`;
fs.writeFileSync('src/lib/orderking/security/active-defense.ts', defenseCode);
