import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { t as isFeatureEnabled } from "./platform-config-noG9WRp_.mjs";
import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { o as useT, r as useClientState, t as Button } from "./button-DknxHYkM.mjs";
import { O as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Volume2, r as VolumeX } from "../_libs/lucide-react.mjs";
import { g as useVendor, r as VendorShell } from "./vendor-shell-Bonozgh5.mjs";
import { t as Card } from "./card-BlL678bI.mjs";
import { r as listOrders } from "./api-orders-r3YxsJbz.mjs";
import { t as OrderCard } from "./order-card-AjHdVNqn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orders-B5528VQ_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
		alarmGain.gain.value = .05;
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
function OrdersPage() {
	const t = useT();
	const vendor = useVendor();
	const qc = useQueryClient();
	const soundOn = useClientState((s) => s.soundOn);
	const setSoundOn = useClientState((s) => s.setSoundOn);
	const [scope, setScope] = (0, import_react.useState)("live");
	const q = useQuery({
		queryKey: [
			"orders",
			vendor.restaurantId,
			scope
		],
		queryFn: () => listOrders({ data: {
			restaurantId: vendor.restaurantId,
			scope
		} }),
		enabled: Boolean(vendor.restaurantId),
		refetchInterval: scope === "live" ? 3e3 : false
	});
	const pending = q.data?.orders.filter((o) => o.state === "PLACED").length ?? 0;
	const prev = (0, import_react.useRef)(pending);
	(0, import_react.useEffect)(() => {
		if (scope === "live" && isFeatureEnabled("new_order_sound") && soundOn && pending > 0) startContinuousAlarm();
		else stopContinuousAlarm();
		prev.current = pending;
		return () => stopContinuousAlarm();
	}, [
		pending,
		soundOn,
		scope
	]);
	if (!vendor.restaurantId && !vendor.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VendorShell, {
		title: t("nav.orders"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("onboarding.title") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/onboarding",
					children: t("common.next")
				})
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(VendorShell, {
		title: t("nav.orders"),
		dataLabel: q.data?.dataLabel ?? vendor.dataLabel,
		stale: q.isError,
		restaurantName: vendor.selected?.restaurantName,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: scope === "live" ? "primary" : "secondary",
					onClick: () => setScope("live"),
					children: t("orders.live")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: scope === "history" ? "primary" : "secondary",
					onClick: () => setScope("history"),
					children: t("orders.history")
				})]
			}), scope === "live" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "secondary",
				size: "icon",
				"aria-label": soundOn ? t("kitchen.soundOn") : t("kitchen.soundOff"),
				onClick: () => setSoundOn(!soundOn),
				children: soundOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3",
			children: (q.data?.orders.length ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "text-sm text-muted",
				children: t("orders.empty")
			}) : q.data?.orders.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderCard, {
				order: o,
				restaurantId: vendor.restaurantId,
				dataLabel: q.data?.dataLabel,
				onChanged: () => {
					qc.invalidateQueries({ queryKey: ["orders"] });
					qc.invalidateQueries({ queryKey: ["dashboard"] });
				}
			}, o.id))
		})]
	});
}
//#endregion
export { OrdersPage as component };
