import { createFileRoute } from "@tanstack/react-router";
import { PartnerLandingPage } from "./index";

export const Route = createFileRoute("/login")({
  component: PartnerLandingPage,
});
