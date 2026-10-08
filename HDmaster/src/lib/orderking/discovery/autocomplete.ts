import { getSql } from '../../db';

export async function autocomplete(prefix: string, limit: number) {
    const sql = await getSql();
    const searchPrefix = prefix + '%';
    
    const result = await sql`
        (SELECT 'restaurant' as type, name as text
         FROM restaurants
         WHERE name ILIKE ${searchPrefix}
         ORDER BY name
         LIMIT ${limit})
        UNION ALL
        (SELECT 'cuisine' as type, name as text
         FROM cuisines
         WHERE name ILIKE ${searchPrefix}
         ORDER BY name
         LIMIT ${limit})
        UNION ALL
        (SELECT 'item' as type, name as text
         FROM menu_items
         WHERE name ILIKE ${searchPrefix}
         ORDER BY name
         LIMIT ${limit})
        LIMIT ${limit}
    ` as any;
    
    return result;
}
