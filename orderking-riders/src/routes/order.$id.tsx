import { createFileRoute, redirect } from "@tanstack/react-router";
import { Page as DeliveryDetailPage } from "./delivery.$id";

export const Route = createFileRoute("/order/$id")({
  beforeLoad: ({ context }) => {
    if (!context.sessionUser) throw redirect({ to: "/login" });
  },
  component: DeliveryDetailPage,
});
