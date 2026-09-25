import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { KingPayShell, type KingPaySection } from "@/components/fintech/kingpay-shell";
import { VehicleGarageHub } from "@/components/fintech/vehicle-garage-hub";
import { TravelBookingHub } from "@/components/fintech/travel-booking-hub";
import { MicroLoanHub } from "@/components/fintech/micro-loan-hub";
import { KingPayAccountHub } from "@/components/fintech/kingpay-account-hub";
import { useLocationStore } from "@/lib/stores/location";
import { Button } from "@/components/ui/button";
import { KingPayMark, KingPayWordmark } from "@/components/brand/kingpay-mark";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { toast } from "sonner";
import { CameraScannerModal, type ParsedUpiResult } from "@/components/scanner/camera-scanner-modal";
import { RoyalAiConcierge } from "@/components/ai/royal-ai-concierge";
import { ReceiveMoneyQrStudio } from "@/components/fintech/receive-money-qr-studio";
import { getCurrentFestiveContext } from "@/lib/brand/calendar-festive-engine";
import { EcosystemSwitchBar } from "@/components/common/ecosystem-switch-bar";
import { PaidRestaurantAdZone } from "@/components/market/paid-restaurant-ad-zone";
import { KingPayFinanceSearch } from "@/components/fintech/kingpay-finance-search";
import { isDeliveryActiveInLocation, getCityWaitlistInfo } from "@/lib/geo/geofence-guard";

export const Route = createFileRoute('/king-pay')({ component: KingPayPage, head: () => ({ meta: [{ property: 'og:title', content: '👑 King Pay - Zero Credit Score, 100% Approval. Earn 7.5% Interest.' }, { property: 'og:description', content: 'The #1 FinTech App in India. Send money, pay bills, and get instant loans.' }, { name: 'twitter:title', content: '👑 King Pay - Zero Credit Score, 100% Approval.' }, { name: 'twitter:description', content: 'The #1 FinTech App in India.' }] }) });

type UtilityService = {
  id: string;
  name: string;
  category: "recharge" | "bills" | "travel" | "gas" | "fuel";
  icon: string;
  description: string;
  badge?: string;
  affiliateUrl: string;
  cashbackText: string;
};

const UTILITY_SERVICES: UtilityService[] = [
  // Fuel & Petrol Station Alliances (HPCL, IndianOil, BPCL)
  {
    id: "hp_fuel_voucher",
    name: "HP Pay Fuel Voucher",
    category: "fuel",
    icon: "⛽",
    description: "Hindustan Petroleum (HPCL) digital fuel voucher for petrol & diesel",
    badge: "2% Cashback",
    affiliateUrl: "https://www.hindustanpetroleum.com/hppay?utm_source=orderking_affiliate",
    cashbackText: "Earn 2% King Coins + 1% fuel surcharge waiver",
  },
  {
    id: "iocl_fuel_voucher",
    name: "IndianOil ONE Fuel Voucher",
    category: "fuel",
    icon: "🛢️",
    description: "Instant QR/barcode redeemable at all IndianOil (IOCL) petrol pumps",
    badge: "Instant QR",
    affiliateUrl: "https://www.iocl.com/indianoil-one?utm_source=orderking_affiliate",
    cashbackText: "Flat 2% instant discount voucher + XTRAREWARDS",
  },
  {
    id: "bpcl_fuel_voucher",
    name: "BPCL SmartDrive Fuel",
    category: "fuel",
    icon: "⛽",
    description: "Bharat Petroleum digital fuel credits with zero transaction fee",
    badge: "Zero Fee",
    affiliateUrl: "https://www.bharatpetroleum.in/smartdrive?utm_source=orderking_affiliate",
    cashbackText: "Up to ₹100 cashback on min ₹1,000 fuel refill",
  },
  {
    id: "fastag_fuel_pay",
    name: "FASTag Pump Fuel Pay",
    category: "fuel",
    icon: "🚗",
    description: "Contactless fuel payment via NETC FASTag at partner HPCL & IOCL highway pumps",
    badge: "Contactless",
    affiliateUrl: "https://paytm.com/fastag-recharge?utm_source=orderking_affiliate",
    cashbackText: "1% highway fuel cashback credited to wallet",
  },
  {
    id: "mob_recharge",
    name: "Mobile Recharge",
    category: "recharge",
    icon: "📱",
    description: "Jio, Airtel, Vi & BSNL instant prepaid recharge",
    badge: "2% Cashback",
    affiliateUrl: "https://paytm.com/recharge?utm_source=orderking_affiliate",
    cashbackText: "Earn up to ₹25 King Coins on every recharge",
  },
  {
    id: "dth_recharge",
    name: "DTH & Cable",
    category: "recharge",
    icon: "📡",
    description: "Tata Play, Airtel DTH, Dish TV & Sun Direct",
    badge: "Instant Top-up",
    affiliateUrl: "https://paytm.com/dth-recharge?utm_source=orderking_affiliate",
    cashbackText: "Flat ₹20 bonus King Coins",
  },
  {
    id: "lpg_cylinder",
    name: "LPG Gas Cylinder",
    category: "gas",
    icon: "🔥",
    description: "Book Indane (IndianOil), HP Gas & Bharat Gas cylinder",
    badge: "Top Utility",
    affiliateUrl: "https://iocl.com/pages/indane-gas-online-booking?utm_source=orderking_affiliate",
    cashbackText: "Guaranteed ₹50 HP/IndianOil fuel cashback voucher",
  },
  {
    id: "electricity_bill",
    name: "Electricity Bill",
    category: "bills",
    icon: "⚡",
    description: "APDCL (Assam Power) & state electricity boards",
    badge: "BBPS Verified",
    affiliateUrl: "https://www.apdcl.org?utm_source=orderking_affiliate",
    cashbackText: "Earn 100 King Coins on timely bill payment",
  },
  {
    id: "train_tickets",
    name: "Train Tickets (IRCTC)",
    category: "travel",
    icon: "🚆",
    description: "ConfirmTkt & IRCTC authorized train seat booking",
    badge: "Zero PG Fee",
    affiliateUrl: "https://www.confirmtkt.com?utm_source=orderking_affiliate",
    cashbackText: "Zero payment gateway charges via KingPay",
  },
  {
    id: "bus_tickets",
    name: "Bus Tickets (RedBus)",
    category: "travel",
    icon: "🚌",
    description: "Intercity AC & sleeper bus booking across Assam & NE",
    badge: "Up to ₹150 OFF",
    affiliateUrl: "https://www.redbus.in?utm_source=orderking_affiliate",
    cashbackText: "Flat 10% instant discount with code REDKING",
  },
  {
    id: "flight_booking",
    name: "Flights & Hotels",
    category: "travel",
    icon: "✈️",
    description: "Domestic flights from Silchar, Guwahati & Kolkata",
    badge: "MakeMyTrip Partner",
    affiliateUrl: "https://www.makemytrip.com/flights?utm_source=orderking_affiliate",
    cashbackText: "Earn up to ₹500 flight cashback",
  },
  {
    id: "fastag_recharge",
    name: "FASTag Recharge",
    category: "bills",
    icon: "🚗",
    description: "NHAI toll FASTag instant recharge for all banks",
    affiliateUrl: "https://paytm.com/fastag-recharge?utm_source=orderking_affiliate",
    cashbackText: "1% fuel cashback on partner highways",
  },
];

type LoanProduct = {
  id: string;
  name: string;
  category: "personal" | "business" | "bike" | "card" | "bajaj";
  partnerNbfc: string;
  maxLimit: string;
  interestRate: string;
  tenureRange: string;
  speedText: string;
  tag: string;
  ownerCommission: string;
  benefit: string;
  whatsappMessage: string;
  partnerUrl: string;
};

const LOAN_PRODUCTS: LoanProduct[] = [
  // 1. Personal Cash Loans (Instant 2-Minute Disbursal)
  {
    id: "navi_personal",
    name: "Navi Instant Cash Loan",
    category: "personal",
    partnerNbfc: "Navi Finserv Ltd (RBI Registered NBFC)",
    maxLimit: "₹5,00,000",
    interestRate: "9.9% - 14.5% p.a.",
    tenureRange: "6 - 36 months",
    speedText: "⚡ 2-Min Disbursal (0 Paperwork)",
    tag: "Lowest Interest",
    ownerCommission: "3.5% of Loan Value (₹3,500 - ₹17,500)",
    benefit: "Direct Bank/UPI transfer in 120 seconds. 100% digital KYC via Account Aggregator.",
    whatsappMessage: "Hi, I want to apply for the Navi Instant Cash Loan up to ₹5,00,000 via KingPay.",
    partnerUrl: "https://navi.com/cash-loan?utm_source=orderking_affiliate",
  },
  {
    id: "kreditbee_personal",
    name: "KreditBee 24x7 Flexi Loan",
    category: "personal",
    partnerNbfc: "Krazybee Services Pvt Ltd (RBI Registered NBFC)",
    maxLimit: "₹3,00,000",
    interestRate: "1.0% - 1.5% / month",
    tenureRange: "3 - 24 months",
    speedText: "⚡ 5-Min Approval for Low CIBIL",
    tag: "High Approval Rate",
    ownerCommission: "3.0% of Loan Value (₹3,000 - ₹9,000)",
    benefit: "Approved even with low or new-to-credit CIBIL scores. Instant disbursal to KingPay wallet or Bank.",
    whatsappMessage: "Hi, I want to apply for the KreditBee Flexi Loan via KingPay.",
    partnerUrl: "https://kreditbee.in?utm_source=orderking_affiliate",
  },
  // 2. Small Business & Kirana Loans (For local shops & restaurants)
  {
    id: "lendingkart_business",
    name: "Lendingkart Kirana & Restaurant Loan",
    category: "business",
    partnerNbfc: "Lendingkart Finance Ltd (RBI Registered NBFC)",
    maxLimit: "₹10,00,000",
    interestRate: "1.2% - 1.8% / month",
    tenureRange: "6 - 36 months",
    speedText: "⚡ Zero Collateral Business Credit",
    tag: "Highest Commission",
    ownerCommission: "4.0% of Loan Value (₹10,000 - ₹40,000)",
    benefit: "Designed for restaurant owners, cloud kitchens, and grocery stores. Daily or weekly easy repayments.",
    whatsappMessage: "Hi, I want to apply for the Lendingkart Business Loan up to ₹10,00,000 for my shop/restaurant.",
    partnerUrl: "https://www.lendingkart.com?utm_source=orderking_affiliate",
  },
  {
    id: "flexiloans_business",
    name: "FlexiLoans MSME Growth Credit",
    category: "business",
    partnerNbfc: "Epimoney Pvt Ltd / FlexiLoans (RBI NBFC)",
    maxLimit: "₹5,00,000",
    interestRate: "1.25% / month",
    tenureRange: "3 - 24 months",
    speedText: "⚡ Disbursed in 24 Hours",
    tag: "MSME Special",
    ownerCommission: "3.5% of Loan Value (₹8,750 - ₹17,500)",
    benefit: "Zero balance sheet required. Fast UPI/QR transaction history based underwriting.",
    whatsappMessage: "Hi, I want to apply for FlexiLoans MSME Growth Credit via KingPay.",
    partnerUrl: "https://flexiloans.com?utm_source=orderking_affiliate",
  },
  // 3. Two-Wheeler / Bike Loans (Tailored for delivery riders & gig workers)
  {
    id: "hero_bike",
    name: "Hero FinCorp 2-Wheeler / EV Bike Loan",
    category: "bike",
    partnerNbfc: "Hero FinCorp Ltd (RBI Registered NBFC)",
    maxLimit: "₹1,50,000",
    interestRate: "7.9% - 10.5% p.a.",
    tenureRange: "12 - 36 months",
    speedText: "⚡ 100% On-Road Funding",
    tag: "Delivery Rider Special",
    ownerCommission: "2.0% of Loan Value (₹2,000 - ₹3,000)",
    benefit: "100% on-road funding for Petrol & EV delivery bikes. Zero processing fee for OrderKing riders.",
    whatsappMessage: "Hi, I want to apply for the Hero FinCorp Two-Wheeler Loan for delivery bike.",
    partnerUrl: "https://www.herofincorp.com?utm_source=orderking_affiliate",
  },
  // 4. Lifetime Free Instant Virtual Credit Cards
  {
    id: "hdfc_millennia",
    name: "HDFC Bank Millennia Credit Card",
    category: "card",
    partnerNbfc: "HDFC Bank Limited (Scheduled Commercial Bank)",
    maxLimit: "₹1,50,000 Instant Limit",
    interestRate: "45 Days 0% Interest",
    tenureRange: "Revolving Credit Line",
    speedText: "⚡ Instant Virtual Card Generated",
    tag: "Best for Food & Shopping",
    ownerCommission: "Flat ₹2,000 CPA per Activated Card",
    benefit: "5% Cashback on Amazon, Flipkart, Swiggy & Zomato + Flat ₹1,500 Amazon voucher on activation.",
    whatsappMessage: "Hi, I want to apply for the pre-approved HDFC Millennia Credit Card via KingPay.",
    partnerUrl: "https://www.hdfcbank.com?utm_source=orderking_affiliate",
  },
  {
    id: "sbi_simplyclick",
    name: "SBI SimplyClick Credit Card",
    category: "card",
    partnerNbfc: "SBI Cards & Payment Services Ltd (RBI Regulated)",
    maxLimit: "₹1,00,000 Instant Limit",
    interestRate: "45 Days 0% Interest",
    tenureRange: "Revolving Credit Line",
    speedText: "⚡ Instant Digital Issuance",
    tag: "10X Reward Points",
    ownerCommission: "Flat ₹1,800 CPA per Activated Card",
    benefit: "10X reward points on online spends + ₹500 Amazon welcome gift voucher + Annual fee waiver.",
    whatsappMessage: "Hi, I want to apply for the SBI SimplyClick Credit Card via KingPay.",
    partnerUrl: "https://www.sbicard.com?utm_source=orderking_affiliate",
  },
  {
    id: "idfc_wow",
    name: "IDFC FIRST WOW Credit Card (FD Backed - 100% Approval)",
    category: "card",
    partnerNbfc: "IDFC FIRST Bank Ltd (Scheduled Commercial Bank)",
    maxLimit: "₹2,00,000 Instant Limit",
    interestRate: "48 Days 0% Interest",
    tenureRange: "Revolving Credit Line",
    speedText: "⚡ 100% Guaranteed Approval (0 CIBIL)",
    tag: "Guaranteed 100% Approval",
    ownerCommission: "Flat ₹1,500 CPA per Activated Card",
    benefit: "Zero credit score required! 100% approval backed by instant FD earning 7.5% interest + 0 forex markup.",
    whatsappMessage: "Hi, I want to apply for the 100% Guaranteed IDFC WOW Credit Card via KingPay.",
    partnerUrl: "https://www.idfcfirstbank.com?utm_source=orderking_affiliate",
  },
  // 5. Co-Branded Fuel & Petro Credit Cards (High CPA & Massive Daily Fuel Savings)
  {
    id: "axis_iocl",
    name: "Axis Bank IndianOil Credit Card",
    category: "card",
    partnerNbfc: "Axis Bank Ltd (Scheduled Commercial Bank)",
    maxLimit: "₹2,50,000 Instant Limit",
    interestRate: "50 Days 0% Interest",
    tenureRange: "Revolving Credit Line",
    speedText: "⚡ Instant Digital Approval",
    tag: "4% IndianOil Fuel Back",
    ownerCommission: "Flat ₹2,200 CPA per Activated Card",
    benefit: "4% value back (20 reward points / ₹100) at IndianOil pumps + 1% fuel surcharge waiver + ₹250 welcome cashback.",
    whatsappMessage: "Hi, I want to apply for Axis Bank IndianOil Fuel Credit Card via KingPay.",
    partnerUrl: "https://www.axisbank.com/retail/cards/credit-card/indianoil-credit-card?utm_source=orderking_affiliate",
  },
  {
    id: "icici_hpcl",
    name: "ICICI HPCL Super Saver Credit Card",
    category: "card",
    partnerNbfc: "ICICI Bank Ltd (Scheduled Commercial Bank)",
    maxLimit: "₹3,00,000 Instant Limit",
    interestRate: "48 Days 0% Interest",
    tenureRange: "Revolving Credit Line",
    speedText: "⚡ 5% Cashback on HPCL Fuel",
    tag: "HPCL Official Partner",
    ownerCommission: "Flat ₹2,000 CPA per Activated Card",
    benefit: "5% total savings (4% cashback + 1% surcharge waiver) via HP Pay app at HPCL pumps + 1.5% cashback on groceries.",
    whatsappMessage: "Hi, I want to apply for ICICI HPCL Super Saver Card via KingPay.",
    partnerUrl: "https://www.icicibank.com/personal-banking/cards/credit-card/hpcl-super-saver-credit-card?utm_source=orderking_affiliate",
  },
  {
    id: "idfc_hpcl_power",
    name: "IDFC FIRST HPCL Power Plus Credit Card",
    category: "card",
    partnerNbfc: "IDFC FIRST Bank Ltd (Scheduled Commercial Bank)",
    maxLimit: "₹4,00,000 Instant Limit",
    interestRate: "48 Days 0% Interest",
    tenureRange: "Revolving Credit Line",
    speedText: "⚡ Up to 6.5% Fuel Savings",
    tag: "Highest Fuel Savings",
    ownerCommission: "Flat ₹2,500 CPA per Activated Card",
    benefit: "Up to 6.5% savings on HPCL fuel & LPG refills + ₹500 welcome fuel voucher + 5% cashback on FASTag recharge.",
    whatsappMessage: "Hi, I want to apply for IDFC FIRST HPCL Power Plus Card via KingPay.",
    partnerUrl: "https://www.idfcfirstbank.com/credit-card/hpcl-power-plus?utm_source=orderking_affiliate",
  },
  {
    id: "sbi_bpcl_octane",
    name: "BPCL SBI Card Octane",
    category: "card",
    partnerNbfc: "SBI Cards & Payment Services Ltd (RBI Regulated)",
    maxLimit: "₹2,00,000 Instant Limit",
    interestRate: "50 Days 0% Interest",
    tenureRange: "Revolving Credit Line",
    speedText: "⚡ 7.25% Value Back on Petrol",
    tag: "25X Petrol Reward Points",
    ownerCommission: "Flat ₹2,200 CPA per Activated Card",
    benefit: "7.25% value back (25X reward points) on BPCL fuel + 1% fuel surcharge waiver + 6,000 bonus reward points (worth ₹1,500).",
    whatsappMessage: "Hi, I want to apply for BPCL SBI Card Octane via KingPay.",
    partnerUrl: "https://www.sbicard.com/en/personal/credit-cards/travel/bpcl-sbi-card-octane.page?utm_source=orderking_affiliate",
  },
  // 6. Bajaj Finance / Bajaj Finserv Flagship Products (India's #1 NBFC)
  {
    id: "bajaj_insta_emi",
    name: "Bajaj Finserv Insta EMI Card",
    category: "bajaj",
    partnerNbfc: "Bajaj Finance Ltd (RBI Registered NBFC)",
    maxLimit: "₹2,00,000 Pre-Approved",
    interestRate: "0% Interest (No-Cost EMI)",
    tenureRange: "3 - 24 months",
    speedText: "⚡ 60-Sec Digital Activation",
    tag: "0% No-Cost EMI",
    ownerCommission: "Flat ₹500 CPA per Card Activation",
    benefit: "Pre-approved ₹2,00,000 limit across 1.5 Lakh partner stores and e-commerce. Zero paperwork and 0 down payment.",
    whatsappMessage: "Hi, I want to activate my pre-approved Bajaj Finserv Insta EMI Card with ₹2,00,000 limit.",
    partnerUrl: "https://www.bajajfinserv.in/insta-emi-card?utm_source=orderking_affiliate",
  },
  {
    id: "bajaj_personal",
    name: "Bajaj Finserv Instant Personal Loan",
    category: "bajaj",
    partnerNbfc: "Bajaj Finance Ltd (RBI Registered NBFC)",
    maxLimit: "₹40,00,000",
    interestRate: "10.5% - 14% p.a.",
    tenureRange: "12 - 96 months",
    speedText: "⚡ Disbursal in 20 Minutes",
    tag: "Highest Sanction",
    ownerCommission: "3.0% of Loan Value (Up to ₹1,20,000)",
    benefit: "Disbursed in 20 minutes directly to your bank account. Minimal documentation, flexible tenure up to 96 months.",
    whatsappMessage: "Hi, I want to apply for Bajaj Finserv Instant Personal Loan up to ₹40 Lakh via KingPay.",
    partnerUrl: "https://www.bajajfinserv.in/personal-loan?utm_source=orderking_affiliate",
  },
  {
    id: "bajaj_kitchen_equipment",
    name: "Bajaj Commercial Kitchen Equipment Loan",
    category: "bajaj",
    partnerNbfc: "Bajaj Finance Ltd (RBI Registered NBFC)",
    maxLimit: "₹15,00,000",
    interestRate: "1.1% / month",
    tenureRange: "12 - 48 months",
    speedText: "⚡ Restaurant & Kitchen Special",
    tag: "Zero Collateral",
    ownerCommission: "3.5% of Loan Value (Up to ₹52,500)",
    benefit: "Designed for cloud kitchens and restaurants to purchase commercial fryers, refrigeration, and POS terminals.",
    whatsappMessage: "Hi, I want to apply for Bajaj Commercial Kitchen Equipment Loan for my restaurant.",
    partnerUrl: "https://www.bajajfinserv.in/business-loan?utm_source=orderking_affiliate",
  },
  {
    id: "bajaj_two_wheeler",
    name: "Bajaj Two-Wheeler & EV Bike Financing",
    category: "bajaj",
    partnerNbfc: "Bajaj Auto Credit Ltd (RBI Registered NBFC)",
    maxLimit: "₹1,75,000",
    interestRate: "7.5% - 9.9% p.a.",
    tenureRange: "12 - 36 months",
    speedText: "⚡ 100% On-Road Funding",
    tag: "EMI from ₹1,999/mo",
    ownerCommission: "2.0% of Vehicle Value (₹3,500)",
    benefit: "Drive home Bajaj Pulsar, Chetak EV or Platina with 100% on-road funding and zero foreclosure charges.",
    whatsappMessage: "Hi, I want to finance a two-wheeler/EV with Bajaj Auto Credit via KingPay.",
    partnerUrl: "https://www.bajajfinserv.in/two-wheeler-loan?utm_source=orderking_affiliate",
  },
];

type BajajOffer = {
  id: string;
  title: string;
  category: "all" | "electronics" | "home" | "business" | "health" | "vehicle" | "lifestyle";
  icon: string;
  badge: string;
  limitText: string;
  tenure: string;
  customerBenefit: string;
  ownerCommission: string;
  instantApplyUrl: string;
};

const BAJAJ_TOP_20_OFFERS: BajajOffer[] = [
  {
    id: "b_insta_card",
    title: "Bajaj Finserv Insta EMI Card",
    category: "lifestyle",
    icon: "💳",
    badge: "100% Digital in 60s",
    limitText: "₹2,00,000 Credit Limit",
    tenure: "3 - 24 Months",
    customerBenefit: "No-Cost EMI across 1.5 Lakh+ online/offline stores. 0 down payment on first purchase.",
    ownerCommission: "Flat ₹500 CPA per activated card",
    instantApplyUrl: "https://www.bajajfinserv.in/insta-emi-card?utm_source=orderking_affiliate",
  },
  {
    id: "b_smartphones",
    title: "Smartphones & Gadgets 0% EMI",
    category: "electronics",
    icon: "📱",
    badge: "No Cost EMI",
    limitText: "Up to ₹1,50,000",
    tenure: "3 - 12 Months",
    customerBenefit: "Zero down payment, 0% interest on Apple iPhone, Samsung, OnePlus & Xiaomi.",
    ownerCommission: "2.5% of Device GMV (₹1,000 - ₹3,750)",
    instantApplyUrl: "https://www.bajajfinserv.in/mobile-phones-on-emi?utm_source=orderking_affiliate",
  },
  {
    id: "b_kitchen_appliances",
    title: "Home & Kitchen Appliances EMI",
    category: "home",
    icon: "🍳",
    badge: "Zero Processing Fee",
    limitText: "Up to ₹2,50,000",
    tenure: "6 - 18 Months",
    customerBenefit: "Upgrade refrigerator, microwave, air fryer & chimney with equal monthly installments.",
    ownerCommission: "3.0% of Order Value",
    instantApplyUrl: "https://www.bajajfinserv.in/kitchen-appliances-on-emi?utm_source=orderking_affiliate",
  },
  {
    id: "b_personal_cash",
    title: "Instant Personal Cash Loan",
    category: "lifestyle",
    icon: "⚡",
    badge: "20-Min Disbursal",
    limitText: "Up to ₹40,00,000",
    tenure: "12 - 96 Months",
    customerBenefit: "100% paperless disbursal straight to bank account with minimal documents.",
    ownerCommission: "3.0% of Loan Value (Up to ₹1,20,000)",
    instantApplyUrl: "https://www.bajajfinserv.in/personal-loan?utm_source=orderking_affiliate",
  },
  {
    id: "b_restaurant_equipment",
    title: "Restaurant Commercial Equipment Credit",
    category: "business",
    icon: "🏬",
    badge: "For Kitchen Partners",
    limitText: "Up to ₹15,00,000",
    tenure: "12 - 48 Months",
    customerBenefit: "Fund deep fryers, commercial refrigeration, combi ovens & POS setups with easy weekly EMIs.",
    ownerCommission: "3.5% of Disbursed Value",
    instantApplyUrl: "https://www.bajajfinserv.in/business-loan?utm_source=orderking_affiliate",
  },
  {
    id: "b_two_wheeler",
    title: "Two-Wheeler & EV Scooter Financing",
    category: "vehicle",
    icon: "🛵",
    badge: "100% On-Road Funding",
    limitText: "Up to ₹1,75,000",
    tenure: "12 - 36 Months",
    customerBenefit: "Drive home Honda, Hero, Bajaj Pulsar or Ather EV with EMIs from ₹1,999/month.",
    ownerCommission: "2.0% of Vehicle Value (₹2,500 - ₹3,500)",
    instantApplyUrl: "https://www.bajajfinserv.in/two-wheeler-loan?utm_source=orderking_affiliate",
  },
  {
    id: "b_medical_health",
    title: "Doctor & Medical Emergency Credit",
    category: "health",
    icon: "🏥",
    badge: "Instant Approval",
    limitText: "Up to ₹5,00,000",
    tenure: "6 - 24 Months",
    customerBenefit: "0 collateral medical line for hospitalisation, dental procedures, and pharmacy bills.",
    ownerCommission: "2.5% of Credit Line",
    instantApplyUrl: "https://www.bajajfinserv.in/health-emi-network-card?utm_source=orderking_affiliate",
  },
  {
    id: "b_education_fees",
    title: "School & College Tuition Fee EMI",
    category: "lifestyle",
    icon: "🎓",
    badge: "0% Education EMI",
    limitText: "Up to ₹3,00,000",
    tenure: "10 Months",
    customerBenefit: "Convert heavy lump-sum school or college fees into 10 zero-interest installments.",
    ownerCommission: "Flat ₹1,200 per Enrolled Student",
    instantApplyUrl: "https://www.bajajfinserv.in/education-loan?utm_source=orderking_affiliate",
  },
  {
    id: "b_gold_loan",
    title: "Instant Gold Loan at 9.5% p.a.",
    category: "lifestyle",
    icon: "🪙",
    badge: "15-Min Disbursal",
    limitText: "Up to ₹20,00,000",
    tenure: "3 - 12 Months",
    customerBenefit: "Highest per-gram valuation with free insured locker storage and part-payment flexibility.",
    ownerCommission: "1.5% of Sanctioned Loan",
    instantApplyUrl: "https://www.bajajfinserv.in/gold-loan?utm_source=orderking_affiliate",
  },
  {
    id: "b_used_car",
    title: "Used Car Purchase Financing",
    category: "vehicle",
    icon: "🚗",
    badge: "Doorstep Inspection",
    limitText: "Up to ₹10,00,000",
    tenure: "12 - 60 Months",
    customerBenefit: "Up to 100% funding on certified pre-owned cars with fast transfer assistance.",
    ownerCommission: "2.5% of Loan Value",
    instantApplyUrl: "https://www.bajajfinserv.in/used-car-loan?utm_source=orderking_affiliate",
  },
  {
    id: "b_home_renovation",
    title: "Home & Dining Room Renovation",
    category: "home",
    icon: "🏡",
    badge: "Flexible Credit",
    limitText: "Up to ₹10,00,000",
    tenure: "12 - 60 Months",
    customerBenefit: "Transform home interiors, modular kitchens or restaurant dining ambiance.",
    ownerCommission: "3.0% of Disbursed Credit",
    instantApplyUrl: "https://www.bajajfinserv.in/home-renovation-loan?utm_source=orderking_affiliate",
  },
  {
    id: "b_student_laptops",
    title: "Student Laptops & Tablets EMI",
    category: "electronics",
    icon: "💻",
    badge: "Student ID Special",
    limitText: "Up to ₹1,00,000",
    tenure: "6 - 12 Months",
    customerBenefit: "0 down payment for college students on HP, Dell, Lenovo and iPad devices.",
    ownerCommission: "Flat ₹1,000 CPA per Device",
    instantApplyUrl: "https://www.bajajfinserv.in/laptops-on-emi?utm_source=orderking_affiliate",
  },
  {
    id: "b_fitness_wellness",
    title: "Gym & Fitness Membership 0% EMI",
    category: "health",
    icon: "🏋️",
    badge: "Zero Interest",
    limitText: "Up to ₹60,000",
    tenure: "3 - 6 Months",
    customerBenefit: "Split annual gym, Cult.fit or yoga memberships into pocket-friendly monthly payments.",
    ownerCommission: "Flat ₹500 CPA",
    instantApplyUrl: "https://www.bajajfinserv.in/fitness-on-emi?utm_source=orderking_affiliate",
  },
  {
    id: "b_travel_vacation",
    title: "Holiday & Travel (Fly Now Pay Later)",
    category: "lifestyle",
    icon: "✈️",
    badge: "MakeMyTrip Linked",
    limitText: "Up to ₹2,50,000",
    tenure: "3 - 12 Months",
    customerBenefit: "Book family domestic & international flights/hotels on instant No-Cost EMI.",
    ownerCommission: "2.5% of Booking Amount",
    instantApplyUrl: "https://www.bajajfinserv.in/travel-on-emi?utm_source=orderking_affiliate",
  },
  {
    id: "b_solar_rooftop",
    title: "Solar Rooftop Panel Green Loan",
    category: "home",
    icon: "☀️",
    badge: "Govt Subsidy Linked",
    limitText: "Up to ₹5,00,000",
    tenure: "12 - 60 Months",
    customerBenefit: "Install rooftop solar; electricity bill savings offset the monthly loan EMI.",
    ownerCommission: "3.5% of Loan Value",
    instantApplyUrl: "https://www.bajajfinserv.in/solar-rooftop-loan?utm_source=orderking_affiliate",
  },
  {
    id: "b_kirana_working_capital",
    title: "Kirana & Grocery Inventory Credit",
    category: "business",
    icon: "🛒",
    badge: "30-Day Revolving",
    limitText: "Up to ₹5,00,000",
    tenure: "1 - 12 Months",
    customerBenefit: "Restock fast-moving grocery FMCG goods with zero collateral and weekly settlements.",
    ownerCommission: "3.5% of Loan Value",
    instantApplyUrl: "https://www.bajajfinserv.in/working-capital-loan?utm_source=orderking_affiliate",
  },
  {
    id: "b_dental_cosmetic",
    title: "Dental, Eye Care & Cosmetic No-Cost EMI",
    category: "health",
    icon: "🦷",
    badge: "0% Healthcare EMI",
    limitText: "Up to ₹1,50,000",
    tenure: "3 - 12 Months",
    customerBenefit: "Instant approval for dental braces, LASIK eye surgery and hair treatments.",
    ownerCommission: "Flat ₹1,200 CPA",
    instantApplyUrl: "https://www.bajajfinserv.in/healthcare-emi?utm_source=orderking_affiliate",
  },
  {
    id: "b_erickshaw_commercial",
    title: "Electric Rickshaw & 3-Wheeler Loan",
    category: "vehicle",
    icon: "🛺",
    badge: "Livelihood Special",
    limitText: "Up to ₹2,50,000",
    tenure: "12 - 36 Months",
    customerBenefit: "Low down payment and daily micro-repayment options for local drivers.",
    ownerCommission: "2.0% of Vehicle Value",
    instantApplyUrl: "https://www.bajajfinserv.in/commercial-vehicle-loan?utm_source=orderking_affiliate",
  },
  {
    id: "b_extended_warranty",
    title: "Complete Device Damage & Warranty Cover",
    category: "electronics",
    icon: "🛡️",
    badge: "From ₹49/month",
    limitText: "100% Repair Value",
    tenure: "12 - 24 Months",
    customerBenefit: "Zero deductible insurance cover for smartphone drops, screen breaks, and liquid spills.",
    ownerCommission: "30% Recurring Insurance Yield",
    instantApplyUrl: "https://www.bajajfinserv.in/extended-warranty?utm_source=orderking_affiliate",
  },
  {
    id: "b_rbl_supercard",
    title: "Bajaj Finserv RBL Bank SuperCard",
    category: "lifestyle",
    icon: "💳",
    badge: "4-in-1 SuperCard",
    limitText: "₹2,50,000 Limit",
    tenure: "Revolving Line",
    customerBenefit: "Credit card, cash card, loan card & EMI card in one. 12X reward points on grocery and dining.",
    ownerCommission: "Flat ₹1,500 CPA per Activated Card",
    instantApplyUrl: "https://www.bajajfinserv.in/rbl-credit-card?utm_source=orderking_affiliate",
  },
];

export type BankAccount = {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumberMasked: string;
  accountType: "Savings" | "Current";
  isPrimary: boolean;
  balance?: number;
  balanceCheckedAt?: string;
  color: string;
  icon: string;
};

const DEFAULT_BANKS: BankAccount[] = [
  {
    id: "bank_sbi_1",
    bankName: "State Bank of India",
    bankCode: "sbi",
    accountNumberMasked: "•••• 4821",
    accountType: "Savings",
    isPrimary: true,
    balance: 24850,
    balanceCheckedAt: "Just now",
    color: "from-blue-600 to-indigo-800",
    icon: "🏛️",
  },
  {
    id: "bank_hdfc_1",
    bankName: "HDFC Bank",
    bankCode: "hdfc",
    accountNumberMasked: "•••• 9014",
    accountType: "Savings",
    isPrimary: false,
    balance: 68120,
    balanceCheckedAt: "Today 11:30 AM",
    color: "from-blue-800 to-sky-900",
    icon: "🏦",
  },
];

const POPULAR_BANKS_FOR_ADDING = [
  { name: "State Bank of India (SBI)", code: "sbi", icon: "🏛️", popular: true },
  { name: "HDFC Bank", code: "hdfc", icon: "🏦", popular: true },
  { name: "ICICI Bank", code: "icici", icon: "🏢", popular: true },
  { name: "Punjab National Bank (PNB)", code: "pnb", icon: "🏛️", popular: true },
  { name: "Axis Bank", code: "axis", icon: "🏦", popular: true },
  { name: "Bank of Baroda (BOB)", code: "bob", icon: "🏢", popular: true },
  { name: "Assam Gramin Vikash Bank (AGVB)", code: "agvb", icon: "🌾", popular: true },
  { name: "Canara Bank", code: "canara", icon: "🏛️", popular: true },
  { name: "Kotak Mahindra Bank", code: "kotak", icon: "🏦", popular: true },
  { name: "Union Bank of India", code: "union", icon: "🏢", popular: true },
];

/**
 * 100x Luxury Visual QR Code Scanner Graphic
 * 100% Customized OrderKing / KingPay Proprietary Design.
 * Features 24K Gold & Imperial Jade beveled reticle brackets, authentic vector QR matrix,
 * center KingPay royal crown medallion, targeting crosshairs, and pulsing emerald laser beam.
 */
function ScannerVisualGraphic({ className = "size-20 sm:size-24" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* 24K Gold & Emerald Luxury Outer Viewfinder Reticle */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full filter drop-shadow-md" fill="none">
        <defs>
          <linearGradient id="goldJadeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
        </defs>
        {/* Beveled Precision Corner Brackets */}
        <path d="M 6 26 L 6 9 A 3 3 0 0 1 9 6 L 26 6" stroke="url(#goldJadeGrad)" strokeWidth="5" strokeLinecap="round" />
        <path d="M 74 6 L 91 6 A 3 3 0 0 1 94 9 L 94 26" stroke="url(#goldJadeGrad)" strokeWidth="5" strokeLinecap="round" />
        <path d="M 94 74 L 94 91 A 3 3 0 0 1 91 94 L 74 94" stroke="url(#goldJadeGrad)" strokeWidth="5" strokeLinecap="round" />
        <path d="M 26 94 L 9 94 A 3 3 0 0 1 6 91 L 6 74" stroke="url(#goldJadeGrad)" strokeWidth="5" strokeLinecap="round" />

        {/* Targeting Reticle Crosshairs */}
        <line x1="50" y1="6" x2="50" y2="12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <line x1="50" y1="88" x2="50" y2="94" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <line x1="6" y1="50" x2="12" y2="50" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <line x1="88" y1="50" x2="94" y2="50" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      </svg>

      {/* High-Definition QR Code Matrix Representation */}
      <div className="relative size-[74%] rounded-xl bg-white p-2 shadow-xl flex flex-col justify-between overflow-hidden border border-amber-400/40">
        {/* Animated Pulsing Laser Scanning Beam */}
        <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 via-amber-300 to-transparent shadow-[0_0_12px_#10B981] animate-pulse z-10 top-1/2 -translate-y-1/2" />

        {/* Top row with 2 Large QR Finder Eyes */}
        <div className="flex justify-between items-start">
          {/* Finder Eye Top Left */}
          <div className="size-6 rounded-md border-2 border-[#111827] p-0.5 flex items-center justify-center bg-white shadow-xs">
            <div className="size-3 rounded-[2px] bg-[#111827]" />
          </div>
          {/* Horizontal Timing Pattern */}
          <div className="flex gap-0.5 pt-1.5">
            <span className="size-1 rounded-[0.5px] bg-[#111827]" />
            <span className="size-1 rounded-[0.5px] bg-amber-500" />
            <span className="size-1 rounded-[0.5px] bg-[#111827]" />
            <span className="size-1 rounded-[0.5px] bg-emerald-600" />
          </div>
          {/* Finder Eye Top Right */}
          <div className="size-6 rounded-md border-2 border-[#111827] p-0.5 flex items-center justify-center bg-white shadow-xs">
            <div className="size-3 rounded-[2px] bg-[#111827]" />
          </div>
        </div>

        {/* Center KingPay 24K Royal Gold Crown Medallion */}
        <div className="flex items-center justify-center my-0.5">
          <div className="size-5 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center shadow-md ring-1 ring-amber-300">
            <svg viewBox="0 0 24 24" className="size-3 text-[#111827]" fill="currentColor">
              <path d="M2 19h20v2H2zM4 17l2-10 5 4 5-4 2 10z" />
            </svg>
          </div>
        </div>

        {/* Bottom row with 1 Finder Eye & Data Matrix Blocks */}
        <div className="flex justify-between items-end">
          {/* Finder Eye Bottom Left */}
          <div className="size-6 rounded-md border-2 border-[#111827] p-0.5 flex items-center justify-center bg-white shadow-xs">
            <div className="size-3 rounded-[2px] bg-[#111827]" />
          </div>
          {/* Data Matrix Pixels Bottom Right */}
          <div className="grid grid-cols-4 gap-0.5 pb-0.5 pr-0.5">
            <span className="size-1 rounded-[0.5px] bg-[#111827]" />
            <span className="size-1 rounded-[0.5px] bg-amber-500" />
            <span className="size-1 rounded-[0.5px] bg-[#111827]" />
            <span className="size-1 rounded-[0.5px] bg-emerald-600" />
            <span className="size-1 rounded-[0.5px] bg-emerald-600" />
            <span className="size-1 rounded-[0.5px] bg-[#111827]" />
            <span className="size-1 rounded-[0.5px] bg-[#111827]" />
            <span className="size-1 rounded-[0.5px] bg-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function KingPayPage({ isGeofencedFallback = false }: { isGeofencedFallback?: boolean } = {}) {
  const { user } = useCurrentUserState();
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = !isGeofencedFallback && isDeliveryActiveInLocation(location.lat, location.lng, location.cityId);
  const waitlistInfo = getCityWaitlistInfo(location.cityName || "Your City");
  const [hasVotedCity, setHasVotedCity] = useState(false);
  const [walletBalance, setWalletBalance] = useState(750);
  const [activeTab, setActiveTab] = useState<"all" | "fuel" | "recharge" | "bills" | "travel" | "gas">("all");
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState("500");
  const [showReceiveQrModal, setShowReceiveQrModal] = useState(false);
  const festive = getCurrentFestiveContext();

  const handleVoteCity = () => {
    if (hasVotedCity) return;
    setHasVotedCity(true);
    const bonus = 50;
    const newBal = walletBalance + bonus;
    setWalletBalance(newBal);
    if (typeof window !== "undefined") {
      localStorage.setItem("ok_king_pay_wallet_balance", String(newBal));
      localStorage.setItem(`voted_expansion_${location.cityName}`, "true");
    }
    playSoundboxChime(bonus);
    toast.success(`🎉 Vote Registered for ${location.cityName || "your city"}! ₹50 bonus credits added to your King Pay wallet!`);
  };

  // Hydrate client storage safely after SSR mount (prevents React hydration mismatch)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedBal = localStorage.getItem("ok_king_pay_wallet_balance");
      if (savedBal) setWalletBalance(parseInt(savedBal, 10));

      const savedLater = localStorage.getItem("ok_king_pay_later_active");
      if (savedLater) setPayLaterActive(savedLater === "true");

      const savedGold = localStorage.getItem("ok_king_pay_gold_grams");
      if (savedGold) setGoldGrams(parseFloat(savedGold));

      const savedBanks = localStorage.getItem("ok_kingpay_linked_banks");
      if (savedBanks) {
        const parsed = JSON.parse(savedBanks);
        if (Array.isArray(parsed) && parsed.length > 0) setLinkedBanks(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-open scanner if navigated with ?scan=true (from bottom nav or quick link)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("scan") === "true") {
        setScannerTab("camera");
        setShowScanner(true);
      }
    }
  }, []);

  // ⛽ Fuel & Petro Hub State
  const [monthlyFuelSpend, setMonthlyFuelSpend] = useState(4000);
  const [selectedVoucherBrand, setSelectedVoucherBrand] = useState<"HPCL (HP Pay)" | "IndianOil (IOCL ONE)" | "BPCL (SmartDrive)">("HPCL (HP Pay)");
  const [showFuelVoucherModal, setShowFuelVoucherModal] = useState(false);
  const [generatedFuelVoucher, setGeneratedFuelVoucher] = useState<{
    code: string;
    brand: string;
    amount: number;
    coinsReward: number;
    expiry: string;
  } | null>(null);

  const handleBuyFuelVoucher = (brand: "HPCL (HP Pay)" | "IndianOil (IOCL ONE)" | "BPCL (SmartDrive)", amt: number) => {
    const coinsReward = Math.round(amt * 0.02 * 10); // 2% value in coins (10 coins = ₹1)
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = brand.includes("HPCL") ? "HP" : brand.includes("IndianOil") ? "IOCL" : "BP";
    const code = `${prefix}-${amt}-${randomHex}`;
    
    setGeneratedFuelVoucher({
      code,
      brand,
      amount: amt,
      coinsReward,
      expiry: "Valid for 90 days at all retail stations across India",
    });
    setKingCoins((c) => c + coinsReward);
    setShowFuelVoucherModal(true);
    toast.success(`🎉 ${brand} ₹${amt} fuel voucher generated! +${coinsReward} King Coins credited.`);
  };
  
  // 10x Low-Bandwidth & Offline 2G Mode
  const [isOffline, setIsOffline] = useState(false);
  const [force2GMode, setForce2GMode] = useState(false);
  const [offlineToken, setOfflineToken] = useState("OKPAY-OFFLINE-7841");

  // Navi-style KingPay Later Micro-Credit
  const [payLaterActive, setPayLaterActive] = useState(false);
  const payLaterLimit = 2500;

  // CRED-style 7-Day Check-in Streak
  const [streakDay, setStreakDay] = useState(3);
  const [claimedToday, setClaimedToday] = useState(false);
  const [kingCoins, setKingCoins] = useState(4250);

  // Interactive Scan & Pay Simulator
  const [showScanner, setShowScanner] = useState(false);
  const [scanRecipient, setScanRecipient] = useState("karimganj.store@upi");
  const [scanAmount, setScanAmount] = useState("150");
  const [scannerTab, setScannerTab] = useState<"camera" | "manual">("camera");
  const [flashlightOn, setFlashlightOn] = useState(false);

  // Bank Accounts & Check Balance State
  const [linkedBanks, setLinkedBanks] = useState<BankAccount[]>(DEFAULT_BANKS);

  const [showCheckBalanceModal, setShowCheckBalanceModal] = useState(false);
  const [selectedBankForBalance, setSelectedBankForBalance] = useState<BankAccount | null>(null);
  const [upiPinInput, setUpiPinInput] = useState("");
  const [pinVerifying, setPinVerifying] = useState(false);
  const [balanceRevealed, setBalanceRevealed] = useState<{ [bankId: string]: number }>({
    bank_sbi_1: 24850,
  });

  // Add Bank Account Flow State
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [addBankStep, setAddBankStep] = useState<"select" | "sim" | "success">("select");
  const [selectedBankToAdd, setSelectedBankToAdd] = useState<string>("");
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [simVerifying, setSimVerifying] = useState(false);
  const [selectedSim, setSelectedSim] = useState<1 | 2>(1);

  // Self Transfer Flow State
  const [showSelfTransferModal, setShowSelfTransferModal] = useState(false);
  const [selfFromBank, setSelfFromBank] = useState("bank_sbi_1");
  const [selfToBank, setSelfToBank] = useState("bank_hdfc_1");
  const [selfTransferAmount, setSelfTransferAmount] = useState("1000");

  // How to Make a Transaction / Payment Guide State
  const [showHowToPayModal, setShowHowToPayModal] = useState(false);

  // Everyday Needs & Payment Modals
  const [activeUtilityModal, setActiveUtilityModal] = useState<"recharge" | "electricity" | "dth" | "gas" | "fastag" | "water" | "broadband" | "card" | "contact" | "upi" | null>(null);
  const [utilityInput, setUtilityInput] = useState("");
  const [utilityAmount, setUtilityAmount] = useState("299");
  const [utilityOperator, setUtilityOperator] = useState("Jio");
  const [paymentSource, setPaymentSource] = useState<"wallet" | string>("wallet");

  const handleUtilityPayment = (title: string, amount: number) => {
    if (amount > walletBalance) {
      toast.error(`Insufficient KingPay balance (₹${walletBalance}). Please add money.`);
      return;
    }
    const newBal = walletBalance - amount;
    setWalletBalance(newBal);
    if (typeof window !== "undefined") {
      localStorage.setItem("ok_king_pay_wallet_balance", String(newBal));
    }
    playSoundboxChime(amount);
    const earnedCoins = Math.round(amount * 0.05 * 10);
    setKingCoins((c) => c + earnedCoins);
    toast.success(`⚡ ${title} successful! Paid ₹${amount} with 0% fee. +${earnedCoins} King Coins earned!`);
    setActiveUtilityModal(null);
    setUtilityInput("");
  };

  // CRED-style Interactive Scratch Card
  const [showScratchCard, setShowScratchCard] = useState(false);
  const [scratched, setScratched] = useState(false);
  const [scratchReward, setScratchReward] = useState({
    title: "🎉 Flat ₹25 Cashback!",
    desc: "Added directly to your KingPay wallet float.",
    amount: 25,
    coins: 100,
  });

  // 24K Digital Gold Partner Savings (Jar / Paytm Gold style)
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [goldGrams, setGoldGrams] = useState(0.045);
  const [goldAmount, setGoldAmount] = useState("100");

  // Split Bill with Friends (Splitwise + PhonePe style)
  const [splitAmount, setSplitAmount] = useState("600");
  const [splitCount, setSplitCount] = useState(3);

  // Biometric 1-Tap WebAuthn Authentication Simulator
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  // CRED/Paytm-style Lucky Jackpot Spin Wheel
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<{
    prize: string;
    sub: string;
    icon: string;
    type: "cash" | "coins" | "food" | "scratch";
    value: number;
  } | null>(null);

  // VIP Milestone Club Tiers
  const getVipTier = (coins: number) => {
    if (coins >= 15000) return { name: "King's Circle Elite", icon: "👑", multiplier: "5x", perk: "Priority Delivery & 0 Surge Fees", color: "text-amber-600 bg-amber-500/15 border-amber-500/30" };
    if (coins >= 5000) return { name: "Gold VIP", icon: "🥇", multiplier: "2.5x", perk: "Free Delivery over ₹149", color: "text-yellow-600 bg-yellow-500/15 border-yellow-500/30" };
    if (coins >= 1000) return { name: "Silver Club", icon: "🥈", multiplier: "1.5x", perk: "Monthly ₹20 Food Voucher", color: "text-slate-600 bg-slate-500/15 border-slate-500/30" };
    return { name: "Bronze Member", icon: "🥉", multiplier: "1x", perk: "Earn 1 Coin per ₹10 spent", color: "text-orange-700 bg-orange-700/15 border-orange-700/30" };
  };

  const handleSpinWheel = () => {
    if (kingCoins < 100 && claimedToday) {
      toast.error("You need at least 100 King Coins to spin the Lucky Jackpot Wheel!");
      return;
    }
    setSpinning(true);
    setSpinResult(null);

    const PRIZES = [
      { prize: "Flat ₹50 Wallet Cashback", sub: "Credited instantly to your KingPay wallet float.", icon: "💰", type: "cash" as const, value: 50 },
      { prize: "Free Food Delivery Token", sub: "Applied automatically on your next food order.", icon: "🍔", type: "food" as const, value: 35 },
      { prize: "500 Bonus King Coins", sub: "Boosts your VIP Club tier progress.", icon: "🪙", type: "coins" as const, value: 500 },
      { prize: "Mystery Scratch Card", sub: "Unlocks an instant surprise reward.", icon: "🎫", type: "scratch" as const, value: 100 },
      { prize: "Flat 20% Off Meal Voucher", sub: "Valid on all partner restaurants in Karimganj & Silchar.", icon: "🏷️", type: "food" as const, value: 100 },
      { prize: "King Club 2X Booster", sub: "Double coin earnings on all transactions today.", icon: "👑", type: "coins" as const, value: 200 },
    ];

    setTimeout(() => {
      const chosen = PRIZES[Math.floor(Math.random() * PRIZES.length)];
      setSpinResult(chosen);
      setSpinning(false);

      if (chosen.type === "cash") {
        setWalletBalance((prev) => prev + chosen.value);
      } else if (chosen.type === "coins") {
        setKingCoins((prev) => prev + chosen.value);
      } else if (chosen.type === "scratch") {
        setScratched(false);
        setScratchReward({
          title: "🎉 Jackpot Mystery Scratch Card!",
          desc: "Won from the Lucky Jackpot Spin Wheel.",
          amount: 30,
          coins: 250,
        });
        setShowScratchCard(true);
      }

      if (!claimedToday) {
        setClaimedToday(true);
      } else {
        setKingCoins((prev) => Math.max(0, prev - 100));
      }

      toast.success(`🎰 Jackpot Win: ${chosen.prize}!`);
    }, 1500);
  };

  const handleBurnCoinsForFood = (coinsToBurn: number, rupeeDiscount: number) => {
    if (kingCoins < coinsToBurn) {
      toast.error(`You need at least ${coinsToBurn} King Coins for a ₹${rupeeDiscount} food discount!`);
      return;
    }
    setKingCoins((prev) => prev - coinsToBurn);
    setWalletBalance((prev) => prev + rupeeDiscount);
    toast.success(`🔥 Burned ${coinsToBurn} King Coins for ₹${rupeeDiscount} food credit added to wallet!`);
  };

  // Pre-approved Loan / Credit Card Lead Application Modal
  const [selectedLoanProduct, setSelectedLoanProduct] = useState<{
    id: string;
    name: string;
    category: string;
    partnerNbfc: string;
    maxLimit: string;
    interestRate: string;
    tenureRange: string;
    speedText: string;
    ownerCommission: string;
    benefit: string;
    leadId: string;
    whatsappUrl: string;
    partnerUrl: string;
  } | null>(null);

  // Interactive Loan EMI & Eligibility Calculator
  const [calcAmount, setCalcAmount] = useState(100000);
  const [calcTenure, setCalcTenure] = useState(12);
  const [simulatedCibilScore, setSimulatedCibilScore] = useState(785);
  const [calcCategory, setCalcCategory] = useState<"personal" | "business" | "bike" | "card" | "bajaj">("personal");
  const [selectedBajajOfferCategory, setSelectedBajajOfferCategory] = useState<"all" | "electronics" | "home" | "business" | "health" | "vehicle" | "lifestyle">("all");

  const calculateEmi = (principal: number, annualRatePct: number, months: number) => {
    const monthlyRate = annualRatePct / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };

  const handleBiometricPay = (amount: number, recipient: string) => {
    setShowBiometricModal(true);
    setBiometricScanning(true);
    setBiometricSuccess(false);

    setTimeout(() => {
      setBiometricScanning(false);
      setBiometricSuccess(true);
      playSoundboxChime(amount);
      if (amount <= walletBalance) {
        const newBal = walletBalance - amount;
        setWalletBalance(newBal);
        if (typeof window !== "undefined") {
          localStorage.setItem("ok_king_pay_wallet_balance", String(newBal));
        }
      }
      setTimeout(() => {
        setShowBiometricModal(false);
        toast.success(`⚡ Biometric 1-Tap Verified! ₹${amount} paid to ${recipient}`);
        setScratched(false);
        setScratchReward({
          title: "🎉 1-Tap Biometric Cashback!",
          desc: "Rewarded for using military-grade WebAuthn 1-tap checkout.",
          amount: Math.floor(10 + Math.random() * 20),
          coins: 120,
        });
        setShowScratchCard(true);
      }, 900);
    }, 1200);
  };

  // Soundbox Voice Synthesis Chime
  const playSoundboxChime = (amount: number) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const text = `KingPay: ₹${amount} payment successful!`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      } catch {
        // speech synthesis fallback
      }
    }
  };

  // Auto-sync offline transaction queue when connectivity returns
  const syncOfflineQueue = () => {
    if (typeof window === "undefined") return;
    try {
      const rawQueue = localStorage.getItem("ok_offline_tx_queue");
      if (!rawQueue) return;
      const queue = JSON.parse(rawQueue) as Array<{ id: string; amount: number; recipient: string; timestamp: string }>;
      if (Array.isArray(queue) && queue.length > 0) {
        localStorage.removeItem("ok_offline_tx_queue");
        toast.success(`⚡ Reconnected: Synced ${queue.length} offline KingPay transaction${queue.length > 1 ? "s" : ""} to OrderKing core!`);
      }
    } catch {
      // ignore parsing error
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOffline(!navigator.onLine);
    const onOnline = () => {
      setIsOffline(false);
      syncOfflineQueue();
    };
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Run sync check on mount if online
    if (navigator.onLine) {
      syncOfflineQueue();
    }

    // Auto-detect slow 2G connection
    const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
    if (conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") {
      setForce2GMode(true);
    }

    // Refresh offline token every 60s
    const interval = setInterval(() => {
      setOfflineToken(`OKPAY-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`);
    }, 60000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, []);

  const handleAddMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(addAmount, 10);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const newBal = walletBalance + val;
    setWalletBalance(newBal);
    if (typeof window !== "undefined") {
      localStorage.setItem("ok_king_pay_wallet_balance", String(newBal));
    }
    setShowAddMoney(false);
    playSoundboxChime(val);
    toast.success(`₹${val} added to KingPay Wallet! (1-Tap Ready)`);
  };

  const handleScanPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(scanAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amt > walletBalance) {
      toast.error(`Insufficient wallet balance (₹${walletBalance}). Please add money.`);
      return;
    }
    const newBal = walletBalance - amt;
    setWalletBalance(newBal);
    if (typeof window !== "undefined") {
      localStorage.setItem("ok_king_pay_wallet_balance", String(newBal));
      if (effective2G) {
        try {
          const rawQueue = localStorage.getItem("ok_offline_tx_queue") || "[]";
          const queue = JSON.parse(rawQueue);
          queue.push({
            id: `tx_off_${Date.now()}`,
            amount: amt,
            recipient: scanRecipient,
            token: offlineToken,
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem("ok_offline_tx_queue", JSON.stringify(queue));
        } catch {
          // ignore
        }
      }
    }
    setShowScanner(false);
    playSoundboxChime(amt);
    if (effective2G) {
      toast.success(`⚡ Offline Payment Cleared! ₹${amt} paid to ${scanRecipient} (Token: ${offlineToken}). Auto-syncs on reconnect.`);
    } else {
      toast.success(`₹${amt} paid to ${scanRecipient} via KingPay!`);
    }

    // Award scratch card reward
    setScratched(false);
    setScratchReward({
      title: "🎉 Instant Cashback Won!",
      desc: "Rewarded for scanning & paying via KingPay!",
      amount: Math.floor(5 + Math.random() * 20),
      coins: Math.floor(50 + Math.random() * 150),
    });
    setShowScratchCard(true);
  };

  const handleVerifyUpiPin = (pin: string) => {
    if (!selectedBankForBalance) return;
    if (pin.length < 4) {
      toast.error("Please enter your 4-digit UPI PIN");
      return;
    }
    setPinVerifying(true);
    setTimeout(() => {
      setPinVerifying(false);
      const randomBal = selectedBankForBalance.balance || Math.floor(12000 + Math.random() * 85000);
      setBalanceRevealed((prev) => ({
        ...prev,
        [selectedBankForBalance.id]: randomBal,
      }));
      playSoundboxChime(100);
      toast.success(`✅ ${selectedBankForBalance.bankName} balance verified via NPCI UPI!`);
      setSelectedBankForBalance(null);
      setUpiPinInput("");
    }, 850);
  };

  const handleStartAddBank = (bankName: string) => {
    setSelectedBankToAdd(bankName);
    setAddBankStep("sim");
  };

  const handleSimVerification = () => {
    setSimVerifying(true);
    setTimeout(() => {
      setSimVerifying(false);
      const newAccNumber = `•••• ${Math.floor(1000 + Math.random() * 9000)}`;
      const newBank: BankAccount = {
        id: `bank_${Date.now()}`,
        bankName: selectedBankToAdd,
        bankCode: selectedBankToAdd.toLowerCase().replace(/[^a-z]/g, "").slice(0, 5),
        accountNumberMasked: newAccNumber,
        accountType: "Savings",
        isPrimary: false,
        balance: Math.floor(15000 + Math.random() * 50000),
        balanceCheckedAt: "Just now",
        color: "from-emerald-700 to-teal-900",
        icon: "🏛️",
      };
      const updated = [...linkedBanks, newBank];
      setLinkedBanks(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("ok_kingpay_linked_banks", JSON.stringify(updated));
      }
      setAddBankStep("success");
      playSoundboxChime(500);
      toast.success(`🎉 ${selectedBankToAdd} linked successfully to KingPay UPI!`);
    }, 1200);
  };

  const handleSelfTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(selfTransferAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (selfFromBank === selfToBank) {
      toast.error("Source and destination accounts must be different");
      return;
    }
    const fromName = linkedBanks.find((b) => b.id === selfFromBank)?.bankName || "Primary Account";
    const toName = linkedBanks.find((b) => b.id === selfToBank)?.bankName || "Secondary Account";
    playSoundboxChime(amt);
    toast.success(`⚡ Self-Transfer of ₹${amt} from ${fromName} to ${toName} completed via UPI! (0% Fee)`);
    setShowSelfTransferModal(false);
  };

  const handleBuyGold = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(goldAmount, 10);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (val > walletBalance) {
      toast.error(`Insufficient wallet balance. Please add money first.`);
      return;
    }
    const newBal = walletBalance - val;
    setWalletBalance(newBal);
    const addedGrams = Number((val / 7420).toFixed(4));
    const newGold = Number((goldGrams + addedGrams).toFixed(4));
    setGoldGrams(newGold);
    if (typeof window !== "undefined") {
      localStorage.setItem("ok_king_pay_wallet_balance", String(newBal));
      localStorage.setItem("ok_king_pay_gold_grams", String(newGold));
    }
    setShowGoldModal(false);
    playSoundboxChime(val);
    toast.success(`🌟 Bought ${addedGrams}g of 24K 99.9% Pure Gold! Vault balance: ${newGold}g`);
  };

  const claimScratchReward = () => {
    const newBal = walletBalance + scratchReward.amount;
    const newCoins = kingCoins + scratchReward.coins;
    setWalletBalance(newBal);
    setKingCoins(newCoins);
    if (typeof window !== "undefined") {
      localStorage.setItem("ok_king_pay_wallet_balance", String(newBal));
    }
    setShowScratchCard(false);
    toast.success(`Claimed ₹${scratchReward.amount} cashback & +${scratchReward.coins} King Coins!`);
  };

  const shareSplitOnWhatsApp = () => {
    const total = parseInt(splitAmount, 10) || 0;
    const perPerson = Math.round(total / splitCount);
    const text = encodeURIComponent(
      `Hey friends! Your share of our bill is ₹${perPerson} (Total: ₹${total} split ${splitCount} ways). Pay instantly with 0 fees on KingPay: https://orderking.in/king-pay`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const togglePayLater = () => {
    const next = !payLaterActive;
    setPayLaterActive(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("ok_king_pay_later_active", String(next));
    }
    if (next) {
      toast.success("⚡ KingPay Later Activated! ₹2,500 credit limit ready at 0% interest.");
    } else {
      toast.info("KingPay Later deactivated.");
    }
  };

  const claimStreak = () => {
    if (claimedToday) return;
    const bonus = streakDay * 50;
    setKingCoins((prev) => prev + bonus);
    setClaimedToday(true);
    toast.success(`🎉 Claimed +${bonus} King Coins! Streak: Day ${streakDay}`);
    setScratched(false);
    setScratchReward({
      title: "🎁 Daily Streak Mystery Box!",
      desc: "Daily habit bonus powered by Brand Alliance partners.",
      amount: Math.floor(10 + Math.random() * 25),
      coins: 150,
    });
    setShowScratchCard(true);
  };

  const filteredServices = activeTab === "all"
    ? UTILITY_SERVICES
    : UTILITY_SERVICES.filter((s) => s.category === activeTab);

  const effective2G = isOffline || force2GMode;

  const [activeSection, setActiveSection] = useState<KingPaySection>("pay");
  const [garageAlertsCount, setGarageAlertsCount] = useState<number>(2);
  const [transactions, setTransactions] = useState<
    Array<{
      id: string;
      title: string;
      amount: number;
      type: "credit" | "debit";
      timestamp: string;
      status: string;
    }>
  >([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_kingpay_garage_vehicles");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const unpaidChallans = parsed.flatMap((v: any) => v.challans?.filter((c: any) => c.status === "unpaid") || []);
          const expiringIns = parsed.filter((v: any) => v.insurance?.status !== "active");
          const expiringPuc = parsed.filter((v: any) => v.puc?.status !== "valid");
          setGarageAlertsCount(unpaidChallans.length + expiringIns.length + expiringPuc.length);
        } catch {
          // fallback
        }
      }
    }
  }, []);

  const handleDeductWallet = (amount: number, description: string): boolean => {
    if (walletBalance < amount) return false;
    const newBal = walletBalance - amount;
    setWalletBalance(newBal);
    if (typeof window !== "undefined") {
      localStorage.setItem("ok_king_pay_wallet_balance", String(newBal));
    }
    setTransactions((prev) => [
      {
        id: `tx_${Date.now()}`,
        title: description,
        amount: -amount,
        type: "debit",
        timestamp: "Just now",
        status: "success",
      },
      ...prev,
    ]);
    playSoundboxChime(amount);
    return true;
  };

  return (
    <>
      
      <KingPayShell
      walletBalance={walletBalance}
      onAddMoneyClick={() => setShowAddMoney(true)}
      onOpenScannerClick={() => {
        setScannerTab("camera");
        setShowScanner(true);
      }}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      alertsCount={garageAlertsCount}
    >
      <div className="px-3 py-3 sm:px-4 sm:py-4 space-y-3.5">
        {/* If activeSection === "garage", display dedicated VehicleGarageHub */}
        {activeSection === "garage" ? (
          <VehicleGarageHub
            walletBalance={walletBalance}
            onDeductWallet={handleDeductWallet}
            onOpenScanner={() => {
              setScannerTab("camera");
              setShowScanner(true);
            }}
          />
        ) : activeSection === "travel" ? (
          <TravelBookingHub
            walletBalance={walletBalance}
            onDeductWallet={handleDeductWallet}
          />
        ) : activeSection === "loan" ? (
          <MicroLoanHub
            walletBalance={walletBalance}
            onDisburseToWallet={(amount) => {
              const newBal = walletBalance + amount;
              setWalletBalance(newBal);
              if (typeof window !== "undefined") {
                localStorage.setItem("ok_king_pay_wallet_balance", String(newBal));
              }
              setTransactions((prev) => [
                {
                  id: `tx_${Date.now()}`,
                  title: `Micro-Credit Disbursed: ₹${amount.toLocaleString("en-IN")}`,
                  amount: amount,
                  type: "credit",
                  timestamp: "Just now",
                  status: "success",
                },
                ...prev,
              ]);
            }}
          />
        ) : activeSection === "account" ? (
          <KingPayAccountHub
            walletBalance={walletBalance}
            onOpenScanner={() => {
              setScannerTab("camera");
              setShowScanner(true);
            }}
          />
        ) : (
          <>
            {/* Automatic 100% Zero-Risk Offline / 2G Assist (Only displays when connection is genuinely offline or 2G) */}
            {effective2G && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <div>
                  <span className="font-bold">Offline / Low-Network Mode (Auto-Detected)</span>
                  <p className="text-[11px] text-muted">0-Data USSD &amp; Offline Wallet Active</p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded font-bold">
                Token: {offlineToken}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:*99*1*1#"
                className="flex-1 rounded-xl bg-primary py-1.5 text-center text-xs font-bold text-white shadow-xs"
              >
                📞 Dial *99# (Zero-Data USSD)
              </a>
              <a
                href={`sms:9223166166?body=PAY%20ORDERKING%20${walletBalance}`}
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-center text-xs font-semibold text-fg"
              >
                💬 SMS Pay
              </a>
            </div>
          </div>
        )}

        {/* 👑 1,000x STRICT GEOFENCING: In locations where Order King is NOT active, PaidRestaurantAdZone is completely hidden */}
        {isDeliveryActive ? (
          <PaidRestaurantAdZone className="mb-0.5" />
        ) : (
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-neutral-900 to-emerald-500/15 p-3.5 shadow-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-bounce">👑</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-amber-300">
                      Order King Foods Coming Soon to {location.cityName || "Your City"}!
                    </span>
                    <span className="rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.2 border border-amber-500/30">
                      RANK #{waitlistInfo.trendingRank}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Over <strong>{waitlistInfo.waitlistVotes.toLocaleString("en-IN")}</strong> foodies already waiting · Launching in ~{waitlistInfo.estimatedLaunchDays} days.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleVoteCity}
                disabled={hasVotedCity}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{hasVotedCity ? "✓ Voted! +₹50 Added" : "🗳️ Vote for City (+₹50 Bonus)"}</span>
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-1.5">
              <span>🛡️ Geofence Guard: You are on King Pay (100% Free UPI Across India)</span>
              <span className="font-mono text-emerald-400 font-bold">0% Intermediary Fee</span>
            </div>
          </div>
        )}

        {/* 👑 3D GLOWING SWITCH BUTTON + SAME-LEVEL AI SUPPORT */}
        <EcosystemSwitchBar currentApp="KINGPAY" className="mb-1.5" />

        {/* 👑 FULL PHONEPE / PAYTM STYLE FINANCE SEARCH (AUTOPAY, REWARDS, BILLS, LOANS, TRANSFERS, UPI) */}
        <KingPayFinanceSearch
          onOpenScanner={() => {
            setScannerTab("camera");
            setShowScanner(true);
          }}
          onOpenAddMoney={() => setShowAddMoney(true)}
          onOpenSelfTransfer={() => setShowSelfTransferModal(true)}
          onOpenGoldModal={() => setShowGoldModal(true)}
          onOpenScratchCard={() => setShowScratchCard(true)}
          onTogglePayLater={togglePayLater}
          className="mb-2.5"
        />

        {showAddMoney && (
          <form onSubmit={handleAddMoney} className="rounded-xl border border-primary/30 bg-surface/90 p-3 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-fg">Enter amount to add via UPI (Zero PG Fee):</p>
              <button
                type="button"
                onClick={() => setShowAddMoney(false)}
                className="text-xs text-muted hover:text-fg"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                className="w-full rounded-md border border-border bg-bg px-2.5 py-1 text-sm font-mono"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="₹500"
              />
              <Button size="sm" type="submit">Proceed</Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setShowAddMoney(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {/* DUAL PROMINENT HERO: 1. SCAN ANY QR CODE | 2. RECEIVE MONEY & CUSTOM QR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* CARD A: SCAN ANY QR CODE TO PAY */}
          <div
            tabIndex={0}
            role="button"
            aria-label="Scan any QR code"
            onClick={() => {
              setScannerTab("camera");
              setShowScanner(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setScannerTab("camera");
                setShowScanner(true);
              }
            }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/20 via-surface to-amber-500/10 p-4 shadow-md transition-all hover:border-emerald-500 hover:shadow-xl focus:ring-4 focus:ring-emerald-500/40 focus:outline-none active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <span className="flex size-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  👑 1-Tap QR Scanner
                </span>
              </div>
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300">
                ⚡ 0% FEES
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative shrink-0 rounded-2xl bg-gradient-to-tr from-[#0D3B2E] via-emerald-800 to-[#07241C] p-2 shadow-lg ring-2 ring-emerald-400/40 group-hover:scale-105 transition-transform duration-200">
                <ScannerVisualGraphic className="size-14 sm:size-16" />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-amber-400 p-0.5 text-[9px] shadow-sm">
                  ⚡
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-display text-base sm:text-lg font-black text-fg tracking-tight group-hover:text-primary transition">
                  Scan Any QR Code
                </h3>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Camera QR Scanner
                </p>
                <p className="text-[11px] text-muted mt-0.5 leading-tight">
                  Point at any shop, merchant or friend QR to pay instantly
                </p>
              </div>

              <div className="shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-primary px-3 py-2 text-xs font-extrabold text-white shadow-sm">
                <span>📷 Scan</span>
              </div>
            </div>
          </div>

          {/* CARD B: RECEIVE MONEY & CUSTOM QR (LUXURY GIFTING & NOTES) */}
          <div
            tabIndex={0}
            role="button"
            aria-label="Receive money and create custom QR"
            onClick={() => setShowReceiveQrModal(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowReceiveQrModal(true);
              }
            }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/20 via-surface to-rose-500/10 p-4 shadow-md transition-all hover:border-amber-500 hover:shadow-xl focus:ring-4 focus:ring-amber-500/40 focus:outline-none active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <span className="flex size-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  ✨ Custom QR Studio
                </span>
              </div>
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[9px] font-extrabold text-amber-800 dark:text-amber-300">
                🧧 6 LUXURY STYLES
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative shrink-0 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-2.5 shadow-lg ring-2 ring-amber-400/40 text-black group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
                <span className="text-3xl">📲</span>
                <span className="absolute -bottom-1 -right-1 rounded-full bg-rose-500 text-white p-0.5 text-[9px] shadow-sm">
                  🎁
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-display text-base sm:text-lg font-black text-fg tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  Receive Money &amp; QR
                </h3>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  Custom Amounts &amp; Notes
                </p>
                <p className="text-[11px] text-muted mt-0.5 leading-tight">
                  Free universal QR for Shagun, Gifts, Splits &amp; Shops
                </p>
              </div>

              <div className="shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 text-xs font-extrabold text-slate-950 shadow-sm">
                <span>📲 My QR</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 CORE DAILY MONEY TRANSFER & BANK ACTIONS */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {/* 1. To Mobile / Phone Number */}
          <button
            type="button"
            onClick={() => setActiveUtilityModal("contact")}
            className="flex flex-col items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/10 to-surface p-2.5 sm:p-3 text-center transition hover:border-blue-500 hover:shadow-md active:scale-95 shadow-xs group"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-500 text-white text-xl mb-1.5 shadow-sm group-hover:scale-105 transition">
              👤
            </span>
            <span className="text-xs font-black text-fg leading-tight">To Mobile</span>
            <span className="text-[10px] text-muted leading-tight mt-0.5">Phone Number</span>
          </button>

          {/* 2. To Bank / UPI ID */}
          <button
            type="button"
            onClick={() => setActiveUtilityModal("upi")}
            className="flex flex-col items-center justify-center rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-surface p-2.5 sm:p-3 text-center transition hover:border-purple-500 hover:shadow-md active:scale-95 shadow-xs group"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-purple-600 text-white text-xl mb-1.5 shadow-sm group-hover:scale-105 transition">
              🏦
            </span>
            <span className="text-xs font-black text-fg leading-tight">To Bank A/C</span>
            <span className="text-[10px] text-muted leading-tight mt-0.5">A/C No. &amp; IFSC</span>
          </button>

          {/* 3. Self Transfer Between Own Bank Accounts */}
          <button
            type="button"
            onClick={() => setShowSelfTransferModal(true)}
            className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-surface p-2.5 sm:p-3 text-center transition hover:border-amber-500 hover:shadow-md active:scale-95 shadow-xs group"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-500 text-white text-xl mb-1.5 shadow-sm group-hover:scale-105 transition">
              🔄
            </span>
            <span className="text-xs font-black text-fg leading-tight">Self Transfer</span>
            <span className="text-[10px] text-muted leading-tight mt-0.5">Between A/Cs</span>
          </button>

          {/* 4. Check Bank Balance */}
          <button
            type="button"
            onClick={() => {
              setSelectedBankForBalance(linkedBanks[0] || null);
              setUpiPinInput("");
              setShowCheckBalanceModal(true);
            }}
            className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-surface p-2.5 sm:p-3 text-center transition hover:border-emerald-500 hover:shadow-md active:scale-95 shadow-xs group"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white text-xl mb-1.5 shadow-sm group-hover:scale-105 transition">
              💳
            </span>
            <span className="text-xs font-black text-fg leading-tight">Check Balance</span>
            <span className="text-[10px] text-emerald-600 font-bold leading-tight mt-0.5">Bank &amp; Wallet</span>
          </button>
        </div>

        {/* LINKED BANK ACCOUNTS & QUICK BALANCE CARD (DAILY NEEDY) */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <div>
                <h3 className="font-display text-sm font-bold text-fg">Linked Bank Accounts</h3>
                <p className="text-[11px] text-muted">Direct UPI transfer &amp; real-time balance inquiry</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddBankStep("select");
                setShowAddBankModal(true);
              }}
              className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition"
            >
              <span>➕ Add Bank Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {linkedBanks.map((bank) => (
              <div
                key={bank.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface-2/60 p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-lg">
                    {bank.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-fg">{bank.bankName}</span>
                      {bank.isPrimary && (
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-muted">{bank.accountType} A/C {bank.accountNumberMasked}</span>
                  </div>
                </div>

                <div>
                  {balanceRevealed[bank.id] !== undefined ? (
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-600 font-bold block">Available</span>
                      <span className="font-mono text-sm font-black text-fg">
                        ₹{balanceRevealed[bank.id].toLocaleString("en-IN")}.00
                      </span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBankForBalance(bank);
                        setUpiPinInput("");
                        setShowCheckBalanceModal(true);
                      }}
                      className="text-xs font-semibold py-1 px-2.5 border-primary/40 text-primary hover:bg-primary/10"
                    >
                      Check Balance
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* UPI ID Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-border/40">
            <div className="flex items-center gap-1.5 text-muted">
              <span>My UPI ID:</span>
              <code className="font-mono font-bold text-fg bg-surface-2 px-2 py-0.5 rounded">
                user9876@kingpay
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText("user9876@kingpay");
                  toast.success("UPI ID copied to clipboard!");
                }}
                className="text-[11px] text-primary font-bold hover:underline"
              >
                Copy
              </button>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              ⚡ 24x7 Instant Settlement
            </span>
          </div>
        </div>

        {/* QUICK JUMP: VEHICLE GARAGE & RTO COMPLIANCE */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveSection("garage")}
          className="group cursor-pointer rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-surface to-surface p-4 shadow-sm hover:border-amber-500 hover:shadow-md transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl group-hover:scale-105 transition">
              🚗
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-fg">
                  Vehicle Garage &amp; RTO Compliance
                </h3>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  MoRTH Radar
                </span>
                {garageAlertsCount > 0 && (
                  <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[9px] font-bold text-white animate-pulse">
                    {garageAlertsCount} Action Required
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                Check traffic e-challans, 0-paperwork insurance renewal, PUC expiry &amp; FASTag
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-primary">
            <span>Manage</span>
            <span>➔</span>
          </div>
        </div>

        {/* QUICK JUMP: PLANET'S LOWEST FARE FLIGHTS & TRAVEL HUB */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveSection("travel")}
          className="group cursor-pointer rounded-2xl border-2 border-sky-500/40 bg-gradient-to-r from-sky-500/15 via-blue-500/5 to-surface p-4 shadow-sm hover:border-sky-500 hover:shadow-md transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-sky-500/20 text-2xl group-hover:scale-105 transition">
              ✈️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-fg">
                  Planet's Lowest Price Flights &amp; Travel
                </h3>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  ₹0 Convenience Fee
                </span>
                <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                  2x Price Match
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Wholesale GDS fares, split-ticketing optimizer, IRCTC tatkal radar, buses &amp; cabs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">
            <span>Explore</span>
            <span>➔</span>
          </div>
        </div>

        {/* QUICK JUMP: KINGPAY SOVEREIGN MICRO-CREDIT LINE */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveSection("loan")}
          className="group cursor-pointer rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 via-blue-500/5 to-surface p-4 shadow-sm hover:border-cyan-500 hover:shadow-md transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-cyan-500/20 text-2xl group-hover:scale-105 transition">
              💳
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-fg">
                  Sovereign Credit Line &amp; Micro-Loans
                </h3>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  0% Interest
                </span>
                <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                  ₹50,000 Limit
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Instant ₹1,000 – ₹50,000 pre-approved credit disbursed directly to your King Pay Wallet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
            <span>Apply</span>
            <span>➔</span>
          </div>
        </div>

        {/* EVERYDAY NEEDS & UTILITY BILLS (ORGANIZED AT THE TOP) */}
        <section aria-label="Everyday Needs & Bills" className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div>
              <h2 className="font-display text-base font-bold text-fg">Everyday Needs &amp; Utility Bills</h2>
              <p className="text-xs text-muted">Instant recharge &amp; bill payments with 0 convenience fee</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              ⚡ Instant BBPS
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8">
            <button
              type="button"
              onClick={() => setActiveUtilityModal("recharge")}
              className="flex flex-col items-center justify-center rounded-xl p-2 text-center transition hover:bg-surface-2 active:scale-95"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 text-2xl mb-1 shadow-xs">
                📱
              </span>
              <span className="text-[11px] font-semibold text-fg leading-tight">Mobile Recharge</span>
              <span className="text-[9px] text-emerald-600 font-bold mt-0.5">2% Back</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveUtilityModal("electricity")}
              className="flex flex-col items-center justify-center rounded-xl p-2 text-center transition hover:bg-surface-2 active:scale-95"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 text-2xl mb-1 shadow-xs">
                ⚡
              </span>
              <span className="text-[11px] font-semibold text-fg leading-tight">Electricity Bill</span>
              <span className="text-[9px] text-muted mt-0.5">APDCL</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveUtilityModal("dth")}
              className="flex flex-col items-center justify-center rounded-xl p-2 text-center transition hover:bg-surface-2 active:scale-95"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 text-2xl mb-1 shadow-xs">
                📡
              </span>
              <span className="text-[11px] font-semibold text-fg leading-tight">DTH / Cable</span>
              <span className="text-[9px] text-muted mt-0.5">Tata/Airtel</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveUtilityModal("gas")}
              className="flex flex-col items-center justify-center rounded-xl p-2 text-center transition hover:bg-surface-2 active:scale-95"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-600 text-2xl mb-1 shadow-xs">
                🛢️
              </span>
              <span className="text-[11px] font-semibold text-fg leading-tight">LPG Cylinder</span>
              <span className="text-[9px] text-muted mt-0.5">Indane/HP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveUtilityModal("fastag")}
              className="flex flex-col items-center justify-center rounded-xl p-2 text-center transition hover:bg-surface-2 active:scale-95"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-600 text-2xl mb-1 shadow-xs">
                🚗
              </span>
              <span className="text-[11px] font-semibold text-fg leading-tight">FASTag</span>
              <span className="text-[9px] text-muted mt-0.5">All Banks</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveUtilityModal("water")}
              className="flex flex-col items-center justify-center rounded-xl p-2 text-center transition hover:bg-surface-2 active:scale-95"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-600 text-2xl mb-1 shadow-xs">
                💧
              </span>
              <span className="text-[11px] font-semibold text-fg leading-tight">Water Tax</span>
              <span className="text-[9px] text-muted mt-0.5">Municipal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveUtilityModal("broadband")}
              className="flex flex-col items-center justify-center rounded-xl p-2 text-center transition hover:bg-surface-2 active:scale-95"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-600 text-2xl mb-1 shadow-xs">
                🌐
              </span>
              <span className="text-[11px] font-semibold text-fg leading-tight">Broadband</span>
              <span className="text-[9px] text-muted mt-0.5">Jio/Airtel</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveUtilityModal("card")}
              className="flex flex-col items-center justify-center rounded-xl p-2 text-center transition hover:bg-surface-2 active:scale-95"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 text-2xl mb-1 shadow-xs">
                💳
              </span>
              <span className="text-[11px] font-semibold text-fg leading-tight">Credit Card</span>
              <span className="text-[9px] text-muted mt-0.5">Instant Pay</span>
            </button>
          </div>
        </section>

        {/* 24K Digital Gold Partner Vault (SafeGold / MMTC-PAMP style) */}
        <div className="rounded-[var(--radius-xl)] border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-surface to-surface p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-lg">
                🪙
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-fg">24K Digital Gold Vault</h3>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.2 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                    Live: ₹7,420/gm · 99.9% Pure
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Vault Balance: <span className="font-semibold text-fg">{goldGrams} gm</span> (Value: ₹{Math.round(goldGrams * 7420)}) · Start from ₹1
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowGoldModal(true)}
              className="text-xs font-semibold border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/10"
            >
              Buy Gold
            </Button>
          </div>
        </div>

        {/* Split Bill with Friends (Compact Smart Card) */}
        <div className="rounded-2xl border border-border bg-surface p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-base">
                👥
              </span>
              <div>
                <h3 className="font-display text-xs font-bold text-fg">Split Bill with Friends</h3>
                <p className="text-[10px] text-muted">Instant WhatsApp link with 0 math</p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">Instant WhatsApp</span>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <div className="w-28">
              <input
                type="number"
                value={splitAmount}
                onChange={(e) => setSplitAmount(e.target.value)}
                placeholder="₹ Amount"
                className="w-full rounded-lg border border-border bg-bg px-2.5 py-1 text-xs font-mono"
              />
            </div>
            <div className="flex gap-1 flex-1">
              {[2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSplitCount(cnt)}
                  className={`flex-1 rounded border py-1 text-[11px] font-semibold transition ${splitCount === cnt ? "bg-primary text-white border-primary" : "border-border bg-surface-2 text-muted"}`}
                >
                  {cnt}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={shareSplitOnWhatsApp}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 transition flex items-center gap-1 shadow-xs shrink-0"
            >
              <span>💬 Split</span>
              <span>(₹{Math.round((parseInt(splitAmount, 10) || 0) / splitCount)})</span>
            </button>
          </div>
        </div>

        {/* 100x High-Speed Instant Loans & Micro-Credit Engine (Navi / KreditBee / Lendingkart) */}
        <div className="rounded-[var(--radius-xl)] border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-surface to-surface p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/20 text-xl">
                ⚡
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-fg">Instant Pre-Approved Loans</h3>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    CIBIL 785 · Pre-Approved
                  </span>
                </div>
                <p className="text-xs text-muted">
                  2-Minute Digital KYC · Instant UPI/Bank Disbursal · Zero Paperwork · 100% RBI Regulated
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Instant Disbursal Active</span>
            </div>
          </div>

          {/* Interactive Loan EMI & Eligibility Calculator */}
          <div className="rounded-xl border border-indigo-500/20 bg-surface/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fg">🧮 Interactive Loan &amp; EMI Calculator</span>
              <span className="text-[11px] font-mono text-muted">Estimated Rate: 9.9% p.a.</span>
            </div>

            {/* Slider 1: Loan Amount */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted font-medium">Desired Loan Amount:</span>
                <span className="font-mono font-extrabold text-sm text-primary">₹{calcAmount.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min={10000}
                max={1000000}
                step={10000}
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between gap-1 pt-1">
                {[50000, 100000, 250000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCalcAmount(amt)}
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold transition ${calcAmount === amt ? "bg-primary text-white" : "bg-surface-2 text-muted hover:bg-accent"}`}
                  >
                    ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}K`}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Tenure */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted font-medium">Tenure (Months):</span>
                <span className="font-mono font-extrabold text-sm text-fg">{calcTenure} Months</span>
              </div>
              <input
                type="range"
                min={3}
                max={36}
                step={3}
                value={calcTenure}
                onChange={(e) => setCalcTenure(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between gap-1 pt-1">
                {[3, 6, 12, 24, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCalcTenure(m)}
                    className={`rounded px-2.5 py-0.5 text-[10px] font-mono font-semibold transition ${calcTenure === m ? "bg-indigo-600 text-white" : "bg-surface-2 text-muted hover:bg-accent"}`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Live EMI Result Display */}
            <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted">Estimated Monthly EMI:</p>
                <p className="font-mono text-base font-extrabold text-indigo-700 dark:text-indigo-300">
                  ₹{calculateEmi(calcAmount, 9.9, calcTenure).toLocaleString("en-IN")} / mo
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted">Total Repayment:</p>
                <p className="font-mono text-xs font-bold text-fg">
                  ₹{(calculateEmi(calcAmount, 9.9, calcTenure) * calcTenure).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Slider 3: CIBIL Score & Instant Pre-Approval Dial */}
            <div className="space-y-1.5 pt-1 border-t border-indigo-500/20">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted font-medium">Your CIBIL Score Dial:</span>
                <span className={`font-mono font-extrabold text-sm ${simulatedCibilScore >= 750 ? "text-emerald-600" : simulatedCibilScore >= 650 ? "text-indigo-600" : "text-amber-600"}`}>
                  {simulatedCibilScore} ({simulatedCibilScore >= 750 ? "Super-Prime Pre-Approved" : simulatedCibilScore >= 650 ? "Good Approval Rate" : "100% Guaranteed FD-Backed"})
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={900}
                step={5}
                value={simulatedCibilScore}
                onChange={(e) => setSimulatedCibilScore(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-muted font-mono">
                <span>300 (New to Credit)</span>
                <span>650 (Average)</span>
                <span>750+ (Super Prime)</span>
                <span>900 (Perfect)</span>
              </div>
            </div>

            {/* Dynamic Mutual Benefit & Owner Yield Card */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                <span>🤝 Customer Benefit:</span>
                <span>
                  {simulatedCibilScore >= 750
                    ? "0% Interest / 9.9% p.a. · Instant Disbursal in 20 Mins"
                    : simulatedCibilScore >= 650
                    ? "Fast Digital Approval · Low Documentation"
                    : "100% Guaranteed Approval (Zero Rejections)"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-semibold border-t border-emerald-500/20 pt-1">
                <span>🛡️ Zero Hidden Charges:</span>
                <span>100% Transparent · Zero Foreclosure Penalty · Instant Bank Disbursal</span>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "personal", label: "⚡ Personal Cash", count: "2 NBFCs" },
              { id: "bajaj", label: "🌟 Bajaj Finserv 0% EMI", count: "Top 20 Offers" },
              { id: "business", label: "🏬 Kirana & MSME", count: "2 Partners" },
              { id: "bike", label: "🛵 Delivery Bikes", count: "Riders Special" },
              { id: "card", label: "💳 0% Credit Cards", count: "3 Banks" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCalcCategory(tab.id as typeof calcCategory)}
                className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  calcCategory === tab.id
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "border-border bg-surface text-muted hover:bg-surface-2"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${calcCategory === tab.id ? "bg-white/20 text-white" : "bg-surface-2 text-muted-foreground"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filtered Loan Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {LOAN_PRODUCTS.filter((p) => p.category === calcCategory).map((product) => {
              const leadCode = `OK-LEAD-${Math.floor(100000 + Math.random() * 900000)}`;
              return (
                <div
                  key={product.id}
                  className="rounded-xl border border-border bg-surface p-3.5 flex flex-col justify-between space-y-2 hover:border-primary/50 transition-colors shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-display font-bold text-xs text-fg">{product.name}</h4>
                          <span className="rounded bg-indigo-500/10 px-1.5 py-0.2 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                            {product.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted">{product.partnerNbfc}</p>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        {product.speedText}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-2/60 p-2 text-[11px] font-mono">
                      <div>
                        <span className="text-muted block text-[10px]">Max Limit:</span>
                        <span className="font-bold text-fg">{product.maxLimit}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">Interest Rate:</span>
                        <span className="font-bold text-emerald-600">{product.interestRate}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted">{product.benefit}</p>

                    <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between">
                      <span>🎁 Customer Welcome Perk:</span>
                      <span>+150 King Coins &amp; 0% Processing Fee</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedLoanProduct({
                        id: product.id,
                        name: product.name,
                        category: product.category,
                        partnerNbfc: product.partnerNbfc,
                        maxLimit: product.maxLimit,
                        interestRate: product.interestRate,
                        tenureRange: product.tenureRange,
                        speedText: product.speedText,
                        ownerCommission: product.ownerCommission,
                        benefit: product.benefit,
                        leadId: leadCode,
                        whatsappUrl: `https://wa.me/919223166166?text=${encodeURIComponent(
                          `VIP LOAN DISBURSAL REQUEST:\nProduct: ${product.name}\nPartner: ${product.partnerNbfc}\nAmount: ₹${calcAmount}\nTenure: ${calcTenure} months\nLead ID: ${leadCode}\nPlease disburse immediately via 1-tap KYC.`
                        )}`,
                        partnerUrl: product.partnerUrl,
                      })
                    }
                    className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-white hover:bg-primary/90 transition text-center shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Instant 2-Min Approval</span>
                    <span>↗</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* 🌟 Top 20 Bajaj Finserv Mutual Benefit Offers Showcase */}
          <div className="rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-surface to-indigo-500/5 p-4 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-500/20 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm">
                    B
                  </span>
                  <h3 className="font-display font-extrabold text-base text-fg">
                    Bajaj Finserv No-Cost EMI &amp; Micro-Credit Hub
                  </h3>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    India&apos;s #1 NBFC
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">
                  Top 20 pre-approved mutual benefit offers: 0% Interest No-Cost EMI, ₹0 down payment &amp; 60-second activation. Customer gets effortless purchasing power; OrderKing earns top guaranteed affiliate commission.
                </p>
              </div>
              <div className="flex-shrink-0">
                <a
                  href="https://www.bajajfinserv.in/insta-emi-card?utm_source=orderking_affiliate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
                >
                  <span>⚡ Activate ₹2L Insta EMI Card</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Offer Category Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: "all", label: "All Offers (20)" },
                { id: "electronics", label: "📱 Gadgets (4)" },
                { id: "home", label: "🏠 Home & Kitchen (3)" },
                { id: "business", label: "🏬 Kirana & Kitchen (3)" },
                { id: "health", label: "🏥 Health & Medical (3)" },
                { id: "vehicle", label: "🛵 2-Wheeler / EV (3)" },
                { id: "lifestyle", label: "💳 Lifestyle & Cards (4)" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedBajajOfferCategory(c.id as typeof selectedBajajOfferCategory)}
                  className={`flex-shrink-0 rounded-lg px-2.5 py-1 font-semibold transition text-[11px] ${
                    selectedBajajOfferCategory === c.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-surface border border-border text-muted hover:bg-surface-2"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Grid of Top 20 Offers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {BAJAJ_TOP_20_OFFERS.filter(
                (o) => selectedBajajOfferCategory === "all" || o.category === selectedBajajOfferCategory
              ).map((offer) => {
                const bajajLeadCode = `OK-BAJAJ-${Math.floor(100000 + Math.random() * 900000)}`;
                return (
                  <div
                    key={offer.id}
                    className="rounded-xl border border-border bg-surface p-3 flex flex-col justify-between space-y-2 hover:border-indigo-500/50 hover:shadow-xs transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{offer.icon}</span>
                          <h4 className="font-display font-bold text-xs text-fg leading-tight">
                            {offer.title}
                          </h4>
                        </div>
                        <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                          {offer.badge}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-2/60 p-1.5 text-[10px] font-mono">
                        <div>
                          <span className="text-muted block">Limit:</span>
                          <span className="font-bold text-fg">{offer.limitText}</span>
                        </div>
                        <div>
                          <span className="text-muted block">Tenure:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{offer.tenure}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-muted leading-relaxed">
                        <span className="font-semibold text-fg">Customer Benefit: </span>
                        {offer.customerBenefit}
                      </p>

                      <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between">
                        <span>🎁 Customer Reward:</span>
                        <span>No-Cost EMI + Free Insurance Voucher</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedLoanProduct({
                          id: offer.id,
                          name: offer.title,
                          category: "bajaj",
                          partnerNbfc: "Bajaj Finance Ltd / Bajaj Finserv",
                          maxLimit: offer.limitText,
                          interestRate: "0% Interest (No-Cost EMI) / 9.5% p.a.",
                          tenureRange: offer.tenure,
                          speedText: offer.badge,
                          ownerCommission: offer.ownerCommission,
                          benefit: offer.customerBenefit,
                          leadId: bajajLeadCode,
                          whatsappUrl: `https://wa.me/919223166166?text=${encodeURIComponent(
                            `VIP BAJAJ FINSERV OFFER APPLICATION:\nOffer: ${offer.title}\nLimit: ${offer.limitText}\nTenure: ${offer.tenure}\nLead ID: ${bajajLeadCode}\nPlease activate with 0% No-Cost EMI immediately.`
                          )}`,
                          partnerUrl: offer.instantApplyUrl,
                        })
                      }
                      className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-1.5 text-xs font-bold text-white transition text-center shadow-xs flex items-center justify-center gap-1"
                    >
                      <span>Check 1-Tap Eligibility</span>
                      <span>↗</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🛡️ Statutory RBI Digital Lending LSP Disclaimer (Zero Liability Guarantee) */}
          <div className="rounded-xl border border-border bg-surface-2/40 p-3 text-[11px] text-muted space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-fg">
              <span>🛡️</span>
              <span>RBI Digital Lending Guidelines (2022/2023) Compliance &amp; Non-Liability Disclosure</span>
            </div>
            <p>
              OrderKing operates strictly as an RBI-compliant Technology Service Provider / Lending Service Provider (LSP) and affiliate aggregator. OrderKing is NOT a Non-Banking Financial Company (NBFC) or Bank. All loans, credit lines, interest rates, underwriting, KYC validation, fund disbursals, and loan repayments are handled directly and exclusively by our RBI-registered NBFC and Scheduled Commercial Bank partners (Bajaj Finance Ltd, Navi Finserv, Krazybee Services, Lendingkart, Hero FinCorp, HDFC Bank, SBI Cards, IDFC FIRST Bank).
            </p>
            <p className="text-[10px] text-muted-foreground">
              OrderKing does not underwrite loans, does not collect debt or EMIs, and bears ZERO financial or legal liability for customer defaults, late repayments, or credit outcomes.
            </p>
          </div>
        </div>

        {/* Smart Bill Due Reminders & UPI Autopay (PhonePe / Paytm style) */}
        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-lg">
                🔔
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-fg">Upcoming Bill Due Alerts</h3>
                <p className="text-xs text-muted">Never miss a due date · 1-Tap Autopay with King Coins reward</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 rounded-full px-2 py-0.5">2 Bills Pending</span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-surface-2/60 p-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-xs font-bold text-fg">APDCL Electricity Bill (Consumer #7890124)</p>
                  <p className="text-[11px] text-amber-600 font-semibold">Due in 3 days · ₹840.00</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  toast.success("APDCL Bill Paid via KingPay! +50 King Coins Earned.");
                  playSoundboxChime(840);
                }}
                className="text-xs font-bold py-1 px-3"
              >
                Pay ₹840
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface-2/60 p-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📶</span>
                <div>
                  <p className="text-xs font-bold text-fg">Airtel Xstream Fiber Wi-Fi (Acct #984102)</p>
                  <p className="text-[11px] text-muted">Due in 6 days · ₹799.00</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast.success("Airtel Fiber Paid via KingPay! +40 King Coins Earned.");
                  playSoundboxChime(799);
                }}
                className="text-xs font-bold py-1 px-3"
              >
                Pay ₹799
              </Button>
            </div>
          </div>
        </div>

        {/* Multi-Bank Account Interoperability (BHIM / PhonePe style) */}
        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-surface-2 text-lg">
                🏦
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-fg">Linked Bank Accounts</h3>
                <p className="text-xs text-muted">NPCI UPI Interoperable · Direct Bank-to-Bank Transfer</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">3 Accounts Active</span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { bank: "State Bank of India", acct: "****3912", bal: "₹34,200.00", icon: "🏛️" },
              { bank: "HDFC Bank", acct: "****7741", bal: "₹52,450.00", icon: "🏢" },
              { bank: "Assam Gramin Vikash", acct: "****8820", bal: "₹18,900.00", icon: "🌾" },
            ].map((b) => (
              <div key={b.acct} className="rounded-lg border border-border bg-surface-2/40 p-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>{b.icon}</span>
                    <span className="text-xs font-bold text-fg">{b.bank}</span>
                  </div>
                  <p className="text-[11px] text-muted font-mono">{b.acct}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info(`${b.bank} (${b.acct}) Balance: ${b.bal}`)}
                  className="rounded border border-border bg-surface px-2 py-1 text-[10px] font-bold text-primary hover:bg-surface-2 transition"
                >
                  Check Bal
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Navi-Style "KingPay Later" Card */}
        <div className="rounded-[var(--radius-xl)] border border-primary/25 bg-gradient-to-r from-primary/10 via-surface to-surface p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-lg">
                ⚡
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-fg">KingPay Later</h3>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    0% Interest for 15 Days
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {payLaterActive
                    ? `Approved Credit Limit: ₹${payLaterLimit.toLocaleString("en-IN")}.00 | 1-Tap Ready`
                    : "Instant ₹2,500 credit limit. No bank documents. Zero interest."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={payLaterActive ? "outline" : "primary"}
              onClick={togglePayLater}
              className="text-xs font-semibold"
            >
              {payLaterActive ? "Active ✓" : "Activate"}
            </Button>
          </div>
        </div>

        {/* CRED-Style 7-Day Habit Streak & Dopamine Coins */}
        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-fg">👑 Daily Check-in Streak</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                  {kingCoins} King Coins
                </span>
              </div>
              <p className="text-xs text-muted">
                Check in daily to earn coins & unlock Mystery Scratch Cards!
              </p>
            </div>
            <Button
              size="sm"
              variant={claimedToday ? "outline" : "primary"}
              onClick={claimStreak}
              disabled={claimedToday}
              className="text-xs font-semibold"
            >
              {claimedToday ? "Claimed ✓" : "Claim +150 Coins"}
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const isPast = day < streakDay;
              const isCurrent = day === streakDay;
              return (
                <div
                  key={day}
                  className={`rounded-lg border py-2 text-xs transition ${
                    isPast
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : isCurrent
                        ? "border-primary bg-primary text-white font-bold shadow-xs"
                        : "border-border bg-surface-2/40 text-muted"
                  }`}
                >
                  <span className="block text-[10px]">D{day}</span>
                  <span className="font-mono text-[11px]">{day === 7 ? "🎁" : `+${day * 50}`}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🎰 CRED & Paytm-Style Customer Addiction & Gamification Hub */}
        <div className="rounded-[var(--radius-xl)] border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/15 via-surface to-indigo-500/10 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-purple-600 text-white text-xl shadow-xs">
                🎰
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-fg">Lucky Jackpot &amp; VIP Club</h3>
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                    Dopamine Rewards
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Spin daily for guaranteed cash, burn coins for instant food discounts, and climb VIP tiers!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSpinWheel(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs active:scale-98"
              >
                <span>🎰 Spin Lucky Jackpot</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded">Free / 100 🪙</span>
              </button>
            </div>
          </div>

          {/* VIP Milestone Tier & Multiplier */}
          {(() => {
            const tier = getVipTier(kingCoins);
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`rounded-xl border p-3 ${tier.color} space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <span>{tier.icon}</span>
                      <span>{tier.name}</span>
                    </span>
                    <span className="text-[10px] font-black uppercase font-mono">{tier.multiplier} Coins</span>
                  </div>
                  <p className="text-[11px] font-semibold">{tier.perk}</p>
                </div>

                {/* Coin Burn Option 1 */}
                <div className="rounded-xl border border-border bg-surface p-3 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-fg">
                      <span>🔥 Fast Food Burn</span>
                      <span className="font-mono text-emerald-600 font-extrabold">-₹10.00</span>
                    </div>
                    <p className="text-[10px] text-muted">Redeem 100 King Coins for instant ₹10 food wallet credit.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBurnCoinsForFood(100, 10)}
                    className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-1 text-xs font-bold transition"
                  >
                    Burn 100 Coins → ₹10
                  </button>
                </div>

                {/* Coin Burn Option 2 */}
                <div className="rounded-xl border border-border bg-surface p-3 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-fg">
                      <span>👑 Royal Feast Burn</span>
                      <span className="font-mono text-emerald-600 font-extrabold">-₹50.00</span>
                    </div>
                    <p className="text-[10px] text-muted">Redeem 500 King Coins for instant ₹50 food wallet credit.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBurnCoinsForFood(500, 50)}
                    className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white py-1 text-xs font-bold transition"
                  >
                    Burn 500 Coins → ₹50
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ⛽ HPCL, IndianOil & BPCL Fuel Advantage Hub */}
        <div className="rounded-[var(--radius-xl)] border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-surface to-orange-500/10 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-black text-xl shadow-xs font-bold">
                ⛽
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-fg">
                    Fuel &amp; Petro Alliances (HPCL · IndianOil · BPCL)
                  </h3>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                    Up to 8.25% Savings
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Official co-branded fuel cards, instant digital vouchers, and delivery fleet rebates (Zero Platform Markup)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full">
                ⛽ Petrol: ₹98.40 · Diesel: ₹88.20
              </span>
            </div>
          </div>

          {/* 1. Interactive Annual Fuel Savings Calculator */}
          <div className="rounded-xl border border-border bg-surface p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-fg flex items-center gap-1.5">
                  <span>📊 Fuel Savings &amp; Cashback Calculator</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">(Annual Projection)</span>
                </h4>
                <p className="text-[11px] text-muted">Calculate how much you save using partner fuel cards &amp; KingPay vouchers</p>
              </div>
              <span className="font-mono text-sm font-extrabold text-primary">₹{monthlyFuelSpend.toLocaleString("en-IN")} / mo</span>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={monthlyFuelSpend}
                onChange={(e) => setMonthlyFuelSpend(parseInt(e.target.value, 10))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted font-mono">
                <span>₹1,000 (Bike)</span>
                <span>₹5,000 (Car/Rider)</span>
                <span>₹10,000 (SUV)</span>
                <span>₹15,000 (Fleet)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="rounded-lg bg-surface-2/60 p-2.5 border border-border">
                <span className="text-[10px] text-muted block uppercase font-bold">Annual Fuel Spend</span>
                <span className="font-mono text-sm font-extrabold text-fg">₹{(monthlyFuelSpend * 12).toLocaleString("en-IN")}</span>
                <span className="text-[10px] text-muted block mt-0.5">Across all pumps</span>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block uppercase font-bold">Cashback &amp; Surcharge Saved</span>
                <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                  ₹{Math.round(monthlyFuelSpend * 12 * 0.0825).toLocaleString("en-IN")} / yr
                </span>
                <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">8.25% Net Value Back</span>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-2.5 border border-amber-500/30">
                <span className="text-[10px] text-amber-800 dark:text-amber-200 block uppercase font-bold">King Coins Earned</span>
                <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                  +{(monthlyFuelSpend * 12 * 0.02 * 10).toLocaleString("en-IN")} 🪙
                </span>
                <span className="text-[10px] text-amber-600 font-medium block mt-0.5">Burn for food discounts</span>
              </div>
            </div>
          </div>

          {/* 2. Instant Digital Fuel Vouchers Simulator */}
          <div className="rounded-xl border border-border bg-surface p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 className="text-xs font-bold text-fg">⚡ Instant Digital Fuel Vouchers (2% King Coins Back)</h4>
                <p className="text-[11px] text-muted">Generate instant barcode / QR voucher redeemable at pump POS in 5 seconds</p>
              </div>
              <div className="flex gap-1">
                {(["HPCL (HP Pay)", "IndianOil (IOCL ONE)", "BPCL (SmartDrive)"] as const).map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedVoucherBrand(brand)}
                    className={`text-[10px] font-bold px-2 py-1 rounded transition ${
                      selectedVoucherBrand === brand
                        ? "bg-amber-500 text-black shadow-xs"
                        : "bg-surface-2 text-muted hover:bg-surface-2/80"
                    }`}
                  >
                    {brand.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[250, 500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleBuyFuelVoucher(selectedVoucherBrand, amt)}
                  className="rounded-lg border border-border bg-surface-2/40 hover:bg-surface-2 p-2.5 text-center transition flex flex-col items-center justify-between gap-1 hover:border-amber-500/50"
                >
                  <span className="text-xs font-bold text-fg font-mono">₹{amt} Voucher</span>
                  <span className="text-[10px] font-semibold text-emerald-600">+{Math.round(amt * 0.02 * 10)} Coins Back</span>
                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold mt-1">1-Tap Generate</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Partner Petrol Pumps & EV Stations Near You */}
          <div className="rounded-xl border border-border bg-surface p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-fg flex items-center gap-1.5">
                <span>📍 Partner Stations in Karimganj &amp; Silchar</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.2 rounded">Live Radar</span>
              </h4>
              <span className="text-[10px] text-muted">Zero Surcharge Network</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-surface-2/40 p-2.5 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-fg">HPCL City Center</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">0.8 km</span>
                </div>
                <p className="text-[10px] text-muted">Station Road, Karimganj</p>
                <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-semibold">
                  <span>⚡ 60kW EV DC Fast Charger Available</span>
                </div>
              </div>

              <div className="rounded-lg bg-surface-2/40 p-2.5 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-fg">IndianOil Jubilee Auto</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">1.4 km</span>
                </div>
                <p className="text-[10px] text-muted">Trunk Road, Silchar</p>
                <div className="flex items-center gap-1 text-[9px] text-primary font-semibold">
                  <span>🛢️ XTRAPOWER Fleet Card Accepted</span>
                </div>
              </div>

              <div className="rounded-lg bg-surface-2/40 p-2.5 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-fg">BPCL Highway Oasis</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">3.2 km</span>
                </div>
                <p className="text-[10px] text-muted">NH-37 Bypass, Silchar</p>
                <div className="flex items-center gap-1 text-[9px] text-amber-600 font-semibold">
                  <span>💨 Free Nitrogen Air + 24/7 Rest Stop</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Delivery Fleet & Rider Fuel Alliance Banner */}
          <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-surface to-teal-500/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛵</span>
              <div>
                <h5 className="text-xs font-bold text-fg">OrderKing Rider &amp; Restaurant Delivery Fleet Alliance</h5>
                <p className="text-[11px] text-muted">
                  HPCL DriveTrack Plus &amp; IOCL XTRAPOWER gives riders ₹1.50 - ₹2.50/L cashback + Free ₹2,00,000 Insurance cover!
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full whitespace-nowrap self-start sm:self-auto">
              0.5% - 1.0% Corporate Volume Rebate
            </span>
          </div>
        </div>

        {/* Quick Utilities & Recharge Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-fg">
                Recharges & Bill Payments
              </h2>
              <p className="text-xs text-muted">
                Powered by official national biller alliances & affiliate partners
              </p>
            </div>
            <span className="text-xs text-emerald-600 font-semibold">100% Secure</span>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {(
              [
                { id: "all", label: "All Services" },
                { id: "fuel", label: "⛽ Fuel & Pumps" },
                { id: "recharge", label: "📱 Recharge" },
                { id: "gas", label: "🔥 LPG Gas" },
                { id: "bills", label: "⚡ Electricity & FASTag" },
                { id: "travel", label: "🚆 Train & Travel" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface text-muted hover:bg-surface-2"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 text-xl">
                        {service.icon}
                      </span>
                      <div>
                        <h3 className="font-semibold text-sm text-fg">
                          {service.name}
                        </h3>
                        {service.badge && (
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {service.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {service.description}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    ✨ {service.cashbackText}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-muted">Official Affiliate Gateway</span>
                  <a
                    href={service.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      toast.success(`Redirecting to ${service.name} secure portal...`);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition"
                  >
                    <span>Proceed</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* E-Commerce & Shopping Affiliate Banner */}
        <div className="rounded-[var(--radius-xl)] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-surface to-amber-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                Affiliate Shopping Rewards
              </span>
              <h3 className="mt-1 font-display font-bold text-base text-fg">
                Shop on Amazon, Flipkart & Meesho
              </h3>
              <p className="text-xs text-muted">
                Save with exclusive promo codes while supporting OrderKing
              </p>
            </div>
            <span className="text-2xl">🛍️</span>
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" asChild className="flex-1 text-xs">
              <Link to="/rewards">View Shopping Deals →</Link>
            </Button>
          </div>
        </div>

        {/* Security & Financial Statutory Footnote */}
        <div className="rounded-lg bg-surface-2/40 p-3 text-center text-xs text-muted">
          <div className="flex items-center justify-center gap-3 font-semibold text-fg">
            <span>🔒 256-Bit SSL</span>
            <span>•</span>
            <span>🏛️ RBI PPI Compliant</span>
            <span>•</span>
            <span>⚡ NPCI / BBPS Ready</span>
          </div>
          <p className="mt-1 text-[11px]">
            KingPay acts as a technology intermediary partnering with licensed BBPS, UPI, and authorized affiliate aggregators. Zero customer liability.
          </p>
        </div>

        {/* MODAL 1: Interactive Scan & Pay Scanner */}
        {showScanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📷</span>
                  <h3 className="font-display font-bold text-base">Scan & Pay Any UPI QR</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScanner(false)}
                  className="rounded-full p-1 text-muted hover:bg-surface-2"
                >
                  ✕
                </button>
              </div>

              {/* Viewfinder simulation */}
              <div className="relative my-4 aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-primary bg-black/80 flex flex-col items-center justify-center">
                <div className="absolute inset-x-4 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                <span className="text-4xl animate-bounce">🎯</span>
                <p className="mt-2 text-xs text-white/80 font-medium">Align any BharatQR / UPI QR code</p>
                <div className="mt-4 flex gap-1">
                  {["Chai (₹20)", "Grocery (₹150)", "Fuel (₹500)"].map((preset) => {
                    const [name, pAmt] = preset.split(" (₹");
                    const amtVal = pAmt.replace(")", "");
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setScanRecipient(`${name.toLowerCase()}@upi`);
                          setScanAmount(amtVal);
                        }}
                        className="rounded-full bg-white/20 hover:bg-white/30 px-2 py-0.5 text-[10px] text-white font-semibold transition"
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleScanPaySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Paying To (UPI ID / Mobile):</label>
                  <input
                    type="text"
                    value={scanRecipient}
                    onChange={(e) => setScanRecipient(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg px-2.5 py-1.5 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Amount (₹):</label>
                  <input
                    type="number"
                    value={scanAmount}
                    onChange={(e) => setScanAmount(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg px-2.5 py-1.5 text-sm font-mono font-bold"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" variant="primary" className="flex-1 font-bold text-xs">
                    Pay ₹{scanAmount} (1-Tap Zero OTP)
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowScanner(false)} className="text-xs">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: CRED-Style Interactive Mystery Scratch Card */}
        {showScratchCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-[var(--radius-xl)] border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-surface to-surface p-6 shadow-2xl text-center">
              <span className="text-4xl">👑</span>
              <h3 className="mt-2 font-display text-xl font-bold text-fg">OrderKing Mystery Scratch Card</h3>
              <p className="text-xs text-muted">You unlocked a guaranteed reward!</p>

              <div
                onClick={() => setScratched(true)}
                className={`relative mx-auto my-5 aspect-[4/3] w-full max-w-[260px] cursor-pointer rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center transition-all ${
                  scratched
                    ? "border-emerald-500 bg-gradient-to-br from-emerald-500/20 to-surface scale-105"
                    : "border-amber-500 bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg hover:scale-102"
                }`}
              >
                {!scratched ? (
                  <>
                    <span className="text-3xl animate-spin">✨</span>
                    <p className="mt-2 font-bold text-sm">TAP TO SCRATCH</p>
                    <p className="text-[10px] opacity-80">Guaranteed Cashback & Coins Inside</p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">🎉</span>
                    <h4 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{scratchReward.title}</h4>
                    <p className="text-2xl font-black font-mono mt-1 text-fg">+₹{scratchReward.amount}</p>
                    <p className="text-xs text-amber-600 font-semibold mt-0.5">+{scratchReward.coins} King Coins</p>
                    <p className="text-[10px] text-muted mt-1">{scratchReward.desc}</p>
                  </>
                )}
              </div>

              {scratched ? (
                <Button onClick={claimScratchReward} variant="primary" className="w-full font-bold text-xs">
                  Claim & Add to Wallet Float
                </Button>
              ) : (
                <p className="text-xs text-muted">Tap on the card above to reveal your reward!</p>
              )}
            </div>
          </div>
        )}

        {/* MODAL 3: 24K Digital Gold Buy Modal */}
        {showGoldModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-amber-500/40 bg-surface p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🪙</span>
                  <h3 className="font-display font-bold text-base">Buy 24K 99.9% Digital Gold</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoldModal(false)}
                  className="rounded-full p-1 text-muted hover:bg-surface-2"
                >
                  ✕
                </button>
              </div>

              <div className="my-3 rounded-lg bg-amber-500/10 p-3 text-xs border border-amber-500/20">
                <div className="flex justify-between items-center font-bold text-amber-900 dark:text-amber-200">
                  <span>Live Gold Rate</span>
                  <span>₹7,420 / gm</span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">100% Insured Bank-Grade Physical Vault · Partnered with MMTC-PAMP & SafeGold</p>
              </div>

              <form onSubmit={handleBuyGold} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Buy Amount (₹):</label>
                  <input
                    type="number"
                    value={goldAmount}
                    onChange={(e) => setGoldAmount(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg px-2.5 py-1.5 text-sm font-mono font-bold"
                    required
                  />
                  <div className="mt-2 flex gap-1.5">
                    {["10", "50", "100", "500"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setGoldAmount(v)}
                        className={`flex-1 rounded border py-1 text-xs font-semibold transition ${goldAmount === v ? "bg-amber-500 text-white border-amber-500" : "border-border bg-surface-2 text-muted"}`}
                      >
                        ₹{v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-surface-2/60 p-2.5 text-xs flex justify-between items-center">
                  <span className="text-muted">Estimated Gold Received:</span>
                  <span className="font-mono font-bold text-fg">
                    {((parseInt(goldAmount, 10) || 0) / 7420).toFixed(4)} gm
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" variant="primary" className="flex-1 font-bold text-xs bg-amber-600 hover:bg-amber-700">
                    Buy Gold for ₹{goldAmount}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowGoldModal(false)} className="text-xs">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Biometric 1-Tap WebAuthn Authentication Modal */}
        {showBiometricModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-indigo-500/40 bg-surface p-6 shadow-2xl text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/30 relative">
                {biometricScanning && (
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-ping opacity-60" />
                )}
                <span className="text-4xl">
                  {biometricSuccess ? "✅" : "👆"}
                </span>
              </div>

              <h3 className="mt-4 font-display text-lg font-bold text-fg">
                {biometricSuccess
                  ? "Biometric Verified!"
                  : biometricScanning
                  ? "Scanning WebAuthn Sensor..."
                  : "Touch ID / Face ID"}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {biometricSuccess
                  ? "1-Tap deduction successful · Instant soundbox confirmation triggered."
                  : "Hold your fingerprint on the sensor or glance at the camera to authenticate with 0 OTP."}
              </p>

              <div className="mt-4 rounded-lg bg-surface-2/60 p-3 text-xs flex justify-between items-center font-mono">
                <span className="text-muted">Security Protocol:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">FIDO2 WebAuthn · 256-Bit AES</span>
              </div>

              {!biometricScanning && !biometricSuccess && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowBiometricModal(false)}
                    className="w-full text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 5: Pre-Approved Loan & Credit Card Lead Modal */}
        {selectedLoanProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-[var(--radius-xl)] border border-indigo-500/40 bg-surface p-5 sm:p-6 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/20 text-xl">
                    ⚡
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-fg">{selectedLoanProduct.name}</h3>
                    <p className="text-[11px] text-muted font-medium">{selectedLoanProduct.partnerNbfc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLoanProduct(null)}
                  className="rounded-full p-1 text-muted hover:bg-surface-2"
                >
                  ✕
                </button>
              </div>

              {/* Approval Status & Speed Badge */}
              <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-surface p-3 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted font-semibold">Pre-Approved Credit Standing:</span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    CIBIL 785 · 100% Eligible (Zero Paperwork)
                  </p>
                </div>
                <span className="rounded bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white shadow-xs">
                  {selectedLoanProduct.speedText}
                </span>
              </div>

              {/* Loan Terms Matrix */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-2/60 p-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-muted block">Max Limit:</span>
                  <span className="font-extrabold text-sm text-primary">{selectedLoanProduct.maxLimit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block">Interest Rate:</span>
                  <span className="font-extrabold text-sm text-fg">{selectedLoanProduct.interestRate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block">Tenure:</span>
                  <span className="font-extrabold text-sm text-fg">{selectedLoanProduct.tenureRange}</span>
                </div>
              </div>

              <div className="rounded-lg bg-surface-2/40 p-2.5 text-xs text-muted">
                <span className="font-bold text-fg block mb-0.5">Product Benefits:</span>
                {selectedLoanProduct.benefit}
              </div>

              {/* Unique Cryptographic Lead ID */}
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-2.5 text-xs flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-muted block">Unique Lead Tracking ID:</span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">{selectedLoanProduct.leadId}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted block">Processing Fee:</span>
                  <span className="font-bold text-emerald-600">₹0 (Zero Fee Waiver)</span>
                </div>
              </div>

              {/* Direct Disbursal Action Buttons */}
              <div className="space-y-2 pt-1">
                <a
                  href={selectedLoanProduct.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold py-2.5 text-center transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>💬 Disburse via VIP WhatsApp Desk</span>
                  <span className="text-[10px] opacity-80">(Auto-Verified Lead)</span>
                </a>

                <a
                  href={selectedLoanProduct.partnerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2.5 text-center transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>🌐 Direct Partner NBFC Instant KYC Portal</span>
                  <span>↗</span>
                </a>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedLoanProduct(null)}
                  className="w-full text-xs"
                >
                  Close
                </Button>
              </div>

              {/* RBI Statutory Non-Liability Disclaimer */}
              <p className="text-[10px] text-muted text-center pt-1 border-t border-border">
                🛡️ All loans are issued directly by RBI-registered NBFCs and Banks. OrderKing operates strictly as an LSP technology provider and bears zero financial liability for loan defaults.
              </p>
            </div>
          </div>
        )}

        {/* MODAL 6: CRED/Paytm-Style Lucky Jackpot Spin Wheel */}
        {showSpinWheel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-[var(--radius-xl)] border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/40 via-surface to-surface p-6 shadow-2xl text-center space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎰</span>
                  <h3 className="font-display font-bold text-base text-fg">Lucky Jackpot Spin Wheel</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSpinWheel(false)}
                  className="rounded-full p-1 text-muted hover:bg-surface-2"
                >
                  ✕
                </button>
              </div>

              {/* Animated Spinner Wheel Visual */}
              <div className="relative mx-auto my-3 flex size-44 items-center justify-center rounded-full border-4 border-dashed border-purple-500 bg-gradient-to-tr from-purple-600/30 via-indigo-500/20 to-pink-500/30 shadow-inner">
                {spinning ? (
                  <div className="flex flex-col items-center justify-center animate-spin">
                    <span className="text-4xl">🎡</span>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 font-mono mt-1">SPINNING...</span>
                  </div>
                ) : spinResult ? (
                  <div className="flex flex-col items-center justify-center p-2">
                    <span className="text-4xl animate-bounce">{spinResult.icon}</span>
                    <span className="font-bold text-xs text-fg mt-1 text-center line-clamp-1">{spinResult.prize}</span>
                    <span className="text-[9px] text-emerald-600 font-semibold">{spinResult.sub}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-4xl">👑</span>
                    <span className="font-bold text-xs text-fg mt-1">Ready to Win!</span>
                    <span className="text-[10px] text-muted">Tap Spin below</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-surface-2/60 p-2.5 text-xs flex justify-between items-center font-mono">
                <span className="text-muted">King Coins Balance:</span>
                <span className="font-bold text-amber-600">{kingCoins} 🪙</span>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSpinWheel}
                  disabled={spinning}
                  className="w-full font-bold text-xs bg-purple-600 hover:bg-purple-700 active:scale-98"
                >
                  {spinning ? "Spinning the Wheel..." : claimedToday ? "Spin for 100 King Coins 🪙" : "🎰 Free Daily Spin!"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 7: Instant Digital Fuel Voucher Details */}
        {showFuelVoucherModal && generatedFuelVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-[var(--radius-xl)] border-2 border-amber-500/50 bg-gradient-to-br from-amber-900/30 via-surface to-surface p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⛽</span>
                  <div>
                    <h3 className="font-display font-bold text-base text-fg">{generatedFuelVoucher.brand}</h3>
                    <p className="text-[10px] text-muted">Digital Fuel Card · Instant Pump POS Redeem</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFuelVoucherModal(false)}
                  className="rounded-full p-1 text-muted hover:bg-surface-2"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-surface p-4 text-center space-y-2 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">Voucher Value</span>
                <span className="font-mono text-3xl font-black text-fg">₹{generatedFuelVoucher.amount}.00</span>
                <div className="my-2 rounded-lg bg-surface-2 p-2 border border-dashed border-primary/50">
                  <span className="text-[10px] uppercase font-bold text-muted block">Voucher Code (Show at Pump)</span>
                  <code className="font-mono text-base font-extrabold text-primary tracking-widest">{generatedFuelVoucher.code}</code>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold">+{generatedFuelVoucher.coinsReward} King Coins Credited to your wallet!</p>
                <p className="text-[10px] text-muted">{generatedFuelVoucher.expiry}</p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full text-xs font-bold"
                  onClick={() => {
                    void navigator.clipboard?.writeText(generatedFuelVoucher.code);
                    toast.success("Voucher code copied to clipboard!");
                  }}
                >
                  📋 Copy Voucher Code
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs font-semibold"
                  onClick={() => setShowFuelVoucherModal(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Receive Money & Custom QR Studio */}
        {showReceiveQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border-2 border-amber-500/40 bg-surface p-4 sm:p-6 shadow-2xl">
              <ReceiveMoneyQrStudio
                isModal
                onClose={() => setShowReceiveQrModal(false)}
              />
            </div>
          </div>
        )}

        {/* MODAL 8: Real High-Accuracy Camera QR Scanner & Manual UPI Input */}
        <CameraScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScanSuccess={(res: ParsedUpiResult) => {
            setScanRecipient(res.upiId || res.raw);
            const amt = res.amount ? parseInt(res.amount, 10) : 250;
            setScanAmount(String(amt));
            setShowScanner(false);

            if (res.amount) {
              if (amt > walletBalance) {
                toast.error(`Scanned ₹${amt} for ${res.payeeName || res.upiId}, but wallet has ₹${walletBalance}. Please add money.`);
                setShowAddMoney(true);
                return;
              }
              const newBal = walletBalance - amt;
              setWalletBalance(newBal);
              if (typeof window !== "undefined") {
                localStorage.setItem("ok_king_pay_wallet_balance", String(newBal));
              }
              playSoundboxChime(amt);
              toast.success(`⚡ Paid ₹${amt} to ${res.payeeName || res.upiId} via KingPay!`);

              setScratched(false);
              setScratchReward({
                title: "🎉 Instant Cashback Won!",
                desc: `Rewarded for paying ${res.payeeName || res.upiId}!`,
                amount: Math.floor(5 + Math.random() * 20),
                coins: Math.floor(50 + Math.random() * 150),
              });
              setShowScratchCard(true);
            } else {
              toast.info(`Scanned ${res.payeeName || res.upiId}. Enter amount to pay.`);
              setScannerTab("manual");
              setShowScanner(true);
            }
          }}
        />

        {/* MODAL 9: Everyday Needs Utility & Payment Modals */}
        {activeUtilityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border-2 border-primary/40 bg-surface p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {activeUtilityModal === "recharge" && "📱"}
                    {activeUtilityModal === "electricity" && "⚡"}
                    {activeUtilityModal === "dth" && "📡"}
                    {activeUtilityModal === "gas" && "🛢️"}
                    {activeUtilityModal === "fastag" && "🚗"}
                    {activeUtilityModal === "water" && "💧"}
                    {activeUtilityModal === "broadband" && "🌐"}
                    {activeUtilityModal === "card" && "💳"}
                    {activeUtilityModal === "contact" && "👤"}
                    {activeUtilityModal === "upi" && "🏦"}
                  </span>
                  <div>
                    <h3 className="font-display font-black text-base text-fg">
                      {activeUtilityModal === "recharge" && "Mobile Recharge"}
                      {activeUtilityModal === "electricity" && "Electricity Bill (APDCL)"}
                      {activeUtilityModal === "dth" && "DTH & Cable Recharge"}
                      {activeUtilityModal === "gas" && "LPG Cylinder Booking"}
                      {activeUtilityModal === "fastag" && "FASTag Toll Recharge"}
                      {activeUtilityModal === "water" && "Municipal Water Tax"}
                      {activeUtilityModal === "broadband" && "Broadband & Wi-Fi"}
                      {activeUtilityModal === "card" && "Credit Card Bill Pay"}
                      {activeUtilityModal === "contact" && "Pay to Contact"}
                      {activeUtilityModal === "upi" && "Pay to UPI / Bank"}
                    </h3>
                    <p className="text-[10px] text-muted">Zero Convenience Fee · Instant BBPS Settlement</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveUtilityModal(null)}
                  className="rounded-full p-1 text-muted hover:bg-surface-2 transition text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Operator / Provider Selection for Utilities */}
              {activeUtilityModal === "recharge" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-1.5">
                    {["Jio", "Airtel", "Vi", "BSNL"].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setUtilityOperator(op)}
                        className={`rounded-lg border py-1.5 text-xs font-bold transition ${utilityOperator === op ? "bg-primary text-white border-primary shadow-xs" : "border-border bg-surface-2 text-muted"}`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">10-Digit Mobile Number:</label>
                    <input
                      type="tel"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono"
                      value={utilityInput}
                      onChange={(e) => setUtilityInput(e.target.value)}
                      placeholder="e.g. 9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Select Popular Plan:</label>
                    <div className="space-y-1.5">
                      {[
                        { price: 299, desc: "2 GB/day · 28 Days · Unlimited 5G" },
                        { price: 199, desc: "1.5 GB/day · 23 Days · True 5G" },
                        { price: 666, desc: "1.5 GB/day · 84 Days · Bestseller" },
                      ].map((plan) => (
                        <button
                          key={plan.price}
                          type="button"
                          onClick={() => setUtilityAmount(String(plan.price))}
                          className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-left transition ${utilityAmount === String(plan.price) ? "border-primary bg-primary/10" : "border-border bg-surface"}`}
                        >
                          <div>
                            <span className="font-mono font-bold text-xs text-fg">₹{plan.price}</span>
                            <p className="text-[10px] text-muted">{plan.desc}</p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            +2% Back
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleUtilityPayment(`${utilityOperator} Recharge (₹${utilityAmount})`, Number(utilityAmount))}
                    className="w-full font-bold text-xs py-2.5 bg-primary text-white shadow"
                  >
                    ⚡ Recharge ₹{utilityAmount} Now
                  </Button>
                </div>
              )}

              {activeUtilityModal === "electricity" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">APDCL Consumer Number:</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono"
                      value={utilityInput}
                      onChange={(e) => setUtilityInput(e.target.value)}
                      placeholder="e.g. 12000045892"
                    />
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Consumer Name:</span>
                      <span className="font-bold text-fg">HASAN HABIBULLAH</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Bill Due Date:</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-300">28th of this month</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border font-mono">
                      <span className="text-muted">Bill Amount:</span>
                      <span className="font-extrabold text-sm text-fg">₹1,240.00</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleUtilityPayment("APDCL Electricity Bill", 1240)}
                    className="w-full font-bold text-xs py-2.5 bg-primary text-white shadow"
                  >
                    ⚡ Pay ₹1,240 Bill (0% Fee)
                  </Button>
                </div>
              )}

              {activeUtilityModal === "contact" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Recipient Mobile Number or Name:</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono"
                      value={utilityInput}
                      onChange={(e) => setUtilityInput(e.target.value)}
                      placeholder="e.g. 9876543210 or Rahul Sharma"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Amount to Transfer (₹):</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono font-bold"
                      value={utilityAmount}
                      onChange={(e) => setUtilityAmount(e.target.value)}
                      placeholder="₹200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-muted font-semibold uppercase mb-1.5">Recent Contacts:</label>
                    <div className="space-y-1">
                      {[
                        { name: "Station Biryani House", phone: "9876540001", role: "Restaurant Partner" },
                        { name: "Sribhumi Kirana Store", phone: "9876540002", role: "Merchant" },
                        { name: "Rahul Sharma", phone: "9876540003", role: "Friend" },
                      ].map((c) => (
                        <button
                          key={c.phone}
                          type="button"
                          onClick={() => {
                            setUtilityInput(`${c.name} (${c.phone})`);
                          }}
                          className="w-full flex items-center justify-between rounded-lg border border-border p-2 text-left hover:bg-surface-2 transition text-xs"
                        >
                          <div>
                            <span className="font-semibold text-fg">{c.name}</span>
                            <span className="text-[10px] text-muted block">{c.phone}</span>
                          </div>
                          <span className="text-[10px] text-primary font-medium">{c.role}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleUtilityPayment(`Transfer to ${utilityInput || "Contact"}`, Number(utilityAmount) || 200)}
                    className="w-full font-bold text-xs py-2.5 bg-primary text-white shadow"
                  >
                    ⚡ Send ₹{utilityAmount} Instantly
                  </Button>
                </div>
              )}

              {activeUtilityModal === "upi" && (
                <div className="space-y-3">
                  <div className="flex rounded-xl bg-surface-2 p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setUtilityOperator("upi_id")}
                      className={`flex-1 rounded-lg py-1.5 transition ${utilityOperator !== "bank_ac" ? "bg-primary text-white shadow-xs" : "text-muted hover:text-fg"}`}
                    >
                      @ UPI ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setUtilityOperator("bank_ac")}
                      className={`flex-1 rounded-lg py-1.5 transition ${utilityOperator === "bank_ac" ? "bg-primary text-white shadow-xs" : "text-muted hover:text-fg"}`}
                    >
                      🏛️ Bank A/C &amp; IFSC
                    </button>
                  </div>

                  {utilityOperator === "bank_ac" ? (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-fg mb-1">Bank Account Number:</label>
                        <input
                          type="text"
                          className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono"
                          value={utilityInput}
                          onChange={(e) => setUtilityInput(e.target.value)}
                          placeholder="e.g. 200481920194"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-fg mb-1">IFSC Code:</label>
                        <input
                          type="text"
                          className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono uppercase"
                          placeholder="e.g. SBIN0000185 (SBI Silchar/Karimganj)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-fg mb-1">Account Holder Name:</label>
                        <input
                          type="text"
                          className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm"
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Recipient UPI ID:</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono"
                        value={utilityInput}
                        onChange={(e) => setUtilityInput(e.target.value)}
                        placeholder="e.g. merchant@icici or 9876543210@upi"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Amount to Transfer (₹):</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono font-bold"
                      value={utilityAmount}
                      onChange={(e) => setUtilityAmount(e.target.value)}
                      placeholder="₹500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Pay From Account:</label>
                    <select
                      value={paymentSource}
                      onChange={(e) => setPaymentSource(e.target.value)}
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-xs font-semibold text-fg"
                    >
                      <option value="wallet">👑 KingPay Wallet (₹{walletBalance}.00)</option>
                      {linkedBanks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} ({b.accountNumberMasked})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleUtilityPayment(`Transfer to ${utilityInput || "Bank/UPI"}`, Number(utilityAmount) || 500)}
                    className="w-full font-bold text-xs py-2.5 bg-primary text-white shadow"
                  >
                    ⚡ Send ₹{utilityAmount} via UPI (0% Fee)
                  </Button>
                </div>
              )}

              {activeUtilityModal !== "recharge" && activeUtilityModal !== "electricity" && activeUtilityModal !== "contact" && activeUtilityModal !== "upi" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Enter Account / ID / Number:</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono"
                      value={utilityInput}
                      onChange={(e) => setUtilityInput(e.target.value)}
                      placeholder="e.g. Account Number / Customer ID"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Amount to Pay (₹):</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono font-bold"
                      value={utilityAmount}
                      onChange={(e) => setUtilityAmount(e.target.value)}
                      placeholder="₹500"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleUtilityPayment(`Payment for ${activeUtilityModal.toUpperCase()}`, Number(utilityAmount) || 500)}
                    className="w-full font-bold text-xs py-2.5 bg-primary text-white shadow"
                  >
                    ⚡ Pay ₹{utilityAmount} with 0% Fee
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 10: Check Bank Balance & Secure UPI PIN Verification */}
        {showCheckBalanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border-2 border-emerald-500/50 bg-surface p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  <div>
                    <h3 className="font-display font-black text-base text-fg">Check Bank Balance</h3>
                    <p className="text-[10px] text-muted">100% Encrypted &amp; Secured via NPCI UPI</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckBalanceModal(false);
                    setSelectedBankForBalance(null);
                    setUpiPinInput("");
                  }}
                  className="rounded-full p-1 text-muted hover:bg-surface-2 transition text-lg"
                >
                  ✕
                </button>
              </div>

              {!selectedBankForBalance ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted">Select an account to check your live available balance:</p>
                  <div className="space-y-2">
                    {/* KingPay Wallet */}
                    <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                      <div className="flex items-center gap-2.5">
                        <KingPayMark className="size-8 rounded-lg shadow-xs" />
                        <div>
                          <span className="text-xs font-bold text-fg block">KingPay 1-Tap Wallet</span>
                          <span className="text-[10px] text-muted font-mono">Instant Float</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted block">Balance</span>
                        <span className="font-mono text-sm font-black text-fg">₹{walletBalance}.00</span>
                      </div>
                    </div>

                    {/* Linked Banks */}
                    {linkedBanks.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-surface-2/60 p-3 hover:border-emerald-500/50 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-lg">
                            {b.icon}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-fg block">{b.bankName}</span>
                            <span className="text-[10px] text-muted font-mono">{b.accountType} A/C {b.accountNumberMasked}</span>
                          </div>
                        </div>

                        <div>
                          {balanceRevealed[b.id] !== undefined ? (
                            <div className="text-right">
                              <span className="text-[10px] text-emerald-600 font-bold block">Available</span>
                              <span className="font-mono text-sm font-black text-fg">
                                ₹{balanceRevealed[b.id].toLocaleString("en-IN")}.00
                              </span>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setSelectedBankForBalance(b)}
                              className="text-xs font-bold py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                              Check Balance
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckBalanceModal(false);
                      setAddBankStep("select");
                      setShowAddBankModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/50 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 transition"
                  >
                    <span>➕ Add Another Bank Account</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Account Header */}
                  <div className="rounded-xl border border-border bg-surface-2 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{selectedBankForBalance.icon}</span>
                      <div>
                        <span className="text-xs font-bold text-fg block">{selectedBankForBalance.bankName}</span>
                        <span className="text-[10px] text-muted font-mono">{selectedBankForBalance.accountType} {selectedBankForBalance.accountNumberMasked}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBankForBalance(null);
                        setUpiPinInput("");
                      }}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Secret UPI PIN Input View */}
                  <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 text-center space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-fg block">Enter 4-Digit UPI PIN</span>
                      <p className="text-[10px] text-muted">Never share your UPI PIN with anyone</p>
                    </div>

                    {/* PIN Masked Dots */}
                    <div className="flex justify-center gap-3 py-2">
                      {[0, 1, 2, 3].map((idx) => (
                        <span
                          key={idx}
                          className={`size-4 rounded-full border-2 transition-all ${
                            upiPinInput.length > idx
                              ? "bg-emerald-600 border-emerald-600 scale-110 shadow-xs"
                              : "border-border bg-surface"
                          }`}
                        />
                      ))}
                    </div>

                    {pinVerifying ? (
                      <div className="py-2 text-xs font-bold text-emerald-600 flex items-center justify-center gap-2">
                        <span className="animate-spin text-base">🔄</span>
                        <span>Verifying with NPCI Bank Switch...</span>
                      </div>
                    ) : (
                      /* Numeric Keypad for easy mobile use */
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              if (upiPinInput.length < 4) {
                                const next = upiPinInput + num;
                                setUpiPinInput(next);
                                if (next.length === 4) {
                                  handleVerifyUpiPin(next);
                                }
                              }
                            }}
                            className="rounded-xl border border-border bg-surface py-2.5 text-base font-bold text-fg hover:bg-surface-2 active:scale-95 transition shadow-xs"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setUpiPinInput("")}
                          className="rounded-xl border border-border bg-surface-2 py-2.5 text-xs font-bold text-muted hover:text-fg active:scale-95 transition"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (upiPinInput.length < 4) {
                              const next = upiPinInput + "0";
                              setUpiPinInput(next);
                              if (next.length === 4) {
                                handleVerifyUpiPin(next);
                              }
                            }
                          }}
                          className="rounded-xl border border-border bg-surface py-2.5 text-base font-bold text-fg hover:bg-surface-2 active:scale-95 transition shadow-xs"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiPinInput((p) => p.slice(0, -1))}
                          className="rounded-xl border border-border bg-surface-2 py-2.5 text-base font-bold text-muted hover:text-fg active:scale-95 transition"
                        >
                          ⌫
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-muted text-center">
                    🛡️ Protected by NPCI 256-bit UPI Security Protocol.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 11: Add Bank Account & UPI Setup Flow */}
        {showAddBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border-2 border-primary/50 bg-surface p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <h3 className="font-display font-black text-base text-fg">Add Bank Account</h3>
                    <p className="text-[10px] text-muted">Link via SIM verification to send &amp; receive money</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="rounded-full p-1 text-muted hover:bg-surface-2 transition text-lg"
                >
                  ✕
                </button>
              </div>

              {addBankStep === "select" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Search Your Bank:</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm"
                      value={bankSearchQuery}
                      onChange={(e) => setBankSearchQuery(e.target.value)}
                      placeholder="e.g. SBI, HDFC, Assam Gramin, PNB..."
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] uppercase font-bold text-muted mb-2 tracking-wider">
                      Popular Indian Banks
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {POPULAR_BANKS_FOR_ADDING.filter((b) =>
                        b.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
                      ).map((b) => (
                        <button
                          key={b.code}
                          type="button"
                          onClick={() => handleStartAddBank(b.name)}
                          className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-2.5 text-left hover:border-primary/60 hover:bg-primary/5 active:scale-95 transition"
                        >
                          <span className="text-xl">{b.icon}</span>
                          <span className="text-xs font-bold text-fg line-clamp-1">{b.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {addBankStep === "sim" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-surface-2 p-3 text-center space-y-1">
                    <span className="text-xs text-muted block">Selected Bank:</span>
                    <span className="font-display font-bold text-sm text-fg">{selectedBankToAdd}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-fg">
                      Select SIM Card Linked with this Bank:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSim(1)}
                        className={`rounded-xl border p-3 text-left transition ${selectedSim === 1 ? "border-primary bg-primary/10 shadow-xs" : "border-border bg-surface"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-fg">SIM 1</span>
                          <span className="text-[10px] text-emerald-600 font-bold">Jio 5G</span>
                        </div>
                        <span className="text-[11px] font-mono text-muted mt-1 block">98765 43210</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedSim(2)}
                        className={`rounded-xl border p-3 text-left transition ${selectedSim === 2 ? "border-primary bg-primary/10 shadow-xs" : "border-border bg-surface"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-fg">SIM 2</span>
                          <span className="text-[10px] text-red-600 font-bold">Airtel</span>
                        </div>
                        <span className="text-[11px] font-mono text-muted mt-1 block">87654 32109</span>
                      </button>
                    </div>
                  </div>

                  {simVerifying ? (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-2">
                      <span className="animate-spin text-2xl block">🔄</span>
                      <span className="text-xs font-bold text-primary block">
                        Sending Encrypted SMS for Verification...
                      </span>
                      <p className="text-[10px] text-muted">
                        Confirming mobile number with {selectedBankToAdd} via NPCI gateway.
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleSimVerification}
                      className="w-full font-bold text-xs py-2.5 bg-primary text-white shadow"
                    >
                      📱 Verify via Free SMS &amp; Link Account
                    </Button>
                  )}
                </div>
              )}

              {addBankStep === "success" && (
                <div className="space-y-4 text-center">
                  <div className="size-16 rounded-full bg-emerald-500/20 text-emerald-600 text-3xl flex items-center justify-center mx-auto shadow-sm">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-black text-base text-fg">Bank Account Linked!</h4>
                    <p className="text-xs text-muted">
                      {selectedBankToAdd} is now ready for instant 1-tap UPI payments.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs flex justify-between">
                    <span className="text-muted">UPI ID:</span>
                    <span className="font-bold text-fg">user9876@kingpay</span>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setShowAddBankModal(false)}
                    className="w-full font-bold text-xs py-2.5 bg-primary text-white shadow"
                  >
                    Done &amp; Check Balance
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 12: Self Account Transfer Modal */}
        {showSelfTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border-2 border-amber-500/50 bg-surface p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <h3 className="font-display font-black text-base text-fg">Self Account Transfer</h3>
                    <p className="text-[10px] text-muted">Transfer between your own linked bank accounts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSelfTransferModal(false)}
                  className="rounded-full p-1 text-muted hover:bg-surface-2 transition text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSelfTransferSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Transfer From (Debited):</label>
                  <select
                    value={selfFromBank}
                    onChange={(e) => setSelfFromBank(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-xs font-semibold text-fg"
                  >
                    {linkedBanks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} ({b.accountNumberMasked})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Transfer To (Credited):</label>
                  <select
                    value={selfToBank}
                    onChange={(e) => setSelfToBank(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-xs font-semibold text-fg"
                  >
                    {linkedBanks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} ({b.accountNumberMasked})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Amount to Transfer (₹):</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-base font-mono font-bold"
                    value={selfTransferAmount}
                    onChange={(e) => setSelfTransferAmount(e.target.value)}
                    placeholder="₹1,000"
                    required
                  />
                </div>

                <div className="rounded-lg bg-surface-2 p-2.5 text-xs flex justify-between items-center font-mono">
                  <span className="text-muted">Transaction Fee:</span>
                  <span className="font-bold text-emerald-600">₹0 (Free UPI)</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-bold text-xs py-2.5 bg-primary text-white shadow"
                >
                  ⚡ Transfer ₹{selfTransferAmount} Instantly
                </Button>
              </form>
            </div>
          </div>
        )}

          </>
        )}

        {/* Multilingual Royal AI Assistant with Sweet Native Girl Voice across 12 Indian Languages */}
        <RoyalAiConcierge
          onOpenScanner={() => {
            setScannerTab("camera");
            setShowScanner(true);
          }}
          onCheckBalance={() => {
            setSelectedBankForBalance(linkedBanks[0] || null);
            setUpiPinInput("");
            setShowCheckBalanceModal(true);
          }}
          onPayElectricity={() => setActiveUtilityModal("electricity")}
          onMobileRecharge={() => setActiveUtilityModal("recharge")}
          onOpenGarage={() => setActiveSection("garage")}
          onOpenTravel={() => setActiveSection("travel")}
        />
      </div>
    </KingPayShell>
    </>
  );
}



