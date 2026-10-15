const fs = require('fs');

function replaceAll(file, search, replacement) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(search, replacement);
    fs.writeFileSync(file, content, 'utf8');
  }
}

// rider-fns.ts - revert to the one before my messed up fix script. 
// Ah, rider-fns.ts wasn't restored. Let me restore it first.
