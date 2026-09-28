// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
    "/logo.jpg",
    "/__grok/icon-180.png",
    "/assets/_app-CLRjy1oF.js",
    "/assets/_app-DuuIVno9.js",
    "/assets/ai-Btg37b7z.js",
    "/assets/analytics-CPu2KrVZ.js",
    "/assets/audit-B96qSO36.js",
    "/assets/auth-splash-BRFjr3JU.js",
    "/assets/badge-BKSm3VYu.js",
    "/assets/button-DmibuQJ2.js",
    "/assets/card-B9Z37kx9.js",
    "/assets/ceo-DNvirTBE.js",
    "/assets/client-DRhaju3Z.js",
    "/assets/commerce-Bofhwu0F.js",
    "/assets/customers-D66v_scj.js",
    "/assets/dispatch-D8RGpInU.js",
    "/assets/dist-vhkMCeUq.js",
    "/assets/finance-B9BP9Hv_.js",
    "/assets/ids-CYAnOr0s.js",
    "/assets/index-Dp457ApK.js",
    "/assets/input-Bz4c-2po.js",
    "/assets/jsx-runtime-0vZSBttN.js",
    "/assets/kpi-CyJYLWiK.js",
    "/assets/kyc-Bcezs_bS.js",
    "/assets/link-Dh3916xN.js",
    "/assets/login-DHgdTMzC.js",
    "/assets/map-CQQQmPE7.js",
    "/assets/money-COI7MnVJ.js",
    "/assets/notifications-C5zz2Rob.js",
    "/assets/orders-Cde-ly9W.js",
    "/assets/page-CABbC4ms.js",
    "/assets/people-Dpz5wsh5.js",
    "/assets/preload-helper-CfabPmSm.js",
    "/assets/react-dom-x9LNwWQc.js",
    "/assets/react-SIfiwpqq.js",
    "/assets/removable-Bpy9_KGc.js",
    "/assets/restaurants-BFEtUUIk.js",
    "/assets/riders-O_BV9Eo7.js",
    "/assets/risk-BYXl3Aif.js",
    "/assets/search-CWaYt2Hl.js",
    "/assets/security-Chpih1Gr.js",
    "/assets/session-BcyV7eId.js",
    "/assets/styles-Dv6t5XaN.css",
    "/assets/support-DYMqPfQu.js",
    "/assets/system-rHUJXdM0.js",
    "/assets/table-CwecwzTF.js",
    "/assets/tabs-D4Ppcaol.js",
    "/assets/tasks-BPrICajW.js",
    "/assets/types-BaLaJadb.js",
    "/assets/useMutation-BcfFmjf_.js",
    "/assets/useQuery-0RK9N1yK.js",
    "/assets/useRouter-1D7_G71C.js",
    "/assets/utils-DojpP95n.js",
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
import worker from "C:\\Users\\hasan\\OrderKing\\Apps-integration-\\.wrangler\\tmp\\pages-XKCeNq\\bundledWorker-0.7502350806379533.mjs";
import { isRoutingRuleMatch } from "C:\\Users\\hasan\\AppData\\Local\\npm-cache\\_npx\\32026684e21afda6\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "C:\\Users\\hasan\\OrderKing\\Apps-integration-\\.wrangler\\tmp\\pages-XKCeNq\\bundledWorker-0.7502350806379533.mjs";
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
//# sourceMappingURL=7730doo1jpr.js.map
