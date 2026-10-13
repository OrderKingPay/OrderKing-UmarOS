import { useEffect, useState } from "react";
const EVENT = "orderking-avatar-updated";
const prefix = "orderking-personal-avatar-v1:";

export function useDeviceAvatar(userId?: string | null) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    if (!userId || typeof window === "undefined") { setImage(null); return; }
    const key = prefix + userId;
    const refresh = () => {
      try { setImage(window.localStorage.getItem(key)); }
      catch { setImage(null); }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(EVENT, refresh);
    };
  }, [userId]);
  function saveImage(dataUrl: string | null) {
    if (!userId || typeof window === "undefined") return false;
    try {
      const key = prefix + userId;
      if (dataUrl && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl) ||
         dataUrl.length > 320_000)) return false;
      if (dataUrl) window.localStorage.setItem(key,dataUrl);
      else window.localStorage.removeItem(key);
      window.dispatchEvent(new Event(EVENT));
      return true;
    } catch { return false; }
  }
  return { image, saveImage };
}
