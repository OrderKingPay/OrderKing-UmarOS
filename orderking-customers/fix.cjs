const fs = require('fs');
const execSync = require('child_process').execSync;

// get from git
const original = execSync('git show HEAD:orderking-customers/src/components/fintech/flight-booking-engine.tsx', { encoding: 'utf8' });

// replace
const fixed = original.split('\\`').join('`').split('\\$').join('$');

// write
fs.writeFileSync('src/components/fintech/flight-booking-engine.tsx', fixed);
console.log('Fixed file.');
