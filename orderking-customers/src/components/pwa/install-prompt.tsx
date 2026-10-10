import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone display mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  if (!deferredPrompt || isDismissed || isInstalled) {
    return null;
  }

  return (
    <div
      role="banner"
      aria-label="Install OrderKing"
      className="fixed bottom-4 left-4 right-4 z-[9998] mx-auto max-w-md rounded-2xl border border-white/10 bg-neutral-900/95 p-3.5 shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6 sm:w-96"
    >
      <div className="flex items-center gap-3">
        <img
          src="/icon-192.png"
          alt="OrderKing"
          className="h-11 w-11 rounded-xl object-cover shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">Install OrderKing</p>
          <p className="truncate text-xs text-neutral-400">Add to home screen for 1-tap ordering</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleInstallClick}
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-orange-600 active:scale-95 transition-all"
          >
            Install
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Close install prompt"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
