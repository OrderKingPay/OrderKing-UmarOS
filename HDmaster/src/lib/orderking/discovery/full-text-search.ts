import { getSql } from '../../db';

export async function searchRestaurants(query: string, lat?: number, lng?: number) {
    const sql = await getSql();
    let result;
    
    if (lat !== undefined && lng !== undefined) {
        result = await sql`
            SELECT 
                id, 
                name, 
                description,
                ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank,
                (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) AS distance
            FROM restaurants
            WHERE search_vector @@ plainto_tsquery('english', ${query})
            ORDER BY rank DESC, distance ASC
        ` as any;
    } else {
        result = await sql`
            SELECT 
                id, 
                name, 
                description,
                ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank
            FROM restaurants
            WHERE search_vector @@ plainto_tsquery('english', ${query})
            ORDER BY rank DESC
        ` as any;
    }
    
    return result;
}
