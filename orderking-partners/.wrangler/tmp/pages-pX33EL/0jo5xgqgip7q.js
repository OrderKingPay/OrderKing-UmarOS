// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
    "/logo.jpg",
    "/manifest.json",
    "/og.jpg",
    "/sw.js",
    "/__grok/icon-180.png",
    "/assets/analytics-DYAcsH8X.js",
    "/assets/api-finance-KxF0F_ww.js",
    "/assets/api-orders-DIKOOZxU.js",
    "/assets/assistant-8KqYtj2F.js",
    "/assets/button-C1sWuqiY.js",
    "/assets/card-DXHGArac.js",
    "/assets/client-LaQg0niS.js",
    "/assets/dashboard-C6Ps4Fyz.js",
    "/assets/hours-bXr1vLbB.js",
    "/assets/index-DjPljLbM.js",
    "/assets/input-CaNo5W-e.js",
    "/assets/kitchen-CM1StxYl.js",
    "/assets/login-C9rJnhtB.js",
    "/assets/menu-CqkF4hPW.js",
    "/assets/money-text-dap1GqtK.js",
    "/assets/more-C80wmg8d.js",
    "/assets/notifications-6Use__t_.js",
    "/assets/onboarding-FF7us3kW.js",
    "/assets/order-card-_hnoaGbm.js",
    "/assets/orders-BKGAC2Vr.js",
    "/assets/promotions-DEj9Lz2S.js",
    "/assets/react-4F1uotGf.js",
    "/assets/reviews-DETk9mQU.js",
    "/assets/routes-C39henCu.js",
    "/assets/settings-COYHX0Yr.js",
    "/assets/settlements-By7pCBco.js",
    "/assets/styles-CFD0Dbqu.css",
    "/assets/vendor-shell-YAtbDpUH.js",
    "/brand/app-icon.svg",
    "/brand/logo-dark.svg",
    "/brand/logo-light.svg",
    "/brand/logo.svg",
    "/__grok/install/styles.css",
    "/__grok/install/assets/homescreen/glass-puzzle.svg",
    "/__grok/install/assets/homescreen/glass-share.svg",
    "/__grok/install/assets/homescreen/logo-grok.svg",
    "/__grok/install/assets/homescreen/ob-ipad.png",
    "/__grok/install/assets/homescreen/ob-phone.png",
    "/__grok/install/assets/homescreen/plus.svg"
  ]
};

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "C:\\Users\\hasan\\OrderKing\\orderking-partners\\.wrangler\\tmp\\pages-pX33EL\\bundledWorker-0.7864226464264976.mjs";
import { isRoutingRuleMatch } from "C:\\Users\\hasan\\AppData\\Local\\npm-cache\\_npx\\32026684e21afda6\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "C:\\Users\\hasan\\OrderKing\\orderking-partners\\.wrangler\\tmp\\pages-pX33EL\\bundledWorker-0.7864226464264976.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=0jo5xgqgip7q.js.map
