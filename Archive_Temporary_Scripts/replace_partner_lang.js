const fs = require('fs');
let c = fs.readFileSync('orderking-partners/src/lib/platform-config.ts', 'utf8');

c = c.replace(/supportedLanguages: \[\"en\", \"bn\", \"hi\", \"te\", \"ta\"\] as const,/, 'supportedLanguages: ["en", "bn"] as const,');
c = c.replace(/futureLanguages: \[\"as\"\] as const,/, 'futureLanguages: ["hi", "te", "ta", "as"] as const,');

fs.writeFileSync('orderking-partners/src/lib/platform-config.ts', c, 'utf8');

let i = fs.readFileSync('orderking-partners/src/lib/i18n/index.ts', 'utf8');
i = i.replace(/export type AppLanguage = \"en\" \| \"bn\" \| \"hi\" \| \"te\" \| \"ta\";/, 'export type AppLanguage = "en" | "bn";');
i = i.replace(/import \{ hi \} from \"\.\/hi\";\n/, '');
i = i.replace(/import \{ te \} from \"\.\/te\";\n/, '');
i = i.replace(/import \{ ta \} from \"\.\/ta\";\n/, '');
i = i.replace(/export const ALL_LANGUAGES = \[.*\] as const;/, 'export const ALL_LANGUAGES = [\n  { code: "en", label: "English", localLabel: "English" },\n  { code: "bn", label: "Bengali", localLabel: "বাংলা" }\n] as const;');
i = i.replace(/const messages: Record<AppLanguage, MessageTree> = \{[^]+\};/, 'const messages: Record<AppLanguage, MessageTree> = { en, bn };');

fs.writeFileSync('orderking-partners/src/lib/i18n/index.ts', i, 'utf8');
