import { EventEmitter } from "events";
import { Readable } from "stream";

/**
 * Task 1.2 [Event Streaming Hub]
 * Server-Sent Events (SSE) hub for Supreme Founder AI.
 */
class SSEHub extends EventEmitter {
  private static instance: SSEHub;
  
  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): SSEHub {
    if (!SSEHub.instance) {
      SSEHub.instance = new SSEHub();
    }
    return SSEHub.instance;
  }

  public broadcast(event: string, data: any) {
    this.emit(event, data);
  }

  public createStream(eventName: string): Readable {
    const stream = new Readable({
      read() {}
    });

    const listener = (data: any) => {
      stream.push(`data: ${JSON.stringify(data)}\n\n`);
    };

    this.on(eventName, listener);

    stream.on('close', () => {
      this.off(eventName, listener);
    });

    return stream;
  }
}

export const sseHub = SSEHub.getInstance();
