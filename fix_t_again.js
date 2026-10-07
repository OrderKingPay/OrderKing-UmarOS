const fs = require('fs');

function patchT(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/t\('([^']+)'\)/g, "t('' as any)");
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

patchT('orderking-riders/src/components/rider/delivery-actions.tsx');
patchT('orderking-riders/src/components/rider/home-view.tsx');

