// @ts-nocheck
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

  test("blocks all report types until verified production data is supplied", () => {
    for (const reportType of allReportTypes) {
      const report = ReportingDocumentEngine.generateReport(reportType, {
        restaurantId: "REST-KORAMANGALA-1",
        riderId: "RIDER-102",
      });

      assert.equal(report.reportType, reportType);
      assert.ok(report.sections.length >= 1);
      assert.equal(report.sections[0]?.metrics?.[0]?.value, "LIVE_DATA_REQUIRED");
      assert.equal(report.overallAttributionSummary.FACT, 0);
      assert.equal(report.overallAttributionSummary.CALCULATION, 0);
    }
  });

  test("emits only explicit data-gate attribution without verified production payload", () => {
    const report = ReportingDocumentEngine.generateReport("FINANCE_PL");
    const metric = report.sections[0]?.metrics?.[0];
    assert.ok(metric);
    assert.equal(metric.category, "RECOMMENDATION");
    assert.equal(metric.key, "report_data_status");
  });

  test("exports report to clean JSON format", () => {
    const report = ReportingDocumentEngine.generateReport("DAILY_FOUNDER_BRIEFING");
    const jsonStr = ReportingDocumentEngine.exportToJSON(report);
    assert.ok(jsonStr.startsWith("{"));
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.id, report.id);
    assert.equal(parsed.reportType, "DAILY_FOUNDER_BRIEFING");
    assert.equal(parsed.sections[0].metrics[0].value, "LIVE_DATA_REQUIRED");
  });

  test("exports report to standard CSV format without inventing report figures", () => {
    const report = ReportingDocumentEngine.generateReport("RESTAURANT_SETTLEMENT_STATEMENT", {
      restaurantId: "REST-001",
    });
    const csv = ReportingDocumentEngine.exportToCSV(report);
    assert.ok(csv.includes('"Report Title"'));
    assert.ok(csv.includes('"Key","Label","Value","Category","Source Note"'));
    assert.ok(csv.includes("LIVE_DATA_REQUIRED"));
    assert.ok(!csv.includes("₹39,740"));
  });

  test("exports clean printable HTML with the data gate", () => {
    const report = ReportingDocumentEngine.generateReport("GST_COMPLIANCE_SUMMARY");
    const html = ReportingDocumentEngine.exportToHTML(report);
    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("<title>"));
    assert.ok(html.includes("Order King • Enterprise Intelligence"));
    assert.ok(html.includes("LIVE_DATA_REQUIRED"));
    assert.ok(html.includes("@media print"));
  });

  test("exports clean Markdown with the data gate", () => {
    const report = ReportingDocumentEngine.generateReport("WEEKLY_FOUNDER_EXECUTIVE");
    const md = ReportingDocumentEngine.exportToMarkdown(report);
    assert.ok(md.startsWith("# Verified-data required: WEEKLY_FOUNDER_EXECUTIVE"));
    assert.ok(md.includes("### Data Trust Attribution Summary"));
    assert.ok(md.includes("| Metric | Value | Attribution | Source |"));
  });
});
