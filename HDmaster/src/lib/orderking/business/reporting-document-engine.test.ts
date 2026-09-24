import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { ReportingDocumentEngine, type ReportType } from "./reporting-document-engine.ts";

describe("Reporting & AI Document Workspace Engine", () => {
  const allReportTypes: ReportType[] = [
    "DAILY_FOUNDER_BRIEFING",
    "WEEKLY_FOUNDER_EXECUTIVE",
    "FINANCE_PL",
    "RESTAURANT_SETTLEMENT_STATEMENT",
    "RIDER_PAYOUT_STATEMENT",
    "OPERATIONS_SLA_REPORT",
    "ANOMALY_AUDIT_REPORT",
    "CUSTOMER_RETENTION_COHORT",
    "INVENTORY_PROCUREMENT_ADVICE",
    "GST_COMPLIANCE_SUMMARY",
    "DISPATCH_EFFICIENCY_REPORT",
    "AI_AGENT_PERFORMANCE_AUDIT",
  ];

  test("generates all 12 enterprise report types with valid metadata and sections", () => {
    for (const reportType of allReportTypes) {
      const report = ReportingDocumentEngine.generateReport(reportType, {
        restaurantId: "REST-KORAMANGALA-1",
        riderId: "RIDER-102",
      });

      assert.ok(report.id.startsWith(`REP-${reportType}`));
      assert.equal(report.reportType, reportType);
      assert.ok(report.title.length > 5);
      assert.ok(report.summary.length > 10);
      assert.ok(report.sections.length >= 1);
      assert.ok(report.overallAttributionSummary);
    }
  });

  test("enforces strict data trust categorization on all metrics (FACT, CALCULATION, ESTIMATE, INFERENCE, RECOMMENDATION)", () => {
    const report = ReportingDocumentEngine.generateReport("FINANCE_PL");
    const validCategories = new Set(["FACT", "CALCULATION", "ESTIMATE", "INFERENCE", "RECOMMENDATION"]);

    let totalMetricsChecked = 0;
    for (const section of report.sections) {
      if (section.metrics) {
        for (const metric of section.metrics) {
          assert.ok(validCategories.has(metric.category), `Invalid category ${metric.category} on ${metric.key}`);
          totalMetricsChecked++;
        }
      }
    }

    assert.ok(totalMetricsChecked >= 8);
    assert.ok(report.overallAttributionSummary.FACT > 0);
    assert.ok(report.overallAttributionSummary.CALCULATION > 0);
  });

  test("exports report to clean JSON format", () => {
    const report = ReportingDocumentEngine.generateReport("DAILY_FOUNDER_BRIEFING");
    const jsonStr = ReportingDocumentEngine.exportToJSON(report);
    assert.ok(jsonStr.startsWith("{"));

    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.id, report.id);
    assert.equal(parsed.reportType, "DAILY_FOUNDER_BRIEFING");
  });

  test("exports report to standard CSV format", () => {
    const report = ReportingDocumentEngine.generateReport("RESTAURANT_SETTLEMENT_STATEMENT", {
      restaurantId: "REST-001",
    });
    const csv = ReportingDocumentEngine.exportToCSV(report);

    assert.ok(csv.includes('"Report Title"'));
    assert.ok(csv.includes('"Key","Label","Value","Category","Source Note"'));
    assert.ok(csv.includes("Order King Commission (0%)"));
  });

  test("exports report to clean printable HTML format", () => {
    const report = ReportingDocumentEngine.generateReport("GST_COMPLIANCE_SUMMARY");
    const html = ReportingDocumentEngine.exportToHTML(report);

    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("<title>"));
    assert.ok(html.includes("Order King • Enterprise Intelligence"));
    assert.ok(html.includes("Section 9(5)"));
    assert.ok(html.includes("@media print"));
  });

  test("exports report to clean Markdown format", () => {
    const report = ReportingDocumentEngine.generateReport("WEEKLY_FOUNDER_EXECUTIVE");
    const md = ReportingDocumentEngine.exportToMarkdown(report);

    assert.ok(md.startsWith("# Weekly Founder Executive"));
    assert.ok(md.includes("### Data Trust Attribution Summary"));
    assert.ok(md.includes("| Metric | Value | Attribution | Source |"));
  });
});
