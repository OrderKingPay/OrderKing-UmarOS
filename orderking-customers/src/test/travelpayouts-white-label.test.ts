import { describe, expect, it } from "vitest";
import {
  TP_CONSENT_KEY,
  TP_MARKER,
  TP_PROJECT_ID,
  TP_WL_ID,
  TP_WL_DOMAIN,
  validateWhiteLabelId,
  whiteLabelScriptUrl,
  getConfiguredWhiteLabelId,
  getTravelpayoutsMarker,
  getTravelpayoutsProjectId,
} from "../lib/travel/travelpayouts-config";

describe("Travelpayouts White Label fail-closed configuration", () => {
  it("uses authentic owner marker 794122 and project 589554 with WL ID 23797", () => {
    expect(TP_MARKER).toBe("794122");
    expect(TP_PROJECT_ID).toBe("589554");
    expect(TP_WL_ID).toBe("23797");
    expect(TP_WL_DOMAIN).toBe("www.orderkingpay.com");
    expect(getTravelpayoutsMarker()).toBe("794122");
    expect(getTravelpayoutsProjectId()).toBe("589554");
    expect(getConfiguredWhiteLabelId()).toBe("23797");
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
    expect(whiteLabelScriptUrl("ab12_34-X")).toBe("https://tpwidg.com/wl_web/main.js?wl_id=ab12_34-X");
    expect(whiteLabelScriptUrl("23797")).toBe("https://tpwidg.com/wl_web/main.js?wl_id=23797");
  });
});
