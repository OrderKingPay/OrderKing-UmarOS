const fs = require('fs');
const filePath = 'orderking-customers/src/components/fintech/supreme-kingpay-experience.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Ensure import
if (!content.includes('import { AirportAutoSuggest, StationAutoSuggest }')) {
  content = content.replace(
    'import airportCatalog from "./airports.json";',
    'import { AirportAutoSuggest, StationAutoSuggest } from "./travel-autosuggest";\nimport airportCatalog from "./airports.json";'
  );
}

// 1. Replace flightFrom
content = content.replace(
  /<input[^>]*flightFrom-suggestions[\s\S]*?<\/datalist>/,
  `<AirportAutoSuggest
                    value={flightFrom}
                    onChange={setFlightFrom}
                    theme="dark"
                    placeholder="Search 7,900+ airports by city or code (e.g. Del, Gau)..."
                    ariaLabel="From City / Airport"
                    className="w-full"
                  />`
);

// 2. Replace flightTo
content = content.replace(
  /<input[^>]*flightTo-suggestions[\s\S]*?<\/datalist>/,
  `<AirportAutoSuggest
                    value={flightTo}
                    onChange={setFlightTo}
                    theme="dark"
                    placeholder="Search 7,900+ airports by city or code (e.g. Bom, Cal)..."
                    ariaLabel="To City / Airport"
                    className="w-full"
                  />`
);

// 3. Replace trainFrom
content = content.replace(
  /<input[^>]*trainFrom-suggestions[\s\S]*?<\/datalist>/,
  `<StationAutoSuggest
                    value={trainFrom}
                    onChange={setTrainFrom}
                    theme="dark"
                    placeholder="Search 8,000+ stations by city or code (e.g. Ndls, Sil)..."
                    ariaLabel="From Station"
                    className="w-full"
                  />`
);

// 4. Replace trainTo
content = content.replace(
  /<input[^>]*trainTo-suggestions[\s\S]*?<\/datalist>/,
  `<StationAutoSuggest
                    value={trainTo}
                    onChange={setTrainTo}
                    theme="dark"
                    placeholder="Search 8,000+ stations by city or code (e.g. Hwh, Ghy)..."
                    ariaLabel="To Station"
                    className="w-full"
                  />`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully replaced all 4 travel search inputs with AirportAutoSuggest and StationAutoSuggest!');
