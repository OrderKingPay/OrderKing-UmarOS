import { Request, Response, NextFunction } from 'express';

// Assuming getSql is provided by the project's db utilities.
// Update the import path as necessary for the project.
import { getSql } from '../../db';

// In-memory cache for banned IPs to ensure sub-millisecond checks
const bannedIpsCache = new Set<string>();
let isCacheLoaded = false;

// In-memory tracker for rate limit violations (HTTP 429)
// Format: IP -> { count: number, resetTime: number }
const rateLimitTracker = new Map<string, { count: number, resetTime: number }>();

// SQL Injection basic payload patterns
const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i
];

/**
 * Loads banned IPs from the database into the in-memory cache.
 */
async function loadBannedIps() {
    try {
        const db = getSql();
        // Create table if it doesn't exist (optional, for absolute realism)
        await db`
            CREATE TABLE IF NOT EXISTS ip_bans (
                ip VARCHAR(45) PRIMARY KEY,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        const rows = await db`SELECT ip FROM ip_bans`;
        for (const row of rows) {
            bannedIpsCache.add(row.ip);
        }
        isCacheLoaded = true;
    } catch (error) {
        console.error('Failed to load banned IPs from database:', error);
    }
}

/**
 * Bans an IP address, adds it to the database and in-memory cache.
 */
async function banIp(ip: string, reason: string) {
    if (bannedIpsCache.has(ip)) return; // Already banned

    bannedIpsCache.add(ip);
    console.warn(`[Active Defense] Banning IP: ${ip} - Reason: ${reason}`);

    try {
        const db = getSql();
        await db`
            INSERT INTO ip_bans (ip, reason, created_at)
            VALUES (${ip}, ${reason}, NOW())
            ON CONFLICT (ip) DO NOTHING
        `;
    } catch (error) {
        console.error(`[Active Defense] Failed to insert banned IP (${ip}) into database:`, error);
    }
}

/**
 * Checks if the request contains SQL injection payloads in the query, body, or params.
 */
function containsSqlInjection(req: Request): boolean {
    const payload = JSON.stringify({ query: req.query, body: req.body, params: req.params });
    return sqlInjectionPatterns.some(pattern => pattern.test(payload));
}

/**
 * Middleware: Active Defense Shield
 */
export async function defenseShield(req: Request, res: Response, next: NextFunction) {
    // Load cache on first request if not already loaded
    if (!isCacheLoaded) {
        await loadBannedIps();
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // 1. Instantly drop connections from banned IPs
    if (bannedIpsCache.has(ip)) {
        res.socket?.destroy(); // Instantly drop connection
        return;
    }

    // 2. Check for SQL Injection payloads
    if (containsSqlInjection(req)) {
        await banIp(ip, 'SQL Injection Attempt');
        res.socket?.destroy();
        return;
    }

    // 3. Monitor for Rate Limiter (HTTP 429) abuses
    // We intercept the res.status() to detect 429s.
    const originalStatus = res.status;
    res.status = function (statusCode: number): Response {
        if (statusCode === 429) {
            handleRateLimitViolation(ip);
        }
        return originalStatus.call(this, statusCode);
    };

    next();
}

/**
 * Handles rate limit violations. If > 5 times in 1 hour, ban the IP.
 */
function handleRateLimitViolation(ip: string) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    let tracker = rateLimitTracker.get(ip);
    if (!tracker || tracker.resetTime < now) {
        tracker = { count: 1, resetTime: now + oneHour };
    } else {
        tracker.count++;
    }

    rateLimitTracker.set(ip, tracker);

    if (tracker.count > 5) {
        banIp(ip, 'Rate Limit Abuse (> 5 HTTP 429s in 1 hour)');
        rateLimitTracker.delete(ip); // Clean up tracker after ban
    }
}
