import test from 'node:test';
import assert from 'node:assert';
import {
  DigitalContractEngine,
  OFFICIAL_RIDER_SECTIONS
} from '../../src/lib/orderking/compliance/onboarding-contracts.ts';

test('OrderKing Delivery Partner Agreement - Code on Social Security 2020 Compliance', () => {
  const engine = new DigitalContractEngine();
  const riderId = 'RIDER-TEST-9901';
  const aadhar = 'XXXX-XXXX-1234';
  const pan = 'ABCDE1234F';

  const contract = engine.generateRiderAgreement(riderId, aadhar, pan);

  // 1. Verify contract identity and branding
  assert.strictEqual(contract.entityId, riderId);
  assert.strictEqual(contract.documentType, 'INDEPENDENT_CONTRACTOR_AGREEMENT');
  assert.strictEqual(contract.status, 'PENDING_SIGNATURE');
  assert.strictEqual(contract.umarOsApprovalStatus, 'PENDING');
  assert.strictEqual(contract.statutoryAct, 'Code on Social Security, 2020 (Act 36 of 2020)');
  assert.strictEqual(contract.governingLaw, 'Laws of the Republic of India');

  // 2. Verify Zero Third-Party (e.g. Zomato) mentions in content summary or sections
  assert.ok(!contract.contentSummary.toLowerCase().includes('zomato'), 'Must not mention Zomato in summary');

  // 3. Verify exactly 13 statutory sections
  assert.strictEqual(contract.legalSections?.length, 13);
  assert.strictEqual(OFFICIAL_RIDER_SECTIONS.length, 13);

  // 4. Verify Welfare Fund and Accidental Insurance details
  assert.strictEqual(contract.welfareFundRate, '1.5% of eligible platform turnover');
  assert.strictEqual(contract.accidentalInsuranceCover, 'INR 10,00,000 Accidental Death & Total Disability');
  assert.strictEqual(contract.hospitalizationCover, 'INR 1,00,000 Emergency Medical Expense');

  // 5. Test signing and UmarOS approval lifecycle
  const signed = engine.signContract(contract);
  assert.strictEqual(signed.status, 'SIGNED');
  assert.ok(signed.digitalSignatureRef?.startsWith('DIGI-SIGN-'));

  const approved = engine.finalizeOnboardingViaUmarOS(signed);
  assert.strictEqual(approved.umarOsApprovalStatus, 'APPROVED');
});

test('OrderKing Delivery Partner Agreement - 13 Sections Structural Integrity', () => {
  const expectedSections = [
    'Definitions and Statutory Interpretations',
    'Independent Contractor Status & Absolute Work Autonomy',
    'Scope of Delivery Services & Professional SOP Standards',
    'Partner Eligibility, Vehicle Regulations & Statutory KYC',
    'Consideration, Payout Computation, Settlements & Tax Compliance',
    'Statutory Gig Worker Welfare & Social Security Fund Contributions',
    'Group Accidental Insurance, Healthcare & Roadside SOS Protection',
    'Delivery Partner Code of Conduct, Road Safety & Zero-Tolerance SOP',
    'Confidentiality, Telemetry Telematics & Data Protection',
    'Term, Voluntary Disengagement & Fair Deactivation Procedure',
    'Mutual Indemnification & Limitation of Platform Liability',
    'Two-Tier Dispute Resolution, Grievance Redressal & Arbitration',
    'Digital Execution, Severability & Electronic Assent'
  ];

  OFFICIAL_RIDER_SECTIONS.forEach((sec, idx) => {
    assert.strictEqual(sec.sectionNumber, String(idx + 1));
    assert.strictEqual(sec.title, expectedSections[idx]);
    assert.ok(sec.statutoryBasis.length > 5);
    assert.ok(sec.fullLegalText.length > 50);
    assert.ok(sec.keyHighlights.length >= 2);
    // Strict branding check
    assert.ok(!sec.fullLegalText.toLowerCase().includes('zomato'), `Section ${sec.sectionNumber} must not mention Zomato`);
  });
});
