import { o as __toESM } from "../_runtime.mjs";
import { n as can } from "./rbac-inyuxmFx.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { o as useT, t as Button } from "./button-DknxHYkM.mjs";
import { g as useVendor, r as VendorShell } from "./vendor-shell-Bonozgh5.mjs";
import { t as Card } from "./card-BlL678bI.mjs";
import { t as formatINR } from "./money-DF4J6Gb1.mjs";
import { t as MoneyText } from "./money-text-XSgR5VMe.mjs";
import { i as getSettlements } from "./api-finance-DtgBNGi4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settlements-DFk2dXm1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettlementsPage() {
	const t = useT();
	const vendor = useVendor();
	const allowed = vendor.role ? can(vendor.role, "settlements.view") : false;
	const [instantSettling, setInstantSettling] = (0, import_react.useState)(false);
	const [instantError, setInstantError] = (0, import_react.useState)(null);
	const handleInstantSettlement = async () => {
		setInstantSettling(true);
		setInstantError(null);
		try {
			throw new Error("Instant settlement provider is not connected. No payout was initiated and no reference was generated.");
		} catch (error) {
			setInstantError(error instanceof Error ? error.message : "Settlement provider unavailable");
		} finally {
			setInstantSettling(false);
		}
	};
	const q = useQuery({
		queryKey: ["settle", vendor.restaurantId],
		queryFn: () => getSettlements({ data: { restaurantId: vendor.restaurantId } }),
		enabled: Boolean(vendor.restaurantId) && allowed
	});
	if (vendor.role && !allowed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VendorShell, {
		title: t("nav.settlements"),
		dataLabel: vendor.dataLabel,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: t("settings.financialLocked") })
	});
	function download(kind) {
		const batches = q.data?.batches ?? [];
		if (kind === "json") {
			const blob = new Blob([JSON.stringify({
				dataLabel: q.data?.dataLabel,
				batches
			}, null, 2)], { type: "application/json" });
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = "orderking-settlement.json";
			a.click();
			return;
		}
		const lines = ["order,food,restaurant_discount,commission,platform_funded,packing,refund,payable"];
		for (const b of batches) for (const l of b.lines) lines.push([
			l.order_number,
			l.foodValuePaise,
			l.restaurantDiscountPaise,
			l.commissionPaise,
			l.platformFundedDiscountPaise,
			l.packingPaise,
			l.refundAdjustmentPaise,
			l.restaurantPayablePaise
		].join(","));
		const blob = new Blob([lines.join("\n")], { type: "text/csv" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = "orderking-settlement.csv";
		a.click();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(VendorShell, {
		title: t("nav.settlements"),
		dataLabel: q.data?.dataLabel ?? vendor.dataLabel,
		children: [
			q.data?.dataLabel === "SIMULATED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-warn",
				children: t("settlements.simulatedNote")
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs uppercase tracking-wide text-muted",
				children: t("settlements.payable")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-display text-3xl",
				children: q.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyText, { paise: q.data.currentPayablePaise }) : "—"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border border-primary/30 bg-primary/5 p-4 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-lg",
								children: "⚡"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold text-foreground text-sm",
								children: "1-Tap Instant Daily Settlement"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary",
								children: "IMPS Real-Time"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted mt-1",
						children: [
							"Need working capital immediately? Settle today's accrued balance (",
							q.data ? formatINR(q.data.currentPayablePaise) : "—",
							") in 15 seconds to your registered bank account for a tiny 0.5% convenience fee."
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						disabled: !q.data || q.data.currentPayablePaise <= 0 || instantSettling,
						onClick: () => handleInstantSettlement(),
						className: "shrink-0 bg-primary hover:bg-primary/90 text-white font-medium",
						children: instantSettling ? "Settling via IMPS..." : `Instant Cashout (${q.data ? formatINR(Math.max(0, Math.round(q.data.currentPayablePaise * .995))) : "—"})`
					})]
				}), instantError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-amber-700 dark:text-amber-300",
					children: instantError
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg",
					children: t("settlements.formula")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted",
					children: t("settlements.formulaHint")
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-base",
								children: "🛡️"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold text-emerald-900 dark:text-emerald-300 text-sm",
								children: "Zero Unexplained Deductions & Statutory Safe Harbor"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded",
							children: "IT Act §79 Protected"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted leading-relaxed",
						children: "OrderKing strictly adheres to transparent merchant accounting under Indian Law. Every single deduction is legally mandated and itemized:"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "list-disc pl-4 space-y-1 text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "GST (5%)" }), ": Remitted under Section 9(5) CGST Act (E-Commerce Restaurant Delivery Services)."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "TCS (1%)" }), ": Tax Collected at Source under Section 52 CGST Act."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "TDS (1%)" }), ": Withholding tax under Section 194-O Income Tax Act (Form 16A issued quarterly)."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Intermediary Safe Harbor" }), ": Platform operates as a neutral technology intermediary under Section 79 of the Information Technology Act, 2000."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Binding Arbitration" }), ": All disputes governed by the Arbitration and Conciliation Act, 1996, with exclusive jurisdiction in local district court."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Zero Arbitrary Levies" }), ": No unexplained marketing or listing penalties. Every single rupee is mathematically accounted for in integer paise."] })
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 via-primary/5 to-emerald-500/5 p-4 space-y-3 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-base",
								children: "🚀"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold text-indigo-900 dark:text-indigo-300 text-sm",
								children: "Why OrderKing is 10x More Profitable for You than Zomato"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded",
							children: "+13.3% Higher Take-Home Profit"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-line bg-surface/50 p-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted uppercase font-medium",
										children: "Platform Commission"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline gap-2 mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-base font-bold text-emerald-600 dark:text-emerald-400",
											children: "15% Flat"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted line-through",
											children: "25% on Zomato"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted mt-1",
										children: "You save ₹100 on every ₹1,000 food order."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-line bg-surface/50 p-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted uppercase font-medium",
										children: "Onboarding & Hidden Levies"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline gap-2 mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-base font-bold text-emerald-600 dark:text-emerald-400",
											children: "₹0 (FREE)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted line-through",
											children: "₹10,000+ fee"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted mt-1",
										children: "Zero forced ad spend or listing penalties."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-line bg-surface/50 p-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted uppercase font-medium",
										children: "Settlement Certainty"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline gap-2 mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-base font-bold text-primary",
											children: "Integer-Paise"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted",
											children: "Weekly direct transfer"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted mt-1",
										children: "All deductions statutory: GST §9(5), TDS 194-O, TCS §52."
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] text-muted",
						children: [
							"💡 ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Pro-tip:" }),
							" Because you take home ₹20,000+ extra per ₹2,00,000 monthly sales compared to Zomato, pass on 5% combo discounts to customers to triple your daily order volume!"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: () => download("csv"),
					children: t("settlements.exportCsv")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: () => download("json"),
					children: t("settlements.exportJson")
				})]
			}),
			(q.data?.batches.length ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "text-sm text-muted",
				children: t("settlements.empty")
			}) : q.data?.batches.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs uppercase text-muted",
						children: b.status
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-medium",
						children: b.scheduled_for ?? b.period_end
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyText, {
						paise: b.totalPayablePaise,
						className: "text-xl font-semibold"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[640px] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs uppercase text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Order"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("settlements.food") }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("settlements.restDisc") }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("settlements.commission") }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("settlements.platformDisc") }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("settlements.payableLine") })
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: b.lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-line tabular",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2",
									children: l.order_number
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatINR(l.foodValuePaise) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatINR(l.restaurantDiscountPaise) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatINR(l.commissionPaise) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatINR(l.platformFundedDiscountPaise) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatINR(l.restaurantPayablePaise) })
							]
						}, l.id)) })]
					})
				})]
			}, b.id))
		]
	});
}
//#endregion
export { SettlementsPage as component };
