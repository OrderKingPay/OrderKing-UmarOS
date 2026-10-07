const fs = require('fs');
let hvPath = 'orderking-riders/src/components/rider/home-view.tsx';
if (fs.existsSync(hvPath)) {
  let content = fs.readFileSync(hvPath, 'utf8');
  content = content.replace(/respondOfferFn/g, 'acceptOfferFn');
  fs.writeFileSync(hvPath, content, 'utf8');
}
