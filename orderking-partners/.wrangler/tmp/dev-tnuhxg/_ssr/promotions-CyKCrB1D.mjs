import { o as __toESM } from "../_runtime.mjs";
import { n as can } from "./rbac-inyuxmFx.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { o as useT, t as Button } from "./button-DknxHYkM.mjs";
import { n as Label, t as Input } from "./input-Dj6qv6Kf.mjs";
import { g as useVendor, r as VendorShell } from "./vendor-shell-Bonozgh5.mjs";
import { t as Card } from "./card-BlL678bI.mjs";
import { a as rupeesToPaise } from "./money-DF4J6Gb1.mjs";
import { t as MoneyText } from "./money-text-XSgR5VMe.mjs";
import { a as saveAdCampaign, o as savePromotion, r as getPromotions, t as getAdCampaign } from "./api-finance-DtgBNGi4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/promotions-CyKCrB1D.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PromotionsPage() {
	const t = useT();
	const vendor = useVendor();
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["promos", vendor.restaurantId],
		queryFn: () => getPromotions({ data: { restaurantId: vendor.restaurantId } }),
		enabled: Boolean(vendor.restaurantId)
	});
	const adQuery = useQuery({
		queryKey: ["adCampaign", vendor.restaurantId],
		queryFn: () => getAdCampaign({ data: { restaurantId: vendor.restaurantId } }),
		enabled: Boolean(vendor.restaurantId)
	});
	const canEdit = vendor.role ? can(vendor.role, "promotions.edit") : false;
	const [name, setName] = (0, import_react.useState)("");
	const [kind, setKind] = (0, import_react.useState)("percent");
	const [percent, setPercent] = (0, import_react.useState)("15");
	const [amountRupees, setAmountRupees] = (0, import_react.useState)("50");
	const [minOrderRupees, setMinOrderRupees] = (0, import_react.useState)("199");
	const [maxDiscountRupees, setMaxDiscountRupees] = (0, import_react.useState)("75");
	const [adBudgetRupees, setAdBudgetRupees] = (0, import_react.useState)("250");
	const rest = q.data?.promotions.filter((p) => p.funder === "RESTAURANT") ?? [];
	const plat = q.data?.promotions.filter((p) => p.funder === "PLATFORM") ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(VendorShell, {
		title: t("nav.promotions"),
		dataLabel: q.data?.dataLabel ?? vendor.dataLabel,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mb-6 space-y-4 border-2 border-primary/20 bg-gradient-to-br from-surface via-surface to-primary/5 p-5 shadow-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary",
								children: "Zomato-Style Ad Engine"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl font-bold",
								children: "Promote & Boost Kitchen"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Get top placement on customer app Search & Home feed with a Promoted badge."
						})] }), adQuery.data?.isActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-success animate-pulse" }), " Active Campaign"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-muted/20 px-3 py-1 text-xs font-medium text-muted",
							children: "Campaign Paused"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border bg-surface p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted",
									children: "Daily Budget"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-lg font-bold",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyText, { paise: adQuery.data?.dailyBudgetPaise ?? 25e3 })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border bg-surface p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted",
									children: "Est. Impressions"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-lg font-bold text-fg",
									children: [
										"~",
										adQuery.data?.estimatedImpressions ?? 3e3,
										" views/day"
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border bg-surface p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted",
									children: "Est. Extra Orders"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-lg font-bold text-primary",
									children: [
										"~",
										adQuery.data?.estimatedClicks ?? 35,
										" clicks"
									]
								})]
							})
						]
					}),
					canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-3 pt-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-sm font-medium",
								children: "Set Daily Budget (₹):"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-2",
								children: [
									"100",
									"250",
									"500",
									"1000"
								].map((amt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setAdBudgetRupees(amt),
									className: `rounded-lg px-3 py-1 text-sm font-medium transition-colors ${adBudgetRupees === amt ? "bg-primary text-white" : "bg-surface-2 text-fg hover:bg-surface-3"}`,
									children: ["₹", amt]
								}, amt))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "ml-auto flex gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: adQuery.data?.isActive ? "outline" : "primary",
									onClick: () => void saveAdCampaign({ data: {
										restaurantId: vendor.restaurantId,
										dailyBudgetPaise: rupeesToPaise(Number(adBudgetRupees) || 250),
										isActive: !adQuery.data?.isActive
									} }).then(() => qc.invalidateQueries({ queryKey: ["adCampaign"] })),
									children: adQuery.data?.isActive ? "Pause Campaign" : "🚀 Launch Ad Boost"
								})
							})
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: t("promotions.restaurantFunded")
					}), rest.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-medium",
									children: p.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded bg-surface-2 px-2 py-0.5 text-xs uppercase font-medium",
									children: p.kind
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: p.estimate.narrative
							}),
							canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => void savePromotion({ data: {
									restaurantId: vendor.restaurantId,
									id: p.id,
									name: p.name,
									funder: "RESTAURANT",
									kind: p.kind,
									percentOff: p.percent_off ?? void 0,
									amountPaise: p.amountPaise ?? void 0,
									isActive: !p.isActive
								} }).then(() => qc.invalidateQueries({ queryKey: ["promos"] })),
								children: p.isActive ? t("promotions.pause") : t("promotions.activate")
							}) : null
						]
					}, p.id))]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: t("promotions.platformFunded")
					}), plat.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-medium",
									children: p.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded bg-surface-2 px-2 py-0.5 text-xs uppercase font-medium",
									children: p.kind
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: p.estimate.narrative
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyText, { paise: p.estimate.estimatedDailyCostPaise })
						]
					}, p.id))]
				})]
			}),
			canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-6 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-bold",
						children: t("promotions.create")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t("menu.name") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "e.g. 20% Off Weekend Specials",
								value: name,
								onChange: (e) => setName(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Offer Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-11 w-full rounded-[12px] border border-line bg-surface px-3 text-sm",
								value: kind,
								onChange: (e) => setKind(e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "percent",
										children: "Percentage Off (%)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "fixed",
										children: "Flat Amount Off (₹)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "bogo",
										children: "Buy 1 Get 1 Free (BOGO)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "free_delivery",
										children: "Free Delivery Offer"
									})
								]
							})] }),
							kind === "percent" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t("promotions.percent") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								value: percent,
								onChange: (e) => setPercent(e.target.value)
							})] }) : null,
							kind === "fixed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Discount Amount (₹)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								value: amountRupees,
								onChange: (e) => setAmountRupees(e.target.value)
							})] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Minimum Order Value (₹)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								value: minOrderRupees,
								onChange: (e) => setMinOrderRupees(e.target.value)
							})] }),
							kind === "percent" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Maximum Discount Cap (₹)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								value: maxDiscountRupees,
								onChange: (e) => setMaxDiscountRupees(e.target.value)
							})] }) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => void savePromotion({ data: {
							restaurantId: vendor.restaurantId,
							name: name.trim() || `${kind.toUpperCase()} Deal`,
							funder: "RESTAURANT",
							kind,
							percentOff: kind === "percent" ? Number(percent) || 0 : void 0,
							amountPaise: kind === "fixed" ? rupeesToPaise(Number(amountRupees) || 0) : void 0,
							minOrderPaise: rupeesToPaise(Number(minOrderRupees) || 0),
							maxDiscountPaise: kind === "percent" && maxDiscountRupees ? rupeesToPaise(Number(maxDiscountRupees)) : null,
							isActive: true
						} }).then(() => {
							setName("");
							qc.invalidateQueries({ queryKey: ["promos"] });
						}),
						children: t("promotions.create")
					})
				]
			}) : null
		]
	});
}
//#endregion
export { PromotionsPage as component };
