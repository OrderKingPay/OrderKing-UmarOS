import { createFileRoute } from "@tanstack/react-router";

const nominations = [
  {
    id: "forbes-asia",
    title: "Forbes 30 Under 30 Asia",
    organization: "Forbes Media",
    deadline: "Check official site",
    url: "https://www.forbes.com/30-under-30/asia/",
    status: "RESEARCH_ONLY",
    pitch: "Draft founder/product narrative only. Do not claim traction, revenue, users, partnerships, or deployment metrics unless independently evidenced.",
  },
  {
    id: "ey-eoy",
    title: "EY Entrepreneur Of The Year - India",
    organization: "Ernst & Young",
    deadline: "Check official site",
    url: "https://www.ey.com/en_in/entrepreneur-of-the-year",
    status: "RESEARCH_ONLY",
    pitch: "Draft nomination workspace. Replace all quantitative claims with verified evidence before submission.",
  },
  {
    id: "tedx-global",
    title: "TEDx Speaker Application",
    organization: "TED",
    deadline: "Check official site",
    url: "https://www.ted.com/participate/organize-a-local-tedx-event/tedx-speaker-guidelines",
    status: "RESEARCH_ONLY",
    pitch: "Draft speaking topic. No public performance or scale claims are asserted by this record.",
  },
  {
    id: "ycombinator",
    title: "Y Combinator Application",
    organization: "Y Combinator",
    deadline: "Check official site",
    url: "https://www.ycombinator.com/apply",
    status: "RESEARCH_ONLY",
    pitch: "Application workspace only. Revenue, customers, growth and market claims require verified pilot evidence.",
  },
] as const;

export const Route = createFileRoute("/api/v1/founder/pr-nominations")({
  server: {
    handlers: {
      GET: async () => Response.json({ success: true, awards: nominations }),
    },
  },
});
