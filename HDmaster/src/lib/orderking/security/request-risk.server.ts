// @ts-nocheck
export type RequestRisk = {
  score: number;
  action: "ALLOW" | "STEP_UP" | "BLOCK";
  reasons: string[];
};

const AUTOMATION_UA = /(headlesschrome|phantomjs|selenium|playwright|puppeteer|curl\/|python-requests|scrapy)/i;

export function evaluateRequestRisk(request: Request, options: { stateChanging?: boolean } = {}): RequestRisk {
  const reasons: string[] = [];
  let score = 0;

  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent) {
    score += 20;
    reasons.push("missing_user_agent");
  } else if (AUTOMATION_UA.test(userAgent)) {
    score += 70;
    reasons.push("automation_signature");
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (options.stateChanging && origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        score += 60;
        reasons.push("cross_origin_state_change");
      }
    } catch {
      score += 40;
      reasons.push("malformed_origin");
    }
  }

  // VPN/proxy use is deliberately allowed and is not itself a fraud signal.
  if (!request.headers.get("x-forwarded-for")) reasons.push("no_forwarded_ip_metadata");

  const action = score >= 70 ? "BLOCK" : score >= 40 ? "STEP_UP" : "ALLOW";
  return { score, action, reasons };
}
