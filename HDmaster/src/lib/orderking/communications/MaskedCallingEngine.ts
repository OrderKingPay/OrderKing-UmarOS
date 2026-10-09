export class MaskedCallingEngine {
    constructor(private provider: CallProvider) {}

    async initiateMaskedCall(riderId: string, customerId: string, orderId: string): Promise<CallSession> {
        // 1. Fetch real numbers securely from DB
        const riderNumber = await this.getRealNumber(riderId);
        const customerNumber = await this.getRealNumber(customerId);

        // 2. Provision a temporary proxy number for this session
        const proxyNumber = await this.provider.provisionProxyNumber();

        // 3. Create a routing map for this proxy number
        await this.saveCallRouting(proxyNumber, riderNumber, customerNumber, orderId);

        return {
            proxyNumber,
            status: 'PROVISIONED',
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
        };
    }

    async handleIncomingCallToProxy(incomingNumber: string, proxyNumber: string): Promise<RoutingDecision> {
        const session = await this.getRoutingSession(proxyNumber);
        
        if (!session) {
            return { action: 'REJECT', reason: 'Invalid or expired proxy number' };
        }

        if (incomingNumber === session.riderNumber) {
            // Forward to customer
            return { action: 'FORWARD', targetNumber: session.customerNumber, callerId: proxyNumber };
        } else if (incomingNumber === session.customerNumber) {
            // Forward to rider
            return { action: 'FORWARD', targetNumber: session.riderNumber, callerId: proxyNumber };
        } else {
            return { action: 'REJECT', reason: 'Unauthorized caller' };
        }
    }

    private async getRealNumber(userId: string): Promise<string> {
        const { getSql } = await import("../../db");
        const sql = await getSql();
        const rows = await sql<{ phone: string }>`SELECT phone FROM "user" WHERE id = ${userId} LIMIT 1`;
        if (rows.length === 0) throw new Error("User not found");
        return rows[0].phone;
    }

    private async saveCallRouting(proxyNumber: string, riderNumber: string, customerNumber: string, orderId: string) {
        const { getSql } = await import("../../db");
        const sql = await getSql();
        await sql`
            INSERT INTO call_routings (proxy_number, rider_number, customer_number, order_id, expires_at)
            VALUES (${proxyNumber}, ${riderNumber}, ${customerNumber}, ${orderId}, NOW() + INTERVAL '2 hours')
        `;
    }

    private async getRoutingSession(proxyNumber: string) {
        const { getSql } = await import("../../db");
        const sql = await getSql();
        const rows = await sql<{ rider_number: string, customer_number: string }>`
            SELECT rider_number, customer_number 
            FROM call_routings 
            WHERE proxy_number = ${proxyNumber} AND expires_at > NOW() 
            LIMIT 1
        `;
        if (rows.length === 0) return null;
        return {
            riderNumber: rows[0].rider_number,
            customerNumber: rows[0].customer_number
        };
    }
}

export interface CallProvider {
    provisionProxyNumber(): Promise<string>;
}

export interface CallSession {
    proxyNumber: string;
    status: string;
    expiresAt: Date;
}

export interface RoutingDecision {
    action: 'FORWARD' | 'REJECT';
    targetNumber?: string;
    callerId?: string;
    reason?: string;
}
