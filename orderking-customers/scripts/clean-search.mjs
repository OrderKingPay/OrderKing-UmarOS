import fs from "fs";

let code = fs.readFileSync("src/routes/api/search.ts", "utf8");

const pattern = /const origin = \{ lat, lng \};[\s\S]*?\/\/ Strict dynamic radius enforcement for local delivery range[\s\S]*?if \(dist <= 50 && dist > activeShift\.radiusKm\) continue;/;

const replacement = `const origin = { lat, lng };
          const rows = await sql.query<any>(query, params);
          
          const promos = await sql<{ id: string; restaurant_id: string | null; name_en: string }>\`
            select id, restaurant_id, name_en from promotions where active = true
          \`;
          const hours = await loadHours();
          const cards: RestaurantCard[] = [];
          for (const row of rows) {
            const offer = promos.find((p) => !p.restaurant_id || p.restaurant_id === row.id);
            const dist = distanceKm(origin, { lat: row.lat, lng: row.lng });
            // Contracted operational shift delivery radius enforcement (Day: 12km, Evening: 7.5km, Late-Night: 3.5km)
            if (dist > activeShift.radiusKm) continue;

            // Destination hazard check
            const destHazard = checkHazardZone({ lat: row.lat, lng: row.lng });
            if (destHazard.inHazardZone && destHazard.deliveryBlocked) continue;`;

if (!pattern.test(code)) {
  console.error("Pattern not matched!");
  process.exit(1);
}

code = code.replace(pattern, replacement);
fs.writeFileSync("src/routes/api/search.ts", code, "utf8");
console.log("Successfully cleaned search.ts");
