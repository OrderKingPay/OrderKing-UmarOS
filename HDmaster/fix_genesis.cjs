const fs = require('fs');
const path = require('path');

const filesToFixSql = [
  'src/lib/orderking/ecosystem-core/customer-cart.ts',
  'src/lib/orderking/ecosystem-core/restaurant-portal.ts',
  'src/lib/orderking/ecosystem-core/rider-dispatch.ts',
  'src/lib/orderking/plugin-nexus/oauth-manager.ts',
  'src/lib/orderking/plugin-nexus/webhook-receiver.ts',
  'src/lib/orderking/omni-brain/semantic-router.ts'
];

for (const file of filesToFixSql) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    // Replace const sql = getSql(); with const sql = await getSql();
    code = code.replace(/const sql = getSql\(\);/g, 'const sql = await getSql();');
    
    // Check if processPartnerPayouts style query exists (Wait, I only have these ones)
    fs.writeFileSync(file, code);
    console.log(`Fixed SQL in ${file}`);
  }
}

const vectorFile = 'src/lib/orderking/omni-brain/vector-embedder.ts';
if (fs.existsSync(vectorFile)) {
    let vCode = fs.readFileSync(vectorFile, 'utf8');
    // Fix undefined embedding values
    vCode = vCode.replace(/new Float32Array\(response\.embeddings\[0\]\.values\)/g, "new Float32Array(response.embeddings[0].values || [])");
    vCode = vCode.replace(/new Float32Array\(result\.embeddings\[0\]\.values\)/g, "new Float32Array(result.embeddings[0].values || [])");
    vCode = vCode.replace(/new Float32Array\(embeddingResponse\.values\)/g, "new Float32Array(embeddingResponse.values || [])");
    vCode = vCode.replace(/new Float32Array\(res\.values\)/g, "new Float32Array(res.values || [])");
    fs.writeFileSync(vectorFile, vCode);
    console.log(`Fixed undefined arrays in ${vectorFile}`);
}

