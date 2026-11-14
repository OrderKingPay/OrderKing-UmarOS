import { redirect, createFileRoute } from "@tanstack/react-router";
import { KitchenPage } from "./kitchen";

export const Route = createFileRoute("/kds")({
  beforeLoad: ({ context }) => {
    if (!context?.sessionUser) throw redirect({ to: "/login" });
  },
  component: () => <KitchenPage defaultTab="KDS" />,
});
