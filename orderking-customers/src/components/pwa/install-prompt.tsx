import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone display mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const isIosDevice =
      typeof navigator !== "undefined" &&
      /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    if (isIosDevice) {
      setIsIos(true);
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

  if (isDismissed || isInstalled || (!deferredPrompt && !isIos)) {
    return null;
  }

  // iOS Safari Install instructions
  if (isIos && !deferredPrompt) {
    return (
      <div
        role="banner"
        aria-label="Install OrderKing on iPhone"
        className="fixed bottom-4 left-4 right-4 z-[9998] mx-auto max-w-md rounded-2xl border border-white/10 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6 sm:w-96"
      >
        <div className="flex items-start gap-3">
          <img
            src="/icon-192.png"
            alt="OrderKing"
            className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Install OrderKing</p>
            <p className="text-xs text-neutral-300 mt-1">
              Tap <span className="font-bold text-orange-400">Share</span> (⎋) in Safari, then select <span className="font-bold text-orange-400">'Add to Home Screen'</span> (➕) for instant 1-tap ordering.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Close install instructions"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
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
