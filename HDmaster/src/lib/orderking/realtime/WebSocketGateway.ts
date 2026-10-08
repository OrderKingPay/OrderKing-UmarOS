import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import * as jose from 'jose';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  subscriptions: Set<string>;
}

export class WebSocketGateway {
  private wss: WebSocketServer;
  private jwtSecret: Uint8Array;

  constructor(server: any, jwtSecretString: string) {
    this.wss = new WebSocketServer({ server });
    this.jwtSecret = new TextEncoder().encode(jwtSecretString);
    
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      ws.subscriptions = new Set<string>();

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);

          switch (data.type) {
            case 'authenticate':
              await this.handleAuthenticate(ws, data.token);
              break;
            case 'subscribe':
              this.handleSubscribe(ws, data.channel);
              break;
            case 'unsubscribe':
              this.handleUnsubscribe(ws, data.channel);
              break;
            default:
              ws.send(JSON.stringify({ error: 'Unknown message type' }));
          }
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message payload' }));
        }
      });

      ws.on('close', () => {
        ws.subscriptions.clear();
      });
    });
  }

  private async handleAuthenticate(ws: AuthenticatedWebSocket, token: string) {
    try {
      const { payload } = await jose.jwtVerify(token, this.jwtSecret);
      
      if (payload && payload.sub) {
        ws.userId = payload.sub;
        ws.send(JSON.stringify({ type: 'authenticated', status: 'success', userId: ws.userId }));
      } else {
        throw new Error('Invalid token payload');
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'authenticated', status: 'error', message: 'Authentication failed' }));
      ws.close(1008, 'Authentication failed');
    }
  }

  private handleSubscribe(ws: AuthenticatedWebSocket, channel: string) {
    if (!ws.userId) {
      ws.send(JSON.stringify({ error: 'Authentication required before subscribing' }));
      return;
    }
    
    // In a real production app, verify if the user is allowed to access this specific order
    // e.g., if channel is `order:123`, check if `ws.userId` is the owner or assigned rider
    
    ws.subscriptions.add(channel);
    ws.send(JSON.stringify({ type: 'subscribed', channel }));
  }

  private handleUnsubscribe(ws: AuthenticatedWebSocket, channel: string) {
    ws.subscriptions.delete(channel);
    ws.send(JSON.stringify({ type: 'unsubscribed', channel }));
  }

  private broadcastToChannel(channel: string, message: object) {
    const payload = JSON.stringify({ channel, data: message });
    
    for (const client of this.wss.clients as Set<AuthenticatedWebSocket>) {
      if (client.readyState === WebSocket.OPEN && client.subscriptions?.has(channel)) {
        client.send(payload);
      }
    }
  }

  // --- Exact Event Dispatchers ---

  /**
   * Dispatches real-time rider location
   */
  public emitRiderLocation(orderId: string, location: { lat: number; lng: number }, riderId: string) {
    const channel = `order:${orderId}`;
    this.broadcastToChannel(channel, {
      type: 'rider_location_updated',
      orderId,
      riderId,
      location,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Dispatches order status updates
   */
  public emitOrderStatus(orderId: string, status: string, metadata?: Record<string, any>) {
    const channel = `order:${orderId}`;
    this.broadcastToChannel(channel, {
      type: 'order_status_updated',
      orderId,
      status,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Dispatches Live AI Command Streaming
   */
  public emitAICommand(sessionId: string, command: any) {
    const channel = `ai_session:${sessionId}`;
    this.broadcastToChannel(channel, {
      type: 'ai_command_streamed',
      sessionId,
      command,
      timestamp: new Date().toISOString()
    });
  }
}
