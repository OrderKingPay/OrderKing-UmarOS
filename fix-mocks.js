const fs = require('fs');

// 1. Remove mock data from preferred-kitchens-ad-row.tsx
const adRowFile = 'orderking-customers/src/components/market/preferred-kitchens-ad-row.tsx';
let adRowContent = fs.readFileSync(adRowFile, 'utf8');
adRowContent = adRowContent.replace(/const MOCK_KITCHENS.*?\];/s, 'const MOCK_KITCHENS: any[] = [];');
fs.writeFileSync(adRowFile, adRowContent);

// 2. Remove mock location from location store
const locationStoreFile = 'orderking-customers/src/lib/stores/location.ts';
let locContent = fs.readFileSync(locationStoreFile, 'utf8');
locContent = locContent.replace(/lat: 26\.1445,[\s\S]*?cityName: "Sribhumi",/, 'lat: 0, lng: 0, cityId: "", zoneName: "", label: "Select Location", line1: "", cityName: "",');
fs.writeFileSync(locationStoreFile, locContent);

// 3. Update the huge share banner to be small in home-feed.tsx
const homeFeedFile = 'orderking-customers/src/components/market/home-feed.tsx';
let hfContent = fs.readFileSync(homeFeedFile, 'utf8');
hfContent = hfContent.replace('Give ₹40 + Free Delivery, Get ₹40!', 'Share & Earn ₹40');
hfContent = hfContent.replace('Share OrderKing with friends. They get ₹40 OFF + Free Delivery (min ₹249) and you get ₹40 wallet cash!', 'Invite friends to OrderKing and earn wallet cash.');
fs.writeFileSync(homeFeedFile, hfContent);

// 4. Force Service Worker Unregister in __root.tsx to clear PWA cache for the user immediately
const rootFile = 'orderking-customers/src/routes/__root.tsx';
let rootContent = fs.readFileSync(rootFile, 'utf8');
const cacheBuster = `
    useEffect(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
      }
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    }, []);
`;
if (!rootContent.includes('registration.unregister()')) {
  rootContent = rootContent.replace('export const Route = createRootRouteWithContext', cacheBuster + '\nexport const Route = createRootRouteWithContext');
}
fs.writeFileSync(rootFile, rootContent);

console.log('Fixed mocks, banners, and injected SW cache buster.');
