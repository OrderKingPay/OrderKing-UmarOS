/**
 * Official Indian Delivery Partner Agreement
 * Compliant with:
 *  - The Code on Social Security, 2020 (Act No. 36 of 2020) — Chapter IX (Social Security for Gig & Platform Workers)
 *  - The Indian Contract Act, 1872 (Section 10 - Essential Conditions of Valid Contracts)
 *  - The Information Technology Act, 2000 (Sections 10A, 65B - Digital Assent & Electronic Records)
 *  - The Motor Vehicles Act, 1988 & CMVR 1989 (Rule 2(u) Commercial & Low-Speed EV Exemptions)
 *  - Food Safety and Standards Act, 2006 (FSSAI Safe Food Delivery & Thermal Bag SOP)
 *  - Digital Personal Data Protection Act, 2023 (DPDP Act - Telemetry & PII Masking)
 *  - Arbitration and Conciliation Act, 1996
 *
 * Brand: OrderKing Partner (Orderkingpay, Sribhumi, Assam - 788710 | GSTIN: 18AFXPH9838M1Z9)
 */

export interface AgreementSection {
  id: string;
  sectionNumber: string;
  title: string;
  statutoryBasis: string;
  summary: string;
  fullLegalText: string;
  keyHighlights: string[];
}

export interface PartnerAgreementMetadata {
  documentTitle: string;
  companyName: string;
  cin: string;
  governingLaw: string;
  complianceFramework: string;
  version: string;
  effectiveDate: string;
  welfareFundRate: string;
  accidentalDeathCover: string;
  hospitalizationCover: string;
  minimumFloorPayout: string;
}

export const ORDERKING_PARTNER_AGREEMENT_METADATA: PartnerAgreementMetadata = {
  documentTitle: "OrderKing Independent Delivery Partner Service Agreement",
  companyName: "Orderkingpay",
  cin: "18AFXPH9838M1Z9",
  governingLaw: "Republic of India",
  complianceFramework: "Code on Social Security, 2020 (Act 36 of 2020)",
  version: "v2026.1-CSS2020",
  effectiveDate: "2026-01-01",
  welfareFundRate: "1.5% of eligible turnover allocated to statutory Gig Workers Welfare Fund",
  accidentalDeathCover: "INR 10,00,000 (Ten Lakh Rupees)",
  hospitalizationCover: "INR 1,00,000 (One Lakh Rupees)",
  minimumFloorPayout: "INR 35 Base Floor Fare per completed delivery",
};

export const ORDERKING_PREAMBLE_TEXT = `This Independent Delivery Partner Service Agreement ("Agreement") is executed electronically by and between Orderkingpay, an enterprise having its registered office in Sribhumi, Assam - 788710, operating under GSTIN 18AFXPH9838M1Z9 (hereinafter referred to as "OrderKing" or "Platform", which expression shall unless repugnant to the context include its successors and assigns), and the Individual Applicant who completes the digital onboarding and verification flow (hereinafter referred to as the "Delivery Partner" or "Partner").

WHEREAS:
A. OrderKing operates a digital technology platform and logistics network facilitating real-time discovery, ordering, and delivery of food, beverages, and grocery items from merchant establishments to end-consumers.
B. The Delivery Partner is an autonomous, self-employed gig worker possessing the requisite legal capacity, transport equipment, and licences, who desires to provide independent delivery services on the OrderKing platform on a principal-to-principal basis.
C. This Agreement is digitally executed pursuant to Section 10A of the Information Technology Act, 2000 and Section 10 of the Indian Contract Act, 1872 upon electronic assent by the Delivery Partner.
D. The parties agree to adhere strictly to the social security mandates, welfare contributions, and safety provisions enacted under the Code on Social Security, 2020 (Act No. 36 of 2020).

NOW, THEREFORE, the parties hereby covenant and agree as follows:`;

export const ORDERKING_PARTNER_AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: "definitions",
    sectionNumber: "1",
    title: "Definitions and Statutory Interpretations",
    statutoryBasis: "Section 2, Code on Social Security, 2020 & General Clauses Act, 1897",
    summary:
      "Defines key operational terms including Active Duty, Gig Worker, Base Fare, Distance Tariff, and Welfare Fund in conformity with Indian statutory law.",
    fullLegalText: `1.1 "Active Duty" means the duration during which the Delivery Partner is logged into the OrderKing Partner Mobile Application in "ONLINE" or "BUSY" status and is either awaiting, traveling towards a merchant, or executing an assigned delivery.
1.2 "Aggregator" shall bear the meaning assigned under Section 2(2) of the Code on Social Security, 2020, referring to OrderKing as a digital intermediary connecting consumers, food businesses, and logistics partners.
1.3 "Delivery Services" means the physical collection, transportation, temperature preservation, and doorstep handover of packaged food, beverages, or commodities from merchant establishments to designated consumer drop-off locations.
1.4 "Gig Worker" shall have the statutory meaning defined in Section 2(35) of the Code on Social Security, 2020, being an individual who performs work or participates in a work arrangement and earns from such activities outside of traditional employer-employee relationships.
1.5 "Social Security Fund" means the statutory fund established by the Central Government under Section 113 of the Code on Social Security, 2020 for the administration of gig worker and platform worker welfare benefits.
1.6 "Tamper-Evident Packaging" means packaging sealed by the Restaurant Partner with security stickers, tapes, or zip-ties designed to show evident visual indicators if opened prior to customer handover.`,
    keyHighlights: [
      "Explicit statutory definition under Section 2(35) Code on Social Security, 2020",
      "Clear demarcation of Active Duty vs. Offline Personal Time",
      "Standard definitions for tamper-evident packaging and aggregator role",
    ],
  },
  {
    id: "contractor-status",
    sectionNumber: "2",
    title: "Independent Contractor Status & Absolute Work Autonomy",
    statutoryBasis: "Chapter IX, Code on Social Security, 2020 & Indian Contract Act, 1872",
    summary:
      "Affirms principal-to-principal status, zero employee benefits, complete freedom to choose work hours, non-exclusivity, and freedom to decline orders.",
    fullLegalText: `2.1 Principal-to-Principal Engagement: The relationship between OrderKing and the Delivery Partner is strictly that of independent principal-to-principal contracting parties. Nothing in this Agreement shall be construed to create any partnership, joint venture, agency, franchise, master-servant, or employer-employee relationship between OrderKing and the Delivery Partner.
2.2 Complete Discretion over Operating Hours: The Delivery Partner possesses absolute discretion and autonomy to decide when to log in, how long to remain available online, and when to log out of the OrderKing Partner Platform. OrderKing imposes zero mandatory minimum shifts, fixed reporting hours, or forced attendance quotas.
2.3 Discretion over Delivery Offers: The Delivery Partner has the unfettered right to accept or decline any delivery task dispatched to them. Declining an offer shall never attract monetary fines or punitive civil damages.
2.4 Multi-Platform Non-Exclusivity: The Delivery Partner is entirely free to provide delivery, transport, or any other commercial services to any other platform, aggregator, restaurant, or business enterprise concurrently, without restriction or platform penalty.
2.5 Negation of Traditional Employment Benefits: The Delivery Partner expressly acknowledges that as an autonomous gig contractor, they are not entitled to, nor shall claim, benefits under traditional employer-employee legislations, including the Employees' Provident Funds and Miscellaneous Provisions Act, 1952, the Employees' State Insurance Act, 1948, the Payment of Gratuity Act, 1972, or the Industrial Disputes Act, 1947. Their statutory social welfare entitlements are governed exclusively by Chapter IX of the Code on Social Security, 2020.`,
    keyHighlights: [
      "100% Principal-to-Principal contract with zero employer-employee liability",
      "Complete autonomy: Partner controls log-in, log-out, and shift duration",
      "Zero mandatory shifts or forced acceptance quotas",
      "Non-exclusive: Partner can work on competing delivery apps simultaneously",
    ],
  },
  {
    id: "scope-services",
    sectionNumber: "3",
    title: "Scope of Delivery Services & Professional SOP Standards",
    statutoryBasis: "Food Safety and Standards Act, 2006 & Consumer Protection Act, 2019",
    summary:
      "Outlines the 6-stage order lifecycle, thermal bag hygiene, tamper seal verification, and doorstep handover standards.",
    fullLegalText: `3.1 Service Execution Lifecycle: Upon accepting a delivery assignment via the OrderKing Partner App, the Delivery Partner shall:
  (a) Proceed safely and promptly to the designated Restaurant Partner premises;
  (b) Announce arrival and present the digital Order Code to the kitchen dispatch counter;
  (c) Visually verify that all food items are packed and secured with intact tamper-evident seals;
  (d) Place packages inside the insulated thermal delivery bag, keeping hot and cold items segregated;
  (e) Navigate to the consumer's designated drop location following lawful road routes;
  (f) Effectuate respectful, contactless or person-to-person handover, and confirm completion via digital delivery proof (OTP or photo verification).
3.2 Food Safety & Hygiene Compliance: In compliance with FSSAI regulations, the Delivery Partner shall maintain personal cleanliness, keep the delivery bag sanitized and free of debris, avoid keeping food in direct contact with vehicle surfaces, and strictly refrain from smoking, chewing tobacco, or handling food containers with unwashed hands.
3.3 Non-Tampering Obligation: Under no circumstances shall the Delivery Partner open, break seals, inspect contents, sample, consume, or alter any food container or customer merchandise. Any breach of this clause constitutes gross misconduct resulting in immediate platform deactivation and potential civil or criminal liability under the Food Safety and Standards Act, 2006.`,
    keyHighlights: [
      "Mandatory tamper-evident seal verification at merchant counter",
      "Insulated thermal bag SOP with hot/cold segregation",
      "FSSAI food hygiene and sanitation rules",
      "Absolute zero tolerance for food tampering or seal damage",
    ],
  },
  {
    id: "eligibility-kyc",
    sectionNumber: "4",
    title: "Partner Eligibility, Vehicle Regulations & Statutory KYC",
    statutoryBasis: "Motor Vehicles Act, 1988, CMVR 1989 & Aadhaar Act, 2016",
    summary:
      "Mandates 18+ age requirement, valid Driving Licence/RC for motorized vehicles, low-speed EV/cycle exemptions, masked Aadhaar and PAN verification.",
    fullLegalText: `4.1 Eligibility Criteria: The Delivery Partner represents and warrants that:
  (a) They are an Indian citizen or legally authorized resident aged eighteen (18) years or older;
  (b) They are legally competent to enter into a binding contract under the Indian Contract Act, 1872;
  (c) They possess no subsisting disqualification, suspension of driving privileges, or criminal convictions involving violent crimes, moral turpitude, or road traffic offences under Sections 279, 304A, or 338 of the Indian Penal Code, 1860 (or corresponding provisions of the Bharatiya Nyaya Sanhita, 2023).
4.2 Motorized Vehicle Fleet Standards: If operating a motorcycle, scooter, or light commercial vehicle, the Delivery Partner warrants that the vehicle is roadworthy, carries a valid Registration Certificate (RC), valid third-party insurance under the Motor Vehicles Act, 1988, and a valid Pollution Under Control (PUC) certificate. The Partner shall hold an active, non-expired Indian Driving Licence.
4.3 Non-Motorized and Low-Speed EV Exemption: In terms of Rule 2(u) of the Central Motor Vehicles Rules, 1989 (CMVR), delivery partners operating pedal bicycles or low-speed electric vehicles with power output below 250 Watts and maximum operational speed not exceeding 25 km/h are legally exempt from RTO vehicle registration and driving licence mandates.
4.4 Statutory KYC Documentation: The Partner shall submit verifiable digital copies of:
  (a) Permanent Account Number (PAN) Card for statutory income tax reporting (Section 194C / 194-O);
  (b) Masked Aadhaar Card (with first 8 digits redacted) pursuant to UIDAI regulations;
  (c) Bank account passbook / cancelled cheque or verified UPI Virtual Payment Address (VPA) registered under the Partner's exact legal name;
  (d) Emergency next-of-kin contact details for road incident coordination.`,
    keyHighlights: [
      "Strict 18+ age verification requirement",
      "Valid DL, RC, Insurance & PUC for motorcycles/scooters",
      "Official statutory CMVR Rule 2(u) exemption for bicycles and low-speed EVs (<25 km/h)",
      "Masked Aadhaar (last 4 only) & PAN for tax compliance",
    ],
  },
  {
    id: "payout-taxes",
    sectionNumber: "5",
    title: "Consideration, Payout Computation, Settlements & Tax Compliance",
    statutoryBasis: "Income Tax Act, 1961 (Sec 194C/194-O) & CGST Act, 2017",
    summary:
      "Sets guaranteed floor payout (₹35 base fare), distance pay, wait-time compensation, 100% tip pass-through, T+0/weekly settlements, and TDS withholding.",
    fullLegalText: `5.1 Transparent Fare Calculation Matrix: OrderKing compensates the Delivery Partner for each successfully executed delivery in accordance with the transparent platform rate card:
  (a) Base Floor Fare: A guaranteed minimum floor fare of INR 35 per completed delivery within the base distance threshold;
  (b) Distance Tariff: An incremental distance fee of INR 10 per kilometer calculated via true route GPS distance beyond the base threshold;
  (c) Kitchen Wait-Time Compensation: In the event that kitchen food preparation at the Restaurant Partner exceeds five (5) minutes from verified rider arrival, compensation shall accrue at prescribed per-minute rates;
  (d) Peak Surge & Weather Allowances: Dynamic surge bonuses notified in the app during high-volume periods, late-night hours, heavy rainfall, or severe climatic conditions.
5.2 100% Customer Tip Pass-Through: 100% of any voluntary gratuity or tip added by the customer is transferred directly to the Delivery Partner without any platform commission, deduction, or processing fee.
5.3 Settlement Cycle & Direct Banking: Accrued delivery fees are remitted on a weekly scheduled settlement or through on-demand T+0 / T+1 fast-settlement directly into the Partner's registered bank account via NEFT/IMPS/UPI.
5.4 Taxation and Statutory Withholding:
  (a) OrderKing shall withhold Tax Deducted at Source (TDS) under Section 194C or Section 194-O of the Income Tax Act, 1961 where mandated by law, and furnish quarterly Form 16A certificates;
  (b) The Delivery Partner is solely responsible for declaring their aggregate earnings, filing personal Income Tax returns, and discharging any personal Goods and Services Tax (GST) liability if their aggregate turnover exceeds statutory thresholds under the CGST Act, 2017.`,
    keyHighlights: [
      "Guaranteed Minimum Base Fare floor: ₹35 per delivery",
      "Distance Pay: ₹10/km beyond base radius",
      "Wait-Time Allowance for kitchen prep delays >5 minutes",
      "100% pass-through of customer tips with custom commission",
      "Automated T+0 / weekly direct bank & UPI settlements",
      "Transparent Section 194-O / 194C TDS compliance with Form 16A",
    ],
  },
  {
    id: "social-security-fund",
    sectionNumber: "6",
    title: "Statutory Gig Worker Welfare & Social Security Fund Contributions",
    statutoryBasis: "Chapter IX, Sections 112, 113 & 114, Code on Social Security, 2020",
    summary:
      "Enforces OrderKing's 1-2% platform turnover contribution to the Central Social Security Fund, e-Shram UAN registration, and government welfare benefits.",
    fullLegalText: `6.1 Statutory Welfare Mandate: In full adherence to Chapter IX of the Code on Social Security, 2020 (Act No. 36 of 2020), OrderKing confirms its statutory standing as an Aggregator and undertakes to comply with all notified rules framed by the Central Government and State Governments for gig and platform workers.
6.2 Platform Welfare Cess Contribution: Pursuant to Section 114 of the Code on Social Security, 2020, OrderKing contributes between 1% to 2% of its eligible annual platform turnover (subject to a statutory ceiling of 5% of aggregate payments made to gig workers) into the National Social Security Fund for Gig and Platform Workers. No portion of this aggregator contribution shall be deducted or recovered from the Delivery Partner's payout.
6.3 National e-Shram & UAN Integration: OrderKing actively facilitates the registration of all active delivery partners on the Ministry of Labour and Employment e-Shram portal to ensure every Partner obtains a valid 12-digit Universal Account Number (UAN), enabling seamless portability of welfare benefits across India.
6.4 Scope of Social Security Coverage: Through the National Social Security Fund and allied schemes, Delivery Partners become eligible for:
  (a) Life and disability cover;
  (b) Accident, health, and maternity benefits;
  (c) Old age protection and skill upgradation schemes;
  (d) Emergency relief during declared natural calamities, epidemics, or force majeure events.`,
    keyHighlights: [
      "Statutory compliance under Sections 112-114 of Code on Social Security, 2020",
      "OrderKing contributes 1% to 2% of platform turnover to Central Welfare Fund",
      "Zero deduction from rider earnings for aggregator welfare contribution",
      "Integration with e-Shram Portal for 12-digit Universal Account Number (UAN)",
      "Access to statutory healthcare, disability, and old-age schemes",
    ],
  },
  {
    id: "accidental-insurance",
    sectionNumber: "7",
    title: "Group Accidental Insurance, Healthcare & Roadside SOS Protection",
    statutoryBasis: "Motor Vehicles Act, 1988 & Guidelines for Aggregators (MoRTH)",
    summary:
      "Details ₹10,00,000 accidental death/permanent disability cover, ₹1,00,000 hospitalization, OPD cover, 24x7 SOS, and penalty-free emergency reassignment.",
    fullLegalText: `7.1 Complimentary Group Accidental Cover: OrderKing maintains a master Group Personal Accident (GPA) and Accidental Medical Expense policy with a registered Indian General Insurance Company at zero premium cost to the Delivery Partner.
7.2 Coverage Tiers During Active Duty:
  (a) Accidental Death Benefit: A capital sum insured of INR 10,00,000 (Ten Lakh Rupees) payable to the Delivery Partner's registered legal nominee in the tragic event of fatal injury sustained while on Active Duty;
  (b) Permanent Total / Partial Disability: Up to INR 10,00,000 (Ten Lakh Rupees) based on IRDAI-approved percentage scales for loss of limbs, sight, or permanent earning capacity;
  (c) Emergency Hospitalization & Medical Reimbursement: In-patient hospitalization cover up to INR 1,00,000 (One Lakh Rupees) for accidental bodily injury sustained during active order transit;
  (d) Out-Patient Department (OPD) Allowance: Up to INR 10,000 for emergency dressing, diagnostic scans, and immediate medical treatment.
7.3 24x7 Roadside SOS Incident Response:
  (a) The OrderKing Partner App provides a 1-tap SOS feature directly connected to National Emergency Response Support System (112), Medical Ambulance (108), Police Control Room (100), and OrderKing Safety Operations;
  (b) Real-time GPS coordinates are automatically transmitted to incident responders upon SOS triggering.
7.4 Emergency Order Protection Guarantee: In the event of a roadside mishap, mechanical breakdown, or personal illness during an active order, the Partner may immediately flag an SOS ticket. The active delivery shall be reassigned to the nearest available fleet partner without cancellation charges, rating penalty, or adverse record on the Delivery Partner's profile.`,
    keyHighlights: [
      "INR 10,00,000 Group Accidental Death Insurance cover to nominee",
      "INR 10,00,000 Permanent Total Disability coverage",
      "INR 1,00,000 Emergency Hospitalization medical expense cover",
      "24x7 In-app SOS button linked to 112, 108 Ambulance, and Police",
      "Zero-penalty order reassignment during roadside emergencies",
    ],
  },
  {
    id: "code-of-conduct",
    sectionNumber: "8",
    title: "Delivery Partner Code of Conduct, Road Safety & Zero-Tolerance SOP",
    statutoryBasis: "Motor Vehicles Act, 1988, Sections 129, 185 & Bharatiya Nyaya Sanhita, 2023",
    summary:
      "Enforces mandatory BIS/ISI helmets, zero-intoxication policy, traffic law adherence, harassment-free workplace, and respectful customer etiquette.",
    fullLegalText: `8.1 Mandatory Protective Headgear: Delivery Partners operating motorized two-wheelers must wear a Bureau of Indian Standards (BIS/ISI 4151) certified protective helmet with the chin strap securely fastened at all times while the vehicle is in motion, pursuant to Section 129 of the Motor Vehicles Act, 1988.
8.2 Zero Tolerance for Intoxication: Operating any vehicle or performing delivery services under the influence of alcohol, narcotic drugs, psychotropic substances, or intoxicating medications is strictly prohibited. Any violation shall trigger immediate permanent disengagement and reporting to lawful law enforcement agencies under Section 185 of the Motor Vehicles Act, 1988.
8.3 Road Traffic Discipline: The Delivery Partner shall obey all traffic lights, speed limits, lane markers, and one-way restrictions. Handheld mobile phone use while riding is strictly forbidden; communication shall be conducted only when the vehicle is safely parked on the road shoulder.
8.4 Customer & Merchant Workplace Decorum: The Delivery Partner agrees to treat restaurant staff, consumers, security personnel, and fellow delivery partners with dignity, politeness, and respect. OrderKing maintains zero tolerance for sexual harassment, verbal abuse, communal slurs, discrimination, physical violence, or threats of any nature.
8.5 Identity Non-Transferability: The Partner shall never lend, sublicense, share, or allow any unauthorized third party to operate under their OrderKing Partner Account. Impersonation violates national security and statutory KYC norms.`,
    keyHighlights: [
      "Mandatory BIS/ISI certified helmet with fastened chin strap",
      "Strict zero-tolerance policy against alcohol, narcotics, and substance abuse",
      "No handheld phone use while riding; speed compliance",
      "Zero tolerance for harassment, abuse, or discrimination",
      "Strict prohibition against account sharing or impersonation",
    ],
  },
  {
    id: "confidentiality-data",
    sectionNumber: "9",
    title: "Confidentiality, Telemetry Telematics & Data Protection",
    statutoryBasis: "Digital Personal Data Protection Act, 2023 & IT Act, 2000",
    summary:
      "Ensures customer phone number masking, strict non-solicitation, DPDP Act 2023 compliance, and transparent GPS telemetry tracking during active duty.",
    fullLegalText: `9.1 Customer Data Confidentiality: The Delivery Partner shall treat all customer details (including full names, residential addresses, gate codes, and order notes) as strictly confidential.
9.2 Non-Contact and Non-Solicitation: Under no circumstances shall the Delivery Partner:
  (a) Save customer telephone numbers or residential details to personal devices;
  (b) Contact any customer after completion of the delivery for social, personal, or promotional reasons;
  (c) Photograph customer residences, premises, or family members.
9.3 Customer Phone Number Masking: OrderKing deploys virtualized VoIP and masked telephone bridges to ensure the customer's true mobile number is never disclosed to the Delivery Partner, and vice-versa.
9.4 GPS Telemetry Consent: The Delivery Partner explicitly consents to OrderKing capturing high-accuracy GPS coordinates, travel speed, and route trajectories strictly while the Partner App is in "ONLINE" or "BUSY" status. Such data is processed solely for order assignment, customer ETA estimation, fraudulent route detection, and emergency SOS incident handling in compliance with the Digital Personal Data Protection Act, 2023.`,
    keyHighlights: [
      "Customer phone numbers masked via secure virtual telephony bridges",
      "Strict prohibition on saving customer numbers or post-delivery contact",
      "Full compliance with Digital Personal Data Protection Act, 2023 (DPDP Act)",
      "Transparent GPS telemetry tracked ONLY while in ONLINE or BUSY duty",
    ],
  },
  {
    id: "term-deactivation",
    sectionNumber: "10",
    title: "Term, Voluntary Disengagement & Fair Deactivation Procedure",
    statutoryBasis: "Principles of Natural Justice & Indian Contract Act, 1872",
    summary:
      "Affirms at-will disengagement by Partner, transparent grounds for deactivation, right to appeal, and natural justice review before disengagement.",
    fullLegalText: `10.1 Term: This Agreement takes effect immediately upon digital execution and continues indefinitely until terminated by either party in accordance with this Section.
10.2 Voluntary At-Will Exit: The Delivery Partner may discontinue providing services and terminate this Agreement at any time, without penalty or minimum notice, simply by logging out and submitting a formal disengagement request via the Partner App. All undisputed earnings shall be settled in full within seven (7) banking days.
10.3 Grounds for Involuntary Deactivation: OrderKing reserves the right to suspend or terminate platform access only upon substantiated grounds:
  (a) Fraudulent manipulation of GPS location, mock mockers, or fake order claims;
  (b) Submission of forged, invalid, or expired KYC documents (DL, RC, Aadhaar, PAN);
  (c) Severe safety infractions, intoxicated driving, violent altercation, or customer harassment;
  (d) Customer food tampering, theft, or deliberate package destruction;
  (e) Lending, selling, or transferring account credentials to third parties.
10.4 Principles of Natural Justice & Grievance Redressal: Prior to permanent deactivation for non-emergency infractions, OrderKing shall issue a digital notice detailing the allegation. The Partner shall have a minimum period of seventy-two (72) hours to submit their explanation or photographic evidence to the OrderKing Partner Redressal Committee. Permanent deactivation occurs only after impartial review by a dedicated compliance officer.`,
    keyHighlights: [
      "Partner can voluntarily leave the platform at any time without penalty",
      "Full settlement of all earned payouts within 7 banking days",
      "Clear, transparent deactivation triggers (fraud, forgery, violence, tampering)",
      "Right to fair hearing and appeal with 72-hour explanation window",
    ],
  },
  {
    id: "indemnity-liability",
    sectionNumber: "11",
    title: "Mutual Indemnification & Limitation of Platform Liability",
    statutoryBasis: "Section 73 & 74, Indian Contract Act, 1872",
    summary:
      "Limits OrderKing liability to aggregate payouts earned in preceding 30 days; partner indemnifies OrderKing for traffic offences and willful unlawful acts.",
    fullLegalText: `11.1 Partner Indemnity: The Delivery Partner shall indemnify, defend, and hold harmless OrderKing, its directors, officers, employees, and agents from any third-party claims, fines, penalties, losses, damages, or legal costs arising out of:
  (a) Traffic violations, fines, or criminal proceedings under the Motor Vehicles Act, 1988;
  (b) Bodily injury or property damage inflicted upon third parties resulting from the Partner's gross negligence, willful misconduct, or intoxicated driving;
  (c) Any breach of representations, warranties, or food safety guidelines contained herein.
11.2 Platform Limitation of Liability: In no event shall OrderKing be liable for any indirect, incidental, consequential, punitive, or special damages, including lost profits, loss of vehicle use, or business interruption.
11.3 Liability Cap: OrderKing's aggregate financial liability to the Delivery Partner for any and all claims arising under this Agreement shall not exceed the total payout amounts earned by the Partner and remitted by OrderKing during the thirty (30) days immediately preceding the event giving rise to liability.`,
    keyHighlights: [
      "Partner responsible for personal traffic fines and motor accidents",
      "Platform liability strictly capped to last 30 days of earned payouts",
      "Exclusion of indirect, punitive, or consequential damages",
    ],
  },
  {
    id: "dispute-arbitration",
    sectionNumber: "12",
    title: "Two-Tier Dispute Resolution, Grievance Redressal & Arbitration",
    statutoryBasis: "Arbitration and Conciliation Act, 1996 & Consumer Protection Act, 2019",
    summary:
      "Establishes Tier-1 internal Grievance Redressal Officer conciliation (15 days), followed by Tier-2 Sole Arbitrator under Arbitration Act 1996 in India.",
    fullLegalText: `12.1 Amicable Conciliation (Tier 1): In the event of any dispute, difference, or claim arising out of or relating to this Agreement, the Delivery Partner and OrderKing shall first attempt in good faith to resolve the matter amicably through the OrderKing Partner Grievance Redressal Desk (Email: compliance@orderking.in). The Grievance Officer shall review the ticket and provide a reasoned written response within fifteen (15) working days.
12.2 Binding Sole Arbitration (Tier 2): If the dispute remains unresolved following the 15-day conciliation period, it shall be finally resolved through binding arbitration administered in accordance with the Arbitration and Conciliation Act, 1996 (as amended).
  (a) The arbitral tribunal shall consist of a sole independent arbitrator appointed by mutual consent of both parties, or failing agreement within thirty (30) days, pursuant to Section 11 of the Arbitration and Conciliation Act, 1996;
  (b) Seat and Venue: The seat and legal place of arbitration shall be New Delhi, India (or the State Capital having territorial jurisdiction over the Partner's primary operating city);
  (c) Language: All arbitral proceedings shall be conducted in English or the official regional language mutually agreed upon;
  (d) Finality: The arbitral award shall be final, conclusive, and binding upon both parties.
12.3 Exclusive Jurisdiction: Subject to the arbitration clause above, the courts of competent jurisdiction in India shall have exclusive territorial jurisdiction over any interim relief or enforcement proceedings.`,
    keyHighlights: [
      "Tier 1: Designated Grievance Redressal Officer response within 15 working days",
      "Tier 2: Sole Arbitrator under the Arbitration and Conciliation Act, 1996",
      "Seat of arbitration in India; proceedings in English or official state language",
      "Enforceable in Indian courts of competent jurisdiction",
    ],
  },
  {
    id: "digital-execution",
    sectionNumber: "13",
    title: "Digital Execution, Severability & Electronic Assent",
    statutoryBasis: "Section 10A, Information Technology Act, 2000 & Section 65B, Indian Evidence Act",
    summary:
      "Legal enforceability of click-wrap electronic assent, digital timestamping, IP logging, and severability of unenforceable provisions.",
    fullLegalText: `13.1 Legal Validity of Electronic Assent: Pursuant to Section 10A of the Information Technology Act, 2000, where in an electronic form or through electronic records, contract formation, agreement terms, and acceptances are expressed, such contract shall not be denied enforceability solely on the ground that electronic forms were used.
13.2 Evidence of Execution: The Delivery Partner's electronic action of selecting the checkbox ("I have read, understood and agree to the OrderKing Delivery Partner Agreement"), entering their authenticated mobile OTP, or clicking "Sign & Submit KYC Application", combined with the recorded timestamp, IP address, device telemetry, and unique Rider ID, constitutes conclusive digital evidence of valid execution under Section 65B of the Indian Evidence Act, 1872 (or Bharatiya Sakshya Adhiniyam, 2023).
13.3 Severability: If any provision of this Agreement is held to be invalid, illegal, or unenforceable by an arbitral tribunal or competent court, such provision shall be severed to the minimum extent necessary, and the remaining provisions shall continue in full legal force and effect.
13.4 Entire Agreement: This Agreement, together with the OrderKing Partner App Terms of Service, Privacy Policy, and Rate Card, represents the entire and exclusive agreement between the parties superseding all prior oral or written discussions.`,
    keyHighlights: [
      "Legally valid click-wrap electronic contract under Section 10A of IT Act, 2000",
      "Attributed digital signature via OTP verification and device timestamp",
      "Full severability and entire agreement protections",
    ],
  },
];

export function getFullAgreementLegalMarkdown(params?: {
  partnerName?: string;
  phone?: string;
  pan?: string;
  aadhaarLast4?: string;
  contractId?: string;
  signedAtIso?: string;
}): string {
  const name = params?.partnerName || "[DELIVERY PARTNER LEGAL NAME]";
  const phone = params?.phone ? `+91-${params.phone}` : "[10-DIGIT MOBILE NUMBER]";
  const pan = params?.pan || "[PAN NUMBER]";
  const aadhaar = params?.aadhaarLast4 ? `XXXX-XXXX-${params.aadhaarLast4}` : "[AADHAAR LAST 4]";
  const contractId = params?.contractId || `OK-AGMT-CSS2020-${Date.now()}`;
  const signedDate = params?.signedAtIso
    ? new Date(params.signedAtIso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  let md = `# ${ORDERKING_PARTNER_AGREEMENT_METADATA.documentTitle.toUpperCase()}
**Statutory Framework:** Compliant with the Code on Social Security, 2020 (Act No. 36 of 2020)  
**Contract Reference ID:** \`${contractId}\`  
**Execution Timestamp:** ${signedDate} IST  
**Version:** ${ORDERKING_PARTNER_AGREEMENT_METADATA.version}  

---

### PARTIES TO THE AGREEMENT
1. **THE PLATFORM / AGGREGATOR:**  
   **${ORDERKING_PARTNER_AGREEMENT_METADATA.companyName}**  
   CIN: ${ORDERKING_PARTNER_AGREEMENT_METADATA.cin}  
   Registered Office: New Delhi, India  

2. **THE INDEPENDENT DELIVERY PARTNER:**  
   **Legal Name:** ${name}  
   **Registered Mobile:** ${phone}  
   **Permanent Account Number (PAN):** ${pan}  
   **Aadhaar (Masked):** ${aadhaar}  
   **Status:** Independent Gig & Platform Worker (Principal-to-Principal)  

---

### PREAMBLE
${ORDERKING_PREAMBLE_TEXT}

---
`;

  ORDERKING_PARTNER_AGREEMENT_SECTIONS.forEach((sec) => {
    md += `\n### SECTION ${sec.sectionNumber}: ${sec.title.toUpperCase()}
*Statutory Authority: ${sec.statutoryBasis}*

${sec.fullLegalText}

**Key Operational Highlights:**
${sec.keyHighlights.map((k) => `- ${k}`).join("\n")}

---
`;
  });

  md += `\n### DIGITAL EXECUTION CERTIFICATE & STATUTORY SIGN-OFF
Pursuant to Section 10A of the Information Technology Act, 2000, this document is an electronically formed and attested legal record.

- **Partner Assent:** Confirmed by electronic checkbox assent & OTP identity verification
- **Statutory Social Security Fund Allocation:** Registered at ${ORDERKING_PARTNER_AGREEMENT_METADATA.welfareFundRate}
- **Group Accidental Insurance Status:** Active coverage at ${ORDERKING_PARTNER_AGREEMENT_METADATA.accidentalDeathCover} Accidental Death & ${ORDERKING_PARTNER_AGREEMENT_METADATA.hospitalizationCover} Hospitalization
- **Statutory Fleet Compliance Approval:** Enforced via verified regulatory and fleet audit engine
`;

  return md;
}
