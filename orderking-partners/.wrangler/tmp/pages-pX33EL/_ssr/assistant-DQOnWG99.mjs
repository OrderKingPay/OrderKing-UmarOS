import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { o as useT, t as Button } from "./button-DknxHYkM.mjs";
import { r as Textarea } from "./input-Dj6qv6Kf.mjs";
import { a as askAssistant, g as useVendor, r as VendorShell } from "./vendor-shell-Bonozgh5.mjs";
import { t as Card } from "./card-BlL678bI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/assistant-DQOnWG99.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AssistantPage() {
	const t = useT();
	const vendor = useVendor();
	const [q, setQ] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [log, setLog] = (0, import_react.useState)([]);
	t("assistant.examples").split("|");
	vendor.adapters?.ai.connected;
	async function send(text) {
		if (!text.trim()) return;
		setBusy(true);
		setLog((l) => [...l, {
			role: "user",
			text
		}]);
		try {
			const res = await askAssistant({ data: {
				restaurantId: vendor.restaurantId,
				question: text
			} });
			const reply = typeof res === "object" && res && "text" in res ? String(res.text) : t("assistant.unavailable");
			setLog((l) => [...l, {
				role: "assistant",
				text: reply
			}]);
		} catch (e) {
			setLog((l) => [...l, {
				role: "assistant",
				text: e instanceof Error ? e.message : t("assistant.unavailable")
			}]);
		} finally {
			setBusy(false);
			setQ("");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(VendorShell, {
		title: t("nav.assistant"),
		dataLabel: vendor.dataLabel,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t("assistant.disclaimer")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5 rounded-full bg-leaf-soft px-3 py-1 text-xs font-semibold text-leaf",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-leaf animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "AI Kitchen Assistant Online" })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border-amber-500/30 bg-amber-500/5 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-amber-700 dark:text-amber-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-lg",
							children: "⚖️"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-bold tracking-tight",
							children: "STATUTORY MERCHANT HELPLINES & OMBUDSMAN"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: "Direct escalation to official Indian statutory departments and regulatory desks. Ensures compliance under FSSAI, GST & DPIIT rules."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "https://foscos.fssai.gov.in",
								target: "_blank",
								rel: "noreferrer",
								className: "flex items-center gap-2 rounded-lg border border-leaf-soft bg-surface p-2.5 text-xs font-bold text-leaf hover:bg-leaf-soft/50 transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "📜" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "FSSAI FoSCoS" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] font-normal text-muted",
									children: "foscos.fssai.gov.in"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "https://www.gst.gov.in",
								target: "_blank",
								rel: "noreferrer",
								className: "flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🏛️" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "GST Seva Kendra" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] font-normal text-muted",
									children: "1800-103-4786"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "https://samadhaan.msme.gov.in",
								target: "_blank",
								rel: "noreferrer",
								className: "flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🛡️" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "MSME Samadhaan" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] font-normal text-muted",
									children: "Delayed Payments"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "https://odrcountry.in",
								target: "_blank",
								rel: "noreferrer",
								className: "flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⚖️" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "DPIIT ODR" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] font-normal text-muted",
									children: "Dispute Resolution"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "mailto:merchant.care@orderking.in",
								className: "flex items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "📩" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Merchant Ombudsman" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] font-normal text-muted",
									children: "Statutory Desk"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "https://wa.me/919223166166?text=RESTAURANT%20PARTNER%20PRIORITY%20SUPPORT:%20Need%20immediate%20kitchen%20settlement%20assistance",
								target: "_blank",
								rel: "noreferrer",
								className: "flex items-center gap-2 rounded-lg bg-[#25D366]/10 p-2.5 text-xs font-bold text-[#25D366] hover:bg-[#25D366]/20 transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "💬" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "WhatsApp VIP Care" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] font-normal text-muted",
									children: "24x7 Priority Desk"
								})] })]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void send("How do I use 1-click AI auto-setup to connect, configure and test my thermal printers and POS?"),
						children: "🛠️ 1-Click AI Auto-Connect Hardware & POS"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void send("How do I test print dual KOT tickets for Kitchen food and Bar beverages?"),
						children: "🧾 Test Print Kitchen KOT & Bar Tickets"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void send("How do I connect my 80mm ESC/POS thermal printer via Network IP or Bluetooth?"),
						children: "🖨️ Thermal Printer & KOT Setup"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void send("How do I configure bidirectional sync with Petpooja or UrbanPiper POS?"),
						children: "🏬 Petpooja & UrbanPiper POS Sync"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void send("How are my kitchen sales and orders today?"),
						children: "📊 Today's Sales & Orders"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void send("Explain my Wednesday payout breakdown with 12% commission, GST, TCS and TDS deductions."),
						children: "💳 Wednesday Payout & Tax Breakdown"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void send("How do I claim 100% food value reimbursement for a customer-cancelled order?"),
						children: "🛡️ Cancelled Order Reimbursement"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void send("What are my top selling dishes today?"),
						children: "🍲 Top Selling Dishes"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void send("Which items are currently out of stock?"),
						children: "⚠️ Check Out-of-Stock Items"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => void send("How do I activate Rush Hour prep time?"),
						children: "🔥 Rush Hour & Prep Buffers"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: log.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: m.role === "user" ? "bg-chili-soft" : "",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "whitespace-pre-wrap text-sm",
						children: m.text
					})
				}, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					send(q);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "min-h-14",
					placeholder: t("assistant.placeholder"),
					value: q,
					onChange: (e) => setQ(e.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					disabled: busy,
					children: t("assistant.send")
				})]
			})
		]
	});
}
//#endregion
export { AssistantPage as component };
