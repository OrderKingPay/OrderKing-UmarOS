
const fs = require("fs");
const path = "orderking-customers/src/components/market/home-feed.tsx";
let content = fs.readFileSync(path, "utf8");

// Remove the inline filter row completely from the top
content = content.replace(
  /\{\/\* HORIZONTAL FILTER CHIPS \*\/\}(.|\n)*?(?=\{\/\* RESTAURANT SUGGESTIONS)/m,
  ""
);

// We want to add it at the very bottom of the page or in a floating bar?
// He said "sharing button should be SMALLER and placed at the bottom. Next to it, place the Veg/Non-Veg toggle. On the other side, place an \"AI Support\" button."

fs.writeFileSync(path, content, "utf8");
console.log("Filters removed from top of home-feed.tsx");

