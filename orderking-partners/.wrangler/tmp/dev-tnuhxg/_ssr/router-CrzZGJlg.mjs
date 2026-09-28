import { o as __toESM } from "../_runtime.mjs";
import { F as string, I as union, M as object, j as number, k as literal } from "../_libs/@better-auth/core+[...].mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as platformConfig } from "./platform-config-noG9WRp_.mjs";
import { i as require_jsx_runtime, n as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { D as lazyRouteComponent, E as Outlet, O as createFileRoute, Q as useRouter, S as HeadContent, T as createRouter, k as createRootRoute, x as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as transitionOrderViaHDmaster } from "./hdmaster-order-transition-BLAHw5vH.mjs";
import { g as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as supabaseCloud } from "./db-cloud-YtcM-9t3.mjs";
import { n as flushQueue } from "./durable-queue-BkyOo-iU.mjs";
import { i as listPublicCatalog } from "./api-menu-C1qRnAve.mjs";
import { t as auth } from "./server-DpVD1Ux8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CrzZGJlg.js
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
				children: error instanceof Error ? error.message : "An unexpected error occurred. Try reloading the page."
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
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths: options.getRoutePaths?.() ?? []
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
		originalPushState(data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		originalReplaceState(isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data, unused, url);
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
		console.error("[OrderKing Partners] Uncaught error:", error, info.componentStack);
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
		className: "fixed inset-x-0 top-0 z-[9999] bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white shadow-md",
		children: "⚠ Connection lost — orders may be delayed"
	});
}
var styles_default = "/assets/styles-D1-3QUkm.css";
var queryClient = new QueryClient({ defaultOptions: {
	queries: {
		retry: (failureCount, error) => {
			if (error instanceof TypeError || error.message.includes("fetch") || error.message.includes("network")) return failureCount < 10;
			return failureCount < 2;
		},
		retryDelay: (attemptIndex) => Math.min(1e3 * 2 ** attemptIndex, 3e4),
		refetchOnWindowFocus: false
	},
	mutations: {
		retry: (failureCount, error) => {
			if (error instanceof TypeError || error.message.includes("fetch") || error.message.includes("network")) return failureCount < 10;
			return failureCount < 1;
		},
		retryDelay: (attemptIndex) => Math.min(1e3 * 2 ** attemptIndex, 3e4)
	}
} });
var Route$18 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: platformConfig.brand.appName },
			{
				name: "description",
				content: platformConfig.brand.tagline
			},
			{
				name: "theme-color",
				content: platformConfig.theme.primary
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
				href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;600&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@500;600&display=swap"
			}
		]
	}),
	component: Root
});
function Root() {
	(0, import_react.useEffect)(() => {
		flushQueue(transitionOrderViaHDmaster);
		const handleOnline = () => {
			flushQueue(transitionOrderViaHDmaster);
		};
		window.addEventListener("online", handleOnline);
		const channel = supabaseCloud.channel("partner_realtime").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "item_availability"
		}, () => {
			console.log("[Realtime] Inventory changed, invalidating catalog");
			queryClient.invalidateQueries({ queryKey: ["catalog"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		}).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "orders"
		}, () => {
			console.log("[Realtime] Order changed, invalidating orders");
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		}).subscribe();
		return () => {
			window.removeEventListener("online", handleOnline);
			supabaseCloud.removeChannel(channel);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfflineDetector, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
				client: queryClient,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) })
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(err => {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            ` } })
		] })]
	});
}
var $$splitComponentImporter$15 = () => import("./routes-B6RLhFd1.mjs");
var Route$17 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./analytics-BsvlK8Pw.mjs");
var Route$16 = createFileRoute("/analytics")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./assistant-DQOnWG99.mjs");
var Route$15 = createFileRoute("/assistant")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./dashboard-t5MpSoWD.mjs");
var Route$14 = createFileRoute("/dashboard")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./hours-1g-pZujV.mjs");
var Route$13 = createFileRoute("/hours")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./kitchen-DiKxuPsP.mjs");
var Route$12 = createFileRoute("/kitchen")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./login-CrYEBJ4d.mjs");
var Route$11 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./menu-CJnlnl6E.mjs");
var Route$10 = createFileRoute("/menu")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./more-CWHRNsl9.mjs");
var Route$9 = createFileRoute("/more")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./notifications-Cgb5DcwN.mjs");
var Route$8 = createFileRoute("/notifications")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./onboarding-C0ncx9Su.mjs");
var Route$7 = createFileRoute("/onboarding")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./orders-B5528VQ_.mjs");
var Route$6 = createFileRoute("/orders")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./promotions-CyKCrB1D.mjs");
var Route$5 = createFileRoute("/promotions")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./reviews-8ZZezFUq.mjs");
var Route$4 = createFileRoute("/reviews")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./settings-D76r9z6g.mjs");
var Route$3 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./settlements-DFk2dXm1.mjs");
var Route$2 = createFileRoute("/settlements")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route$1 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var Route = createFileRoute("/api/v1/catalog")({ server: { handlers: { GET: async () => {
	const body = await listPublicCatalog();
	return new Response(JSON.stringify(body), { headers: { "content-type": "application/json; charset=utf-8" } });
} } } });
var rootRouteChildren = {
	IndexRoute: Route$17.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$18
	}),
	AnalyticsRoute: Route$16.update({
		id: "/analytics",
		path: "/analytics",
		getParentRoute: () => Route$18
	}),
	AssistantRoute: Route$15.update({
		id: "/assistant",
		path: "/assistant",
		getParentRoute: () => Route$18
	}),
	DashboardRoute: Route$14.update({
		id: "/dashboard",
		path: "/dashboard",
		getParentRoute: () => Route$18
	}),
	HoursRoute: Route$13.update({
		id: "/hours",
		path: "/hours",
		getParentRoute: () => Route$18
	}),
	KitchenRoute: Route$12.update({
		id: "/kitchen",
		path: "/kitchen",
		getParentRoute: () => Route$18
	}),
	LoginRoute: Route$11.update({
		id: "/login",
		path: "/login",
		getParentRoute: () => Route$18
	}),
	MenuRoute: Route$10.update({
		id: "/menu",
		path: "/menu",
		getParentRoute: () => Route$18
	}),
	MoreRoute: Route$9.update({
		id: "/more",
		path: "/more",
		getParentRoute: () => Route$18
	}),
	NotificationsRoute: Route$8.update({
		id: "/notifications",
		path: "/notifications",
		getParentRoute: () => Route$18
	}),
	OnboardingRoute: Route$7.update({
		id: "/onboarding",
		path: "/onboarding",
		getParentRoute: () => Route$18
	}),
	OrdersRoute: Route$6.update({
		id: "/orders",
		path: "/orders",
		getParentRoute: () => Route$18
	}),
	PromotionsRoute: Route$5.update({
		id: "/promotions",
		path: "/promotions",
		getParentRoute: () => Route$18
	}),
	ReviewsRoute: Route$4.update({
		id: "/reviews",
		path: "/reviews",
		getParentRoute: () => Route$18
	}),
	SettingsRoute: Route$3.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$18
	}),
	SettlementsRoute: Route$2.update({
		id: "/settlements",
		path: "/settlements",
		getParentRoute: () => Route$18
	}),
	ApiAuthSplatRoute: Route$1.update({
		id: "/api/auth/$",
		path: "/api/auth/$",
		getParentRoute: () => Route$18
	}),
	ApiV1CatalogRoute: Route.update({
		id: "/api/v1/catalog",
		path: "/api/v1/catalog",
		getParentRoute: () => Route$18
	})
};
var routeTree = Route$18._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { getRouter };
