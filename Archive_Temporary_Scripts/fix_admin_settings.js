const fs = require('fs');
let file = 'HDmaster/src/routes/api/v1/admin/settings.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/let bag = \{\}/g, 'let bag: Record<string, any> = {}');
c = c.replace(/let existing = \{\}/g, 'let existing: Record<string, any> = {}');
c = c.replace(/JSON\.parse\(rows\[0\]\.settings_json\);/g, 'JSON.parse(rows[0].settings_json as string);');
c = c.replace(/error: err\.message/g, 'error: err instanceof Error ? err.message : String(err)');
fs.writeFileSync(file, c);
