import { a as getServerFnById, r as createServerFn, t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-DsMHvbSu.mjs";
import process from "node:process";
//#region node_modules/.nitro/vite/services/ssr/assets/hdmaster-order-transition-BLAHw5vH.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function coreUrl() {
	const value = process.env.HDMASTER_URL?.trim();
	if (!value) throw new Error("HDMASTER_URL is not configured");
	return value.replace(/\/+$/, "");
}
function serviceToken() {
	const value = process.env.ORDERKING_SERVICE_TOKEN?.trim() || process.env.ORDERKING_SERVICE_TOKEN?.trim();
	if (!value) throw new Error("ORDERKING_SERVICE_TOKEN is not configured");
	return value;
}
var transitionOrderViaHDmaster = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("2bce48553a9158ea9749c9874b7cf5e0e41364507c0a634c77492defabb7b646"));
//#endregion
export { transitionOrderViaHDmaster as i, createSsrRpc as n, serviceToken as r, coreUrl as t };
