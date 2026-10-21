const fs = require('fs');
const filePath = 'orderking-customers/src/components/fintech/supreme-kingpay-experience.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ensure AirportAutoSuggest & StationAutoSuggest are imported
if (!content.includes('AirportAutoSuggest')) {
  content = content.replace(
    'import airportCatalog from "./airports.json";',
    'import { AirportAutoSuggest, StationAutoSuggest } from "./travel-autosuggest";\nimport airportCatalog from "./airports.json";'
  );
}

// 2. Replace flightFrom input + datalist
const flightFromTarget = `<input type="text" aria-label="Search any airport by city or IATA code" placeholder="Search any airport by city or IATA code" autoComplete="off" list="flightFrom-suggestions" value={flightFrom} onChange={(e) => setFlightFrom(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none " />
                    <datalist id="flightFrom-suggestions">{searchAirportOptions(flightFrom).map((a) => <option key={a.code + a.name} value={a.city + " (" + a.code + ")"}>{a.name}</option>)}</datalist>`;

const flightFromReplacement = `<AirportAutoSuggest
                    value={flightFrom}
                    onChange={setFlightFrom}
                    theme="dark"
                    placeholder="Search 7,900+ airports by city or IATA (e.g. Del, Gau)..."
                    ariaLabel="From City / Airport"
                    className="w-full"
                  />`;

content = content.replace(flightFromTarget, flightFromReplacement);

// 3. Replace flightTo input + datalist
const flightToTarget = `<input type="text" aria-label="Search any airport by city or IATA code" placeholder="Search any airport by city or IATA code" autoComplete="off" list="flightTo-suggestions" value={flightTo} onChange={(e) => setFlightTo(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none " />
                    <datalist id="flightTo-suggestions">{searchAirportOptions(flightTo).map((a) => <option key={a.code + a.name} value={a.city + " (" + a.code + ")"}>{a.name}</option>)}</datalist>`;

const flightToReplacement = `<AirportAutoSuggest
                    value={flightTo}
                    onChange={setFlightTo}
                    theme="dark"
                    placeholder="Search 7,900+ airports by city or IATA (e.g. Bom, Cal)..."
                    ariaLabel="To City / Airport"
                    className="w-full"
                  />`;

content = content.replace(flightToTarget, flightToReplacement);

// 4. Replace trainFrom input + datalist
const trainFromTarget = `<input type="text" aria-label="Search station or type station code" placeholder="Search station or type station code" autoComplete="off" list="trainFrom-suggestions" value={trainFrom} onChange={(e) => setTrainFrom(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none " />
                    <datalist id="trainFrom-suggestions">{searchStationOptions(trainFrom).map((a) => <option key={a.code} value={a.name + " (" + a.code + ")"}>{a.city}</option>)}</datalist>`;

const trainFromReplacement = `<StationAutoSuggest
                    value={trainFrom}
                    onChange={setTrainFrom}
                    theme="dark"
                    placeholder="Search 8,000+ stations by city or code (e.g. Ndls, Sil)..."
                    ariaLabel="From Station"
                    className="w-full"
                  />`;

content = content.replace(trainFromTarget, trainFromReplacement);

// 5. Replace trainTo input + datalist
const trainToTarget = `<input type="text" aria-label="Search station or type station code" placeholder="Search station or type station code" autoComplete="off" list="trainTo-suggestions" value={trainTo} onChange={(e) => setTrainTo(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none " />
                    <datalist id="trainTo-suggestions">{searchStationOptions(trainTo).map((a) => <option key={a.code} value={a.name + " (" + a.code + ")"}>{a.city}</option>)}</datalist>`;

const trainToReplacement = `<StationAutoSuggest
                    value={trainTo}
                    onChange={setTrainTo}
                    theme="dark"
                    placeholder="Search 8,000+ stations by city or code (e.g. Hwh, Ghy)..."
                    ariaLabel="To Station"
                    className="w-full"
                  />`;

content = content.replace(trainToTarget, trainToReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully upgraded search inputs in supreme-kingpay-experience.tsx to AirportAutoSuggest and StationAutoSuggest!');
