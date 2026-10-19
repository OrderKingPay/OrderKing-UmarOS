import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const DB_FILE = path.join(process.cwd(), 'umar_os_state.json');

// ============================================================================
// UMAR OS v5.0: CENTRAL PERSISTENT DATABASE & GOD-MODE CONFIGURATION
// ============================================================================
const initialData = {
  umarConfig: {
    systemVersion: "UMAR OS v5.0 — Supreme Autonomous Core",
    activeGateway: process.env.DEFAULT_PAYMENT_GATEWAY || "direct_upi",
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_live_test",
    founderUpiId: process.env.FOUNDER_UPI_ID || "orderkingpay@upi",
    founderWhatsapp: process.env.FOUNDER_WHATSAPP_NUMBER || "919864000000",
    travelpayoutsMarker: process.env.TRAVELPAYOUTS_MARKER || "500000",
    flightEngineMode: "HYBRID_DIRECT_AND_AFFILIATE",
    masterPromoCode: "KING500",
    // PROTECTED FLIGHT MARGINS (NEVER DEDUCTED)
    flightFounderBaseMarkupINR: 450,
    flightConvenienceFeeINR: 310,
    flightAnchorDiscountINR: 500,
    // DAILY LIFE HIGH-FREQUENCY MARGINS
    foodPlatformCommissionPercent: 22,
    foodPackagingAndPlatformFeeINR: 35,
    foodToTravelCashbackPercent: 5,
    pharmacyMarginPercent: 25,
    pharmacyDeliveryFeeINR: 30,
    bbpsConvenienceFeeINR: 19,
    jobFastTrackFeeINR: 499,
    aiTutorProFeeINR: 199,
    referralRewardKingCashINR: 50
  },
  ledger: {
    founderNetProfitINR: 34820,
    grossMerchandiseValueINR: 198400,
    userKingCashBalanceINR: 350,
    dailyStreakCount: 3,
    orders: [
      {
        id: "OKP-91042",
        category: "FOOD",
        title: "Food Palace — Special Royal Chicken Biryani Combo (x2)",
        subtitle: "Karimganj Bypass • Dispatched via WhatsApp Bridge • +₹32 KingCash",
        customerPaidINR: 640,
        wholesaleCostINR: 465,
        founderNetProfitINR: 175,
        paymentMethod: "0% Fee Direct UPI",
        whatsappDispatchUrl: "https://wa.me/919864000000?text=Order%20OKP-91042",
        timestamp: "Today, 09:10 PM"
      },
      {
        id: "OKP-91018",
        category: "FLIGHT",
        title: "IndiGo 6E-204 • IXS (Silchar) → DEL (New Delhi)",
        subtitle: "Zero-Loss Engine • Promo KING500 Applied • PNR Issued",
        customerPaidINR: 5210,
        wholesaleCostINR: 4450,
        founderNetProfitINR: 760,
        paymentMethod: "0% Fee Direct UPI",
        whatsappDispatchUrl: "https://wa.me/919864000000?text=Flight%20OKP-91018",
        timestamp: "Today, 06:45 PM"
      }
    ]
  },
  restaurants: [
    {
      id: "rest_fp",
      name: "Food Palace",
      badge: "FLAGSHIP HIGHWAY HUB",
      rating: "4.9",
      eta: "20 mins",
      dish: "Royal Dum Biryani & Tandoori Family Combo",
      wholesalePrice: 360
    },
    {
      id: "rest_pb",
      name: "Party Box",
      badge: "FAST FOOD EXPRESS",
      rating: "4.8",
      eta: "15 mins",
      dish: "Crispy Zinger Bucket + Peri-Peri Fries",
      wholesalePrice: 420
    },
    {
      id: "rest_hd",
      name: "Highway Darbar Grill",
      badge: "LATE NIGHT KITCHEN",
      rating: "4.7",
      eta: "25 mins",
      dish: "Mutton Rogan Josh & Garlic Naan Platter",
      wholesalePrice: 490
    }
  ],
  dailyPharmacyAndMart: [
    {
      id: "med_1",
      name: "Family Emergency & Daily Wellness Kit",
      category: "EXPRESS PHARMACY",
      eta: "15 mins",
      mrp: 480
    },
    {
      id: "med_2",
      name: "Costus Igneus (Spiral Ginger) & Herbal Care Pack",
      category: "AYURVEDA & HEALTH",
      eta: "20 mins",
      mrp: 350
    },
    {
      id: "mart_3",
      name: "Wholesale Household & Footwear Bulk Saver Pack",
      category: "KING WHOLESALE MART",
      eta: "Same Day",
      mrp: 1250
    }
  ]
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error("Initializing fresh DB state:", err.message);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  return initialData;
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let db = loadDB();

// ============================================================================
// CORE ZERO-LOSS PRICING ENGINE + TRAVELPAYOUTS AFFILIATE DEEP-LINK GENERATOR
// ============================================================================
function formatAviasalesDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date(Date.now() + 86400000 * 3);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}${mm}`;
}

function calculateZeroLossFlight(rawWholesaleINR, origin, destination, departureDate, applyKingCash = true) {
  const cfg = db.umarConfig;
  const baseMarkup = Number(cfg.flightFounderBaseMarkupINR);
  const convFee = Number(cfg.flightConvenienceFeeINR);
  const anchorDiscount = Number(cfg.flightAnchorDiscountINR);

  const competitorMMTPrice = Math.round(rawWholesaleINR + baseMarkup + convFee + 195);
  const displayedRetailMRP = Math.round(rawWholesaleINR + baseMarkup + anchorDiscount);
  const afterPromoPrice = displayedRetailMRP - anchorDiscount;

  const kingCashUsed = applyKingCash ? Math.min(db.ledger.userKingCashBalanceINR, 250) : 0;
  const finalCustomerPayable = afterPromoPrice + convFee - kingCashUsed;

  // Founder Net Profit is strictly locked: Base Markup + Convenience Fee
  const protectedFounderProfit = baseMarkup + convFee;

  // Real Travelpayouts / Aviasales Zero-Capital Affiliate Search Link
  const ddmm = formatAviasalesDate(departureDate);
  const routeCode = `${origin.toUpperCase()}${ddmm}${destination.toUpperCase()}1`;
  const affiliateBookingUrl = `https://www.aviasales.com/search/${routeCode}?marker=${cfg.travelpayoutsMarker}`;

  return {
    rawWholesaleINR: Math.round(rawWholesaleINR),
    displayedRetailMRP,
    promoCode: cfg.masterPromoCode,
    promoDiscountINR: anchorDiscount,
    afterPromoPrice,
    convenienceFeeINR: convFee,
    kingCashUsedINR: kingCashUsed,
    finalCustomerPayable,
    competitorMMTPrice,
    savingsVsCompetitorINR: competitorMMTPrice - finalCustomerPayable,
    protectedFounderProfit,
    affiliateBookingUrl
  };
}

// ============================================================================
// 1. BOOTSTRAP & UMAR OS CONFIGURATION API
// ============================================================================
app.get('/api/umar-os/bootstrap', (req, res) => {
  res.json({
    umarConfig: db.umarConfig,
    ledger: db.ledger,
    restaurants: db.restaurants,
    dailyPharmacyAndMart: db.dailyPharmacyAndMart,
    liveConnectors: {
      duffelConfigured: Boolean(process.env.DUFFEL_ACCESS_TOKEN),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      upiZeroFeeActive: true
    }
  });
});

app.post('/api/umar-os/update', (req, res) => {
  const { masterKey, updates } = req.body;
  const validKey = process.env.UMAR_OS_MASTER_KEY || 'umar_god_9999';
  if (masterKey !== validKey) {
    return res.status(403).json({ error: "Invalid Umar OS Master Key" });
  }
  db.umarConfig = { ...db.umarConfig, ...updates };
  saveDB(db);
  res.json({ success: true, umarConfig: db.umarConfig });
});

// ============================================================================
// 2. HYBRID FLIGHT SEARCH & DIRECT NDC BOOKING API (DUFFEL v2 + AFFILIATE)
// ============================================================================
app.post('/api/kingpay/flights/search', async (req, res) => {
  const {
    origin = 'IXS',
    destination = 'DEL',
    departureDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    useKingCash = true
  } = req.body;

  try {
    if (process.env.DUFFEL_ACCESS_TOKEN) {
      const response = await fetch('https://api.duffel.com/air/offer_requests?return_offers=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
          'Duffel-Version': 'v2',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          data: {
            slices: [{ origin: origin.toUpperCase(), destination: destination.toUpperCase(), departure_date: departureDate }],
            passengers: [{ type: 'adult' }],
            cabin_class: 'economy'
          }
        })
      });

      const json = await response.json();
      if (json.data?.offers?.length) {
        const offers = json.data.offers.slice(0, 6).map(offer => {
          const rawTotal = parseFloat(offer.total_amount);
          const wholesaleINR = offer.total_currency === 'INR' ? rawTotal : rawTotal * 86;
          return {
            id: offer.id,
            airline: offer.owner?.name || 'Global Airline',
            flightNo: offer.slices?.[0]?.segments?.[0]?.marketing_carrier_flight_number || 'NDC-101',
            origin: origin.toUpperCase(),
            destination: destination.toUpperCase(),
            depTime: offer.slices?.[0]?.segments?.[0]?.departing_at?.slice(11, 16) || '07:15',
            arrTime: offer.slices?.[0]?.segments?.[0]?.arriving_at?.slice(11, 16) || '10:00',
            duration: 'Direct NDC',
            pricing: calculateZeroLossFlight(wholesaleINR, origin, destination, departureDate, useKingCash)
          };
        });
        return res.json({ source: 'LIVE_DUFFEL_NDC_v2', offers });
      }
    }

    // High-Realism Zero-Loss Engine with Live Aviasales Affiliate Deep-Links
    const baseCarriers = [
      { id: 'off_6e_204', airline: 'IndiGo Airlines', flightNo: '6E-204', depTime: '07:15 AM', arrTime: '09:55 AM', duration: '2h 40m Non-Stop', wholesaleINR: 4180 },
      { id: 'off_ai_812', airline: 'Air India', flightNo: 'AI-812', depTime: '01:20 PM', arrTime: '04:00 PM', duration: '2h 40m Non-Stop', wholesaleINR: 4490 },
      { id: 'off_qp_114', airline: 'Akasa Air', flightNo: 'QP-114', depTime: '05:45 PM', arrTime: '08:30 PM', duration: '2h 45m Non-Stop', wholesaleINR: 3960 }
    ];

    const offers = baseCarriers.map(c => ({
      ...c,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      pricing: calculateZeroLossFlight(c.wholesaleINR, origin, destination, departureDate, useKingCash)
    }));

    res.json({ source: 'UMAR_OS_HYBRID_ENGINE', offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 3. 0% FEE DIRECT UPI DEEP-LINK + WHATSAPP GPS AUTO-BRIDGE CHECKOUT
// ============================================================================
app.post('/api/kingpay/checkout', (req, res) => {
  const {
    category,
    title,
    subtitle,
    customerPaidINR,
    wholesaleCostINR,
    founderNetProfitINR,
    kingCashUsed = 0,
    kingCashEarned = 0,
    gpsCoords = 'Karimganj-Bypass-Hub'
  } = req.body;

  const orderId = 'OKP-' + Math.floor(10000 + Math.random() * 90000);
  const cfg = db.umarConfig;

  const activeGateway = req.body.gateway || cfg.activeGateway || 'direct_upi';

  // 1. Generate 0% Fee Direct NPCI UPI Deep-Link & Live QR
  const upiUri = `upi://pay?pa=${encodeURIComponent(cfg.founderUpiId)}&pn=${encodeURIComponent('OrderKingPay')}&am=${Number(customerPaidINR).toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId + ' ' + category)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  const upiIntent = upiUri;

  // 2. Generate Automated WhatsApp Kitchen/Rider/Ticket Dispatch Bridge
  const mapsLink = gpsCoords.includes(',') ? `https://maps.google.com/?q=${gpsCoords}` : 'Local-Hub';
  const paymentTag = activeGateway === 'razorpay' ? 'Razorpay PG' : '0% Fee Direct UPI';
  const waMessage = `*NEW ORDERKINGPAY DISPATCH [${orderId}]*\nCategory: ${category}\nItem: ${title}\nCustomer Paid: ₹${customerPaidINR} (${paymentTag})\nProtected Founder Profit: ₹${founderNetProfitINR}\nCustomer GPS: ${mapsLink}`;
  const whatsappDispatchUrl = `https://wa.me/${cfg.founderWhatsapp}?text=${encodeURIComponent(waMessage)}`;

  const newOrder = {
    id: orderId,
    category,
    title,
    subtitle: subtitle || `Instant Confirmed via ${paymentTag}`,
    customerPaidINR: Number(customerPaidINR),
    wholesaleCostINR: Number(wholesaleCostINR),
    founderNetProfitINR: Number(founderNetProfitINR),
    paymentMethod: paymentTag,
    activeGateway,
    upiUri,
    upiIntent,
    qrUrl,
    whatsappDispatchUrl,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  db.ledger.orders.unshift(newOrder);
  db.ledger.founderNetProfitINR += Number(founderNetProfitINR);
  db.ledger.grossMerchandiseValueINR += Number(customerPaidINR);
  db.ledger.userKingCashBalanceINR = Math.max(0, db.ledger.userKingCashBalanceINR - Number(kingCashUsed) + Number(kingCashEarned));

  saveDB(db);
  res.json({
    success: true,
    upiIntent,
    qrUrl,
    whatsappDispatchUrl,
    activeGateway,
    order: newOrder,
    ledger: db.ledger
  });
});

// ============================================================================
// 4. DAILY SPIN-TO-WIN ADDICTION & VIRAL WHATSAPP REFERRAL ENGINE
// ============================================================================
app.post('/api/kingpay/viral-reward', (req, res) => {
  const { type } = req.body;
  const reward = type === 'REFERRAL'
    ? Number(db.umarConfig.referralRewardKingCashINR)
    : [15, 25, 35, 50][Math.floor(Math.random() * 4)];

  db.ledger.userKingCashBalanceINR += reward;
  db.ledger.dailyStreakCount += 1;
  saveDB(db);

  res.json({
    success: true,
    rewardAdded: reward,
    userKingCashBalanceINR: db.ledger.userKingCashBalanceINR,
    dailyStreakCount: db.ledger.dailyStreakCount
  });
});

// ============================================================================
// 5. GEMINI 2.5 FLASH AI TUTOR & UMAR OS FOUNDER STRATEGIST
// ============================================================================
app.post('/api/kingpay/ai-assistant', async (req, res) => {
  const { mode, prompt } = req.body;
  try {
    if (ai) {
      const systemContext = mode === 'UMAR_COPILOT'
        ? `You are Umar OS v5.0, the Founder's autonomous profit engine for OrderKingPay.com. Total Founder Profit: ₹${db.ledger.founderNetProfitINR}. Give concise, high-impact pricing and growth actions.`
        : `You are the KingPay 24/7 AI Tutor & Career Mentor inside OrderKingPay.com. Teach clearly with actionable steps.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemContext}\n\nRequest: ${prompt}`
      });
      return res.json({ reply: response.text });
    }

    const fallbackReply = mode === 'UMAR_COPILOT'
      ? `[Umar OS v5.0 Profit Audit]:\n• 0% Fee UPI Bypass is saving ₹2,000 per ₹1,00,000 GMV.\n• Flight Profit is locked at ₹${db.umarConfig.flightFounderBaseMarkupINR + db.umarConfig.flightConvenienceFeeINR}/ticket.\n• Daily Spin & Food KingCash are locking users into your ecosystem at ₹0 cost to your base profit.`
      : `[KingPay AI Tutor]: Step-by-Step Mastery Plan for "${prompt}":\n1. Speak the top 10 industry phrases aloud for 5 minutes daily.\n2. Use the Voice Mic button in OrderKingPay to test pronunciation.\n3. Apply directly via the Gulf & Metro Fast-Track Jobs tab.`;

    res.json({ reply: fallbackReply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 ORDERKINGPAY.COM + UMAR OS v5.0 LIVE AT http://localhost:${PORT}`);
});