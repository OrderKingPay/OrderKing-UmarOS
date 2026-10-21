import fs from "node:fs";

let c = fs.readFileSync("orderking-customers/src/routes/travel.tsx", "utf8");

// Normalize line endings to LF for consistent replacement, then we can save back
const isCRLF = c.includes("\r\n");
if (isCRLF) {
  c = c.replace(/\r\n/g, "\n");
}

// 1. Add imports & search functions
const targetImport = `import { AppErrorComponent } from "@/lib/error-component";`;
const replacementImport = `import { AppErrorComponent } from "@/lib/error-component";
import airportCatalog from "@/components/fintech/airports.json";
import stationCatalog from "@/components/fintech/stations.json";

const searchAirportOptions = (raw: string) => {
  const q = raw.replace(/\\s*\\([A-Z]{3}\\).*$/, "").trim().toLowerCase();
  if (!q) return airportCatalog.slice(0, 20);
  return airportCatalog
    .filter((a) => a.code && (a.code.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)))
    .slice(0, 20);
};

const searchStationOptions = (raw: string) => {
  const q = raw.replace(/\\s*\\([A-Z0-9]{2,5}\\).*$/, "").trim().toLowerCase();
  if (!q) return stationCatalog.slice(0, 20);
  return stationCatalog
    .filter((a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q))
    .slice(0, 20);
};`;

if (!c.includes("import airportCatalog")) {
  c = c.replace(targetImport, replacementImport);
}

// 2. Flight from input
const targetFlightFrom = `<input
                    type="text"
                    value={flightFrom}
                    onChange={(e) => setFlightFrom(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. New Delhi (DEL)"
                  />`;
const repFlightFrom = `<input
                    type="text"
                    value={flightFrom}
                    onChange={(e) => setFlightFrom(e.target.value)}
                    list="travel-flightFrom-list"
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="Search 7,900+ airports or city..."
                  />
                  <datalist id="travel-flightFrom-list">
                    {searchAirportOptions(flightFrom).map((a) => (
                      <option key={a.code + a.name} value={\`\${a.city} (\${a.code})\`}>
                        {a.name} · {a.country}
                      </option>
                    ))}
                  </datalist>`;
c = c.replace(targetFlightFrom, repFlightFrom);

// 3. Flight to input
const targetFlightTo = `<input
                    type="text"
                    value={flightTo}
                    onChange={(e) => setFlightTo(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="e.g. Mumbai (BOM)"
                  />`;
const repFlightTo = `<input
                    type="text"
                    value={flightTo}
                    onChange={(e) => setFlightTo(e.target.value)}
                    list="travel-flightTo-list"
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                    placeholder="Search 7,900+ airports or city..."
                  />
                  <datalist id="travel-flightTo-list">
                    {searchAirportOptions(flightTo).map((a) => (
                      <option key={a.code + a.name} value={\`\${a.city} (\${a.code})\`}>
                        {a.name} · {a.country}
                      </option>
                    ))}
                  </datalist>`;
c = c.replace(targetFlightTo, repFlightTo);

// 4. Train from input
const targetTrainFrom = `<input
                    type="text"
                    value={trainFrom}
                    onChange={(e) => setTrainFrom(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                    placeholder="Enter Station or Code"
                  />`;
const repTrainFrom = `<input
                    type="text"
                    value={trainFrom}
                    onChange={(e) => setTrainFrom(e.target.value)}
                    list="travel-trainFrom-list"
                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                    placeholder="Search 8,000+ stations or code"
                  />
                  <datalist id="travel-trainFrom-list">
                    {searchStationOptions(trainFrom).map((s) => (
                      <option key={s.code} value={\`\${s.name} (\${s.code})\`}>
                        {s.city}
                      </option>
                    ))}
                  </datalist>`;
c = c.replace(targetTrainFrom, repTrainFrom);

// 5. Train to input
const targetTrainTo = `<input
                    type="text"
                    value={trainTo}
                    onChange={(e) => setTrainTo(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                    placeholder="Enter Station or Code"
                  />`;
const repTrainTo = `<input
                    type="text"
                    value={trainTo}
                    onChange={(e) => setTrainTo(e.target.value)}
                    list="travel-trainTo-list"
                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                    placeholder="Search 8,000+ stations or code"
                  />
                  <datalist id="travel-trainTo-list">
                    {searchStationOptions(trainTo).map((s) => (
                      <option key={s.code} value={\`\${s.name} (\${s.code})\`}>
                        {s.city}
                      </option>
                    ))}
                  </datalist>`;
c = c.replace(targetTrainTo, repTrainTo);

if (isCRLF) {
  c = c.replace(/\n/g, "\r\n");
}

fs.writeFileSync("orderking-customers/src/routes/travel.tsx", c);
console.log("travel.tsx successfully updated with searchable airports and stations!");
