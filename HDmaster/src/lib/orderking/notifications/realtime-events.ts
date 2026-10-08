import { getSql } from '../../db';

type SSEConnection = {
    write: (data: string) => void;
    end: () => void;
};

const activeConnections = new Map<string, Set<SSEConnection>>();

export function createSSEHandler() {
    return (req: any, res: any) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const orderId = url.searchParams.get('orderId');

        if (!orderId) {
            res.status(400).json({ error: 'orderId is required' });
            return;
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders();

        const connection: SSEConnection = {
            write: (data: string) => res.write(`data: ${data}\n\n`),
            end: () => res.end()
        };

        if (!activeConnections.has(orderId)) {
            activeConnections.set(orderId, new Set());
        }
        activeConnections.get(orderId)!.add(connection);

        req.on('close', () => {
            const connections = activeConnections.get(orderId);
            if (connections) {
                connections.delete(connection);
                if (connections.size === 0) {
                    activeConnections.delete(orderId);
                }
            }
        });
    };
}

export async function broadcastOrderUpdate(orderId: string, data: any) {
    const connections = activeConnections.get(orderId);
    if (connections) {
        const payload = JSON.stringify(data);
        for (const conn of connections) {
            conn.write(payload);
        }
    }
    
    const sql = await getSql();
    await sql`
        INSERT INTO order_realtime_events (order_id, event_data, created_at)
        VALUES (${orderId}, ${JSON.stringify(data)}, NOW())
    `;
}
