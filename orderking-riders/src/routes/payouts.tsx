import { createFileRoute } from "@tanstack/react-router";
import { SettlementsDesk } from "./settlements";

export const Route = createFileRoute("/payouts")({
  component: SettlementsDesk,
});
