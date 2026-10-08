import { IoTBroker } from './mqtt-broker';

export interface SyncPayload {
  edgeNodeId: string;
  state: Record<string, any>;
  version: number;
  timestamp: number;
}

export interface SyncConflict {
  edgeNodeId: string;
  serverVersion: number;
  edgeVersion: number;
  resolvedState: Record<string, any>;
}

export class EdgeStateSync {
  private broker: IoTBroker;
  private serverState: Map<string, SyncPayload> = new Map();
  private systemId: string = 'central-os';

  constructor(broker: IoTBroker) {
    this.broker = broker;
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.broker.subscribe(this.systemId, 'edge/+/sync/up', (message) => {
      this.handleSyncUp(message.payload);
    });
  }

  private handleSyncUp(payload: SyncPayload) {
    const { edgeNodeId, version, state } = payload;
    const current = this.serverState.get(edgeNodeId);

    if (!current || version > current.version) {
      // Accept new state
      this.serverState.set(edgeNodeId, { ...payload });
      // Acknowledge sync
      this.broker.publish(`edge/${edgeNodeId}/sync/ack`, { version });
    } else if (version < current.version) {
      // Conflict: Edge is behind, send resolution down
      const conflict: SyncConflict = {
        edgeNodeId,
        serverVersion: current.version,
        edgeVersion: version,
        resolvedState: current.state
      };
      this.broker.publish(`edge/${edgeNodeId}/sync/conflict`, conflict);
    }
  }

  /**
   * Pushes state changes down to a specific edge node.
   */
  public pushStateDown(edgeNodeId: string, partialState: Record<string, any>) {
    const current = this.serverState.get(edgeNodeId) || {
      edgeNodeId,
      state: {},
      version: 0,
      timestamp: Date.now()
    };
    
    current.state = { ...current.state, ...partialState };
    current.version += 1;
    current.timestamp = Date.now();
    
    this.serverState.set(edgeNodeId, current);
    
    this.broker.publish(`edge/${edgeNodeId}/sync/down`, {
      version: current.version,
      state: current.state,
      timestamp: current.timestamp
    });
  }
  
  public getEdgeState(edgeNodeId: string): SyncPayload | undefined {
    return this.serverState.get(edgeNodeId);
  }
}
