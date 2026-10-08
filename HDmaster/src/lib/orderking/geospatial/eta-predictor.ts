import { getSql } from '../../db';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function predictETA(restaurantId: string, customerLat: number, customerLng: number) {
    const sql = await getSql();
    
    // Query average prep time
    const [restaurant] = (await sql`
        SELECT lat, lng, avg_prep_time_minutes 
        FROM restaurants 
        WHERE id = ${restaurantId}
    `) as any[];

    if (!restaurant) {
        throw new Error('Restaurant not found');
    }

    const distance = calculateDistance(restaurant.lat, restaurant.lng, customerLat, customerLng);
    
    // Assume 30 km/h average speed in city -> 0.5 km/min -> 2 mins per km
    const travelTimeMinutes = distance * 2;
    
    const trafficMultiplier = 1.2; // simple traffic estimation

    const totalETA = restaurant.avg_prep_time_minutes + (travelTimeMinutes * trafficMultiplier);

    return {
        etaMinutes: Math.round(totalETA),
        distanceKm: distance
    };
}
