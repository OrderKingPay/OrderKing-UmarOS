import { describe, expect, it } from "vitest";
import { TP_CONSENT_KEY, TP_MARKER, validateWhiteLabelId, whiteLabelScriptUrl } from "../lib/travel/travelpayouts-config";

describe("Travelpayouts White Label fail-closed configuration", () => {
  it("uses actual owner project marker only in metadata, never as widget ID", () => {
    expect(TP_MARKER).toBe("589554");
    expect(TP_CONSENT_KEY).toBe("orderking_tp_wl_consent_v1");
    expect(whiteLabelScriptUrl(undefined)).toBeNull();
  });

  it.each([undefined, null, "", " ", "TODO", "REPLACE_ME", "EXAMPLE", "null", "undefined", "https://evil.example/test.js", "a/b", "<script>"])(
    "rejects missing or invalid widget identifiers (%s)", (value) => {
      expect(validateWhiteLabelId(value)).toBeNull();
      expect(whiteLabelScriptUrl(value)).toBeNull();
    }
  );

  it("accepts only a well-formed owner-configured widget identifier", () => {
    expect(validateWhiteLabelId(" ab12_34-X ")).toBe("ab12_34-X");
    expect(whiteLabelScriptUrl("ab12_34-X")).toBe("https://tpwgts.com/wl_web/main.js?wl_id=ab12_34-X");
  });
});
