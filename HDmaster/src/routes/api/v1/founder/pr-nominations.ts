import { createFileRoute } from "@tanstack/react-router";

const nominations = [
  ["forbes-asia","Forbes 30 Under 30 Asia","Forbes Media","https://www.forbes.com/30-under-30/asia/"],
  ["ey-eoy","EY Entrepreneur Of The Year - India","Ernst & Young","https://www.ey.com/en_in/entrepreneur-of-the-year"],
  ["tedx-global","TEDx Speaker Application","TED","https://www.ted.com/participate/organize-a-local-tedx-event/tedx-speaker-guidelines"],
  ["ycombinator","Y Combinator Application","Y Combinator","https://www.ycombinator.com/apply"],
] as const;

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/v1/founder/pr-nominations")({
  server: {
    handlers: {
      GET: async () => Response.json({
        success: true,
        awards: nominations.map(([id,title,organization,url]) => ({
          id, title, organization, url, status: "RESEARCH_ONLY", deadline: "Check official site",
          pitch: "Draft workspace only. Replace all quantitative claims with independently verified evidence before submission.",
        })),
      }),
    },
  },
});
