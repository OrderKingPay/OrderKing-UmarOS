import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/founder-command")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      window.location.replace("https://admin.orderkingpay.com");
    }
    throw redirect({ to: "/" });
  },
  component: () => null,
});
