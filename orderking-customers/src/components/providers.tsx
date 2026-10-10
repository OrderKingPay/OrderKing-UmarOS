
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { DEFAULT_CONFIG } from "@/lib/config/defaults";
import type { PublicAppConfig } from "@/lib/config/types";
import { isLang, translate, type Lang } from "@/lib/i18n";
import { htmlLang } from "@/lib/locale";
import { flushQueue } from "@/lib/offline/durable-queue";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: true,
      networkMode: 'offlineFirst',
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 3
    }
  }
});

const BrandContext = createContext<PublicAppConfig>(DEFAULT_CONFIG);

export function useBrand() {
  return useContext(BrandContext);
}

const I18nContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
}>({
  lang: "en",
  setLang: () => undefined,
  t: (path, vars) => translate("en", path, vars),
});

export function useT() {
  return useContext(I18nContext);
}

export function AppProviders({
  children,
  config,
}: {
  children: ReactNode;
  config: PublicAppConfig;
}) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem("marketplace-lang");
    return isLang(stored) ? stored : "en";
  });
  useEffect(() => {
    document.title = config.brand.seoTitle;
    document.querySelector('link[rel="icon"]')?.setAttribute("href", config.brand.faviconUrl || "/favicon.svg");
    const isDark = config.brand.themeMode === "dark";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#0f172a" : config.brand.primaryColor);
    document.documentElement.lang = htmlLang(lang);

    // Primary & Accent Brand Color
    if (config.brand.primaryColor) {
      document.documentElement.style.setProperty("--color-primary", config.brand.primaryColor);
      document.documentElement.style.setProperty("--color-accent", config.brand.accentColor || config.brand.primaryColor);
    }

    // Component Border Radius: Sharp (0px) vs Rounded (16px)
    const isSharp = (config.brand.radiusPx ?? 16) === 0;
    const rXs = isSharp ? "0px" : "4px";
    const rSm = isSharp ? "0px" : "8px";
    const rMd = isSharp ? "0px" : "12px";
    const rLg = isSharp ? "0px" : `${config.brand.radiusPx || 16}px`;
    const rXl = isSharp ? "0px" : "20px";
    const r2Xl = isSharp ? "0px" : "24px";
    document.documentElement.style.setProperty("--radius-xs", rXs);
    document.documentElement.style.setProperty("--radius-sm", rSm);
    document.documentElement.style.setProperty("--radius-md", rMd);
    document.documentElement.style.setProperty("--radius-lg", rLg);
    document.documentElement.style.setProperty("--radius-xl", rXl);
    document.documentElement.style.setProperty("--radius-2xl", r2Xl);

    // Light / Dark Mode Forced Override
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.setProperty("color-scheme", "dark");
      document.documentElement.style.setProperty("--color-bg", "#0f172a");
      document.documentElement.style.setProperty("--color-surface", "#1e293b");
      document.documentElement.style.setProperty("--color-surface-2", "#334155");
      document.documentElement.style.setProperty("--color-fg", "#f8fafc");
      document.documentElement.style.setProperty("--color-muted", "#94a3b8");
      document.documentElement.style.setProperty("--color-border", "#334155");
      document.documentElement.style.backgroundColor = "#0f172a";
      document.documentElement.style.color = "#f8fafc";
      if (document.body) {
        document.body.style.backgroundColor = "#0f172a";
        document.body.style.color = "#f8fafc";
      }
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.setProperty("color-scheme", "light");
      document.documentElement.style.setProperty("--color-bg", "#FFFFFF");
      document.documentElement.style.setProperty("--color-surface", "#FFFFFF");
      document.documentElement.style.setProperty("--color-surface-2", "#F8F9FA");
      document.documentElement.style.setProperty("--color-fg", "#1C1C1C");
      document.documentElement.style.setProperty("--color-muted", "#6B7280");
      document.documentElement.style.setProperty("--color-border", "#E5E7EB");
      document.documentElement.style.backgroundColor = "#FFFFFF";
      document.documentElement.style.color = "#1C1C1C";
      if (document.body) {
        document.body.style.backgroundColor = "#FFFFFF";
        document.body.style.color = "#1C1C1C";
      }
    }

    flushQueue();
  }, [config, lang]);
  const setLang = (next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") window.localStorage.setItem("marketplace-lang", next);
    if (typeof document !== "undefined") document.documentElement.lang = htmlLang(next);
  };
  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (path: string, vars?: Record<string, string | number>) => translate(lang, path, vars),
    }),
    [lang],
  );

  const isDark = config.brand?.themeMode === "dark";
  const brandStyle = {
    ["--color-primary" as string]: config.brand.primaryColor,
    ["--color-accent" as string]: config.brand.accentColor || config.brand.primaryColor,
    ["--color-bg" as string]: isDark ? "#0f172a" : (config.brand.backgroundColor || "#FFFFFF"),
    ["--color-surface" as string]: isDark ? "#1e293b" : (config.brand.surfaceColor || "#FFFFFF"),
    ["--color-surface-2" as string]: isDark ? "#334155" : "#F8F9FA",
    ["--color-fg" as string]: isDark ? "#f8fafc" : (config.brand.textColor || "#1C1C1C"),
    ["--color-muted" as string]: isDark ? "#94a3b8" : (config.brand.mutedColor || "#6B7280"),
    ["--color-border" as string]: isDark ? "#334155" : "#E5E7EB",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrandContext.Provider value={config}>
        <I18nContext.Provider value={value}>
          <div style={brandStyle} className="min-h-dvh bg-bg text-fg">
            {children}
          </div>
          <Toaster position="top-center" richColors={false} />
        </I18nContext.Provider>
      </BrandContext.Provider>
    </QueryClientProvider>
  );
}
