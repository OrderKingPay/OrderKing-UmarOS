import test from 'node:test';
import assert from 'node:assert';
import {
  DigitalContractEngine,
  OFFICIAL_MERCHANT_SECTIONS
} from '../../src/lib/orderking/compliance/onboarding-contracts.ts';

test('OrderKing Restaurant Partner Agreement - Indian Statutory Clickwrap Compliance', () => {
  const engine = new DigitalContractEngine();
  const restaurantId = 'REST-TEST-DELHI-4001';
  const fssai = '10724001001234'; // Delhi 14-digit FSSAI
  const gstin = '07AAAAA0000A1Z5'; // Delhi GSTIN

  const contract = engine.generateRestaurantPartnerAgreement(restaurantId, fssai, gstin, 18);

  // 1. Verify contract identity and branding
  assert.strictEqual(contract.entityId, restaurantId);
  assert.strictEqual(contract.documentType, 'MERCHANT_PARTNER_AGREEMENT');
  assert.strictEqual(contract.status, 'PENDING_SIGNATURE');
  assert.strictEqual(contract.umarOsApprovalStatus, 'PENDING');
  assert.strictEqual(contract.fssaiNumber, fssai);
  assert.strictEqual(contract.gstin, gstin);
  assert.strictEqual(contract.commissionRate, '18%');
  assert.strictEqual(contract.settlementCycle, 'T+1 Daily (Midnight Cutoff, 10:00 AM Dispatch)');
  assert.strictEqual(contract.statutoryAct, 'Food Safety and Standards Act, 2006 & CGST Act, 2017');
  assert.strictEqual(contract.governingLaw, 'Laws of the Republic of India');

  // 2. Verify Zero Third-Party mentions in content summary or sections
  assert.ok(!contract.contentSummary.toLowerCase().includes('zomato'), 'Must not mention Zomato in summary');

  // 3. Verify exactly 13 statutory sections
  assert.strictEqual(contract.legalSections?.length, 13);
  assert.strictEqual(OFFICIAL_MERCHANT_SECTIONS.length, 13);

  // 4. Test signing and UmarOS approval lifecycle
  const signed = engine.signContract(contract);
  assert.strictEqual(signed.status, 'SIGNED');
  assert.ok(signed.digitalSignatureRef?.startsWith('DIGI-SIGN-'));

  const approved = engine.finalizeOnboardingViaUmarOS(signed);
  assert.strictEqual(approved.umarOsApprovalStatus, 'APPROVED');
});

test('OrderKing Restaurant Partner Agreement - 13 Sections Structural Integrity', () => {
  const expectedSections = [
    'Definitions and Statutory Standing',
    'Non-Exclusive Digital Listing & Menu Parity',
    'FSSAI Food Safety Act 2006 & Mandatory 14-Digit Registration',
    'Dietary Labelling & Declarations: FSS (Labelling and Display) Regs 2020',
    'Kitchen Preparation SOP, Hygiene & Tamper-Evident Packaging',
    'Commercial Terms, Commission Structure & Fee Schedules',
    'CGST Act Section 9(5) Food Delivery Tax Remittance & ITC Inadmissibility',
    'Section 52 TCS & Section 194-O TDS Statutory Withholding',
    'Daily T+1 Merchant Settlement Cycle, Midnight Cutoff & Section 34 Credit Notes',
    'Digital Personal Data Protection (DPDP) Act, 2023 & Customer Telephony Masking',
    'Merchant Representations, Product Warranties & Food Contamination Indemnity',
    'Term, Non-Exclusive Disengagement, Suspension & Principles of Natural Justice',
    'Two-Tier Dispute Resolution, Arbitration Act, 1996 & Section 10A IT Act Digital Assent'
  ];

  OFFICIAL_MERCHANT_SECTIONS.forEach((sec, idx) => {
    assert.strictEqual(sec.sectionNumber, String(idx + 1));
    assert.strictEqual(sec.title, expectedSections[idx]);
    assert.ok(sec.statutoryBasis.length > 5);
    assert.ok(sec.fullLegalText.length > 50);
    assert.ok(sec.keyHighlights.length >= 2);
    // Strict branding check
    assert.ok(!sec.fullLegalText.toLowerCase().includes('zomato'), `Section ${sec.sectionNumber} must not mention Zomato`);
  });
});
