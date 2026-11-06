import { createFileRoute } from "@tanstack/react-router";
import { KitchenPage } from "./kitchen";

export const Route = createFileRoute("/kds")({
  component: () => <KitchenPage defaultTab="KDS" />,
});
