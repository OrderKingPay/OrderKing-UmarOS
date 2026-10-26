import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/HDmaster/src/routes/index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `{/* BOX 3: QUICK SETTINGS & CUSTOMIZATIONS (Wired to PostgreSQL \`saveUmarOsSettingsFn\` + \`localStorage\`) */}`,
  `              </div>
            </section>

            {/* BOX 3: QUICK SETTINGS & CUSTOMIZATIONS (Wired to PostgreSQL \`saveUmarOsSettingsFn\` + \`localStorage\`) */}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added closing tags before Box 3');
