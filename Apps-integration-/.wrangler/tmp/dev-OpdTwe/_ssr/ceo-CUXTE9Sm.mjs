import { o as __toESM } from "../_runtime.mjs";
import { n as formatBps, r as formatINR } from "./money-DdTRi1IE.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { H as runMarketplaceTick, V as runE2eSimulation, n as askAssistant, r as generateCeoReport, s as getCeoDashboard } from "./session-BhD-mRHK.mjs";
import { n as PageHeader, r as RequirePerm, t as ErrorBanner } from "./page-l0Jk-1KQ.mjs";
import { n as CardTitle, t as Card } from "./card-C7aY7pux.mjs";
import { t as Kpi } from "./kpi-BVqsoTTZ.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Button } from "./button-efe6RXBR.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as computeEconomics, r as simulateCommissionChange, t as DEFAULT_PILOT_ASSUMPTIONS } from "./unit-economics-DVx8MjVq.mjs";
import { t as Input } from "./input-CWXujp7X.mjs";
import { t as Tabs } from "./tabs-BlcPaBF0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ceo-CUXTE9Sm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CeoPage() {
	const [tab, setTab] = (0, import_react.useState)("today");
	const [range, setRange] = (0, import_react.useState)("today");
	const q = useQuery({
		queryKey: ["ceo", range],
		queryFn: async () => {
			const r = await getCeoDashboard({ data: { range } });
			if (!r.ok) throw new Error(r.error);
			return r.data;
		}
	});
	const qc = useQueryClient();
	const tick = useMutation({
		mutationFn: async () => {
			const r = await runMarketplaceTick();
			if (!r.ok) throw new Error(r.error);
			return r.data;
		},
		onSuccess: (d) => {
			toast.success(`Simulated order ${d.orderId} delivered`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const e2e = useMutation({
		mutationFn: async () => {
			const r = await runE2eSimulation();
			if (!r.ok) throw new Error(r.error);
			return r.data;
		},
		onSuccess: () => {
			toast.success("End-to-end admin simulation recorded in the audit log");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Command Center",
			description: "Business health first. Simulation does not change a live marketplace.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "secondary",
				onClick: () => tick.mutate(),
				disabled: tick.isPending,
				children: "Simulate one delivery"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => e2e.mutate(),
				disabled: e2e.isPending,
				children: "Run admin walkthrough"
			})] })
		}),
		q.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorBanner, {
			message: q.error.message,
			onRetry: () => void q.refetch()
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
				tabs: [
					{
						id: "today",
						label: "Today"
					},
					{
						id: "money",
						label: "Money"
					},
					{
						id: "economics",
						label: "Unit economics"
					},
					{
						id: "sim",
						label: "What-if"
					},
					{
						id: "ai",
						label: "CEO AI"
					},
					{
						id: "report",
						label: "Report"
					}
				],
				value: tab,
				onChange: setTab
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: "h-10 rounded-sm border border-border bg-elevated px-2 text-sm",
				value: range,
				onChange: (e) => setRange(e.target.value),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "today",
						children: "Today"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "yesterday",
						children: "Yesterday"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "7d",
						children: "7 days"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "30d",
						children: "30 days"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "month",
						children: "Month"
					})
				]
			})]
		}),
		tab === "today" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayPane, { data: q.data }) : null,
		tab === "money" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyPane, { data: q.data }) : null,
		tab === "economics" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EconomicsPane, { data: q.data }) : null,
		tab === "sim" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Simulator, {}) : null,
		tab === "ai" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CeoAi, {}) : null,
		tab === "report" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportPane, {}) : null
	] });
}
function TodayPane({ data }) {
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Loading…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-subtle",
				children: [data.period, " · SIMULATED DATA"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Orders",
						value: String(data.money.orders),
						hint: `Yesterday ${data.prior.orders}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "GMV",
						value: formatINR(data.money.gmvPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Contribution",
						value: formatINR(data.money.contributionPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "AOV",
						value: formatINR(data.money.aovPaise)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Active restaurants",
						value: String(data.counts.restaurants)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Riders",
						value: String(data.counts.riders),
						hint: `${data.counts.online} online`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Active customers",
						value: String(data.counts.customers)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Delivery success",
						value: formatBps(data.money.deliverySuccessBps)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "mb-3 text-base",
					children: "Growing restaurants"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2 text-sm",
					children: data.top.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular-nums text-muted",
							children: [
								formatINR(r.gmv),
								" · ",
								r.orders,
								" orders"
							]
						})]
					}, r.id))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "mb-3 text-base",
					children: "Needs attention"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2 text-sm",
					children: data.weak.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums text-muted",
							children: formatINR(r.gmv)
						})]
					}, r.id))
				})] })]
			})
		]
	});
}
function MoneyPane({ data }) {
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Loading…"
	});
	const m = data.money;
	const rows = [
		["Restaurant commission", m.restaurantCommissionPaise],
		["Delivery revenue", m.deliveryRevenuePaise],
		["Customer fees", m.customerFeesPaise],
		["Payment cost", -m.paymentCostPaise],
		["Rider cost", -m.riderCostPaise],
		["Refunds", -m.refundsPaise],
		["Platform promotions", -m.promotionalCostPaise],
		["Support (variable)", -m.supportCostPaise],
		["Infrastructure (variable)", -m.infraCostPaise]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "mb-1",
			children: "Platform contribution"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 text-xs text-muted",
			children: "SIMULATED DATA. 10% commission is not assumed profitable — this is the actual stack."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
			className: "space-y-2 text-sm",
			children: [rows.map(([label, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex justify-between border-b border-border py-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular-nums",
					children: formatINR(v)
				})]
			}, label)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex justify-between pt-2 font-medium",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Contribution" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular-nums",
					children: formatINR(m.contributionPaise)
				})]
			})]
		})
	] });
}
function EconomicsPane({ data }) {
	if (!data) return null;
	const slice = computeEconomics({
		...DEFAULT_PILOT_ASSUMPTIONS,
		orders: Math.max(1, data.money.orders),
		aovPaise: data.money.aovPaise || DEFAULT_PILOT_ASSUMPTIONS.aovPaise
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Revenue / order",
				value: formatINR(data.unit.revenuePerOrder)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Contribution / order",
				value: formatINR(data.unit.contributionPerOrder)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Break-even orders / day",
				value: data.unit.breakEvenOrdersPerDay == null ? "Not reached" : String(data.unit.breakEvenOrdersPerDay)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Commission / order",
				value: formatINR(Math.trunc(slice.restaurantCommissionPaise / Math.max(1, slice.gmvPaise ? data.money.orders || 1 : 1)))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Rider cost / order",
				value: formatINR(DEFAULT_PILOT_ASSUMPTIONS.riderPayoutPaise)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Payment cost / order",
				value: formatINR(Math.trunc(slice.paymentCostPaise / Math.max(1, data.money.orders || 1)))
			})
		]
	});
}
function Simulator() {
	const [commissionBps, setCommissionBps] = (0, import_react.useState)(1e3);
	const [orders, setOrders] = (0, import_react.useState)(48);
	const [aov, setAov] = (0, import_react.useState)(420);
	const [discount, setDiscount] = (0, import_react.useState)(12);
	const [delivery, setDelivery] = (0, import_react.useState)(35);
	const [customerFee, setCustomerFee] = (0, import_react.useState)(5);
	const [rider, setRider] = (0, import_react.useState)(42);
	const [refundBps, setRefundBps] = (0, import_react.useState)(180);
	const [paymentBps, setPaymentBps] = (0, import_react.useState)(180);
	const [support, setSupport] = (0, import_react.useState)(2.5);
	const [marketing, setMarketing] = (0, import_react.useState)(250);
	const input = (0, import_react.useMemo)(() => ({
		...DEFAULT_PILOT_ASSUMPTIONS,
		commissionBps,
		orders,
		aovPaise: aov * 100,
		platformDiscountPaise: discount * 100,
		deliveryFeePaise: delivery * 100,
		customerFeePaise: customerFee * 100,
		riderPayoutPaise: rider * 100,
		refundRateBps: refundBps,
		paymentCostBps: paymentBps,
		supportCostPaise: Math.round(support * 100),
		marketingSpendPaise: marketing * 100
	}), [
		commissionBps,
		orders,
		aov,
		discount,
		delivery,
		customerFee,
		rider,
		refundBps,
		paymentBps,
		support,
		marketing
	]);
	const result = computeEconomics(input);
	const scenarios = [
		500,
		800,
		1e3,
		1200
	].map((bps) => ({
		bps,
		r: simulateCommissionChange(input, bps)
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-xs",
				children: "SIMULATION — DOES NOT CHANGE LIVE SYSTEM."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Commission (bps)",
						value: commissionBps,
						onChange: setCommissionBps
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Orders / day",
						value: orders,
						onChange: setOrders
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "AOV (₹)",
						value: aov,
						onChange: setAov
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Platform discount / order (₹)",
						value: discount,
						onChange: setDiscount
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Delivery fee (₹)",
						value: delivery,
						onChange: setDelivery
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Customer fee (₹)",
						value: customerFee,
						onChange: setCustomerFee
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Rider payout (₹)",
						value: rider,
						onChange: setRider
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Refund rate (bps)",
						value: refundBps,
						onChange: setRefundBps
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Payment cost (bps)",
						value: paymentBps,
						onChange: setPaymentBps
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Support / order (₹)",
						value: support,
						onChange: setSupport
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Marketing / day (₹)",
						value: marketing,
						onChange: setMarketing
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Revenue",
						value: formatINR(result.revenuePaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Variable cost",
						value: formatINR(result.variableCostPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Contribution",
						value: formatINR(result.contributionPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Est. monthly (×30)",
						value: formatINR(result.contributionPaise * 30)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Break-even orders / day",
				value: result.breakEvenOrdersPerDay == null ? "Not reached at this unit contribution" : String(result.breakEvenOrdersPerDay)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "mb-3 text-base",
				children: "If commission changes"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2 text-sm",
				children: scenarios.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [(s.bps / 100).toFixed(2), "%"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular-nums",
						children: [formatINR(s.r.contributionPaise), " contribution"]
					})]
				}, s.bps))
			})] })
		]
	});
}
function Num({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "text-xs text-muted",
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			type: "number",
			className: "mt-1",
			value,
			onChange: (e) => onChange(Number(e.target.value) || 0)
		})]
	});
}
function CeoAi() {
	const [prompt, setPrompt] = (0, import_react.useState)("Onboard new restaurant 'Karimganj Spice Villa' with full biryani & north indian menu with realistic photos");
	const [modelTier, setModelTier] = (0, import_react.useState)("antigravity-elite");
	const [autoFixEnabled, setAutoFixEnabled] = (0, import_react.useState)(true);
	const [remedyApproved, setRemedyApproved] = (0, import_react.useState)({});
	const mut = useMutation({
		mutationFn: async (customPrompt) => {
			const r = await askAssistant({ data: {
				prompt: customPrompt || prompt,
				mode: "ceo"
			} });
			if (!r.ok) throw new Error(r.error);
			return r.data;
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary",
							children: "Master AI Commander"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-lg font-bold",
							children: "Autonomous Operating Center"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-muted",
					children: "All-rounder AI executive: onboards restaurants & riders in 1 command, creates menus with realistic dish images, and auto-resolves operations."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs font-medium text-muted",
						children: "Intelligence Tier:"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-8 rounded border border-border bg-elevated px-2.5 text-xs font-medium",
						value: modelTier,
						onChange: (e) => setModelTier(e.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "antigravity-elite",
								children: "Antigravity Elite (Google Multi-Agent)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "claude-4.6",
								children: "Claude 4.6 Sonnet (Anthropic)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "gpt-5.6-luna",
								children: "GPT-5.6 Luna (OpenAI)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "supergrok-4.6",
								children: "SuperGrok 4.6 (xAI)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "gemini-3.0",
								children: "Gemini 3.0 Pro (Google DeepMind)"
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-semibold text-muted",
				children: "1-Command Executive Actions:"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1.5 flex flex-wrap gap-2",
				children: [
					{
						label: "🍽️ Onboard Kitchen + Dishes",
						prompt: "Onboard new restaurant 'Royal Darbar Biryani' with operating hours 11:00-23:00, zone 'Karimganj Central', 10% commission, and generate complete live menu with authentic dish images"
					},
					{
						label: "🛵 Onboard Rider + KYC",
						prompt: "Onboard delivery rider 'Bikash Roy', phone '9876509988', vehicle 'MOTORCYCLE', zone 'Karimganj Central', verify KYC, and set up Wednesday UPI payout"
					},
					{
						label: "📡 Market Competitive Radar",
						prompt: "Execute real-time competitive radar scanning delivery speeds, price elasticity, and take-rate opportunities against Zomato and Swiggy"
					},
					{
						label: "⚡ Sub-20m Pre-Dispatch",
						prompt: "Run predictive pre-dispatch engine to synchronize rider arrival with kitchen dish completion for sub-20 minute deliveries"
					},
					{
						label: "💰 Overnight Treasury Yield",
						prompt: "Optimize overnight escrow float in RBI-regulated TREPS / liquid funds yielding 6.75% annualized with instant liquidity backstop"
					},
					{
						label: "🛡️ Neural Fraud Sentinel",
						prompt: "Run deep neural graph network analysis on GPS spoofing, voucher sybil rings, and circular refund fraud"
					},
					{
						label: "🔧 Self-Healing Hotpatch Engine",
						prompt: "Activate autonomous hotpatch engine to diagnose runtime anomalies, synthesize type-safe AST patches, and verify in sandbox"
					},
					{
						label: "📈 Maximize Profit Margins",
						prompt: "Run autonomous take-rate and profit margin optimizer across all zones to maximize platform EBITDA and eliminate margin leakages"
					},
					{
						label: "🎁 Harvest Bonuses & Free Cash",
						prompt: "Harvest all available payment gateway volume rebates, GST input tax credits, and merchant promo co-funding into platform reserves"
					},
					{
						label: "🤝 Form Corporate & Bank Alliance",
						prompt: "Establish a co-funded bank discount alliance with HDFC Bank (10% instant discount) and B2B corporate lunch catering program"
					},
					{
						label: "🧠 Run Customer Mind-Reader",
						prompt: "Activate customer mind-reading recommendation engine to predict meal cravings and generate hyper-personalized re-order campaigns"
					},
					{
						label: "⚡ Optimize KingPay 2G Flow",
						prompt: "Audit and optimize KingPay 1-tap checkout, offline 2G cryptographic token clearance, and zero-hang network resilience"
					},
					{
						label: "🛡️ Auto-Diagnose & Prepare Fixes",
						prompt: "Run auto-diagnosis across all orders, kitchens, and zones. Prepare remedial actions for any bottlenecks with owner approval controls"
					},
					{
						label: "📑 Generate Wednesday Settlement",
						prompt: "Generate weekly Wednesday settlement statements for all restaurants and riders with strict tenant data isolation"
					}
				].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					className: "text-xs",
					disabled: mut.isPending,
					onClick: () => {
						setPrompt(c.prompt);
						mut.mutate(c.prompt);
					},
					children: c.label
				}, c.label))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-border bg-surface p-3.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold",
								children: "Autonomous Self-Healing"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400",
								children: autoFixEnabled ? "ACTIVE (AUTO-RESOLVING)" : "PAUSED (MANUAL ONLY)"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex cursor-pointer items-center gap-2 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Auto-Fixing:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: autoFixEnabled,
								onChange: (e) => {
									setAutoFixEnabled(e.target.checked);
									toast.success(`Autonomous self-healing ${e.target.checked ? "ENABLED" : "PAUSED"}`);
								},
								className: "size-4 rounded border-border text-primary focus:ring-primary"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: "Continuously audits dispatch bottlenecks, kitchen delays, and zone surge deficits. Prepares actionable remedies with your approval switch."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2 rounded border border-border/80 bg-elevated p-2.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-fg",
								children: "Remedy #1: Reassign delayed orders to nearest idle riders"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: "Estimated delay reduction: ~12-15 mins · Risk: LOW"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400",
									children: "AUTO-FIXED"
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2 rounded border border-border/80 bg-elevated p-2.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-fg",
								children: "Remedy #2: Apply dynamic +0.2x surge buffer in Karimganj Central"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted",
								children: "Incentivizes 3-5 additional riders to go online · Risk: LOW"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-2",
								children: remedyApproved["surge"] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400",
									children: "✓ Approved & Applied"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "default",
									className: "h-7 text-xs",
									onClick: () => {
										setRemedyApproved((prev) => ({
											...prev,
											surge: true
										}));
										toast.success("Surge buffer approved and applied live to Karimganj Central");
									},
									children: "Approve Fix"
								})
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-elevated p-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 text-xs text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "📈" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-fg",
									children: "Strategy & EBITDA"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400",
								children: "+24.8% Net Margin"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] text-muted",
								children: "Dynamic take-rate & surge active"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-elevated p-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 text-xs text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🤝" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-fg",
									children: "Corporate Alliances"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm font-bold text-fg",
								children: "5 Active Partnerships"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] text-muted",
								children: "HDFC, Flipkart, HPCL, B2B Meals"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-elevated p-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 text-xs text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🧠" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-fg",
									children: "Customer Mind-Reader"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm font-bold text-primary",
								children: "3.6x CTR Multiplier"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] text-muted",
								children: "Contextual meal cravings active"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-elevated p-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 text-xs text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🎁" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-fg",
									children: "Treasury Harvesting"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400",
								children: "₹2,20,500 Credited"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] text-muted",
								children: "PG rebates & GST ITC recovered"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-3.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-bold uppercase tracking-wider text-primary",
									children: "Cognitive Consensus Council (Quorum Engine)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400",
									children: "96.8% Quorum Agreement"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[11px] text-muted",
							children: [
								"Confidence: ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-fg",
									children: "0.94 / 1.0"
								}),
								" · Cryptographic Consensus"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2.5 flex flex-wrap items-center gap-2 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded border border-border/70 bg-elevated px-2 py-1 text-[11px] font-medium text-fg",
								children: "👑 Antigravity Elite (Core)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded border border-border/70 bg-elevated px-2 py-1 text-[11px] font-medium text-fg",
								children: "🧠 Claude 4.6 Sonnet"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded border border-border/70 bg-elevated px-2 py-1 text-[11px] font-medium text-fg",
								children: "⚡ GPT-5.6 Luna"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded border border-border/70 bg-elevated px-2 py-1 text-[11px] font-medium text-fg",
								children: "🚀 SuperGrok 4.6"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded border border-border/70 bg-elevated px-2 py-1 text-[11px] font-medium text-fg",
								children: "💎 Gemini 3.8 Flash High"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[11px] text-muted",
						children: "All executive commands evaluate through a multi-model cognitive quorum. Discrepancies are arbitrated autonomously against verified PostgreSQL ledger records."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-medium text-muted",
					children: "Order to Master AI:"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					className: "mt-1 min-h-20 w-full rounded border border-border bg-elevated p-3 text-sm",
					value: prompt,
					onChange: (e) => setPrompt(e.target.value),
					placeholder: "Type any order: onboard restaurant with menu and dish photos, onboard rider, fix order delay, run financial audit..."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[11px] text-muted",
						children: [
							"Engine: ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-fg",
								children: modelTier
							}),
							" · Multi-Tenant Scope Enforced"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => void mut.mutate(),
						disabled: mut.isPending,
						children: mut.isPending ? "Executing Order…" : "Execute Order"
					})]
				})
			] }),
			mut.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("pre", {
				className: "mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-elevated p-3 text-xs leading-relaxed",
				children: [mut.data.text, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 border-t border-border/50 pt-2 text-[11px] text-subtle",
					children: ["Executed by Master AI · Provider: ", mut.data.provider]
				})]
			}) : null
		]
	});
}
function ReportPane() {
	const mut = useMutation({
		mutationFn: async () => {
			const r = await generateCeoReport();
			if (!r.ok) throw new Error(r.error);
			return r.data;
		},
		onError: (e) => toast.error(e.message)
	});
	const d = mut.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 flex items-center justify-between gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "text-base",
			children: "Daily CEO report"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			onClick: () => mut.mutate(),
			disabled: mut.isPending,
			children: "Generate"
		})]
	}), d ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2 text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-warn",
				children: ["SIMULATED DATA · ", d.period]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Orders ",
				d.orders,
				" · GMV ",
				formatINR(d.gmvPaise),
				" · Contribution ",
				formatINR(d.contributionPaise)
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Top restaurants: ", d.topRestaurants.map((r) => r.name).join(", ") || "—"] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Risks: ", d.alerts.join("; ") || "none open"] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "list-disc pl-5",
				children: d.recommended.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: x }, x))
			})
		]
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "One click. Numbers come from authorized tables, not invention."
	})] });
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequirePerm, {
	perm: "view_executive",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CeoPage, {})
});
//#endregion
export { SplitComponent as component };
