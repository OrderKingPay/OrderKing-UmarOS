
const fs = require("fs");
const path = "orderking-customers/src/components/market/home-feed.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /<PreferredKitchensAdRow \/>/g,
  ""
);

content = content.replace(
  /<MindReaderWidget \/>/g,
  ""
);

fs.writeFileSync(path, content, "utf8");
console.log("Done home");

