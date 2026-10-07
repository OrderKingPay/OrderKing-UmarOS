/**
 * Geospatial Hotspot & Dispatch Optimization Engine
 * Processes live coordinate streams to identify geographic "Hot Zones".
 */

export interface Coordinate {
    lat: number;
    lng: number;
}

export interface OrderEvent {
    id: string;
    location: Coordinate;
    timestamp: number;
    value: number;
}

export interface RiderEvent {
    id: string;
    location: Coordinate;
    timestamp: number;
    status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

export interface HotZone {
    center: Coordinate;
    radius: number; // in meters
    score: number; // 0 to 100
    demandVolume: number;
    supplyVolume: number;
}

export interface RiderPayload {
    recommendedZones: HotZone[];
    timestamp: number;
}

class GridCell {
    latIndex: number;
    lngIndex: number;
    orders: number = 0;
    riders: number = 0;

    constructor(latIndex: number, lngIndex: number) {
        this.latIndex = latIndex;
        this.lngIndex = lngIndex;
    }
}

export class GeospatialHotspotEngine {
    // Spatial grid for fast aggregation. 
    // Example: ~1km x 1km cells
    private static readonly GRID_SIZE = 0.01; 
    
    private grid: Map<string, GridCell> = new Map();
    private readonly decayRate = 0.9; // For historical weighting
    
    // Process new order
    public processOrder(order: OrderEvent): void {
        const cellId = this.getCellId(order.location);
        let cell = this.grid.get(cellId);
        if (!cell) {
            const { latIndex, lngIndex } = this.getIndices(order.location);
            cell = new GridCell(latIndex, lngIndex);
            this.grid.set(cellId, cell);
        }
        cell.orders++;
    }

    // Process rider status
    public processRider(rider: RiderEvent): void {
        const cellId = this.getCellId(rider.location);
        let cell = this.grid.get(cellId);
        if (!cell) {
            const { latIndex, lngIndex } = this.getIndices(rider.location);
            cell = new GridCell(latIndex, lngIndex);
            this.grid.set(cellId, cell);
        }
        
        if (rider.status === 'AVAILABLE') {
            cell.riders++;
        }
    }

    // Compute hotspots
    public computeHotZones(): HotZone[] {
        const zones: HotZone[] = [];
        
        for (const [id, cell] of this.grid.entries()) {
            const demand = cell.orders;
            const supply = cell.riders;
            
            // Score based on high demand and low supply
            if (demand > 0) {
                // simple ratio score
                let ratio = demand / (supply > 0 ? supply : 0.1);
                let score = Math.min(100, (ratio * 10)); // normalized 0-100
                
                if (score > 30) {
                    zones.push({
                        center: this.getCellCenter(cell.latIndex, cell.lngIndex),
                        radius: 1000,
                        score: score,
                        demandVolume: demand,
                        supplyVolume: supply
                    });
                }
            }
            
            // Apply decay for next cycle
            cell.orders = Math.floor(cell.orders * this.decayRate);
            cell.riders = Math.floor(cell.riders * this.decayRate);
        }
        
        // Sort by highest score
        return zones.sort((a, b) => b.score - a.score);
    }

    // Generate Payload for Rider App
    public generateRiderPayload(): RiderPayload {
        return {
            recommendedZones: this.computeHotZones().slice(0, 5), // Top 5
            timestamp: Date.now()
        };
    }
    
    public clearState(): void {
        this.grid.clear();
    }

    // --- Helpers ---
    private getIndices(coord: Coordinate): { latIndex: number, lngIndex: number } {
        const latIndex = Math.floor(coord.lat / GeospatialHotspotEngine.GRID_SIZE);
        const lngIndex = Math.floor(coord.lng / GeospatialHotspotEngine.GRID_SIZE);
        return { latIndex, lngIndex };
    }
    
    private getCellId(coord: Coordinate): string {
        const { latIndex, lngIndex } = this.getIndices(coord);
        return `${latIndex},${lngIndex}`;
    }
    
    private getCellCenter(latIndex: number, lngIndex: number): Coordinate {
        return {
            lat: (latIndex + 0.5) * GeospatialHotspotEngine.GRID_SIZE,
            lng: (lngIndex + 0.5) * GeospatialHotspotEngine.GRID_SIZE
        };
    }
}
