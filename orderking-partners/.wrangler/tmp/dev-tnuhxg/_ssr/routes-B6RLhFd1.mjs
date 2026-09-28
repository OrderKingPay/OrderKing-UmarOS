import { n as platformConfig } from "./platform-config-noG9WRp_.mjs";
import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { a as useCurrentUserState, n as OrderKingMark, o as useT, t as Button } from "./button-DknxHYkM.mjs";
import { A as Link, L as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B6RLhFd1.js
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const t = useT();
	const { user } = useCurrentUserState();
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/dashboard" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-dvh bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex min-h-dvh max-w-3xl flex-col px-5 py-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderKingMark, { className: "size-9 text-chili" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-xl",
						children: platformConfig.brand.appName
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					className: "inline-flex min-h-11 items-center text-sm font-medium text-chili",
					children: t("auth.signIn")
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 flex-col justify-center py-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium uppercase tracking-[0.18em] text-chili",
						children: t("landing.kicker")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 max-w-xl font-display text-4xl leading-[1.1] md:text-5xl",
						children: t("landing.title")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-lg text-lg text-muted",
						children: t("landing.body")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 flex flex-wrap gap-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "lg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/login",
								children: t("landing.cta")
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-10 max-w-md text-sm text-muted",
						children: t("landing.forOwners")
					})
				]
			})]
		})
	});
}
//#endregion
export { Home as component };
