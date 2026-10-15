import { Suspense, useEffect } from "react";
import { createServerFn } from "@tanstack/react-start";
import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState, Link } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppProviders } from "@/components/providers";
import { DEFAULT_CONFIG } from "@/lib/config/defaults";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineDetector } from "@/components/offline-detector";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import appCss from "../styles.css?url";
import { NextGenSeo } from "@/components/seo/NextGenSeo";

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const u = await getSessionUser();
    return u ? { id: u.id, email: u.email } : null;
  } catch (err) {
    console.error("fetchSessionUser error:", err);
    return null;
  }
});

const fetchConfig = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { loadConfig } = await import("@/lib/server/load-config");
    return await loadConfig();
  } catch (err) {
    console.error("fetchConfig error:", err);
    return null;
  }
});

export const Route = createRootRoute({
  beforeLoad: async () => {
    let sessionUser = null;
    let config = null;
    try {
      const [su, c] = await Promise.all([fetchSessionUser(), fetchConfig()]);
      sessionUser = su;
      config = c;
    } catch (err) {
      console.error("beforeLoad Promise.all error:", err);
    }
    return { sessionUser, config };
  },
  errorComponent: ({ error }) => {
    return (
      <div className="min-h-screen bg-white p-8 text-gray-900 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">OrderKing Initialization Error</h2>
        <p className="text-sm text-gray-600 mb-4 max-w-md">Please check the database connection strings and environment variables.</p>
        <pre className="max-w-lg rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-600 text-left overflow-auto">
          {(error as Error)?.message || String(error)}
        </pre>
      </div>
    );
  },
  head: ({ loaderData, match }) => {
    const config = (match?.context as { config?: typeof DEFAULT_CONFIG } | undefined)?.config ?? DEFAULT_CONFIG;
    void loaderData;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { title: config.brand.seoTitle },
        { name: "description", content: config.brand.seoDescription },
        { name: "theme-color", content: "#FFFFFF" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "application-name", content: "OrderKing" },
        { property: "og:description", content: config.brand.seoDescription },
        { property: "og:image", content: config.brand.ogImageUrl },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: config.brand.seoTitle },
        { name: "twitter:description", content: config.brand.seoDescription },
        { name: "twitter:image", content: config.brand.ogImageUrl },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "preconnect", href: "https://xezsqsptomcndbksxrvu.supabase.co" },
        { rel: "icon", type: "image/png", href: "/icon-192.png" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.json" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
        },
      ],
    };
  },
  component: Root,
});

function CustomerAppSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#FCFAF7] pb-24 md:max-w-5xl"
      aria-busy="true"
      aria-label="Loading OrderKing"
    >
      {/* Luxury Golden Header Skeleton */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] border-b border-amber-900/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-gradient-to-tr from-amber-400/40 via-yellow-300/30 to-amber-500/20 animate-pulse flex items-center justify-center">
            <span className="text-sm">👑</span>
          </div>
          <div className="space-y-1">
            <div className="h-4 w-24 bg-amber-200/50 rounded-md animate-pulse" />
            <div className="h-2 w-14 bg-amber-200/30 rounded-xs animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 bg-amber-200/40 rounded-full animate-pulse" />
          <div className="size-7 bg-amber-200/40 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Main Body Skeleton */}
      <div className="px-4 py-4 space-y-4">
        {/* Search Bar Skeleton */}
        <div className="h-10 w-full bg-white/80 rounded-xl border border-amber-200/60 shadow-2xs flex items-center px-3 gap-2">
          <div className="size-4 rounded-full bg-amber-200/50 animate-pulse" />
          <div className="h-3 w-40 bg-amber-100 rounded animate-pulse" />
        </div>

        {/* Categories Circular Skeletons */}
        <div className="flex gap-3 overflow-hidden py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="size-16 rounded-full bg-gradient-to-tr from-amber-200/60 to-yellow-100/60 p-0.5 animate-pulse">
                <div className="size-full rounded-full bg-white/90" />
              </div>
              <div className="h-2.5 w-12 bg-amber-200/40 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Card Grid Skeletons */}
        <div className="grid gap-4 md:grid-cols-2 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-amber-900/10 bg-white shadow-xs flex flex-col"
            >
              <div className="aspect-[16/10] w-full bg-gradient-to-r from-amber-100/60 via-amber-50 to-amber-100/60 animate-pulse" />
              <div className="p-4 space-y-2 bg-gradient-to-b from-white to-amber-50/20">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-3/5 bg-amber-200/60 rounded animate-pulse" />
                  <div className="h-4 w-10 bg-amber-200/40 rounded animate-pulse" />
                </div>
                <div className="h-3 w-2/5 bg-amber-100/80 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Root() {
  const context = Route.useRouteContext();
  const config = context.config ?? DEFAULT_CONFIG;
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get("utm_source");
      const utmMedium = params.get("utm_medium");
      const utmCampaign = params.get("utm_campaign");
      const tableNo = params.get("table");
      const mode = params.get("mode");
      const ref = params.get("ref");

      if (utmSource || utmMedium || utmCampaign || tableNo || mode || ref) {
        const attribution = {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          table_no: tableNo,
          order_mode: mode || "delivery",
          referral_code: ref,
          captured_at: new Date().toISOString(),
        };
        sessionStorage.setItem("orderking_attribution", JSON.stringify(attribution));
      }
    } catch {}
  }, [location.search]);

  return (
    <html lang="en" className="antialiased bg-white text-gray-900" suppressHydrationWarning>
      <head>
        <HeadContent />
        <NextGenSeo config={config} />
        <script src="https://checkout.razorpay.com/v1/checkout.js" defer></script>
      </head>
      <body className="bg-white text-gray-900 min-h-screen pb-20">
        <PreviewHostBridge />
        <OfflineDetector />
        <PwaInstallPrompt />
        <AuthProvider>
          <AppProviders config={config}>
            <ErrorBoundary>
              <div className="min-h-screen flex flex-col w-full relative">
                <Suspense fallback={<CustomerAppSkeleton />}>
                  <Outlet />
                </Suspense>
              </div>
            </ErrorBoundary>
          </AppProviders>
        </AuthProvider>
        <Scripts />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(()=>{}))}` }} />
      </body>
    </html>
  );
}
