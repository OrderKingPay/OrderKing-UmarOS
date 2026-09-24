import { useEffect, useState } from "react";

export function OfflineDetector() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (online) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[9999] bg-red-600 px-4 py-2 text-center text-sm font-medium text-white shadow-md">
      ⚠ Network disconnected
    </div>
  );
}
