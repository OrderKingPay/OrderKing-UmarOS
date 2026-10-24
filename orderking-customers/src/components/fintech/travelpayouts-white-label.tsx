import { useEffect, useRef } from "react";

interface Props {
  wlId?: string;
}

export function TravelpayoutsWhiteLabel({ wlId = "23797" }: Props) {
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const scriptId = `tpwl-script-${wlId}`;
    const existing = document.getElementById(scriptId);

    if (!existing) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.type = "module";
      script.src = `https://tpwidg.com/wl_web/main.js?wl_id=${encodeURIComponent(wlId)}`;
      script.setAttribute("data-cfasync", "false");
      script.setAttribute("data-noptimize", "1");
      document.head.appendChild(script);
      isLoadedRef.current = true;
    }
  }, [wlId]);

  return (
    <div className="w-full space-y-4 my-4">
      {/* Search Bar Container required by Travelpayouts */}
      <div
        id="tpwl-search"
        className="w-full min-h-[120px] rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-800 p-2 shadow-sm transition-all"
      />

      {/* Results Container required by Travelpayouts */}
      <div
        id="tpwl-tickets"
        className="w-full min-h-[300px] rounded-2xl"
      />
    </div>
  );
}
