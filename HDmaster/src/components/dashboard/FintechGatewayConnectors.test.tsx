import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FintechGatewayConnectors } from "./FintechGatewayConnectors";

describe("FintechGatewayConnectors safety boundary", () => {
  it("does not claim provider connectivity without server attestation", () => {
    const html = renderToStaticMarkup(<FintechGatewayConnectors />);
    expect(html).toContain("verification required");
    expect(html).toContain("Unverified");
    expect(html).not.toContain(">Connected<");
    expect(html).not.toContain(">Connect<");
  });

  it("never requests financial provider secrets in the browser", () => {
    const html = renderToStaticMarkup(<FintechGatewayConnectors />);
    expect(html).not.toContain("<input");
    expect(html).not.toContain("Enter production key");
    expect(html).toContain("Configure secrets only");
  });
});
