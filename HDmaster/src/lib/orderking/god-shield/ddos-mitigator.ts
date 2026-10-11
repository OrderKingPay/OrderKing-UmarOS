import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
    count: number;
    startTime: number;
}

const windowMs = 1000; // 1 second
const maxReqPerSec = 100;
const ipMap = new Map<string, RateLimitInfo>();

// Awaiting actual database driver mapping
async function banIpInDb(ip: string) {
    // In a real scenario, use Prisma/TypeORM/pg etc.
    console.log(`[DB] Executing: INSERT INTO banned_ips (ip, reason) VALUES ('${ip}', 'DDoS mitigation')`);
}

export function ddosMitigator(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (ip === 'unknown') return next();

    const now = Date.now();
    const info = ipMap.get(ip);

    if (!info) {
        ipMap.set(ip, { count: 1, startTime: now });
        return next();
    }

    if (now - info.startTime > windowMs) {
        info.count = 1;
        info.startTime = now;
        return next();
    }

    info.count++;
    if (info.count > maxReqPerSec) {
        // Asynchronously ban in DB
        banIpInDb(ip).catch(console.error);
        return res.status(429).send('Too Many Requests - Banned');
    }

    next();
}
