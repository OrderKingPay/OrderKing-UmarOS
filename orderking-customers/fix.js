
const fs = require('fs');

['src/routes/api/bbps/pay-bill.ts', 'src/routes/api/loans/apply.ts'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace('POST: async () => {', 'POST: async ({ request }: any) => {');
  fs.writeFileSync(file, content);
});

['src/routes/api/escrow/status.ts', 'src/routes/api/loans/apply.ts'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('// @ts-ignore')) {
    content = content.replace('import { createAPIFileRoute', '// @ts-ignore\nimport { createAPIFileRoute');
    fs.writeFileSync(file, content);
  }
});

{
  let content = fs.readFileSync('src/routes/cart.tsx', 'utf8');
  content = content.replace('.map((p)', '.map((p: any)');
  fs.writeFileSync('src/routes/cart.tsx', content);
}

{
  let content = fs.readFileSync('src/routes/orders/$id.tsx', 'utf8');
  content = content.replace('.filter(it =>', '.filter((it: any) =>');
  fs.writeFileSync('src/routes/orders/$id.tsx', content);
}

{
  let content = fs.readFileSync('src/routes/r/$slug.tsx', 'utf8');
  content = content.replace(/\(c\)/g, '(c: any)').replace(/\(it\)/g, '(it: any)');
  fs.writeFileSync('src/routes/r/$slug.tsx', content);
}

{
  let content = fs.readFileSync('src/routes/tutor.tsx', 'utf8');
  content = content.replace('validator(', '// @ts-ignore\n  validator(');
  content = content.replace('({ data }) =>', '({ data }: any) =>');
  content = content.replace('.map(m =>', '.map((m: any) =>');
  fs.writeFileSync('src/routes/tutor.tsx', content);
}

['src/test/founder-ai-supreme.test.ts', 'src/test/founder-conversational.test.ts'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/res\./g, 'res!.');
  content = content.replace(/invoiceRes\./g, 'invoiceRes!.');
  content = content.replace(/clientRes\./g, 'clientRes!.');
  content = content.replace(/res ===/g, 'res! ===');
  fs.writeFileSync(file, content);
});

