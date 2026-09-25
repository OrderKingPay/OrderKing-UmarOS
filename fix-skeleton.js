const fs = require('fs');
const file = 'orderking-customers/src/components/ui/skeleton.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ motion \} from \"framer-motion\";/g, '');
content = content.replace(/React\.ComponentProps<typeof motion\.div>/g, 'React.HTMLAttributes<HTMLDivElement>');
content = content.replace(/<motion\.div/g, '<div');
content = content.replace(/initial={{ opacity: 0.5 }}/g, '');
content = content.replace(/animate={{ opacity: 1 }}/g, '');
content = content.replace(/transition={{[^}]+}}/g, '');

fs.writeFileSync(file, content);
