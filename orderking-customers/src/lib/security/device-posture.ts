export function collectDevicePosture() {
  if (typeof navigator === "undefined") return null;

  const storageAvailable = (() => {
    try {
      const key = "__orderking_posture__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  })();

  return {
    secureContext: window.isSecureContext === true,
    webdriver: navigator.webdriver === true,
    cookieEnabled: navigator.cookieEnabled === true,
    storageAvailable,
    cryptoAvailable: Boolean(globalThis.crypto?.subtle),
    online: navigator.onLine === true
  };
}

export function startSilentDevicePostureReporting() {
  if (typeof window === "undefined") return;

  const send = async () => {
    const posture = collectDevicePosture();
    if (!posture) return;

    try {
      await fetch("/api/security/device-posture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        keepalive: true,
        body: JSON.stringify(posture),
      });
    } catch {
      // Security telemetry is non-blocking and never interrupts a legitimate user.
    }
  };

  void send();
  const timer = window.setInterval(send, 15 * 60 * 1000);
  window.addEventListener("online", send, { passive: true });
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void send();
  }, { passive: true });

  return () => window.clearInterval(timer);
}
