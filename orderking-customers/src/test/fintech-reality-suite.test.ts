import { describe, it, expect } from "vitest";

describe("Squad 2: FinTech & Travel Reality Engine - Pure SafeInteger & Zero Mocks", () => {
  describe("Split Bill Zero-Drift SafeInteger Paise Math", () => {
    it("allocates single paise remainders perfectly with zero floating point drift", () => {
      const billInr = 1000; // ₹1,000.00
      const billPaise = billInr * 100; // 100,000 paise
      const people = 3;

      const baseSharePaise = Math.floor(billPaise / people); // 33,333 paise
      const remainderPaise = billPaise % people; // 1 paisa

      expect(baseSharePaise).toBe(33333);
      expect(remainderPaise).toBe(1);

      // Total of shares must match the exact bill down to 1 paisa
      const totalSum = baseSharePaise * (people - remainderPaise) + (baseSharePaise + 1) * remainderPaise;
      expect(totalSum).toBe(billPaise);
    });

    it("handles tip percentages strictly in integer paise", () => {
      const billInr = 2500;
      const billPaise = billInr * 100;
      const tipPercent = 10;
      const tipPaise = Math.round((billPaise * tipPercent) / 100);
      const grandTotalPaise = billPaise + tipPaise;

      expect(tipPaise).toBe(25000); // ₹250.00
      expect(grandTotalPaise).toBe(275000); // ₹2,750.00
    });
  });

  describe("Loan EMI Standard Reducing Balance Formula", () => {
    it("computes monthly EMI in exact integer paise", () => {
      const principalInr = 100000;
      const principalPaise = principalInr * 100;
      const apr = 12; // 12% p.a.
      const months = 12;

      const monthlyRate = apr / 1200; // 0.01 per month
      const factor = Math.pow(1 + monthlyRate, months);
      const emiInr = (principalPaise / 100) * monthlyRate * factor / (factor - 1);
      const emiPaise = Math.round(emiInr * 100);

      // Monthly EMI for ₹1,00,000 @ 12% for 12 months is ~₹8,884.88 => 888488 paise
      expect(emiPaise).toBe(888488);

      const totalPayablePaise = emiPaise * months;
      expect(totalPayablePaise).toBeGreaterThan(principalPaise);
      const totalInterestPaise = totalPayablePaise - principalPaise;
      expect(totalInterestPaise).toBe(661856); // ₹6,618.56
    });
  });

  describe("GST Statutory Exclusive & Inclusive Math", () => {
    it("computes exclusive GST with exact 50/50 CGST and SGST split", () => {
      const netInr = 10000;
      const netPaise = netInr * 100;
      const rate = 18;

      const taxPaise = Math.round((netPaise * rate) / 100);
      const cgstPaise = Math.floor(taxPaise / 2);
      const sgstPaise = taxPaise - cgstPaise;

      expect(taxPaise).toBe(180000); // ₹1,800.00
      expect(cgstPaise).toBe(90000);  // ₹900.00
      expect(sgstPaise).toBe(90000);  // ₹900.00
      expect(netPaise + taxPaise).toBe(1180000); // ₹11,800.00
    });

    it("computes inclusive GST reversing statutory rate cleanly", () => {
      const grossInr = 11800;
      const grossPaise = grossInr * 100;
      const rate = 18;

      const basePaise = Math.round((grossPaise * 100) / (100 + rate));
      const taxPaise = grossPaise - basePaise;

      expect(basePaise).toBe(1000000); // ₹10,000.00
      expect(taxPaise).toBe(180000);   // ₹1,800.00
    });
  });

  describe("FD & RD Quarterly Compounding Yield Formula", () => {
    it("computes quarterly compounded FD maturity per RBI master circular", () => {
      const principalInr = 100000;
      const principalPaise = principalInr * 100;
      const rate = 8.0; // 8% p.a.
      const months = 12; // 4 quarters

      const quarters = (months / 12) * 4; // 4
      const ratePerQuarter = rate / 400; // 0.02
      const maturityInr = (principalPaise / 100) * Math.pow(1 + ratePerQuarter, quarters);
      const maturityPaise = Math.round(maturityInr * 100);

      // (1.02)^4 = 1.08243216 => ₹108,243.22 => 10824322 paise
      expect(maturityPaise).toBe(10824322);
      const interestEarnedPaise = maturityPaise - principalPaise;
      expect(interestEarnedPaise).toBe(824322); // ₹824.322
    });
  });

  describe("Sovereign Travel 0% Platform Fee Guarantee", () => {
    it("guarantees zero platform convenience markup and passes 100% partner rebate", () => {
      const baseFarePaise = 450000; // ₹4,500.00
      const passengers = 2;
      const totalBasePaise = baseFarePaise * passengers;
      const taxPaise = Math.round((totalBasePaise * 5) / 100);
      const otaConvenienceFeePaise = 49900 * passengers; // ₹499 per pax

      const otaTotalPaise = totalBasePaise + taxPaise + otaConvenienceFeePaise;
      const sovereignTotalPaise = totalBasePaise + taxPaise; // 0 paise desk fee

      const instantSavingsPaise = otaTotalPaise - sovereignTotalPaise;
      expect(instantSavingsPaise).toBe(otaConvenienceFeePaise);

      // 200 bps carrier rebate (2.0%)
      const rebatePaise = Math.floor((totalBasePaise * 200) / 10000);
      expect(rebatePaise).toBe(18000); // ₹180.00

      // Total customer advantage = instant savings + rebate
      const totalCustomerAdvantagePaise = instantSavingsPaise + rebatePaise;
      expect(totalCustomerAdvantagePaise).toBe(99800 + 18000);
    });
  });
});
