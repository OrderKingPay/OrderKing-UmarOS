import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as cn } from "./utils-BZJZXT5Z.mjs";
import { i as require_jsx_runtime, r as useQueryClient } from "../_libs/react+tanstack__react-query.mjs";
import { o as useT, t as Button } from "./button-DknxHYkM.mjs";
import { i as transitionOrderViaHDmaster } from "./hdmaster-order-transition-BLAHw5vH.mjs";
import { t as Card } from "./card-BlL678bI.mjs";
import { t as formatINR } from "./money-DF4J6Gb1.mjs";
import { t as MoneyText } from "./money-text-XSgR5VMe.mjs";
import { t as REJECT_REASONS } from "./state-machine-DxXhKfD0.mjs";
import { t as enqueueMutation } from "./durable-queue-BkyOo-iU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/order-card-AjHdVNqn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function actionKey(orderId, action) {
	if (typeof window === "undefined") return `${orderId}:${action}:${Date.now()}`;
	const k = `orderking:idem:${orderId}:${action}`;
	try {
		const existing = sessionStorage.getItem(k);
		if (existing) return existing;
		const next = crypto.randomUUID();
		sessionStorage.setItem(k, next);
		return next;
	} catch {
		return crypto.randomUUID();
	}
}
function clearActionKey(orderId, action) {
	if (typeof window === "undefined") return;
	try {
		sessionStorage.removeItem(`orderking:idem:${orderId}:${action}`);
	} catch {}
}
var STATE_MARK = {
	PLACED: {
		letter: "N",
		cls: "bg-danger text-surface"
	},
	ACCEPTED: {
		letter: "A",
		cls: "bg-info text-surface"
	},
	PREPARING: {
		letter: "P",
		cls: "bg-warn text-surface"
	},
	READY: {
		letter: "R",
		cls: "bg-leaf text-surface"
	},
	RIDER_ASSIGNED: {
		letter: "K",
		cls: "bg-leaf text-surface"
	},
	PICKED_UP: {
		letter: "U",
		cls: "bg-leaf text-surface"
	},
	ON_THE_WAY: {
		letter: "W",
		cls: "bg-leaf text-surface"
	},
	DELIVERED: {
		letter: "D",
		cls: "bg-ink text-surface"
	},
	REJECTED: {
		letter: "X",
		cls: "bg-muted text-surface"
	},
	CANCELLED: {
		letter: "C",
		cls: "bg-muted text-surface"
	}
};
function OrderCard({ order, restaurantId, large, dataLabel, onChanged }) {
	const t = useT();
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [rejectOpen, setRejectOpen] = (0, import_react.useState)(false);
	const [reason, setReason] = (0, import_react.useState)("item_unavailable");
	const [error, setError] = (0, import_react.useState)(null);
	const qc = useQueryClient();
	async function act(action) {
		setBusy(true);
		setError(null);
		try {
			const idempotencyKey = actionKey(order.id, action);
			if (typeof navigator !== "undefined" && !navigator.onLine) {
				await enqueueMutation({
					restaurantId,
					orderId: order.id,
					action,
					reason: action === "reject" ? reason : void 0,
					idempotencyKey
				});
				qc.setQueryData([
					"orders",
					restaurantId,
					"live"
				], (old) => {
					if (!old) return old;
					const nextState = {
						accept: "ACCEPTED",
						reject: "REJECTED",
						preparing: "PREPARING",
						ready: "READY"
					};
					return {
						...old,
						orders: old.orders.map((o) => o.id === order.id ? {
							...o,
							state: nextState[action] || o.state
						} : o)
					};
				});
				clearActionKey(order.id, action);
				setRejectOpen(false);
				onChanged?.();
				return;
			}
			await transitionOrderViaHDmaster({ data: {
				restaurantId,
				orderId: order.id,
				action,
				reason: action === "reject" ? reason : void 0,
				idempotencyKey
			} });
			clearActionKey(order.id, action);
			setRejectOpen(false);
			onChanged?.();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Could not update order");
		} finally {
			setBusy(false);
		}
	}
	const mark = STATE_MARK[order.state] ?? {
		letter: "•",
		cls: "bg-muted text-surface"
	};
	const received = new Date(order.placedAt);
	const mins = Math.max(0, Math.round((Date.now() - received.getTime()) / 6e4));
	function printKOT() {
		const win = window.open("", "_blank", "width=400,height=600");
		if (!win) return;
		const itemsHtml = order.lines.map((l) => `<tr><td style="padding:4px 0;font-weight:bold;width:35px">${l.quantity}x</td><td style="padding:4px 0">${l.itemName}${l.variantName ? ` (${l.variantName})` : ""}${l.specialInstructions ? `<br/><small style="color:#666">* ${l.specialInstructions}</small>` : ""}</td></tr>`).join("");
		win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT - ${order.orderNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; font-size: 13px; margin: 12px; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .footer { border-top: 2px dashed #000; padding-top: 8px; margin-top: 8px; text-align: center; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0;font-size:18px">KITCHEN ORDER TICKET</h2>
            <p style="margin:4px 0;font-size:16px;font-weight:bold">Order #${order.orderNumber}</p>
            <p style="margin:0;font-size:12px">${new Date(order.placedAt).toLocaleTimeString()}</p>
          </div>
          <table>${itemsHtml}</table>
          ${order.specialInstructions ? `<p style="border:1px solid #000;padding:6px;margin:8px 0;font-size:12px"><strong>Note:</strong> ${order.specialInstructions}</p>` : ""}
          <div class="footer">
            <p style="margin:0">OrderKing Kitchen OS</p>
          </div>
        </body>
      </html>
    `);
		win.document.close();
		win.focus();
		setTimeout(() => {
			win.print();
			win.close();
		}, 250);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: cn("space-y-3", large && "p-5"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("grid size-10 place-items-center rounded-full text-sm font-semibold", mark.cls),
						"aria-label": order.state,
						children: mark.letter
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: order.orderNumber }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: printKOT,
							className: "rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted hover:bg-surface hover:text-fg",
							title: "Print Kitchen Order Ticket (KOT)",
							children: "🖨️ KOT"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs text-muted",
						children: [
							t("orders.received"),
							" ",
							mins,
							" ",
							t("common.minutes"),
							" · ",
							order.customerArea ?? "Area hidden"
						]
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs uppercase tracking-wide text-muted",
						children: t(`status.${order.state}`)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyText, {
						paise: order.prices.customerTotalPaise,
						className: "text-lg font-semibold"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1 text-sm",
				children: order.lines.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular font-medium",
							children: [line.quantity, "×"]
						}),
						" ",
						line.itemName,
						line.variantName ? ` · ${line.variantName}` : "",
						line.addons?.length ? ` + ${line.addons.map((a) => a.name).join(", ")}` : ""
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular text-muted",
						children: formatINR(line.unitPricePaise * line.quantity)
					})]
				}, i))
			}),
			order.specialInstructions ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-[12px] bg-warn-soft px-3 py-2 text-sm text-warn",
				children: [
					t("orders.special"),
					": ",
					order.specialInstructions
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2 text-xs text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full border border-line px-2 py-1",
						children: order.isCod ? t("orders.cod") : t("orders.paid")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full border border-line px-2 py-1",
						children: [
							t("orders.prepTime"),
							" ",
							order.prepMinutes,
							" ",
							t("common.minutes")
						]
					}),
					order.prices.restaurantDiscountPaise > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-chili-soft px-2 py-1 text-chili-dark",
						children: [
							t("orders.restaurantPromo"),
							" ",
							formatINR(order.prices.restaurantDiscountPaise)
						]
					}) : null,
					order.prices.platformFundedDiscountPaise > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-leaf-soft px-2 py-1 text-leaf",
						children: [
							t("orders.platformPromo"),
							" ",
							formatINR(order.prices.platformFundedDiscountPaise)
						]
					}) : null
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: error
			}) : null,
			rejectOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 rounded-[16px] bg-surface-2 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: t("orders.rejectTitle")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: t("orders.rejectHint")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-2",
						children: REJECT_REASONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex min-h-11 items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "radio",
								name: `reject-${order.id}`,
								checked: reason === r,
								onChange: () => setReason(r)
							}), t(`rejectReasons.${r}`)]
						}, r))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "danger",
							disabled: busy,
							onClick: () => void act("reject"),
							children: t("orders.reject")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setRejectOpen(false),
							children: t("common.cancel")
						})]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					order.state === "PLACED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: large ? "lg" : "md",
						disabled: busy,
						onClick: () => void act("accept"),
						children: t("orders.accept")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: large ? "lg" : "md",
						variant: "secondary",
						disabled: busy,
						onClick: () => setRejectOpen(true),
						children: t("orders.reject")
					})] }) : null,
					order.state === "ACCEPTED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: large ? "lg" : "md",
						disabled: busy,
						onClick: () => void act("preparing"),
						children: t("orders.preparing")
					}) : null,
					order.state === "PREPARING" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: large ? "lg" : "md",
						variant: "leaf",
						disabled: busy,
						onClick: () => void act("ready"),
						children: t("orders.ready")
					}) : null
				]
			})
		]
	});
}
//#endregion
export { OrderCard as t };
