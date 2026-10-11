import { Suspense } from "react";
import { createServerFn } from "@tanstack/react-start";
import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppProviders } from "@/components/providers";
import { DEFAULT_CONFIG } from "@/lib/config/defaults";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineDetector } from "@/components/offline-detector";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import appCss from "../styles.css?url";
import { NextGenSeo } from "@/components/seo/NextGenSeo";
import { Home, Utensils, Wallet, GraduationCap, User } from "lucide-react";

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
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-white pb-24 md:max-w-5xl animate-pulse" aria-busy="true" aria-label="Loading application">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="h-6 w-28 bg-gray-100 rounded-md" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-gray-100 rounded-full" />
          <div className="h-8 w-8 bg-gray-100 rounded-full" />
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="h-11 w-full bg-gray-50 rounded-xl border border-gray-100" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="h-20 w-20 shrink-0 bg-gray-50 rounded-2xl border border-gray-100" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="h-56 w-full bg-gray-50 rounded-3xl border border-gray-100" />
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
                >
                  <Suspense fallback={<CustomerAppSkeleton />}>
                    <Outlet />
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </AppProviders>
        </AuthProvider>
        <Scripts />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(()=>{}))}` }} />

        <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center py-2 z-50">
           <Link to="/" className="flex flex-col items-center text-gray-600 hover:text-[#E23744] [&.active]:text-[#E23744]" aria-label="Navigate to Delivery">
             <Home className="w-6 h-6" aria-hidden="true" />
             <span className="text-[10px] mt-1 font-medium">Delivery</span>
           </Link>
           <Link to="/dining" className="flex flex-col items-center text-gray-600 hover:text-[#E23744] [&.active]:text-[#E23744]" aria-label="Navigate to Dining">
             <Utensils className="w-6 h-6" aria-hidden="true" />
             <span className="text-[10px] mt-1 font-medium">Dining</span>
           </Link>
           <Link to="/kingpay-wallet" className="flex flex-col items-center text-gray-600 hover:text-[#E23744] [&.active]:text-[#E23744]" aria-label="Navigate to KingPay">
             <Wallet className="w-6 h-6" aria-hidden="true" />
             <span className="text-[10px] mt-1 font-medium">KingPay</span>
           </Link>
           <Link to="/tutor" className="flex flex-col items-center text-gray-600 hover:text-[#E23744] [&.active]:text-[#E23744]" aria-label="Navigate to AI Tutor">
             <GraduationCap className="w-6 h-6" aria-hidden="true" />
             <span className="text-[10px] mt-1 font-medium">AI Tutor</span>
           </Link>
           <Link to="/account" className="flex flex-col items-center text-gray-600 hover:text-[#E23744] [&.active]:text-[#E23744]" aria-label="Navigate to Profile">
             <User className="w-6 h-6" aria-hidden="true" />
             <span className="text-[10px] mt-1 font-medium">Profile</span>
           </Link>
        </div>
      </body>
    </html>
  );
}
