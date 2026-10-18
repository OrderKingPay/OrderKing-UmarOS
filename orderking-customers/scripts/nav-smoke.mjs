import assert from "node:assert/strict";
import { chromium } from "playwright";
import path from "node:path";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.ORDERKING_LOCAL_URL || "http://127.0.0.1:8082";
const out = path.resolve(process.cwd(), "..", "work", "nav-qa-20261018");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = { baseUrl, checkedAt: new Date().toISOString(), mobile: {}, desktop: {}, pageErrors: [] };
try {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on("pageerror", e => report.pageErrors.push("mobile: " + e.message));
  await mobile.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  const nav = mobile.getByTestId("customer-bottom-nav");
  await nav.waitFor({ timeout: 45000 });
  const links = nav.locator("a");
  const labels = await links.allTextContents();
  report.mobile.labels = labels.map(x => x.trim());
  assert.deepEqual(report.mobile.labels, ["Food", "KingPay", "Orders & Passes"], "Bottom nav must match approved labels");
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  report.mobile.horizontalOverflow = overflow;
  assert.equal(overflow, false, "Mobile page must not scroll horizontally");
  await mobile.screenshot({ path: path.join(out, "home-mobile.png"), fullPage: false });
  await links.nth(1).click();
  await mobile.waitForURL(/\/kingpay\/?$/, { timeout: 45000 });
  report.mobile.kingpayHeading = await mobile.locator("h1").first().innerText();
  assert.match(report.mobile.kingpayHeading, /KingPay/i);
  await mobile.screenshot({ path: path.join(out, "kingpay-mobile.png"), fullPage: false });
  await mobile.getByTestId("customer-bottom-nav").locator("a").nth(2).click();
  await mobile.waitForURL(/\/orders\/?$/, { timeout: 45000 });
  report.mobile.ordersUrl = mobile.url();
  await mobile.screenshot({ path: path.join(out, "orders-mobile.png"), fullPage: false });
  await mobile.close();

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  desktop.on("pageerror", e => report.pageErrors.push("desktop: " + e.message));
  await desktop.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  report.desktop.headerNavVisible = await desktop.getByText("KingPay", { exact: true }).first().isVisible();
  await desktop.screenshot({ path: path.join(out, "home-desktop.png"), fullPage: false });
  await desktop.close();
  report.success = report.pageErrors.length === 0;
} catch(e) {
  report.success = false;
  report.failure = String(e);
} finally {
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  if (!report.success) process.exitCode = 1;
}