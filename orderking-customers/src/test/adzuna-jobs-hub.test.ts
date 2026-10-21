import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  JOB_CATEGORIES,
  REAL_TIME_JOB_CATALOG,
  searchDynamicCatalog,
  searchJobs,
} from "../lib/career/adzuna-jobs-service";
import { TutorJobsHub } from "../components/tutor-jobs/tutor-jobs-hub";
import { TutorJobsHub as EducationTutorJobsHub } from "../components/education/tutor-jobs-hub";

const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");

describe("All-India & Global Jobs Hub (Adzuna & Real Gigs)", () => {
  it("exports both component entrypoints with identical component reference", () => {
    expect(TutorJobsHub).toBeDefined();
    expect(EducationTutorJobsHub).toBe(TutorJobsHub);
  });

  it("supports all 4 required job categories without omission", () => {
    expect(JOB_CATEGORIES).toEqual([
      "Remote / Work From Home",
      "Pan-India National Roles",
      "Local City & Fleet Delivery Gigs",
      "Freelance & Digital Tasks",
    ]);

    // Ensure catalog contains postings for every category
    for (const cat of JOB_CATEGORIES) {
      const categoryJobs = REAL_TIME_JOB_CATALOG.filter((j) => j.category === cat);
      expect(categoryJobs.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("filters accurately across categories, titles, skills, and locations", () => {
    // 1. Category search
    const remoteJobs = searchDynamicCatalog({ category: "Remote / Work From Home" });
    expect(remoteJobs.every((j) => j.category === "Remote / Work From Home")).toBe(true);

    const fleetJobs = searchDynamicCatalog({ category: "Local City & Fleet Delivery Gigs" });
    expect(fleetJobs.every((j) => j.category === "Local City & Fleet Delivery Gigs")).toBe(true);

    // 2. Title & Skill search
    const reactJobs = searchDynamicCatalog({ query: "React" });
    expect(reactJobs.length).toBeGreaterThan(0);
    expect(
      reactJobs.every(
        (j) =>
          j.title.toLowerCase().includes("react") ||
          j.skills.some((s) => s.toLowerCase().includes("react")) ||
          j.description.toLowerCase().includes("react")
      )
    ).toBe(true);

    // 3. Location search
    const guwahatiJobs = searchDynamicCatalog({ location: "Guwahati" });
    expect(guwahatiJobs.length).toBeGreaterThan(0);
    expect(
      guwahatiJobs.every(
        (j) =>
          j.location.toLowerCase().includes("guwahati") ||
          (j.city && j.city.toLowerCase().includes("guwahati"))
      )
    ).toBe(true);

    const bengaluruJobs = searchDynamicCatalog({ location: "Bengaluru" });
    expect(bengaluruJobs.length).toBeGreaterThan(0);
  });

  it("ensures every catalog job has clean professional fields and authentic apply targets", () => {
    for (const job of REAL_TIME_JOB_CATALOG) {
      expect(job.id).toBeTruthy();
      expect(job.title).toBeTruthy();
      expect(job.company).toBeTruthy();
      expect(job.location).toBeTruthy();
      expect(job.salaryRange).toBeTruthy();
      expect(job.workType).toBeTruthy();
      expect(job.description).toBeTruthy();
      expect(job.skills.length).toBeGreaterThan(0);
      expect(job.applyUrl).toBeTruthy();
    }
  });

  it("purges all marketing slogans and fake application fees from tutor-jobs-hub", () => {
    const hubCode = read("../components/tutor-jobs/tutor-jobs-hub.tsx");

    // Slogans purged
    expect(hubCode).not.toContain("0% deductions");
    expect(hubCode).not.toContain("zero placement fees");
    expect(hubCode).not.toContain("zero registration fee");
    expect(hubCode).not.toContain("Zero Security Deposit Policy");
    expect(hubCode).not.toContain("Zero Security Bond Policy");
    expect(hubCode).not.toContain("Anti-Scam Verified Direct Dispatch");
    expect(hubCode).not.toContain("Zero Bond");

    // Fake application fees purged
    expect(hubCode).not.toContain("JOB_APPLICATION_PLATFORM_FEE_INR");
    expect(hubCode).not.toContain("Direct Apply (₹29)");
    expect(hubCode).not.toContain("Pay ₹29");

    // Clean professional cards elements present
    expect(hubCode).toContain("Remote / Work From Home");
    expect(hubCode).toContain("Pan-India National Roles");
    expect(hubCode).toContain("Local City & Fleet Delivery Gigs");
    expect(hubCode).toContain("Freelance & Digital Tasks");
    expect(hubCode).toContain("job.salaryRange");
    expect(hubCode).toContain("job.location");
    expect(hubCode).toContain("job.company");
    expect(hubCode).toContain("<span>Apply</span>");

    // Commercial truth requirement preserved
    expect(hubCode).toContain("No verified employer is connected");
  });

  it("handles live search query fallback seamlessly", async () => {
    const result = await searchJobs({ query: "Full Stack", location: "Remote" });
    expect(result.jobs.length).toBeGreaterThan(0);
    expect(result.source).toBe("Dynamic Catalog");
  });
});
