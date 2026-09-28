import { o as __toESM, r as __exportAll } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as createRootRoute, b as useRouter, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { L as string, N as number, P as object, R as union, j as literal } from "../_libs/@better-auth/core+[...].mjs";
import { i as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { n as auth } from "./server-3pSweaG_.mjs";
import processModule from "node:process";
import { Buffer } from "node:buffer";
import * as crypto from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/router--PYTs68d.js
var router__PYTs68d_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: error.message || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var ErrorBoundary = class extends import_react.Component {
	state = {
		hasError: false,
		error: null
	};
	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			error
		};
	}
	componentDidCatch(error, info) {
		console.error("[OrderKing Integration] Uncaught error:", error, info.componentStack);
	}
	render() {
		if (this.state.hasError) return this.props.fallback ?? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-4xl",
					children: "😕"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-semibold",
					children: "Something went wrong"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-sm text-sm text-muted",
					children: this.state.error?.message ?? "An unexpected error occurred"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white",
					onClick: () => {
						this.setState({
							hasError: false,
							error: null
						});
						window.location.reload();
					},
					children: "Try Again"
				})
			]
		});
		return this.props.children;
	}
};
function OfflineDetector() {
	const [online, setOnline] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const on = () => setOnline(true);
		const off = () => setOnline(false);
		setOnline(navigator.onLine);
		window.addEventListener("online", on);
		window.addEventListener("offline", off);
		return () => {
			window.removeEventListener("online", on);
			window.removeEventListener("offline", off);
		};
	}, []);
	if (online) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-x-0 top-0 z-[9999] bg-red-600 px-4 py-2 text-center text-sm font-medium text-white shadow-md",
		children: "⚠ Network disconnected"
	});
}
var styles_default = "/assets/styles-Dv6t5XaN.css";
var APP_NAME = "OrderKing";
var queryClient = new QueryClient({ defaultOptions: { queries: {
	retry: 1,
	refetchOnWindowFocus: false
} } });
var Route$28 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#0B0C0E"
			},
			{
				name: "description",
				content: "OrderKing master admin and CEO command center"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/jpeg",
				href: "/logo.jpg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfflineDetector, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
				client: queryClient,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "dark",
					position: "bottom-right"
				})]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$23 = () => import("../_app-q29NqEla.mjs");
var Route$27 = createFileRoute("/_app")({ component: lazyRouteComponent($$splitComponentImporter$23, "component") });
var $$splitComponentImporter$22 = () => import("./login-eSgHvO3t.mjs");
var Route$26 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$22, "component") });
var $$splitComponentImporter$21 = () => import("../_app-Dm3BPi78.mjs");
var Route$25 = createFileRoute("/_app/")({ component: lazyRouteComponent($$splitComponentImporter$21, "component") });
var $$splitComponentImporter$20 = () => import("./ai-qPgaloeF.mjs");
var Route$24 = createFileRoute("/_app/ai")({ component: lazyRouteComponent($$splitComponentImporter$20, "component") });
var $$splitComponentImporter$19 = () => import("./analytics-BIiyT5d_.mjs");
var Route$23 = createFileRoute("/_app/analytics")({ component: lazyRouteComponent($$splitComponentImporter$19, "component") });
var $$splitComponentImporter$18 = () => import("./audit-8wuxulzZ.mjs");
var Route$22 = createFileRoute("/_app/audit")({ component: lazyRouteComponent($$splitComponentImporter$18, "component") });
var $$splitComponentImporter$17 = () => import("./ceo-CUXTE9Sm.mjs");
var Route$21 = createFileRoute("/_app/ceo")({ component: lazyRouteComponent($$splitComponentImporter$17, "component") });
var $$splitComponentImporter$16 = () => import("./commerce-CU2RMMWT.mjs");
var Route$20 = createFileRoute("/_app/commerce")({ component: lazyRouteComponent($$splitComponentImporter$16, "component") });
var $$splitComponentImporter$15 = () => import("./customers-C2vipgCx.mjs");
var Route$19 = createFileRoute("/_app/customers")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./dispatch-aAoGzk-H.mjs");
var Route$18 = createFileRoute("/_app/dispatch")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./finance-DGQYZsNt.mjs");
var Route$17 = createFileRoute("/_app/finance")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./kyc-Bc8jyduY.mjs");
var Route$16 = createFileRoute("/_app/kyc")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./map-CZ_YQCVn.mjs");
var Route$15 = createFileRoute("/_app/map")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./notifications-Bg-JAY1E.mjs");
var Route$14 = createFileRoute("/_app/notifications")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./orders-D2SIAZfm.mjs");
var Route$13 = createFileRoute("/_app/orders")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./people-LF9b9cQU.mjs");
var Route$12 = createFileRoute("/_app/people")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./restaurants-BSbJnxpM.mjs");
var Route$11 = createFileRoute("/_app/restaurants")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./riders-B7o2UjTW.mjs");
var Route$10 = createFileRoute("/_app/riders")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./risk-DJKKYQ7a.mjs");
var Route$9 = createFileRoute("/_app/risk")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./search-BkLXvHT7.mjs");
var Route$8 = createFileRoute("/_app/search")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./security-Do9V6ZGT.mjs");
var Route$7 = createFileRoute("/_app/security")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./support-BWPMh5kb.mjs");
var Route$6 = createFileRoute("/_app/support")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./system-B3Lktk6t.mjs");
var Route$5 = createFileRoute("/_app/system")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./tasks-DFmWhP-G.mjs");
var Route$4 = createFileRoute("/_app/tasks")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route$3 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var WebhookGateway = class {
	/**
	* Verifies a Razorpay webhook signature.
	* @param payload The raw request body as a string.
	* @param signature The `x-razorpay-signature` header value.
	* @param secret The Razorpay webhook secret.
	* @returns boolean True if signature is valid.
	*/
	static verifyRazorpaySignature(payload, signature, secret) {
		try {
			const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
			if (signature.length !== expectedSignature.length) return false;
			return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
		} catch (e) {
			return false;
		}
	}
	/**
	* Verifies a Twilio webhook signature.
	* @param url The full webhook URL (including query params).
	* @param params The parsed form-urlencoded body parameters.
	* @param signature The `x-twilio-signature` header value.
	* @param authToken The Twilio Auth Token.
	* @returns boolean True if signature is valid.
	*/
	static verifyTwilioSignature(url, params, signature, authToken) {
		try {
			let dataToSign = url;
			const sortedKeys = Object.keys(params).sort();
			for (const key of sortedKeys) dataToSign += key + params[key];
			const expectedSignature = crypto.createHmac("sha1", authToken).update(dataToSign).digest("base64");
			if (signature.length !== expectedSignature.length) return false;
			return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
		} catch (e) {
			return false;
		}
	}
	/**
	* Verifies a MessageBird webhook signature.
	* @param url The full request URL.
	* @param rawBody The raw request body.
	* @param signature The `MessageBird-Signature` header value.
	* @param timestamp The `MessageBird-Request-Timestamp` header value.
	* @param signingKey The MessageBird signing key.
	* @returns boolean True if signature is valid.
	*/
	static verifyMessageBirdSignature(url, rawBody, signature, timestamp, signingKey) {
		try {
			const dataToSign = `${timestamp}\n${new URL(url).search.replace("?", "")}\n${rawBody}`;
			const expectedSignature = crypto.createHmac("sha256", signingKey).update(dataToSign).digest("base64");
			if (signature.length !== expectedSignature.length && signature !== expectedSignature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")) {}
			const sigBuffer = Buffer.from(signature, "base64");
			const expectedBuffer = Buffer.from(expectedSignature, "base64");
			if (sigBuffer.length !== expectedBuffer.length) return false;
			return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
		} catch (e) {
			return false;
		}
	}
};
var Route$2 = createFileRoute("/api/webhooks/messagebird")({ server: { handlers: { POST: async ({ request }) => {
	const signature = request.headers.get("messagebird-signature");
	const timestamp = request.headers.get("messagebird-request-timestamp");
	if (!signature || !timestamp) return new Response("Missing signature or timestamp", { status: 400 });
	const signingKey = processModule.env.MESSAGEBIRD_SIGNING_KEY;
	if (!signingKey) {
		console.error("MESSAGEBIRD_SIGNING_KEY is not configured");
		return new Response("Configuration error", { status: 500 });
	}
	const url = request.url;
	const rawBody = await request.text();
	if (!WebhookGateway.verifyMessageBirdSignature(url, rawBody, signature, timestamp, signingKey)) return new Response("Invalid signature", { status: 400 });
	try {
		const payload = JSON.parse(rawBody);
		console.log("Verified MessageBird Webhook Payload:", payload);
		return new Response(JSON.stringify({ status: "ok" }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response("Invalid JSON payload", { status: 400 });
	}
} } } });
var Route$1 = createFileRoute("/api/webhooks/razorpay")({ server: { handlers: { POST: async ({ request }) => {
	const signature = request.headers.get("x-razorpay-signature");
	if (!signature) return new Response(JSON.stringify({ error: "Missing signature" }), {
		status: 400,
		headers: { "Content-Type": "application/json" }
	});
	const rawBody = await request.text();
	const secret = processModule.env.RAZORPAY_WEBHOOK_SECRET;
	if (!secret) {
		console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
		return new Response(JSON.stringify({ error: "Configuration error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
	if (!WebhookGateway.verifyRazorpaySignature(rawBody, signature, secret)) return new Response(JSON.stringify({ error: "Invalid signature" }), {
		status: 400,
		headers: { "Content-Type": "application/json" }
	});
	try {
		const payload = JSON.parse(rawBody);
		console.log("Verified Razorpay Webhook:", payload.event);
		switch (payload.event) {
			case "payment.captured": break;
			case "payment.failed": break;
			default: console.log("Unhandled Razorpay event:", payload.event);
		}
		return new Response(JSON.stringify({ status: "ok" }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}
} } } });
var Route = createFileRoute("/api/webhooks/twilio")({ server: { handlers: { POST: async ({ request }) => {
	const signature = request.headers.get("x-twilio-signature");
	if (!signature) return new Response("Missing signature", { status: 400 });
	const authToken = processModule.env.TWILIO_AUTH_TOKEN;
	if (!authToken) {
		console.error("TWILIO_AUTH_TOKEN is not configured");
		return new Response("Configuration error", { status: 500 });
	}
	const url = request.url;
	const bodyText = await request.text();
	const params = new URLSearchParams(bodyText);
	const paramsObj = {};
	for (const [key, value] of params.entries()) paramsObj[key] = value;
	if (!WebhookGateway.verifyTwilioSignature(url, paramsObj, signature, authToken)) return new Response("Invalid signature", { status: 400 });
	console.log("Verified Twilio Webhook Payload:", paramsObj);
	const messageStatus = paramsObj.MessageStatus;
	if (messageStatus) console.log(`Message ${paramsObj.MessageSid} status is now: ${messageStatus}`);
	return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
		status: 200,
		headers: { "Content-Type": "text/xml" }
	});
} } } });
var AppRoute = Route$27.update({
	id: "/_app",
	getParentRoute: () => Route$28
});
var LoginRoute = Route$26.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$28
});
var AppIndexRoute = Route$25.update({
	id: "/",
	path: "/",
	getParentRoute: () => AppRoute
});
var AppAiRoute = Route$24.update({
	id: "/ai",
	path: "/ai",
	getParentRoute: () => AppRoute
});
var AppAnalyticsRoute = Route$23.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => AppRoute
});
var AppAuditRoute = Route$22.update({
	id: "/audit",
	path: "/audit",
	getParentRoute: () => AppRoute
});
var AppCeoRoute = Route$21.update({
	id: "/ceo",
	path: "/ceo",
	getParentRoute: () => AppRoute
});
var AppCommerceRoute = Route$20.update({
	id: "/commerce",
	path: "/commerce",
	getParentRoute: () => AppRoute
});
var AppCustomersRoute = Route$19.update({
	id: "/customers",
	path: "/customers",
	getParentRoute: () => AppRoute
});
var AppDispatchRoute = Route$18.update({
	id: "/dispatch",
	path: "/dispatch",
	getParentRoute: () => AppRoute
});
var AppFinanceRoute = Route$17.update({
	id: "/finance",
	path: "/finance",
	getParentRoute: () => AppRoute
});
var AppKycRoute = Route$16.update({
	id: "/kyc",
	path: "/kyc",
	getParentRoute: () => AppRoute
});
var AppMapRoute = Route$15.update({
	id: "/map",
	path: "/map",
	getParentRoute: () => AppRoute
});
var AppNotificationsRoute = Route$14.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => AppRoute
});
var AppOrdersRoute = Route$13.update({
	id: "/orders",
	path: "/orders",
	getParentRoute: () => AppRoute
});
var AppPeopleRoute = Route$12.update({
	id: "/people",
	path: "/people",
	getParentRoute: () => AppRoute
});
var AppRestaurantsRoute = Route$11.update({
	id: "/restaurants",
	path: "/restaurants",
	getParentRoute: () => AppRoute
});
var AppRidersRoute = Route$10.update({
	id: "/riders",
	path: "/riders",
	getParentRoute: () => AppRoute
});
var AppRiskRoute = Route$9.update({
	id: "/risk",
	path: "/risk",
	getParentRoute: () => AppRoute
});
var AppSearchRoute = Route$8.update({
	id: "/search",
	path: "/search",
	getParentRoute: () => AppRoute
});
var AppSecurityRoute = Route$7.update({
	id: "/security",
	path: "/security",
	getParentRoute: () => AppRoute
});
var AppSupportRoute = Route$6.update({
	id: "/support",
	path: "/support",
	getParentRoute: () => AppRoute
});
var AppSystemRoute = Route$5.update({
	id: "/system",
	path: "/system",
	getParentRoute: () => AppRoute
});
var AppTasksRoute = Route$4.update({
	id: "/tasks",
	path: "/tasks",
	getParentRoute: () => AppRoute
});
var ApiAuthSplatRoute = Route$3.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$28
});
var ApiWebhooksMessagebirdRoute = Route$2.update({
	id: "/api/webhooks/messagebird",
	path: "/api/webhooks/messagebird",
	getParentRoute: () => Route$28
});
var ApiWebhooksRazorpayRoute = Route$1.update({
	id: "/api/webhooks/razorpay",
	path: "/api/webhooks/razorpay",
	getParentRoute: () => Route$28
});
var ApiWebhooksTwilioRoute = Route.update({
	id: "/api/webhooks/twilio",
	path: "/api/webhooks/twilio",
	getParentRoute: () => Route$28
});
var AppRouteChildren = {
	AppAiRoute,
	AppAnalyticsRoute,
	AppAuditRoute,
	AppCeoRoute,
	AppCommerceRoute,
	AppCustomersRoute,
	AppDispatchRoute,
	AppFinanceRoute,
	AppKycRoute,
	AppMapRoute,
	AppNotificationsRoute,
	AppOrdersRoute,
	AppPeopleRoute,
	AppRestaurantsRoute,
	AppRidersRoute,
	AppRiskRoute,
	AppSearchRoute,
	AppSecurityRoute,
	AppSupportRoute,
	AppSystemRoute,
	AppTasksRoute,
	AppIndexRoute
};
var rootRouteChildren = {
	AppRoute: AppRoute._addFileChildren(AppRouteChildren),
	LoginRoute,
	ApiAuthSplatRoute,
	ApiWebhooksMessagebirdRoute,
	ApiWebhooksRazorpayRoute,
	ApiWebhooksTwilioRoute
};
var routeTree = Route$28._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { getRouter, router__PYTs68d_exports as t };
