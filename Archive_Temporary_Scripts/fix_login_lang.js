
const fs = require("fs");
const path = "orderking-riders/src/routes/login.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /import \{ useI18n \} from "@\/lib\/rider\/i18n-context";/,
  `import { useI18n } from "@/lib/rider/i18n-context";\nimport { LanguageSelector } from "@/components/language-selector";`
);

content = content.replace(
  /<button type="button" className="text-sm underline" onClick=\{\(\) => setLocale\(locale === "en" \? "bn" : "en"\)\}>\s*\{locale === "en" \? "বাংলা" : "English"\}\s*<\/button>/,
  `<LanguageSelector />`
);

fs.writeFileSync(path, content, "utf8");
console.log("Fixed login.tsx language selector");

