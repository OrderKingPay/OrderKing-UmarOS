import { i as cn } from "./utils-BZJZXT5Z.mjs";
import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as formatINR } from "./money-DF4J6Gb1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/money-text-XSgR5VMe.js
var import_jsx_runtime = require_jsx_runtime();
function MoneyText({ paise, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("tabular", className),
		children: formatINR(paise)
	});
}
//#endregion
export { MoneyText as t };
