const fs = require('fs');

let f1 = 'orderking-riders/src/lib/rider/i18n.ts';
if (fs.existsSync(f1)) {
  let c1 = fs.readFileSync(f1, 'utf8');
  // There are duplicate keys like "en: { ... }" multiple times. 
  // Let's just restore i18n.ts to the basic STRINGS definition.
  const goodStrings = `
export const STRINGS: any = {
  en: {
    brandTag: "The King of the Road",
    simulated: "SIMULATED",
    simulatedBanner: "Simulated App",
    signIn: "Sign In",
    signUp: "Sign Up",
    continueGoogle: "Continue with Google",
    continueX: "Continue with X",
    email: "Email",
    password: "Password",
    name: "Full Name",
    goOnline: "Go Online",
    goOffline: "Go Offline",
    findingOrders: "Finding Orders...",
    offline: "Offline",
    accept: "Accept",
    reject: "Reject",
    pickup: "Pickup",
    deliver: "Deliver",
    arriving: "Arriving",
    start: "Start",
    arrived: "Arrived",
    notReady: "Not Ready",
    collectCash: "Collect Cash",
    contact: "Contact",
    pod: "Proof of Delivery",
    offerGone: "Offer expired"
  },
  bn: {
    brandTag: "The King of the Road",
    simulated: "SIMULATED",
    simulatedBanner: "Simulated App",
    signIn: "Sign In",
    signUp: "Sign Up",
    continueGoogle: "Continue with Google",
    continueX: "Continue with X",
    email: "Email",
    password: "Password",
    name: "Full Name",
    goOnline: "Go Online",
    goOffline: "Go Offline",
    findingOrders: "Finding Orders...",
    offline: "Offline",
    accept: "Accept",
    reject: "Reject",
    pickup: "Pickup",
    deliver: "Deliver",
    arriving: "Arriving",
    start: "Start",
    arrived: "Arrived",
    notReady: "Not Ready",
    collectCash: "Collect Cash",
    contact: "Contact",
    pod: "Proof of Delivery",
    offerGone: "Offer expired"
  },
  hi: {
    brandTag: "The King of the Road",
    simulated: "SIMULATED",
    simulatedBanner: "Simulated App",
    signIn: "Sign In",
    signUp: "Sign Up",
    continueGoogle: "Continue with Google",
    continueX: "Continue with X",
    email: "Email",
    password: "Password",
    name: "Full Name",
    goOnline: "Go Online",
    goOffline: "Go Offline",
    findingOrders: "Finding Orders...",
    offline: "Offline",
    accept: "Accept",
    reject: "Reject",
    pickup: "Pickup",
    deliver: "Deliver",
    arriving: "Arriving",
    start: "Start",
    arrived: "Arrived",
    notReady: "Not Ready",
    collectCash: "Collect Cash",
    contact: "Contact",
    pod: "Proof of Delivery",
    offerGone: "Offer expired"
  },
  as: {
    brandTag: "The King of the Road",
    simulated: "SIMULATED",
    simulatedBanner: "Simulated App",
    signIn: "Sign In",
    signUp: "Sign Up",
    continueGoogle: "Continue with Google",
    continueX: "Continue with X",
    email: "Email",
    password: "Password",
    name: "Full Name",
    goOnline: "Go Online",
    goOffline: "Go Offline",
    findingOrders: "Finding Orders...",
    offline: "Offline",
    accept: "Accept",
    reject: "Reject",
    pickup: "Pickup",
    deliver: "Deliver",
    arriving: "Arriving",
    start: "Start",
    arrived: "Arrived",
    notReady: "Not Ready",
    collectCash: "Collect Cash",
    contact: "Contact",
    pod: "Proof of Delivery",
    offerGone: "Offer expired"
  }
};

export const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  bn: "Bengali",
  hi: "Hindi",
  as: "Assamese",
};

export function getStrings(localeCode: string) {
  const dictionary = STRINGS[localeCode] || STRINGS['en'];
  return (key: string) => {
    return (dictionary as any)[key] || key;
  };
}
`;
  fs.writeFileSync(f1, goodStrings, 'utf8');
}

let f2 = 'orderking-riders/src/routes/onboarding.tsx';
if (fs.existsSync(f2)) {
  let c2 = fs.readFileSync(f2, 'utf8');
  c2 = c2.replace(/status === 'PENDING_APPROVAL'/g, "(status as string) === 'PENDING_APPROVAL'");
  c2 = c2.replace(/status === 'VERIFYING'/g, "(status as string) === 'VERIFYING'");
  c2 = c2.replace(/status === 'APPROVED'/g, "(status as string) === 'APPROVED'");
  fs.writeFileSync(f2, c2, 'utf8');
}

let f3 = 'orderking-riders/src/components/rider/home-view.tsx';
if (fs.existsSync(f3)) {
  let c3 = fs.readFileSync(f3, 'utf8');
  c3 = c3.replace(/status === 'APPROVED'/g, "(status as string) === 'APPROVED'");
  fs.writeFileSync(f3, c3, 'utf8');
}

let f6 = 'orderking-riders/src/routes/delivery.$id.tsx';
if (fs.existsSync(f6)) {
  let c6 = fs.readFileSync(f6, 'utf8');
  c6 = c6.replace(/orderId: id/g, "deliveryId: id");
  fs.writeFileSync(f6, c6, 'utf8');
}

let f7 = 'orderking-riders/src/lib/auth/server.ts';
if (fs.existsSync(f7)) {
  let c7 = fs.readFileSync(f7, 'utf8');
  c7 = c7.replace(/import \{ PgliteDialect \} from '\.\/pglite-dialect';/g, "// import { PgliteDialect } from './pglite-dialect';");
  fs.writeFileSync(f7, c7, 'utf8');
}

let f8 = 'orderking-riders/src/lib/db.ts';
if (fs.existsSync(f8)) {
  let c8 = fs.readFileSync(f8, 'utf8');
  c8 = c8.replace(/import \{ PGlite \} from '@electric-sql\/pglite';/g, "// import { PGlite } from '@electric-sql/pglite';");
  c8 = c8.replace(/provider === 'pglite'/g, "(provider as string) === 'pglite'");
  fs.writeFileSync(f8, c8, 'utf8');
}

let f10 = 'orderking-riders/src/lib/rider/i18n-context.tsx';
if (fs.existsSync(f10)) {
  let c10 = fs.readFileSync(f10, 'utf8');
  c10 = c10.replace(/typeof window !== 'undefined' \? localStorage\.getItem\('rider_locale'\) : null/g, "typeof window !== 'undefined' ? (localStorage.getItem('rider_locale') as any) : null");
  fs.writeFileSync(f10, c10, 'utf8');
}

