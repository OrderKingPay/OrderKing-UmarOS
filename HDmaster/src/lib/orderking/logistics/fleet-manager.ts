export interface Rider {
    id: string;
    name: string;
    status: 'AVAILABLE' | 'ON_SHIFT' | 'OFF_DUTY';
    currentStationId?: string;
    reliabilityScore: number;
}

export interface Shift {
    id: string;
    stationId: string;
    startTime: Date;
    endTime: Date;
    requiredRiders: number;
    assignedRiders: string[];
}

export interface DemandForecast {
    stationId: string;
    predictedOrderVolume: number;
    recommendedRiders: number;
}

export class AutonomousFleetEngine {
    private riders: Map<string, Rider> = new Map();
    private shifts: Map<string, Shift> = new Map();

    constructor() {
        // Initialize with some dummy data or rely on a DB injection in a real system
    }

    /**
     * Uses historical demand to autonomously assign Riders to physical stations 
     * for upcoming shifts without human dispatchers.
     * @param stationId The ID of the station to predict and assign shifts for.
     */
    public predictiveShiftAssignment(stationId: string): Shift[] {
        // 1. Fetch historical demand (mocked here as a prediction)
        const forecast = this.getDemandForecast(stationId);

        // 2. Determine required shifts based on the forecast
        const upcomingShifts = this.generateUpcomingShifts(stationId, forecast.recommendedRiders);

        // 3. Autonomously assign riders to these shifts
        for (const shift of upcomingShifts) {
            this.assignRidersToShift(shift);
        }

        return upcomingShifts;
    }

    private getDemandForecast(stationId: string): DemandForecast {
        // In a real system, this would run a complex ML model on historical order data,
        // weather, events, and traffic. Here we mock a prediction.
        console.log(`[AutonomousFleetEngine] Analyzing historical data for station: ${stationId}`);
        const predictedVolume = Math.floor(Math.random() * 500) + 100; // 100 to 600 orders
        
        // Assume 1 rider can handle 20 orders in a shift
        const recommendedRiders = Math.ceil(predictedVolume / 20);
        
        return {
            stationId,
            predictedOrderVolume: predictedVolume,
            recommendedRiders: recommendedRiders
        };
    }

    private generateUpcomingShifts(stationId: string, requiredRiders: number): Shift[] {
        // Generate a mock shift for the next day
        const now = new Date();
        const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0); // 8 AM tomorrow
        const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 16, 0, 0); // 4 PM tomorrow

        const shift: Shift = {
            id: `shift_${stationId}_${startTime.getTime()}`,
            stationId,
            startTime,
            endTime,
            requiredRiders,
            assignedRiders: []
        };

        this.shifts.set(shift.id, shift);
        return [shift];
    }

    private assignRidersToShift(shift: Shift): void {
        const availableRiders = this.getAvailableRiders();
        
        // Sort by reliability score (highest first)
        availableRiders.sort((a, b) => b.reliabilityScore - a.reliabilityScore);

        let assignedCount = 0;
        for (const rider of availableRiders) {
            if (assignedCount >= shift.requiredRiders) {
                break; // Shift filled
            }

            // Assign rider
            shift.assignedRiders.push(rider.id);
            rider.status = 'ON_SHIFT';
            rider.currentStationId = shift.stationId;
            
            console.log(`[AutonomousFleetEngine] Autonomously assigned rider ${rider.id} to shift ${shift.id}`);
            assignedCount++;
        }

        if (assignedCount < shift.requiredRiders) {
            console.warn(`[AutonomousFleetEngine] WARNING: Shortage of riders for shift ${shift.id}. Required: ${shift.requiredRiders}, Assigned: ${assignedCount}`);
            // In a real system, this might trigger dynamic surge pricing or emergency recruitment
        }
    }

    private getAvailableRiders(): Rider[] {
        // Mocking available riders. In reality, fetch from database.
        const mockRiders: Rider[] = [];
        for (let i = 1; i <= 50; i++) {
            mockRiders.push({
                id: `rider_${i}`,
                name: `Autonomous Rider ${i}`,
                status: 'AVAILABLE',
                reliabilityScore: Math.random() * 100
            });
        }
        return mockRiders;
    }
}
