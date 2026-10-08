export interface Waypoint {
    lat: number;
    lng: number;
}

export async function getOptimalRoute(riderLat: number, riderLng: number, waypoints: Waypoint[]) {
    // We use the OSRM (Open Source Routing Machine) Trip API to solve TSP (Traveling Salesperson Problem)
    const coords = [`${riderLng},${riderLat}`];
    for (const wp of waypoints) {
        coords.push(`${wp.lng},${wp.lat}`);
    }

    const coordinatesString = coords.join(';');
    
    const url = `https://router.project-osrm.org/trip/v1/driving/${coordinatesString}?source=first`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch route from OSRM');
    }

    const data = await response.json();
    
    return data;
}
