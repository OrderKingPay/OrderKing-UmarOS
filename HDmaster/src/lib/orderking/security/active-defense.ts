import { getSql } from '@/lib/db';

const ipBanCache = new Set<string>();
const violationCounts = new Map<string, number>();

export async function defenseShield(req: any, res: any, next: any) {
    const ip = req.headers['x-forwarded-for'] || '127.0.0.1';
    
    if (ipBanCache.has(ip)) {
        return res.status(403).json({ error: "Access Denied: IP Banned" });
    }

    try {
        const sql = await getSql();
        const check = await sql`SELECT 1 FROM ip_bans WHERE ip_address = ${ip} LIMIT 1`;
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
            await sql`INSERT INTO ip_bans (ip_address, reason, created_at) VALUES (${ip}, ${reason}, NOW()) ON CONFLICT DO NOTHING`;
        } catch(e) {}
    }
}
