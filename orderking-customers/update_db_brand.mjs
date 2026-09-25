import pg from "pg";
const dbUrl = "postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
const pool = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function updateBrand() {
  const brandData = {
    appName: "OrderKing",
    shortName: "OrderKing",
    companyName: "OrderKing Marketplace",
    tagline: "Order from kitchens near you",
    description: "A fair local food marketplace. Sample catalogue until real kitchens are verified.",
    logoUrl: "/logo.jpg",
    logoLightUrl: "/logo.jpg",
    logoDarkUrl: "/logo.jpg",
    faviconUrl: "/favicon.svg",
    seoTitle: "OrderKing — food delivery & King Pay",
    seoDescription: "Order local food, track delivery, and settle payments with King Pay.",
    metaImage: "",
    themeColor: "#1E4A3A",
    backgroundColor: "#122c23",
    primaryColor: "hsl(159, 43%, 20%)",
    currency: "INR",
    currencySymbol: "₹",
    country: "IN",
    language: "en",
    timezone: "Asia/Kolkata",
    socialLinks: {},
    appStoreName: "OrderKing",
    playStoreName: "OrderKing",
    appStoreUrl: "",
    playStoreUrl: "",
    longDescription: "OrderKing is a local food marketplace and fintech super app.",
    publisherName: "OrderKing Marketplace",
    supportEmail: "support@orderking.com",
    supportPhone: "+91 99999 99999",
    supportUrl: "https://orderking.com/support",
    termsUrl: "https://orderking.com/terms",
    privacyUrl: "https://orderking.com/privacy",
    notificationSenderName: "OrderKing",
    notificationSenderEmail: "no-reply@orderking.com",
    whatsappDisplayName: "OrderKing",
    emailSenderName: "OrderKing",
    emailReplyTo: "support@orderking.com",
    supportName: "OrderKing Support",
    supportAddress: "Karimganj, Assam",
    taxId: "",
    taxName: "GST",
    taxRate: 5,
    taxInclusive: true,
    companyRegistration: "",
    companyAddress: "Karimganj, Assam",
    companyPhone: "+91 99999 99999",
    companyEmail: "support@orderking.com",
    companyWebsite: "https://orderking.com",
    founderEmail: "admin@orderking.com",
    founderPhone: "+91 99999 99999",
    founderName: "Umar Hasan",
    portalName: "OrderKing for Kitchens",
    portalUrl: "https://orderking-partners.vercel.app",
    notificationSender: "OrderKing Kitchens",
    settlementStatementBrand: "OrderKing Marketplace",
    settlementSupportEmail: "finance@orderking.com",
    settlementSupportPhone: "+91 99999 99999",
    legalEntityName: "OrderKing Marketplace",
    legalEntityAddress: "Karimganj, Assam",
    legalEntityPhone: "+91 99999 99999",
    legalEntityEmail: "legal@orderking.com"
  };

  try {
    const res = await pool.query(`UPDATE app_config SET value = $1 WHERE key = 'brand' RETURNING *`, [brandData]);
    console.log("Successfully updated live database:", res.rows[0]);
  } catch (err) {
    console.error("Failed to update db:", err);
  } finally {
    pool.end();
  }
}
updateBrand();
