import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-DsMHvbSu.mjs";
import { n as createSsrRpc } from "./hdmaster-order-transition-BLAHw5vH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-finance-DtgBNGi4.js
var getSettlements = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("b4a89ad8c279ff3f65672681374676267580eb7b7165cea1a33dfcfdbe3e515d"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("b1d22ffe45f397340c3aa93a7581b535584eff22dbd3d1e1c80a240eec8dc4c6"));
var getPromotions = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("222ae520961227a0ad7cde97da0fda59ca2967c2184764c7154f1f3ca74607be"));
var savePromotion = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("3cd1f44a3d815457bb1c18462e9cbbe76e06ad65a85a9c7dc41482d588a8ec63"));
var getAdCampaign = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("5da7377b36f2052ab90573a4543b809a483a4167023de68b24d302c0d6135a87"));
var saveAdCampaign = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("ce11d09dd9606d0694f77494edd9852c0b915d095c4eaf90240bc5c1c9298f63"));
var getAnalytics = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("5ccc90aeb213c330650b3b2aae0688f44acb3bd3b8bbcb2107ccc44f3701f677"));
//#endregion
export { saveAdCampaign as a, getSettlements as i, getAnalytics as n, savePromotion as o, getPromotions as r, getAdCampaign as t };
