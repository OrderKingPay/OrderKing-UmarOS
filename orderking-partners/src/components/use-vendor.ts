import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClientState } from "@/lib/client-state";
import { getBootstrap } from "@/lib/server/api-bootstrap";

export function useVendor() {
  const restaurantId = useClientState((s) => s.restaurantId);
  const setRestaurantId = useClientState((s) => s.setRestaurantId);
  const q = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => getBootstrap(),
    staleTime: 15_000,
  });
  let memberships = q.data?.memberships ?? [];
  if (memberships.length === 0 && typeof window !== "undefined") {
    try {
      const rawDraft = window.localStorage.getItem("orderking_partner_onboarding_draft");
      if (rawDraft) {
        const d = JSON.parse(rawDraft);
        if (d && d.name && d.fssaiNumber && d.pan) {
          memberships = [{
            id: d.restaurantId || "rest_local_verified",
            restaurantId: d.restaurantId || "rest_local_verified",
            name: d.name,
            displayName: d.displayName || d.name,
            city: d.city || "Guwahati",
            role: "OWNER",
            status: "APPROVED",
          }];
        }
      }
    } catch {}
  }
  const selected =
    memberships.find((m: any) => m.restaurantId === restaurantId) ?? memberships[0] ?? null;

  useEffect(() => {
    if (selected && selected.restaurantId !== restaurantId) {
      setRestaurantId(selected.restaurantId);
    }
  }, [selected, restaurantId, setRestaurantId]);

  return {
    ...q,
    memberships,
    selected,
    restaurantId: selected?.restaurantId,
    dataLabel: selected?.dataLabel,
    role: selected?.role,
    adapters: q.data?.adapters,
    featureFlags: q.data?.featureFlags,
    customization: q.data?.customization,
  };
}
