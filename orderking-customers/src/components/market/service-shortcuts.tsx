import { Link } from "@tanstack/react-router";
import { Plane, GraduationCap, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { useCustomization } from "@orderking/ui";
import { useLocationStore } from "@/lib/stores/location";

/**
 * Existing routes only; no invented bookability, providers, or demand.
 * Ranking uses the customer's actual service clicks in the selected zone.
 * Every service remains hidden unless the administrator explicitly verifies it\n * and enables nationwide access or an exact supported zone. Provider eligibility\n * is still rechecked at the destination; clicks are preferences, not demand.
 */
const OPTIONS = [
  { key: "travel", label: "Travel", detail: "Explore travel options", to: "/travel", Icon: Plane },
  { key: "tutor", label: "AI Tutor", detail: "Explore learning", to: "/tutor", Icon: GraduationCap },
  { key: "jobs", label: "Jobs", detail: "Explore opportunities", to: "/tutor-jobs", Icon: Briefcase },
] as const;

type Variant = "header" | "compact" | "tiles";
export function ServiceShortcuts({
  variant = "compact",
  emphasizeAlternatives = false,
}: {
  variant?: Variant;
  emphasizeAlternatives?: boolean;
}) {
  const location = useLocationStore((s) => s.location);
  const customization = useCustomization();
  const flags = ((customization as any)?.state?.features ?? {}) as Record<string, unknown>;
  const zone = (location?.zoneId || location?.cityId || "unselected").replace(/[^a-z0-9-]/gi, "_").slice(0, 64);
  const storageKey = "orderking-service-usage-v1:" + zone;
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
      setCounts(stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {});
    } catch {
      setCounts({});
    }
  }, [storageKey]);

  const sorted = OPTIONS
    .filter((item) => {
      const configuredZones = flags["zones_" + item.key];
      const inConfiguredZone = zone !== "unselected" &&
        Array.isArray(configuredZones) && configuredZones.includes(zone);
      return flags["service_" + item.key] === true &&
        flags["verified_" + item.key] === true &&
        (flags["nationwide_" + item.key] === true || inConfiguredZone);
    })
    .sort((a, b) => Math.max(0, Number(counts[b.key]) || 0) - Math.max(0, Number(counts[a.key]) || 0));

  const recordOpen = (key: string) => {
    try {
      const next = { ...counts, [key]: Math.min(10000, (Number(counts[key]) || 0) + 1) };
      localStorage.setItem(storageKey, JSON.stringify(next));
      setCounts(next);
    } catch {
      // Storage can be unavailable. Navigation continues normally.
    }
  };

  if (sorted.length === 0) {
    return variant === "tiles" ? (
      <p role="status" className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-600">
        No additional services have been verified for this area yet.
      </p>
    ) : null;
  }

  return (
    <nav aria-label="Explore OrderKing services" className={emphasizeAlternatives ? "rounded-xl ring-1 ring-amber-400/60" : undefined}>
      <ul
        role="list"
        className={variant === "tiles" ? "grid grid-cols-2 gap-3 sm:grid-cols-3" :
          variant === "header" ? "flex items-center justify-center gap-1.5" : "grid grid-cols-3 gap-1"}
      >
        {sorted.map(({ key, label, detail, to, Icon }) => (
          <li key={key} className="min-w-0">
            <Link
              to={to as any}
              preload="intent"
              onClick={() => recordOpen(key)}
              aria-label={label}
              className={variant === "tiles"
                ? "flex min-h-32 flex-col justify-between rounded-2xl border border-amber-300/50 bg-white p-4 text-stone-900 no-underline shadow-sm transition-colors hover:border-amber-500 hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                : "flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-amber-300/40 bg-white/90 px-2 text-[11px] font-extrabold text-stone-900 no-underline transition-colors hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"}
            >
              <Icon className={variant === "tiles" ? "size-6 text-amber-700" : "size-4 shrink-0 text-amber-700"} aria-hidden="true" />
              <span className="truncate">{label}</span>
              {variant === "tiles" && <span className="mt-2 block text-xs font-medium leading-snug text-stone-500">{detail}</span>}
            </Link>
          </li>
        ))}
      </ul>
      {variant === "tiles" && (
        <p className="mt-3 text-xs text-stone-500">
          Only services explicitly enabled and verified for your selected area appear here. Final availability is confirmed by the provider.
        </p>
      )}
    </nav>
  );
}
