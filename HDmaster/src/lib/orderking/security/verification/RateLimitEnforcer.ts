export class RateLimitEnforcer {
    private requests: Map<string, number[]>;
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number = 60000, maxRequests: number = 100) {
        this.requests = new Map();
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    public check(ip: string): boolean {
        const now = Date.now();
        const userRequests = this.requests.get(ip) || [];
        
        // Filter out requests outside the window
        const recentRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
        
        if (recentRequests.length >= this.maxRequests) {
            this.requests.set(ip, recentRequests);
            return false; // Rate limit exceeded
        }
        
        recentRequests.push(now);
        this.requests.set(ip, recentRequests);
        return true; // Allowed
    }

    public enforce(req: any, res: any, next: any) {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        if (!this.check(ip)) {
            return res.status(429).json({ error: 'Too Many Requests - Brute-force protection triggered.' });
        }
        next();
    }
}
