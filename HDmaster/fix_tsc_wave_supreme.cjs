const fs = require('fs');

// Fix multimodal-engine.server.ts
const multimodalFile = 'src/lib/orderking/ai/multimodal-engine.server.ts';
let mmCode = fs.readFileSync(multimodalFile, 'utf8');
mmCode = mmCode.replace(/response\.generatedImages\.map/g, '(response.generatedImages || []).map');
fs.writeFileSync(multimodalFile, mmCode);

// Fix demand-forecaster.ts
const forecasterFile = 'src/lib/orderking/data/demand-forecaster.ts';
let fCode = fs.readFileSync(forecasterFile, 'utf8');
fCode = fCode.replace(/import \{ getSql \} from '.*?db.*';/g, "import { getSql } from '@/lib/db';");
fs.writeFileSync(forecasterFile, fCode);

// Fix active-defense.ts
const defenseFile = 'src/lib/orderking/security/active-defense.ts';
let dCode = fs.readFileSync(defenseFile, 'utf8');
dCode = dCode.replace(/const sql = getSql\(\);/g, 'const sql = await getSql();');
fs.writeFileSync(defenseFile, dCode);

