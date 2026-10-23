import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isActiveFounderEmployee } from "../../auth/founder-privileges";

describe("Umar OS founder-only boundary", () => {
  it("accepts only an ACTIVE SUPER_ADMIN employee record", () => {
    expect(isActiveFounderEmployee({ role_key: "SUPER_ADMIN", status: "ACTIVE" })).toBe(true);
    for (const row of [
      null,
      undefined,
      { role_key: "SUPER_ADMIN", status: "PENDING" },
      { role_key: "FOUNDER", status: "ACTIVE" },
      { role_key: "ADMIN", status: "ACTIVE" },
      { role_key: "CUSTOM", status: "ACTIVE" },
    ]) {
      expect(isActiveFounderEmployee(row)).toBe(false);
    }
  });

  it("requires authorization before each homepage server handler", () => {
    const src = readFileSync(new URL("../../../routes/index.tsx", import.meta.url), "utf8");
    for (const handler of [
      "getUmarOSStats",
      "saveUmarOsSettingsFn",
      "approveRestaurantFn",
      "runUmarAiActionFn",
    ]) {
      const marker = `export const ${handler} = createServerFn`;
      const start = src.indexOf(marker);
      expect(start, `missing ${handler}`).toBeGreaterThanOrEqual(0);
      expect(src.slice(start, start + 350)).toContain("await requireVerifiedFounderSession();");
    }
  });

  it("does not fabricate successful writes after persistence errors", () => {
    const src = readFileSync(new URL("../../../routes/index.tsx", import.meta.url), "utf8");
    const saveBlock = src.slice(src.indexOf("export const saveUmarOsSettingsFn"), src.indexOf("export const approveRestaurantFn"));
    const approveBlock = src.slice(src.indexOf("export const approveRestaurantFn"), src.indexOf("export interface UmarAiActionResult"));
    expect(saveBlock).toContain('error: "PERSISTENCE_FAILED"');
    expect(approveBlock).toContain("RETURNING id");
    expect(approveBlock).toContain('error: "RESTAURANT_NOT_FOUND"');
    expect(approveBlock).toContain('error: "PERSISTENCE_FAILED"');
  });
});
