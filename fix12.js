const fs = require('fs');
let f = 'orderking-customers/src/lib/ai/supreme-founder-ai-core.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/const formattedTotalSize = "4\.2 GB";/g, '');
  c = c.replace(/const mediaStorageVault = \{[^}]*\};/g, '');
  c = c.replace(/const deployRes = \{[^}]*\};/g, '');
  
  c = c.replace(/responseMarkdown = \Deploying to 25 edge regions\.\.\.\\n\ \+ JSON\.stringify\(deployRes, null, 2\);/g, 'responseMarkdown = "Deployment API is not connected.";');
  c = c.replace(/responseMarkdown = \Your Media Vault is currently occupying \\.\.\.\\n\ \+ JSON\.stringify\(mediaStorageVault, null, 2\);/g, 'responseMarkdown = "Media Vault API is not connected.";');
  
  fs.writeFileSync(f, c);
}
