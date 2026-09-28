import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { t as isFeatureEnabled } from "./platform-config-noG9WRp_.mjs";
import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { o as useT, r as useClientState, t as Button } from "./button-DknxHYkM.mjs";
import { i as Volume2, r as VolumeX } from "../_libs/lucide-react.mjs";
import { g as useVendor, r as VendorShell } from "./vendor-shell-Bonozgh5.mjs";
import { t as Card } from "./card-BlL678bI.mjs";
import { r as listOrders } from "./api-orders-r3YxsJbz.mjs";
import { t as supabaseCloud } from "./db-cloud-YtcM-9t3.mjs";
import { t as OrderCard } from "./order-card-AjHdVNqn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/kitchen-DiKxuPsP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var COLS = [
	{
		state: "PLACED",
		key: "kitchen.new"
	},
	{
		state: "ACCEPTED",
		key: "kitchen.accepted"
	},
	{
		state: "PREPARING",
		key: "kitchen.preparing"
	},
	{
		state: "READY",
		key: "kitchen.ready"
	},
	{
		state: "RIDER_ASSIGNED",
		key: "kitchen.pickup"
	}
];
var alarmAudioCtx = null;
var alarmOscillator = null;
var alarmGain = null;
var isAlarmPlaying = false;
function startContinuousAlarm() {
	if (isAlarmPlaying) return;
	try {
		const AudioContextClass = window.AudioContext || window.webkitAudioContext;
		if (!AudioContextClass) return;
		if (!alarmAudioCtx) alarmAudioCtx = new AudioContextClass();
		if (alarmAudioCtx.state === "suspended") alarmAudioCtx.resume();
		alarmOscillator = alarmAudioCtx.createOscillator();
		alarmGain = alarmAudioCtx.createGain();
		alarmOscillator.type = "square";
		const lfo = alarmAudioCtx.createOscillator();
		lfo.type = "square";
		lfo.frequency.value = 2;
		const lfoGain = alarmAudioCtx.createGain();
		lfoGain.gain.value = 800;
		lfo.connect(lfoGain);
		lfoGain.connect(alarmOscillator.frequency);
		alarmOscillator.frequency.value = 800;
		alarmGain.gain.value = 1;
		alarmOscillator.connect(alarmGain);
		alarmGain.connect(alarmAudioCtx.destination);
		alarmOscillator.start();
		lfo.start();
		isAlarmPlaying = true;
	} catch (e) {
		console.error("Failed to start continuous alarm", e);
	}
}
function stopContinuousAlarm() {
	if (!isAlarmPlaying) return;
	try {
		if (alarmOscillator) {
			alarmOscillator.stop();
			alarmOscillator.disconnect();
			alarmOscillator = null;
		}
		if (alarmGain) {
			alarmGain.disconnect();
			alarmGain = null;
		}
		isAlarmPlaying = false;
	} catch (e) {
		console.error("Failed to stop alarm", e);
	}
}
function playKitchenBell() {
	startContinuousAlarm();
	setTimeout(stopContinuousAlarm, 1e3);
}
function speakKitchenOrder(orderId, totalPaise) {
	try {
		if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
		const amountRs = Math.round(totalPaise / 100);
		const text = `OrderKing: New order #${orderId.slice(-4).toUpperCase()} received! Total amount ₹${amountRs} paid via KingPay.`;
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.rate = 1;
		utterance.pitch = 1.1;
		window.speechSynthesis.speak(utterance);
	} catch {}
}
function KitchenPage() {
	const t = useT();
	const vendor = useVendor();
	const qc = useQueryClient();
	const soundOn = useClientState((s) => s.soundOn);
	const setSoundOn = useClientState((s) => s.setSoundOn);
	const q = useQuery({
		queryKey: [
			"orders",
			vendor.restaurantId,
			"live"
		],
		queryFn: () => listOrders({ data: {
			restaurantId: vendor.restaurantId,
			scope: "live"
		} }),
		enabled: Boolean(vendor.restaurantId)
	});
	(0, import_react.useEffect)(() => {
		if (!vendor.restaurantId) return;
		const channel = supabaseCloud.channel(`orders-${vendor.restaurantId}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "orders",
			filter: `restaurant_id=eq.${vendor.restaurantId}`
		}, () => {
			qc.invalidateQueries({ queryKey: [
				"orders",
				vendor.restaurantId,
				"live"
			] });
		}).subscribe();
		return () => {
			supabaseCloud.removeChannel(channel);
		};
	}, [vendor.restaurantId, qc]);
	const pending = q.data?.orders.filter((o) => o.state === "PLACED").length ?? 0;
	const prev = (0, import_react.useRef)(pending);
	(0, import_react.useEffect)(() => {
		if (isFeatureEnabled("new_order_sound") && soundOn && pending > 0) {
			startContinuousAlarm();
			if (pending > prev.current) {
				const latest = q.data?.orders.find((o) => o.state === "PLACED");
				if (latest) speakKitchenOrder(latest.id, latest.prices?.customerTotalPaise ?? 0);
			}
		} else stopContinuousAlarm();
		prev.current = pending;
		return () => stopContinuousAlarm();
	}, [
		pending,
		soundOn,
		q.data?.orders
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(VendorShell, {
		title: t("kitchen.title"),
		dataLabel: q.data?.dataLabel ?? vendor.dataLabel,
		stale: q.isError,
		restaurantName: vendor.selected?.restaurantName,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: q.data ? `Updated ${new Date(q.data.serverTime).toLocaleTimeString()}` : t("common.loading")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "icon",
					"aria-label": soundOn ? t("kitchen.soundOn") : t("kitchen.soundOff"),
					onClick: () => setSoundOn(!soundOn),
					children: soundOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "border border-primary/30 bg-primary/5 p-4 space-y-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xl",
							children: "📢"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold text-sm text-foreground",
								children: "King Pay AI Soundbox Active"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300",
								children: "₹99/mo Active"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted mt-0.5",
							children: "Zero physical hardware cost. Announces incoming orders and King Pay UPI payments aloud in Bengali, Hindi, and English."
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => {
							playKitchenBell();
							speakKitchenOrder("TEST-8421", 45e3);
						},
						className: "shrink-0 text-xs font-medium",
						children: "🔊 Test Voice Announcement"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0",
				children: COLS.map((col) => {
					const items = (q.data?.orders ?? []).filter((o) => col.state === "RIDER_ASSIGNED" ? [
						"RIDER_ASSIGNED",
						"PICKED_UP",
						"ON_THE_WAY"
					].includes(o.state) : o.state === col.state);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "w-[min(86vw,22rem)] shrink-0 snap-start space-y-2 lg:w-auto lg:min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold tracking-wide",
								children: t(col.key)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular text-sm text-muted",
								children: items.length
							})]
						}), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							className: "text-sm text-muted",
							children: t("kitchen.empty")
						}) : items.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderCard, {
							large: true,
							order: o,
							restaurantId: vendor.restaurantId,
							dataLabel: q.data?.dataLabel,
							onChanged: () => void qc.invalidateQueries({ queryKey: ["orders"] })
						}, o.id))]
					}, col.state);
				})
			})
		]
	});
}
//#endregion
export { KitchenPage as component };
