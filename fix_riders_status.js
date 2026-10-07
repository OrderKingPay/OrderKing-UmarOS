const fs = require('fs');

let f1 = 'orderking-riders/src/components/rider/home-view.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/rider\.verification_status === 'APPROVED'/g, "(rider.verification_status as string) === 'APPROVED'");
fs.writeFileSync(f1, c1, 'utf8');

let f2 = 'orderking-riders/src/routes/onboarding.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/status === 'APPROVED'/g, "(status as string) === 'APPROVED'");
c2 = c2.replace(/status === 'PENDING_APPROVAL'/g, "(status as string) === 'PENDING_APPROVAL'");
c2 = c2.replace(/status === 'VERIFYING'/g, "(status as string) === 'VERIFYING'");
fs.writeFileSync(f2, c2, 'utf8');

