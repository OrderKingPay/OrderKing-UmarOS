export interface FraudScore {
    userId: string;
    ipAddress: string;
    velocityScore: number;
    isShadowBanned: boolean;
    isIpBanned: boolean;
}

export class FraudDetectionSystem {
    // In-memory store for demonstration; in production, use Redis.
    private ipRequestCounts: Map<string, number[]> = new Map();
    private shadowBannedUsers: Set<string> = new Set();
    private bannedIps: Set<string> = new Set();

    private readonly VELOCITY_TIME_WINDOW_MS = 60 * 60 * 1000; // 1 hour
    private readonly MAX_ACCOUNTS_PER_IP_PER_WINDOW = 3;

    constructor() {}

    /**
     * Mathematically analyzes user velocity based on request timestamps
     * @param ipAddress The IP address of the user
     * @returns The velocity score (higher is more suspicious)
     */
    public analyzeVelocity(ipAddress: string): number {
        const now = Date.now();
        let requests = this.ipRequestCounts.get(ipAddress) || [];
        
        // Filter requests within the time window
        requests = requests.filter(timestamp => now - timestamp < this.VELOCITY_TIME_WINDOW_MS);
        
        // Record current request
        requests.push(now);
        this.ipRequestCounts.set(ipAddress, requests);

        // Simple mathematical velocity calculation: 
        // exponentially increasing score based on number of requests in window
        return Math.pow(requests.length, 1.5);
    }

    /**
     * Evaluates a user action (e.g., account creation, promo code usage)
     * @param userId The ID of the user
     * @param ipAddress The IP address of the user
     * @returns The FraudScore containing ban/shadow-ban status
     */
    public evaluateAction(userId: string, ipAddress: string): FraudScore {
        if (this.bannedIps.has(ipAddress)) {
            return this.buildScore(userId, ipAddress, Infinity, true, true);
        }

        const velocityScore = this.analyzeVelocity(ipAddress);

        // If velocity exceeds threshold, ban IP
        if (velocityScore > Math.pow(this.MAX_ACCOUNTS_PER_IP_PER_WINDOW, 1.5)) {
            this.banIp(ipAddress);
            return this.buildScore(userId, ipAddress, velocityScore, true, true);
        }

        // If user is already shadow banned
        if (this.shadowBannedUsers.has(userId)) {
            return this.buildScore(userId, ipAddress, velocityScore, true, false);
        }

        // Potential AI model scoring integration here
        // const aiScore = await this.callAIModel(userId, ipAddress);
        // if (aiScore > 0.9) { this.shadowBanUser(userId); }

        return this.buildScore(userId, ipAddress, velocityScore, false, false);
    }

    public shadowBanUser(userId: string): void {
        this.shadowBannedUsers.add(userId);
        console.log(`[Security] User ${userId} has been autonomously shadow-banned.`);
    }

    public banIp(ipAddress: string): void {
        this.bannedIps.add(ipAddress);
        console.log(`[Security] IP ${ipAddress} has been autonomously banned.`);
    }
    
    private buildScore(userId: string, ipAddress: string, velocityScore: number, isShadowBanned: boolean, isIpBanned: boolean): FraudScore {
        return { userId, ipAddress, velocityScore, isShadowBanned, isIpBanned };
    }
}

export const fraudDetectionMiddleware = (req: any, res: any, next: any) => {
    // Middleware implementation logic
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.body?.userId || req.user?.id || 'anonymous';
    
    const system = new FraudDetectionSystem();
    const score = system.evaluateAction(userId, ip);
    
    if (score.isIpBanned) {
        return res.status(403).json({ error: "Access denied." });
    }
    
    if (score.isShadowBanned) {
        // Silently alter behavior without letting the user know
        req.isShadowBanned = true;
    }
    
    next();
};
