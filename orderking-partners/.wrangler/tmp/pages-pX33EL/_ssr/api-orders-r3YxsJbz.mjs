import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-DsMHvbSu.mjs";
import { n as createSsrRpc } from "./hdmaster-order-transition-BLAHw5vH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-orders-r3YxsJbz.js
var listOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("c8c37c09ba07ecfe2b47463f962436c7847d47e407b9d51f39b43b3139795738"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("1b734824599414618d62e0e2a27f257918eabfd5fad2b14500ff2f024a5be314"));
var getDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("45eecb9802db3a8af9d742694b69311436aa7d0ce13249e32932ee78afc3bab7"));
var getOperatingSnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("ffa61d595de0c2d85935c70833c9e8a639508e781b0d12e54ab23e265a5a80ce"));
var saveHours = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("fd97d75f6fb3e2ec2fb9024c8f8be9544fcf58a644712948f5d9eef1a4cc79af"));
var quickThrottleKitchen = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("42f02f5548e63e388012f2448d385af1fe5856fb486e92c4803d3a3b0adcc603"));
//#endregion
export { saveHours as a, quickThrottleKitchen as i, getOperatingSnapshot as n, listOrders as r, getDashboard as t };
