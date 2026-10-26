import fs from 'node:fs';

const content = fs.readFileSync('c:/Users/hasan/OrderKing/HDmaster/src/routes/index.tsx', 'utf8');
const lines = content.split('\n');

const stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // check for <section
  const opens = (line.match(/<section\b/g) || []).length;
  const closes = (line.match(/<\/section>/g) || []).length;
  for (let j = 0; j < opens; j++) {
    stack.push(i + 1);
  }
  for (let j = 0; j < closes; j++) {
    if (stack.length === 0) {
      console.log(`Extra close at line ${i + 1}`);
    } else {
      stack.pop();
    }
  }
}

console.log('Unclosed sections opened at lines:', stack);
