// @ts-nocheck
import { describe, it, expect } from "vitest";
import { getSql } from "../../db";

describe("Live Infrastructure & Gateway Diagnostics", () => {
  it("verifies live Supabase PostgreSQL Singapore 17.6 database connection", async () => {
    const sql = await getSql();
    const result: any = await sql`SELECT NOW() as db_time, current_database() as db_name, version() as db_version;`;
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    const row = result[0];
    console.log("✅ Live Supabase Connection:", {
      database: row.db_name,
      time: row.db_time,
      version: String(row.db_version || "").slice(0, 40),
    });
  });

  it("verifies live Fast2SMS telecom gateway balance API", async () => {
    const apiKey = process.env.FAST2SMS_API_KEY || "8N1WpYHWBVeiCvSqiH0AoYYF8xXp227bvOF3RDFeBBg4QVf4Gx8cACyYk7aiUNowVGPVaj9GePXTJcfU";
    const res = await fetch("https://www.fast2sms.com/dev/wallet", {
      headers: { authorization: apiKey },
    });
    const data = await res.json();
    console.log("✅ Live Fast2SMS Gateway Status:", {
      status: res.status,
      wallet: data,
    });
    expect(res.status).toBe(200);
  });

  it("verifies live 2Factor.in telecom gateway API", async () => {
    const apiKey = process.env.TWOFACTOR_API_KEY || "bae2bf50-d3d4-11f1-ac3e-0200cd936042";
    const res = await fetch(`https://2factor.in/API/V1/${apiKey}/BAL/SMS`);
    const text = await res.text();
    console.log("✅ Live 2Factor Gateway Status:", {
      status: res.status,
      response: text,
    });
    expect(res.status).toBe(200);
  });
});
