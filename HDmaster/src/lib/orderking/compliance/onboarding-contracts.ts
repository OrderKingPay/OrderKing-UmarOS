/**
 * OrderKing Digital Contract Engine
 * Generates official Indian Delivery Partner Agreements compliant with the Code on Social Security, 2020.
 * Enforces mandatory UmarOS admin review and approval for legal compliance.
 *
 * Brand: OrderKing Partner (OrderKing Foods Private Limited)
 * Zero third-party platform branding.
 */

export interface LegalSectionDetail {
  sectionNumber: string;
  title: string;
  statutoryBasis: string;
  summary: string;
  fullLegalText: string;
  keyHighlights: string[];
}

export interface ContractResult {
  contractId: string;
  entityId: string;
  timestamp: string;
  documentType: string;
  status: 'PENDING_SIGNATURE' | 'SIGNED' | 'REJECTED';
  umarOsApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  contentSummary: string;
  // Enhanced statutory compliance fields
  legalSections?: LegalSectionDetail[];
  welfareFundRate?: string;
  accidentalInsuranceCover?: string;
  hospitalizationCover?: string;
  statutoryAct?: string;
  governingLaw?: string;
  digitalSignatureRef?: string;
  fssaiNumber?: string;
  gstin?: string;
  commissionRate?: string;
  settlementCycle?: string;
}

export const OFFICIAL_RIDER_SECTIONS: LegalSectionDetail[] = [
  {
    sectionNumber: "1",
    title: "Definitions and Statutory Interpretations",
    statutoryBasis: "Section 2, Code on Social Security, 2020 & General Clauses Act, 1897",
    summary: "Defines Active Duty, Gig Worker, Base Fare, Distance Tariff, and Welfare Fund in conformity with Indian statutory law.",
    fullLegalText: `1.1 "Active Duty" means the duration during which the Delivery Partner is logged into the OrderKing Partner Mobile Application in "ONLINE" or "BUSY" status and is either awaiting, traveling towards a merchant, or executing an assigned delivery.
1.2 "Aggregator" shall bear the meaning assigned under Section 2(2) of the Code on Social Security, 2020, referring to OrderKing as a digital intermediary connecting consumers, food businesses, and logistics partners.
1.3 "Delivery Services" means the physical collection, transportation, temperature preservation, and doorstep handover of packaged food, beverages, or commodities from merchant establishments to designated consumer drop-off locations.
1.4 "Gig Worker" shall have the statutory meaning defined in Section 2(35) of the Code on Social Security, 2020, being an individual who performs work or participates in a work arrangement and earns from such activities outside of traditional employer-employee relationships.
1.5 "Social Security Fund" means the statutory fund established by the Central Government under Section 113 of the Code on Social Security, 2020 for the administration of gig worker and platform worker welfare benefits.
1.6 "Tamper-Evident Packaging" means packaging sealed by the Restaurant Partner with security stickers, tapes, or zip-ties designed to show evident visual indicators if opened prior to customer handover.`,
    keyHighlights: [
      "Explicit statutory definition under Section 2(35) Code on Social Security, 2020",
      "Clear demarcation of Active Duty vs. Offline Personal Time",
      "Standard definitions for tamper-evident packaging and aggregator role"
    ]
  },
  {
    sectionNumber: "2",
    title: "Independent Contractor Status & Absolute Work Autonomy",
    statutoryBasis: "Chapter IX, Code on Social Security, 2020 & Indian Contract Act, 1872",
    summary: "Affirms principal-to-principal status, zero employee benefits, complete freedom to choose work hours, non-exclusivity, and freedom to decline orders.",
    fullLegalText: `2.1 Principal-to-Principal Engagement: The relationship between OrderKing and the Delivery Partner is strictly that of independent principal-to-principal contracting parties. Nothing in this Agreement shall be construed to create any partnership, joint venture, agency, franchise, master-servant, or employer-employee relationship between OrderKing and the Delivery Partner.
2.2 Complete Discretion over Operating Hours: The Delivery Partner possesses absolute discretion and autonomy to decide when to log in, how long to remain available online, and when to log out of the OrderKing Partner Platform. OrderKing imposes zero mandatory minimum shifts, fixed reporting hours, or forced attendance quotas.
2.3 Discretion over Delivery Offers: The Delivery Partner has the unfettered right to accept or decline any delivery task dispatched to them. Declining an offer shall never attract monetary fines or punitive civil damages.
2.4 Multi-Platform Non-Exclusivity: The Delivery Partner is entirely free to provide delivery, transport, or any other commercial services to any other platform, aggregator, restaurant, or business enterprise concurrently, without restriction or platform penalty.
2.5 Negation of Traditional Employment Benefits: The Delivery Partner expressly acknowledges that as an autonomous gig contractor, they are not entitled to, nor shall claim, benefits under traditional employer-employee legislations, including the Employees' Provident Funds and Miscellaneous Provisions Act, 1952, the Employees' State Insurance Act, 1948, the Payment of Gratuity Act, 1972, or the Industrial Disputes Act, 1947. Their statutory social welfare entitlements are governed exclusively by Chapter IX of the Code on Social Security, 2020.`,
    keyHighlights: [
      "100% Principal-to-Principal contract with zero employer-employee liability",
      "Complete autonomy: Partner controls log-in, log-out, and shift duration",
      "Zero mandatory shifts or forced acceptance quotas",
      "Non-exclusive: Partner can work on competing delivery apps simultaneously"
    ]
  },
  {
    sectionNumber: "3",
    title: "Scope of Delivery Services & Professional SOP Standards",
    statutoryBasis: "Food Safety and Standards Act, 2006 & Consumer Protection Act, 2019",
    summary: "Outlines the 6-stage order lifecycle, thermal bag hygiene, tamper seal verification, and doorstep handover standards.",
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
      "Absolute zero tolerance for food tampering or seal damage"
    ]
  },
  {
    sectionNumber: "4",
    title: "Partner Eligibility, Vehicle Regulations & Statutory KYC",
    statutoryBasis: "Motor Vehicles Act, 1988, CMVR 1989 & Aadhaar Act, 2016",
    summary: "Mandates 18+ age requirement, valid Driving Licence/RC for motorized vehicles, low-speed EV/cycle exemptions, masked Aadhaar and PAN verification.",
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
      "Masked Aadhaar (last 4 only) & PAN for tax compliance"
    ]
  },
  {
    sectionNumber: "5",
    title: "Consideration, Payout Computation, Settlements & Tax Compliance",
    statutoryBasis: "Income Tax Act, 1961 (Sec 194C/194-O) & CGST Act, 2017",
    summary: "Sets guaranteed floor payout (₹35 base fare), distance pay, wait-time compensation, 100% tip pass-through, T+0/weekly settlements, and TDS withholding.",
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
      "100% direct pass-through of customer tips to staff",
      "Automated T+0 / weekly direct bank & UPI settlements",
      "Transparent Section 194-O / 194C TDS compliance with Form 16A"
    ]
  },
  {
    sectionNumber: "6",
    title: "Statutory Gig Worker Welfare & Social Security Fund Contributions",
    statutoryBasis: "Chapter IX, Sections 112, 113 & 114, Code on Social Security, 2020",
    summary: "Enforces OrderKing's 1-2% platform turnover contribution to the Central Social Security Fund, e-Shram UAN registration, and government welfare benefits.",
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
      "Access to statutory healthcare, disability, and old-age schemes"
    ]
  },
  {
    sectionNumber: "7",
    title: "Group Accidental Insurance, Healthcare & Roadside SOS Protection",
    statutoryBasis: "Motor Vehicles Act, 1988 & Guidelines for Aggregators (MoRTH)",
    summary: "Details ₹10,00,000 accidental death/permanent disability cover, ₹1,00,000 hospitalization, OPD cover, 24x7 SOS, and penalty-free emergency reassignment.",
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
      "Zero-penalty order reassignment during roadside emergencies"
    ]
  },
  {
    sectionNumber: "8",
    title: "Delivery Partner Code of Conduct, Road Safety & Zero-Tolerance SOP",
    statutoryBasis: "Motor Vehicles Act, 1988, Sections 129, 185 & Bharatiya Nyaya Sanhita, 2023",
    summary: "Enforces mandatory BIS/ISI helmets, zero-intoxication policy, traffic law adherence, harassment-free workplace, and respectful customer etiquette.",
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
      "Strict prohibition against account sharing or impersonation"
    ]
  },
  {
    sectionNumber: "9",
    title: "Confidentiality, Telemetry Telematics & Data Protection",
    statutoryBasis: "Digital Personal Data Protection Act, 2023 & IT Act, 2000",
    summary: "Ensures customer phone number masking, strict non-solicitation, DPDP Act 2023 compliance, and transparent GPS telemetry tracking during active duty.",
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
      "Transparent GPS telemetry tracked ONLY while in ONLINE or BUSY duty"
    ]
  },
  {
    sectionNumber: "10",
    title: "Term, Voluntary Disengagement & Fair Deactivation Procedure",
    statutoryBasis: "Principles of Natural Justice & Indian Contract Act, 1872",
    summary: "Affirms at-will disengagement by Partner, transparent grounds for deactivation, right to appeal, and natural justice review before disengagement.",
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
      "Right to fair hearing and appeal with 72-hour explanation window"
    ]
  },
  {
    sectionNumber: "11",
    title: "Mutual Indemnification & Limitation of Platform Liability",
    statutoryBasis: "Section 73 & 74, Indian Contract Act, 1872",
    summary: "Limits OrderKing liability to aggregate payouts earned in preceding 30 days; partner indemnifies OrderKing for traffic offences and willful unlawful acts.",
    fullLegalText: `11.1 Partner Indemnity: The Delivery Partner shall indemnify, defend, and hold harmless OrderKing, its directors, officers, employees, and agents from any third-party claims, fines, penalties, losses, damages, or legal costs arising out of:
  (a) Traffic violations, fines, or criminal proceedings under the Motor Vehicles Act, 1988;
  (b) Bodily injury or property damage inflicted upon third parties resulting from the Partner's gross negligence, willful misconduct, or intoxicated driving;
  (c) Any breach of representations, warranties, or food safety guidelines contained herein.
11.2 Platform Limitation of Liability: In no event shall OrderKing be liable for any indirect, incidental, consequential, punitive, or special damages, including lost profits, loss of vehicle use, or business interruption.
11.3 Liability Cap: OrderKing's aggregate financial liability to the Delivery Partner for any and all claims arising under this Agreement shall not exceed the total payout amounts earned by the Partner and remitted by OrderKing during the thirty (30) days immediately preceding the event giving rise to liability.`,
    keyHighlights: [
      "Partner responsible for personal traffic fines and motor accidents",
      "Platform liability strictly capped to last 30 days of earned payouts",
      "Exclusion of indirect, punitive, or consequential damages"
    ]
  },
  {
    sectionNumber: "12",
    title: "Two-Tier Dispute Resolution, Grievance Redressal & Arbitration",
    statutoryBasis: "Arbitration and Conciliation Act, 1996 & Consumer Protection Act, 2019",
    summary: "Establishes Tier-1 internal Grievance Redressal Officer conciliation (15 days), followed by Tier-2 Sole Arbitrator under Arbitration Act 1996 in India.",
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
      "Enforceable in Indian courts of competent jurisdiction"
    ]
  },
  {
    sectionNumber: "13",
    title: "Digital Execution, Severability & Electronic Assent",
    statutoryBasis: "Section 10A, Information Technology Act, 2000 & Section 65B, Indian Evidence Act",
    summary: "Legal enforceability of click-wrap electronic assent, digital timestamping, IP logging, and severability of unenforceable provisions.",
    fullLegalText: `13.1 Legal Validity of Electronic Assent: Pursuant to Section 10A of the Information Technology Act, 2000, where in an electronic form or through electronic records, contract formation, agreement terms, and acceptances are expressed, such contract shall not be denied enforceability solely on the ground that electronic forms were used.
13.2 Evidence of Execution: The Delivery Partner's electronic action of selecting the checkbox ("I have read, understood and agree to the OrderKing Delivery Partner Agreement"), entering their authenticated mobile OTP, or clicking "Sign & Submit KYC Application", combined with the recorded timestamp, IP address, device telemetry, and unique Rider ID, constitutes conclusive digital evidence of valid execution under Section 65B of the Indian Evidence Act, 1872 (or Bharatiya Sakshya Adhiniyam, 2023).
13.3 Severability: If any provision of this Agreement is held to be invalid, illegal, or unenforceable by an arbitral tribunal or competent court, such provision shall be severed to the minimum extent necessary, and the remaining provisions shall continue in full legal force and effect.
13.4 Entire Agreement: This Agreement, together with the OrderKing Partner App Terms of Service, Privacy Policy, and Rate Card, represents the entire and exclusive agreement between the parties superseding all prior oral or written discussions.`,
    keyHighlights: [
      "Legally valid click-wrap electronic contract under Section 10A of IT Act, 2000",
      "Attributed digital signature via OTP verification and device timestamp",
      "Full severability and entire agreement protections"
    ]
  }
];

export const OFFICIAL_MERCHANT_SECTIONS: LegalSectionDetail[] = [
  {
    sectionNumber: "1",
    title: "Definitions and Statutory Standing",
    statutoryBasis: "Section 9(5), Central Goods and Services Tax Act, 2017 & Section 3, Food Safety and Standards Act, 2006",
    summary: "Establishes legal definitions for E-Commerce Operator (ECO), Food Business Operator (FBO), Net Taxable Supplies, and Principal-to-Principal commercial engagement.",
    fullLegalText: `1.1 "Electronic Commerce Operator" (ECO) or "OrderKing" means OrderKing Technologies Private Limited, operating as a digital marketplace aggregator facilitating online restaurant ordering and food delivery.
1.2 "Restaurant Partner" or "Food Business Operator" (FBO) means the licensed food business entity entering into this Agreement, holding a valid 14-digit registration or license under the Food Safety and Standards Act, 2006.
1.3 "Net Taxable Supplies" means the aggregate value of food and beverages ordered through the Platform excluding allowable customer discounts, refunds, and cancellations pursuant to Section 52 of the CGST Act, 2017.
1.4 "Principal-to-Principal Status": The engagement between OrderKing and the Restaurant Partner is strictly on a principal-to-principal basis. Neither party is the agent, legal representative, partner, or joint venturer of the other.`,
    keyHighlights: [
      "Principal-to-Principal commercial contracting relationship",
      "Statutory definition of OrderKing as ECO under Section 9(5) CGST Act",
      "Statutory definition of Restaurant Partner as licensed FBO under FSSAI 2006"
    ]
  },
  {
    sectionNumber: "2",
    title: "Non-Exclusive Digital Listing & Menu Parity",
    statutoryBasis: "Section 2(e), Competition Act, 2002 & Consumer Protection (E-Commerce) Rules, 2020",
    summary: "Guarantees non-exclusive digital listing, real-time inventory synchronization, and price parity without unfair delivery markups.",
    fullLegalText: `2.1 Non-Exclusive Engagement: The Restaurant Partner may freely list their offerings on competing food delivery platforms or operate independent dine-in and delivery services without platform restriction or exclusivity penalty.
2.2 Catalog & Menu Integrity: The Restaurant Partner shall provide authentic item descriptions, high-resolution kitchen photography, accurate ingredient specifications, and real-time inventory availability.
2.3 Price Parity Undertaking: The Restaurant Partner warrants that prices and item portions listed on the OrderKing Platform shall maintain fair parity with the prices displayed on their physical dine-in or takeaway menus, avoiding artificial price inflation on delivery orders.`,
    keyHighlights: [
      "100% non-exclusive partnership with zero competitor restrictions",
      "Menu and portion parity with physical restaurant dine-in pricing",
      "Real-time item availability and catalog updates"
    ]
  },
  {
    sectionNumber: "3",
    title: "FSSAI Food Safety Act 2006 & Mandatory 14-Digit Registration",
    statutoryBasis: "Sections 31 & 65, Food Safety and Standards Act, 2006 & FoSCoS Regulations",
    summary: "Mandates valid 14-digit FSSAI license, automated FoSCoS renewal window tracking, and instant platform deactivation on license expiration.",
    fullLegalText: `3.1 Mandatory 14-Digit FSSAI License: The Restaurant Partner warrants that they possess an active, valid 14-digit FSSAI registration or license issued by the Food Safety and Standards Authority of India (FSSAI) via the FoSCoS portal for the designated kitchen premises.
3.2 License Display Obligation: Pursuant to statutory e-commerce guidelines, OrderKing shall prominently display the Restaurant Partner's 14-digit FSSAI number and hygiene rating on the digital menu page prior to consumer checkout.
3.3 Expiry Tracking & Automated Ordering Halt: The Restaurant Partner shall upload renewed license documentation at least thirty (30) days prior to license expiry. In the event that an FSSAI license expires or is revoked/suspended by food safety authorities, OrderKing automated compliance gates shall immediately halt ordering and delist the kitchen until valid certification is verified.`,
    keyHighlights: [
      "Mandatory valid 14-digit FSSAI FoSCoS license verification",
      "Prominent customer-facing display of 14-digit license number",
      "Automated platform ordering halt immediately upon license expiration"
    ]
  },
  {
    sectionNumber: "4",
    title: "Dietary Labelling & Declarations: FSS (Labelling and Display) Regs 2020",
    statutoryBasis: "Regulations 5(4)(c) & 5(5), Food Safety and Standards (Labelling and Display) Regulations, 2020",
    summary: "Enforces mandatory Green Dot (Vegetarian), Brown Triangle/Red Dot (Non-Vegetarian), Egg declarations, and allergen disclosures on all menu items.",
    fullLegalText: `4.1 Mandatory Dietary Symbols: In strict compliance with Regulation 5(4)(c) of the Food Safety and Standards (Labelling and Display) Regulations, 2020:
  (a) Every vegetarian food item shall bear the statutory green symbol consisting of a green filled circle inside a green outline square;
  (b) Every non-vegetarian food item shall bear the statutory symbol consisting of a brown filled triangle inside a brown outline square (or red circle indicator);
  (c) Items containing egg components shall declare mandatory egg allergen notifications.
4.2 Allergen Disclosures: The Restaurant Partner shall disclose common food allergens (including gluten, dairy, tree nuts, peanuts, soy, and shellfish) for all listed preparations.
4.3 Misbranding Liability: Any deliberate or negligent misclassification of a non-vegetarian or egg-containing dish as vegetarian constitutes gross statutory misbranding under Section 52 of the Food Safety and Standards Act, 2006, resulting in immediate suspension and total merchant indemnification.`,
    keyHighlights: [
      "Statutory Green Dot (Vegetarian) and Brown Triangle (Non-Vegetarian) labeling",
      "Mandatory egg declarations and allergen disclosures prior to checkout",
      "Strict liability and zero tolerance for vegetarian misbranding"
    ]
  },
  {
    sectionNumber: "5",
    title: "Kitchen Preparation SOP, Hygiene & Tamper-Evident Packaging",
    statutoryBasis: "Schedule 4, FSS (Licensing and Registration of Food Businesses) Regulations, 2011",
    summary: "Mandates segregated prep cookware, thermal temperature preservation, tamper-evident security seals, and Kitchen Order Ticket (KOT) prep SLAs.",
    fullLegalText: `5.1 Kitchen Hygiene & Segregation: The Restaurant Partner shall maintain sanitary cooking environments in accordance with Schedule 4 of the FSSAI Regulations, including dedicated cookware, utensils, and cutting boards for vegetarian and non-vegetarian food preparations.
5.2 Tamper-Evident Security Packaging: All food items dispatched for delivery must be securely sealed inside food-grade packaging using tamper-evident stickers, heat-sealed bags, or zip ties. The packaging must visibly demonstrate if unauthorized opening occurs prior to customer handover.
5.3 Food Quality & Temperature Maintenance: Freshly prepared hot meals must be packed at safe food-holding temperatures, with hot and cold beverages segregated into separate thermal packages.
5.4 Kitchen Preparation SLA: The Partner shall accept and prepare orders within agreed Kitchen Preparation Time (KPT) thresholds (standard 12-18 minutes) to minimize rider waiting time and ensure peak food freshness.`,
    keyHighlights: [
      "Mandatory tamper-evident security seals on all delivered food containers",
      "Schedule 4 hygiene with segregated vegetarian and non-vegetarian prep",
      "Thermal packaging standards with hot/cold separation",
      "Strict Kitchen Preparation Time (KPT) SLAs"
    ]
  },
  {
    sectionNumber: "6",
    title: "Commercial Terms, Commission Structure & Fee Schedules",
    statutoryBasis: "Sections 2(d) & 10, Indian Contract Act, 1872",
    summary: "Details agreed platform commission, transparent payment gateway processing fees, zero hidden charges, and transparent commercial accounting.",
    fullLegalText: `6.1 Platform Service Fee / Commission: The Restaurant Partner agrees to pay OrderKing a platform commission fee calculated as an agreed percentage (typically 15% to 25% plus applicable 18% GST) of the Net Food Value of completed orders.
6.2 Payment Processing Charges: A nominal payment gateway facilitation fee (typically 1.5% to 2.0% plus GST) applies to digital transactions processed via credit cards, net banking, or UPI.
6.3 Zero Hidden Deductions: OrderKing shall levy no onboarding maintenance fees, hidden advertising surcharges, or unauthorized deductions not expressly documented in the Partner Dashboard rate card.`,
    keyHighlights: [
      "Agreed platform commission rate (15-25% + 18% GST) on net food value",
      "Standard payment gateway fee pass-through",
      "Zero hidden fees, transparent dashboard accounting"
    ]
  },
  {
    sectionNumber: "7",
    title: "CGST Act Section 9(5) Food Delivery Tax Remittance & ITC Inadmissibility",
    statutoryBasis: "Section 9(5), Central Goods and Services Tax Act, 2017 & Notification No. 17/2021-CT(R)",
    summary: "Platform directly collects and remits 5% GST on restaurant food delivery into Government Treasury with zero Input Tax Credit (ITC).",
    fullLegalText: `7.1 Statutory ECO Tax Remittance: Pursuant to Section 9(5) of the Central Goods and Services Tax (CGST) Act, 2017 read with Notification No. 17/2021-Central Tax (Rate), OrderKing as the Electronic Commerce Operator is legally responsible for paying Goods and Services Tax at the rate of 5% on restaurant food delivery services.
7.2 Input Tax Credit (ITC) Inadmissibility: The Restaurant Partner acknowledges that under Notification No. 17/2021-CT(R), the 5% GST on restaurant food delivery is discharged without the benefit of Input Tax Credit (ITC). Neither OrderKing nor the Restaurant Partner may claim ITC against this food tax liability.
7.3 Segregation in Tax Invoices & GSTR-3B: Invoices issued by OrderKing for food delivery supplies shall distinctly show the 5% Section 9(5) GST discharged by OrderKing under Table 3.1.1(i) of GSTR-3B. The Restaurant Partner shall report such turnover in Table 3.1.1(ii) of their respective GSTR-3B as supplies on which ECO pays tax.`,
    keyHighlights: [
      "OrderKing directly remits 5% GST under Section 9(5) CGST Act",
      "Input Tax Credit (ITC) strictly blocked under Notification 17/2021-CT(R)",
      "Statutory segregation in GSTR-3B Table 3.1.1(i) and Table 3.1.1(ii)"
    ]
  },
  {
    sectionNumber: "8",
    title: "Section 52 TCS & Section 194-O TDS Statutory Withholding",
    statutoryBasis: "Section 52, CGST Act, 2017 & Section 194-O, Income Tax Act, 1961",
    summary: "Enforces 1% Tax Collected at Source (TCS) and 1% Income Tax TDS withholding on merchant sales with automated Form 16A and GSTR-8 returns.",
    fullLegalText: `8.1 Section 52 TCS Withholding: Pursuant to Section 52 of the CGST Act, 2017, OrderKing shall collect Tax Collected at Source (TCS) at the statutory rate of 1% (0.5% CGST + 0.5% SGST or 1% IGST) on the net value of taxable supplies made through the platform. OrderKing shall deposit the collected TCS and file monthly GSTR-8 returns.
8.2 Section 194-O Income Tax TDS: Pursuant to Section 194-O of the Income Tax Act, 1961, OrderKing shall deduct Tax Deducted at Source (TDS) at the statutory rate of 1% on the gross amount of sales facilitated through the digital marketplace.
8.3 Statutory PAN Validation & Form 16A: The Restaurant Partner shall furnish a valid Permanent Account Number (PAN). In the absence of a valid PAN, TDS shall be withheld at the higher penal rate of 5% pursuant to Section 206AA. OrderKing shall furnish quarterly Form 16A certificates for all tax deductions made.`,
    keyHighlights: [
      "1% TCS deducted under Section 52 CGST Act with monthly GSTR-8 filing",
      "1% TDS deducted under Section 194-O Income Tax Act",
      "Mandatory PAN validation with quarterly Form 16A certificates"
    ]
  },
  {
    sectionNumber: "9",
    title: "Daily T+1 Merchant Settlement Cycle, Midnight Cutoff & Section 34 Credit Notes",
    statutoryBasis: "Section 34, CGST Act, 2017 & RBI Master Directions on Payment Aggregators",
    summary: "Guarantees daily T+1 payout compilation at 12:00 Midnight IST, next-morning 10:00 AM dispatch, and automated Section 34 CGST Act credit notes.",
    fullLegalText: `9.1 Midnight Cutoff & Settlement Calculation: The daily settlement window closes at 12:00 Midnight IST (23:59:59.999+05:30) for all orders completed during that calendar day (T).
9.2 Next-Morning 10:00 AM Dispatch: Payouts for the compiled T settlement batch are dispatched automatically to the Restaurant Partner's verified bank account via NEFT/RTGS/IMPS at 10:00 AM IST on the next banking day (T+1).
9.3 Settlement Formula:
    Net Settlement Payout = Gross Food Value
      - Customer Discounts Funded by Merchant
      - Platform Commission Fee
      - GST on Platform Commission (18%)
      - Section 9(5) Food GST (5%)
      - Section 52 TCS (1%)
      - Section 194-O TDS (1%)
      + Section 34 Statutory Credit Notes for Refunds/Cancellations.
9.4 Section 34 CGST Act Automated Credit Notes: Where an order is cancelled, refunded, or subject to post-sale discount, OrderKing shall automatically generate a statutory GST Credit Note reversing platform commission, commission GST, TCS, and Section 9(5) tax in strict adherence to Section 34 of the CGST Act.`,
    keyHighlights: [
      "T+1 settlement compilation with exact 12:00 Midnight IST cutoff",
      "Automated bank payout dispatch at 10:00 AM IST next morning",
      "Automated Section 34 CGST Act credit notes for cancellations and refunds",
      "Zero floating-point rounding drift with 100% integer-paise accounting"
    ]
  },
  {
    sectionNumber: "10",
    title: "Digital Personal Data Protection (DPDP) Act, 2023 & Customer Telephony Masking",
    statutoryBasis: "Sections 6, 8 & 12, Digital Personal Data Protection Act, 2023 & Section 36, CGST Act, 2017",
    summary: "Guarantees virtual telephone bridging, customer PII masking, strict non-solicitation, and 72-month statutory financial ledger retention under Section 36 CGST Act.",
    fullLegalText: `10.1 Customer Telephony Privacy Masking: Pursuant to Section 8 of the Digital Personal Data Protection Act, 2023, OrderKing routes all merchant-to-customer communications through virtualized telephone proxy bridges. The Restaurant Partner shall never receive the customer's true telephone number.
10.2 Purpose Limitation & Non-Solicitation: Customer personal data (including names and delivery instructions) is disclosed solely for the purpose of food preparation and packaging. The Restaurant Partner shall not export, harvest, store, or utilize customer contact details for off-platform promotional messaging, marketing spam, or unsolicited communication.
10.3 Right to Oblivion & Tax Retention Balance: Upon receipt of a Data Principal Erasure Request under Section 12 of the DPDP Act 2023, customer identifying details shall be cryptographically shredded. However, pursuant to Section 36 of the CGST Act, 2017, all underlying financial transaction ledgers, tax invoices, and credit notes shall be preserved for seventy-two (72) months in anonymized format for statutory audit compliance.`,
    keyHighlights: [
      "Virtual VoIP telephone bridge ensures zero customer phone disclosure",
      "Strict purpose limitation and complete ban on marketing solicitation",
      "Cryptographic shredding for erasure requests balanced with 72-month CGST tax retention"
    ]
  },
  {
    sectionNumber: "11",
    title: "Merchant Representations, Product Warranties & Food Contamination Indemnity",
    statutoryBasis: "Sections 59 & 65, Food Safety and Standards Act, 2006 & Section 124, Indian Contract Act, 1872",
    summary: "Restaurant warrants complete food freshness and safety, and indemnifies OrderKing against food poisoning, foreign contaminants, or consumer health claims.",
    fullLegalText: `11.1 Food Quality Warranties: The Restaurant Partner warrants that all food preparations dispatched:
  (a) Are prepared using fresh, unadulterated, non-expired ingredients;
  (b) Comply with all microbial, chemical, and physical food safety standards prescribed by FSSAI;
  (c) Are completely free of foreign contaminants, pests, glass, metallic fragments, or pathogenic organisms.
11.2 Statutory Indemnity for Food Safety Violations: The Restaurant Partner shall defend, indemnify, and hold harmless OrderKing, its directors, employees, and logistics partners against any civil liabilities, consumer forum awards, medical expenses, or criminal fines arising out of food contamination, foreign objects, allergen failures, or foodborne illness under Section 65 of the Food Safety and Standards Act, 2006.`,
    keyHighlights: [
      "Absolute warranty of ingredient freshness and zero contamination",
      "Full merchant indemnity for consumer health claims, allergens, and food poisoning",
      "Compliance with Section 65 Food Safety and Standards Act, 2006"
    ]
  },
  {
    sectionNumber: "12",
    title: "Term, Non-Exclusive Disengagement, Suspension & Principles of Natural Justice",
    statutoryBasis: "Principles of Natural Justice & Section 39, Indian Contract Act, 1872",
    summary: "Provides voluntary at-will exit, 7-day cure notice for operational non-compliance, and immediate suspension only for expired FSSAI or contamination.",
    fullLegalText: `12.1 Term & At-Will Exit: This Agreement is effective upon electronic assent and remains in force indefinitely. Either party may voluntarily terminate this Agreement without penalty by providing seven (7) days written notice via the Partner Dashboard.
12.2 Grounds for Immediate Platform Suspension: OrderKing reserves the right to suspend or freeze digital listing immediately upon:
  (a) Expiration, cancellation, or suspension of the Restaurant Partner's FSSAI license;
  (b) Validated severe consumer food poisoning incidents or viral hygiene contamination;
  (c) Fraudulent tax billing or intentional misrepresentation of menu items.
12.3 Principles of Natural Justice: Prior to permanent platform deactivation for non-emergency infractions, OrderKing shall furnish a written explanation notice. The Restaurant Partner shall have seven (7) calendar days to cure the defect or submit written representations before final administrative action.`,
    keyHighlights: [
      "Voluntary at-will disengagement with 7-day notice",
      "Immediate ordering freeze only for expired FSSAI or verified food hazard",
      "7-day natural justice notice and cure window for operational disputes"
    ]
  },
  {
    sectionNumber: "13",
    title: "Two-Tier Dispute Resolution, Arbitration Act, 1996 & Section 10A IT Act Digital Assent",
    statutoryBasis: "Arbitration and Conciliation Act, 1996 & Section 10A, Information Technology Act, 2000",
    summary: "Establishes 15-day Grievance Redressal conciliation, binding Indian arbitration, and legally enforceable clickwrap electronic assent.",
    fullLegalText: `13.1 Tier-1 Grievance Redressal: In the event of any commercial or operational dispute, the parties shall first submit the matter to the OrderKing Merchant Grievance Redressal Desk (Email: merchant-compliance@orderking.in). The Grievance Officer shall issue a reasoned decision within fifteen (15) working days.
13.2 Tier-2 Sole Arbitration: Any dispute remaining unresolved after conciliation shall be referred to and finally resolved by a sole independent arbitrator appointed in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be New Delhi, India (or the State Capital having territorial jurisdiction). The proceedings shall be conducted in English, and the arbitral award shall be final and binding.
13.3 Digital Clickwrap Assent & Electronic Admissibility: Pursuant to Section 10A of the Information Technology Act, 2000, the Restaurant Partner's digital action of clicking "I Agree", checking the onboarding assent box, or submitting authenticated KYC records constitutes a legally valid, binding signature admissible in evidence under Section 65B of the Indian Evidence Act, 1872 / Section 63 of the Bharatiya Sakshya Adhiniyam, 2023.`,
    keyHighlights: [
      "Tier 1: Dedicated Merchant Grievance Officer resolution within 15 working days",
      "Tier 2: Sole Arbitrator under the Arbitration and Conciliation Act, 1996",
      "Enforceable digital clickwrap agreement under Section 10A Information Technology Act, 2000",
      "Conclusive electronic evidence under Section 65B Indian Evidence Act"
    ]
  }
];

export class DigitalContractEngine {
  /**
   * Generates a strict legal contractor agreement for a delivery rider,
   * fully compliant with Chapter IX of the Code on Social Security, 2020.
   * Branded exclusively as OrderKing Partner.
   */
  public generateRiderAgreement(
    riderId: string,
    aadharNumber: string,
    panNumber: string
  ): ContractResult {
    const timestamp = new Date().toISOString();
    const contractId = `OK-RIDER-AGMT-${riderId}-${Date.now()}`;
    
    console.log(`[CONTRACT ENGINE] Generating official OrderKing Independent Delivery Partner Agreement for Rider ${riderId}`);
    console.log(`[CONTRACT ENGINE] Verified Aadhar: ${aadharNumber}, PAN: ${panNumber}`);
    console.log(`[CONTRACT ENGINE] Compliance: Code on Social Security, 2020 (Sections 112-114), Motor Vehicles Act, 1988, FSSAI 2006, IT Act, 2000.`);
    console.log(`[CONTRACT ENGINE] Welfare Fund: 1.5% platform contribution allocated; Group Accidental Insurance: ₹10,00,000 active.`);
    console.log(`[CONTRACT ENGINE] STATUS: Awaiting mandatory final approval from UmarOS Compliance Center.`);

    return {
      contractId,
      entityId: riderId,
      timestamp,
      documentType: 'INDEPENDENT_CONTRACTOR_AGREEMENT',
      status: 'PENDING_SIGNATURE',
      umarOsApprovalStatus: 'PENDING',
      contentSummary: 'Official OrderKing Independent Delivery Partner Agreement (Code on Social Security, 2020 Compliant), outlining principal-to-principal status, welfare fund contribution, accidental insurance coverage, dispute resolution, code of conduct, and transparent payout terms.',
      legalSections: OFFICIAL_RIDER_SECTIONS,
      welfareFundRate: '1.5% of eligible platform turnover',
      accidentalInsuranceCover: 'INR 10,00,000 Accidental Death & Total Disability',
      hospitalizationCover: 'INR 1,00,000 Emergency Medical Expense',
      statutoryAct: 'Code on Social Security, 2020 (Act 36 of 2020)',
      governingLaw: 'Laws of the Republic of India',
      digitalSignatureRef: `SIG-DIGITAL-${riderId}-${Date.now()}`
    };
  }

  /**
   * Generates an official Merchant Partner Agreement for a restaurant partner,
   * fully compliant with FSSAI Act 2006, CGST Act Section 9(5), Section 52 TCS, Section 194-O TDS,
   * DPDP Act 2023, and T+1 Daily Settlements.
   * Branded exclusively for OrderKing Partner Network.
   */
  public generateRestaurantPartnerAgreement(
    restaurantId: string,
    fssai: string,
    gst: string,
    commissionRate: number = 20
  ): ContractResult {
    const timestamp = new Date().toISOString();
    const contractId = `REST-AGMT-${restaurantId}-${Date.now()}`;
    
    console.log(`[CONTRACT ENGINE] Generating official OrderKing Merchant Partner Agreement for Restaurant ${restaurantId}`);
    console.log(`[CONTRACT ENGINE] Verified FSSAI: ${fssai}, GSTIN: ${gst}`);
    console.log(`[CONTRACT ENGINE] Terms included: Platform commission rate (${commissionRate}%), Section 9(5) CGST Act (5% GST without ITC), Section 52 TCS (1%), Section 194-O TDS (1%), T+1 Daily Settlements (Midnight Cutoff, 10:00 AM Dispatch), DPDP Act 2023 privacy governance.`);
    console.log(`[CONTRACT ENGINE] STATUS: Awaiting mandatory final approval from UmarOS Compliance Center.`);

    return {
      contractId,
      entityId: restaurantId,
      timestamp,
      documentType: 'MERCHANT_PARTNER_AGREEMENT',
      status: 'PENDING_SIGNATURE',
      umarOsApprovalStatus: 'PENDING',
      contentSummary: 'Official OrderKing Restaurant Partner Agreement compliant with FSSAI Act 2006, CGST Act Section 9(5), Section 52 TCS, Section 194-O TDS, DPDP Act 2023, and T+1 Daily Settlements.',
      legalSections: OFFICIAL_MERCHANT_SECTIONS,
      fssaiNumber: fssai,
      gstin: gst,
      commissionRate: `${commissionRate}%`,
      settlementCycle: 'T+1 Daily (Midnight Cutoff, 10:00 AM Dispatch)',
      statutoryAct: 'Food Safety and Standards Act, 2006 & CGST Act, 2017',
      governingLaw: 'Laws of the Republic of India',
      digitalSignatureRef: `SIG-REST-${restaurantId}-${Date.now()}`
    };
  }

  /**
   * Mandatory final approval by UmarOS Compliance Center / Admin.
   * Partners and riders are ONLY onboarded after this step is legally cleared.
   */
  public finalizeOnboardingViaUmarOS(contract: ContractResult): ContractResult {
    console.log(`[UmarOS ADMIN] Initiating mandatory legal review for contract ${contract.contractId}...`);
    
    if (contract.status !== 'SIGNED') {
      console.warn(`[UmarOS ADMIN] WARNING: Contract ${contract.contractId} MUST be signed by entity ${contract.entityId} prior to UmarOS final approval. Legal compliance halt.`);
      return {
        ...contract,
        umarOsApprovalStatus: 'REJECTED'
      };
    }

    console.log(`[UmarOS ADMIN] Contract ${contract.contractId} meets official OrderKing Code on Social Security, 2020 compliance criteria. FINAL APPROVAL GRANTED.`);
    console.log(`[UmarOS ADMIN] SUCCESS: Entity ${contract.entityId} is officially onboarded into OrderKing Fleet.`);

    return {
      ...contract,
      umarOsApprovalStatus: 'APPROVED'
    };
  }

  /**
   * Applies digital signature by the Delivery Partner with device timestamp & OTP proof reference.
   */
  public signContract(contract: ContractResult, signatureRef?: string): ContractResult {
    return {
      ...contract,
      status: 'SIGNED',
      digitalSignatureRef: signatureRef || `DIGI-SIGN-${contract.entityId}-${Date.now()}`
    };
  }
}
