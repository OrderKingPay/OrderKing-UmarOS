
const fs = require("fs");
const path = "orderking-customers/src/components/market/shell.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /<NavItem to="\/account" icon=\{UserRound\} label="Profile" active=\{path.startsWith\("\/account"\)\} colorClass="text-purple-500" \/>/,
  `<NavItem to="/tutor" icon={GraduationCap} label="AI Tutor" active={path.startsWith("/tutor")} colorClass="text-indigo-500" />
            <NavItem to="/account" icon={UserRound} label="Profile" active={path.startsWith("/account")} colorClass="text-purple-500" />`
);

content = content.replace(
  /grid-cols-4/,
  "grid-cols-5"
);

fs.writeFileSync(path, content, "utf8");
console.log("Done adding tutor");

