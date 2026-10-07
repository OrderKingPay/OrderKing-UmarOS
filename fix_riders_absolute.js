const fs = require('fs');

// home-view
let hvPath = 'orderking-riders/src/components/rider/home-view.tsx';
if (fs.existsSync(hvPath)) {
  let hv = fs.readFileSync(hvPath, 'utf8');
  hv = hv.replace(/import \{ respondOfferFn \} from \"@\/lib\/server\/rider-fns\"/, 'import { acceptOfferFn } from "@/lib/server/rider-fns"');
  hv = hv.replace(/respondOfferFn\(/g, 'acceptOfferFn(');
  hv = hv.replace(/import \{ LOCALE_LABELS \} from \"@\/lib\/rider\/i18n\";/g, '');
  fs.writeFileSync(hvPath, hv, 'utf8');
}

// lang-selector
let lsPath = 'orderking-riders/src/components/language-selector.tsx';
if (fs.existsSync(lsPath)) {
  let ls = fs.readFileSync(lsPath, 'utf8');
  ls = ls.replace(/import \{ LOCALE_LABELS \} from \"@\/lib\/rider\/i18n\";/, 'import { LOCALE_LABELS } from "@/lib/rider/config";');
  fs.writeFileSync(lsPath, ls, 'utf8');
}

// engine.ts
let engPath = 'orderking-riders/src/lib/rider/engine.ts';
if (fs.existsSync(engPath)) {
  let eng = fs.readFileSync(engPath, 'utf8');
  eng = eng.replace(/this\.dispatchOffer/g, 'this.presentOffer');
  fs.writeFileSync(engPath, eng, 'utf8');
}

// rider-fns
let fnsPath = 'orderking-riders/src/lib/server/rider-fns.ts';
if (fs.existsSync(fnsPath)) {
  let fns = fs.readFileSync(fnsPath, 'utf8');
  fns = fns.replace(/deliveryId:/g, 'orderId:');
  fns = fns.replace(/this\.respondOffer/g, 'this.acceptOffer');
  fns = fns.replace(/this\.generateOtp/g, 'this.otpForSimulation');
  fs.writeFileSync(fnsPath, fns, 'utf8');
}

// profile
let profPath = 'orderking-riders/src/routes/profile.tsx';
if (fs.existsSync(profPath)) {
  let prof = fs.readFileSync(profPath, 'utf8');
  prof = prof.replace(/import \{ LOCALE_LABELS \} from \"@\/lib\/rider\/i18n\";/, 'import { LOCALE_LABELS } from "@/lib/rider/config";');
  fs.writeFileSync(profPath, prof, 'utf8');
}
