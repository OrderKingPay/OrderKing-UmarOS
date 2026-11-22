import { redirect, createFileRoute } from "@tanstack/react-router";
import { KitchenPage } from "./kitchen";

export const Route = createFileRoute("/kds")({
  beforeLoad: ({ context }) => {
    if (typeof window !== "undefined") {
      let hasUser = Boolean(context?.sessionUser);
      if (!hasUser) {
        try {
          const raw = window.localStorage.getItem("orderking.phone.session");
          if (raw && JSON.parse(raw)?.user?.id) hasUser = true;
        } catch {}
      }
      if (!hasUser) throw redirect({ to: "/login" });
    }
  },
  component: () => <KitchenPage defaultTab="KDS" />,
});
