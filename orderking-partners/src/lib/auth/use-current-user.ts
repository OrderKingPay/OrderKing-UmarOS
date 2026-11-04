import { useState, useEffect } from "react";
import { authClient, authEnabled, getPhoneSession } from "./client";
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  phone?: string | null;
  role?: string | null;
  isDevFallback: boolean;
};
export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@orderking.in",
  profileImageUrl: null,
  isDevFallback: true,
};
export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};
export function useCurrentUserState(): CurrentUserState {
  const [phoneSession, setPhoneSessionState] = useState<any | null>(() => getPhoneSession());
  useEffect(() => {
    const sync = () => setPhoneSessionState(getPhoneSession());
    sync();
    window.addEventListener("orderking-auth-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("orderking-auth-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const { data, isPending } = authClient.useSession();
  if (phoneSession?.user) {
    const u = phoneSession.user;
    return {
      user: {
        id: u.id,
        displayName: u.name ?? ("OrderKing " + String(u.phone || "").slice(-4)),
        primaryEmail: u.email ?? null,
        profileImageUrl: u.image ?? null,
        phone: u.phone ?? null,
        role: u.role ?? "partner",
        isDevFallback: false,
      },
      isPending: false,
    };
  }
  if (!authEnabled) return { user: DEV_USER, isPending: false };
  let user = data?.user;
  if (!user && typeof window !== "undefined") {
    try {
      const cached = window.localStorage.getItem("orderking_authenticated_user") || window.localStorage.getItem("ok_partner_session") || window.localStorage.getItem("ok_rider_session") || window.localStorage.getItem("ok_customer_session");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.id || parsed.phone || parsed.email)) {
          user = parsed;
        }
      }
    } catch {}
  } else if (user && typeof window !== "undefined") {
    try {
      window.localStorage.setItem("orderking_authenticated_user", JSON.stringify(user));
      document.cookie = "ok_edge_user=" + encodeURIComponent(JSON.stringify({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role })) + "; path=/; max-age=2592000; SameSite=Lax";
    } catch {}
  }
  return {
    user: user
      ? {
          id: user.id,
          displayName: user.name ?? null,
          primaryEmail: user.email ?? null,
          profileImageUrl: user.image ?? null,
          isDevFallback: false,
        }
      : null,
    isPending,
  };
}
export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
