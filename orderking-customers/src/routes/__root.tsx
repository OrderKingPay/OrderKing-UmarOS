
import { createServerFn } from "@tanstack/react-start";
import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
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
    return <div style={{ padding: '2rem', background: '#111', color: 'white', height: '100vh' }}><h2>OrderKing Initialization Error</h2><p>Please check the database connection strings and environment variables.</p><pre style={{ background: '#222', padding: '1rem', color: '#ff7777', whiteSpace: 'pre-wrap' }}>{(error as Error)?.message || String(error)}</pre></div>;
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
        { name: "theme-color", content: config.brand.primaryColor },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "OrderKing" },
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
        { rel: "preconnect", href: "https://xezsqsptomcndbksxrvu.supabase.co" },
        { rel: "icon", type: "image/png", href: "/icon-192.png" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.json" },

        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;1,400&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap",
        },
      ],
    };
  },
  component: Root,
});

function Root() {
  const context = Route.useRouteContext();
  const config = context.config ?? DEFAULT_CONFIG;
  const location = useRouterState({ select: (s) => s.location });
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <NextGenSeo config={config} />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <PreviewHostBridge />
        <OfflineDetector />
        <PwaInstallPrompt />
        <AuthProvider>
          <AppProviders config={config}>
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, scale: 0.98, filter: "blur(5px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.02, filter: "blur(5px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </AppProviders>
        </AuthProvider>
        <Scripts />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(()=>{}))}` }} />

      </body>
    </html>
  );
}


