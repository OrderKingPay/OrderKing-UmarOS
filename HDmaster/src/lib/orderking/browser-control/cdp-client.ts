export class BrowserSession {
  private ws!: WebSocket;
  private messageId = 0;
  private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  constructor(private wsUrl: string) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data.toString());
        if (data.id && this.pendingRequests.has(data.id)) {
          if (data.error) {
            this.pendingRequests.get(data.id)!.reject(data.error);
          } else {
            this.pendingRequests.get(data.id)!.resolve(data.result);
          }
          this.pendingRequests.delete(data.id);
        }
      };
    });
  }

  async sendCommand(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.messageId++;
      this.pendingRequests.set(this.messageId, { resolve, reject });
      this.ws.send(JSON.stringify({
        id: this.messageId,
        method,
        params,
      }));
    });
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}
