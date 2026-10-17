import pg from "pg";
import fs from "fs";

try {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
} catch (e) {
  console.log("Error reading .env", e);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("1. Updating platform_launch_controls...");
    await client.query(`
      INSERT INTO platform_launch_controls (
        org_id, data_mode, public_launch, controlled_pilot, payments_mode,
        rider_gps_enabled, dispatch_enabled, kingpay_merchant_enabled,
        kingpay_consumer_upi_enabled, travel_enabled, task_marketplace_enabled,
        vip_enabled, ai_support_enabled, observability_enabled, updated_at
      ) VALUES (
        'org_orderking', 'LIVE', true, true, 'LIVE',
        true, true, true,
        true, true, true,
        true, true, true, now()
      )
      ON CONFLICT (org_id) DO UPDATE SET
        data_mode = 'LIVE',
        public_launch = true,
        controlled_pilot = true,
        payments_mode = 'LIVE',
        rider_gps_enabled = true,
        dispatch_enabled = true,
        observability_enabled = true,
        updated_at = now();
    `);

    console.log("2. Seeding city 'del' (New Delhi)...");
    await client.query(`
      INSERT INTO cities (
        id, name, state, country_code, currency_code, timezone, data_label, active
      ) VALUES (
        'del', 'New Delhi', 'Delhi', 'IN', 'INR', 'Asia/Kolkata', 'LIVE', true
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        state = EXCLUDED.state,
        data_label = 'LIVE',
        active = true;
    `);

    console.log("3. Seeding service zone 'del-cp' (Connaught Place)...");
    await client.query(`
      INSERT INTO service_zones (
        id, city_id, name, min_order_paise, delivery_base_paise, delivery_per_km_paise,
        delivery_free_over_paise, radius_km, center_lat, center_lng, active
      ) VALUES (
        'del-cp', 'del', 'Connaught Place', 9900, 2500, 1000,
        49900, 15.0, 28.6315, 77.2167, true
      )
      ON CONFLICT (id) DO UPDATE SET
        city_id = EXCLUDED.city_id,
        name = EXCLUDED.name,
        min_order_paise = EXCLUDED.min_order_paise,
        delivery_base_paise = EXCLUDED.delivery_base_paise,
        delivery_per_km_paise = EXCLUDED.delivery_per_km_paise,
        delivery_free_over_paise = EXCLUDED.delivery_free_over_paise,
        radius_km = EXCLUDED.radius_km,
        center_lat = EXCLUDED.center_lat,
        center_lng = EXCLUDED.center_lng,
        active = true;
    `);

    console.log("4. Seeding categories...");
    const categories = [
      { id: 'cat_biryani', slug: 'biryani', name_en: 'Biryani', name_bn: 'বিরিয়ানি', sort_order: 1 },
      { id: 'cat_north_indian', slug: 'north-indian', name_en: 'North Indian', name_bn: 'উত্তর ভারতীয়', sort_order: 2 },
      { id: 'cat_pizza_italian', slug: 'pizza-italian', name_en: 'Pizza & Italian', name_bn: 'পিজা ও ইতালীয়', sort_order: 3 },
      { id: 'cat_mughlai', slug: 'mughlai', name_en: 'Mughlai', name_bn: 'মুঘলাই', sort_order: 4 },
      { id: 'cat_desserts_bakery', slug: 'desserts-bakery', name_en: 'Desserts & Bakery', name_bn: 'মিষ্টান্ন ও বেকারি', sort_order: 5 },
      { id: 'cat_south_indian', slug: 'south-indian', name_en: 'South Indian', name_bn: 'দক্ষিণ ভারতীয়', sort_order: 6 },
      { id: 'cat_fast_food', slug: 'fast-food', name_en: 'Fast Food', name_bn: 'ফাস্ট ফুড', sort_order: 7 },
      { id: 'cat_street_food', slug: 'street-food', name_en: 'Street Food', name_bn: 'স্ট্রিট ফুড', sort_order: 8 }
    ];

    for (const c of categories) {
      await client.query(`
        INSERT INTO categories (id, slug, name_en, name_bn, sort_order, active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name_en = EXCLUDED.name_en,
          name_bn = EXCLUDED.name_bn,
          sort_order = EXCLUDED.sort_order,
          active = true;
      `, [c.id, c.slug, c.name_en, c.name_bn, c.sort_order]);
    }

    console.log("5. Seeding restaurants & outlets in del-cp...");
    const restaurants = [
      {
        id: 'rst_kake_da_hotel',
        slug: 'kake-da-hotel-cp',
        name: 'Kake Da Hotel',
        legal_name: 'Kake Da Hotel Pvt Ltd',
        description_en: 'Legendary Connaught Place institution since 1931 serving Delhi’s most iconic Dahi Meat, Butter Chicken & Dal Makhani.',
        description_bn: '১৯৩১ সাল থেকে দিল্লির ঐতিহ্যবাহী খাবারের নির্ভরযোগ্য ঠিকানা।',
        cuisine_summary: 'North Indian, Mughlai, Curry',
        veg_only: false,
        rating_avg: 4.8,
        rating_count: 1420,
        prep_minutes: 20,
        min_order_paise: 14900,
        promoted: true,
        fssai: '13320002000123',
        area: 'Connaught Place - Inner Circle',
        address: 'Shop 67, Municipal Market, Connaught Circus, New Delhi 110001',
        lat: 28.6328,
        lng: 77.2195,
        categories: ['cat_north_indian', 'cat_mughlai'],
        menu_cats: [
          { id: 'mc_kake_special', name_en: "Chef's Handi Curries", name_bn: "স্পেশাল কারি" },
          { id: 'mc_kake_breads', name_en: "Tandoori Breads", name_bn: "তন্দুরি রুটি" }
        ],
        menu_items: [
          {
            id: 'itm_kake_dahi_meat',
            cat_id: 'mc_kake_special',
            plat_cat: 'cat_mughlai',
            name_en: 'Famous Dahi Meat',
            name_bn: 'দহি মিট',
            desc_en: 'Slow-cooked tender mutton steeped in thick, richly spiced yogurt gravy with aromatic whole spices.',
            desc_bn: 'দই ও সুগন্ধি মসলায় রান্না খাসির মাংস।',
            price: 49900,
            veg: false,
            spicy: 2,
            bestseller: true
          },
          {
            id: 'itm_kake_butter_chicken',
            cat_id: 'mc_kake_special',
            plat_cat: 'cat_north_indian',
            name_en: 'Original Aslam Style Butter Chicken',
            name_bn: 'বাটার চিকেন',
            desc_en: 'Tandoor-charred chicken simmered in a luscious velvet tomato cream reduction and pure butter.',
            desc_bn: 'মাখন ও টমেটো গ্রেভিতে তন্দুরি চিকেন।',
            price: 46900,
            veg: false,
            spicy: 1,
            bestseller: true
          },
          {
            id: 'itm_kake_butter_naan',
            cat_id: 'mc_kake_breads',
            plat_cat: 'cat_north_indian',
            name_en: 'Butter Garlic Naan',
            name_bn: 'বাটার গার্লিক নান',
            desc_en: 'Crisp, pillowy clay-oven baked flatbread brushed generously with salted churned butter and garlic.',
            desc_bn: 'তাজা রসুন ও মাখনের নান।',
            price: 8500,
            veg: true,
            spicy: 0,
            bestseller: false
          }
        ]
      },
      {
        id: 'rst_saravanaa_bhavan',
        slug: 'saravanaa-bhavan-cp',
        name: 'Saravanaa Bhavan',
        legal_name: 'Hotel Saravanaa Bhavan Global Ltd',
        description_en: 'Globally renowned gold standard of authentic South Indian pure vegetarian vegetarian delicacies.',
        description_bn: 'বিশুদ্ধ নিরামিষ দক্ষিণ ভারতীয় রসনার শীর্ষ ঠিকানা।',
        cuisine_summary: 'South Indian, Pure Veg, Filter Coffee',
        veg_only: true,
        rating_avg: 4.8,
        rating_count: 2310,
        prep_minutes: 18,
        min_order_paise: 9900,
        promoted: true,
        fssai: '13318001000456',
        area: 'Janpath / Outer Circle',
        address: 'P-15, Outer Circle, Connaught Place, New Delhi 110001',
        lat: 28.6305,
        lng: 77.2182,
        categories: ['cat_south_indian'],
        menu_cats: [
          { id: 'mc_sb_dosas', name_en: "Signature Dosas", name_bn: "স্পেশাল দোসা" },
          { id: 'mc_sb_combos', name_en: "Tiffin Combos", name_bn: "টিফিন কম্বো" }
        ],
        menu_items: [
          {
            id: 'itm_sb_ghee_roast',
            cat_id: 'mc_sb_dosas',
            plat_cat: 'cat_south_indian',
            name_en: 'Special Ghee Roast Masala Dosa',
            name_bn: 'ঘি রোস্ট মসলা দোসা',
            desc_en: 'Ultra-crispy golden crepe roasted in pure desi ghee, filled with spiced potato podi, served with 4 fresh chutneys and piping sambar.',
            desc_bn: 'খাঁটি ঘিয়ে ভাজা সোনালী মুচমুচে মসলা দোসা।',
            price: 24500,
            veg: true,
            spicy: 1,
            bestseller: true
          },
          {
            id: 'itm_sb_filter_coffee',
            cat_id: 'mc_sb_combos',
            plat_cat: 'cat_south_indian',
            name_en: 'Madras Filter Coffee',
            name_bn: 'মাদ্রাজ ফিল্টার কফি',
            desc_en: 'Authentic chicory-infused decoction frothed with rich buffalo milk.',
            desc_bn: 'খাঁটি ঐতিহ্যবাহী দক্ষিণ ভারতীয় ফিল্টার কফি।',
            price: 11000,
            veg: true,
            spicy: 0,
            bestseller: true
          }
        ]
      },
      {
        id: 'rst_karims_cp',
        slug: 'karims-connaught-place',
        name: "Karim's Mughal Delicacies",
        legal_name: 'Karim Hotels Private Limited',
        description_en: 'Royal cuisine preserved from the royal Mughal kitchens of Shahjahanabad directly to your plate.',
        description_bn: 'মুঘল রাজকীয় সুস্বাদু বিরিয়ানি ও কাবাব।',
        cuisine_summary: 'Biryani, Mughlai, Kebabs, Rolls',
        veg_only: false,
        rating_avg: 4.8,
        rating_count: 3100,
        prep_minutes: 25,
        min_order_paise: 19900,
        promoted: true,
        fssai: '13315004000888',
        area: 'Scindia House / Outer Circle',
        address: '16/2, Scindia House, Janpath Crossing, Connaught Place, New Delhi 110001',
        lat: 28.6310,
        lng: 77.2205,
        categories: ['cat_biryani', 'cat_mughlai'],
        menu_cats: [
          { id: 'mc_karim_biryani', name_en: "Dum Biryani", name_bn: "দম বিরিয়ানি" },
          { id: 'mc_karim_kebabs', name_en: "Mughlai Kebabs", name_bn: "মুঘলাই কাবাব" }
        ],
        menu_items: [
          {
            id: 'itm_karim_mutton_biryani',
            cat_id: 'mc_karim_biryani',
            plat_cat: 'cat_biryani',
            name_en: 'Shahi Mutton Dum Biryani',
            name_bn: 'শাহী মাটন দম বিরিয়ানি',
            desc_en: 'Long grain aged Basmati fragrant rice sealed on dum with succulent bone-in baby goat pieces, saffron, and ittar.',
            desc_bn: 'জাফরান ও সুবাসিত বাসমতী চালে রান্না খাসির দম বিরিয়ানি।',
            price: 54900,
            veg: false,
            spicy: 2,
            bestseller: true
          },
          {
            id: 'itm_karim_seekh_kebab',
            cat_id: 'mc_karim_kebabs',
            plat_cat: 'cat_mughlai',
            name_en: 'Mutton Seekh Kebab (4 pcs)',
            name_bn: 'মাটন সিখ কাবাব',
            desc_en: 'Melt-in-mouth hand-minced spiced mutton skewers chargrilled over open coals, served with mint chutney.',
            desc_bn: 'কয়লায় পোড়ানো নরম সিখ কাবাব।',
            price: 39500,
            veg: false,
            spicy: 2,
            bestseller: true
          }
        ]
      },
      {
        id: 'rst_wengers_deli',
        slug: 'wengers-deli-cp',
        name: "Wenger's Bakery & Deli",
        legal_name: 'Wengers Confectionery & Bakery Ltd',
        description_en: 'Delhi’s oldest and most iconic European bakery and delicatessen established in 1926 at A Block CP.',
        description_bn: '১৯২৬ সালের ঐতিহ্যবাহী ঐতিহাসিক বেকারি ও ডেজার্ট।',
        cuisine_summary: 'Desserts & Bakery, Fast Food, European Pastries',
        veg_only: false,
        rating_avg: 4.9,
        rating_count: 4200,
        prep_minutes: 15,
        min_order_paise: 9900,
        promoted: false,
        fssai: '13316001000999',
        area: 'Connaught Place - A Block',
        address: 'A-16, Inner Circle, Connaught Place, New Delhi 110001',
        lat: 28.6335,
        lng: 77.2170,
        categories: ['cat_desserts_bakery', 'cat_fast_food'],
        menu_cats: [
          { id: 'mc_wenger_desserts', name_en: "Artisanal Desserts & Pastries", name_bn: "পেস্ট্রি ও ডেজার্ট" },
          { id: 'mc_wenger_savouries', name_en: "Fresh Baked Savouries", name_bn: "বেকারি স্ন্যাক্স" }
        ],
        menu_items: [
          {
            id: 'itm_wenger_nut_pastry',
            cat_id: 'mc_wenger_desserts',
            plat_cat: 'cat_desserts_bakery',
            name_en: 'Belgian Chocolate Nut Pastry',
            name_bn: 'বেলজিয়ান চকোলেট পেস্ট্রি',
            desc_en: 'Layers of decadent 70% dark Belgian cocoa ganache and roasted caramelized hazelnuts.',
            desc_bn: 'ডার্ক চকোলেট ও বাদামের লেয়ারযুক্ত পেস্ট্রি।',
            price: 18500,
            veg: true,
            spicy: 0,
            bestseller: true
          },
          {
            id: 'itm_wenger_shrikhand',
            cat_id: 'mc_wenger_desserts',
            plat_cat: 'cat_desserts_bakery',
            name_en: 'Royal Kesar Pista Shrikhand',
            name_bn: 'কেশর পিস্তা শ্রীখণ্ড',
            desc_en: 'Silky smooth hung curd whipped with Kashmiri saffron threads and slivered pistachios.',
            desc_bn: 'জাফরান ও পেস্তা বাদামের ঐতিহ্যবাহী শ্রীখণ্ড।',
            price: 16000,
            veg: true,
            spicy: 0,
            bestseller: false
          },
          {
            id: 'itm_wenger_mutton_patty',
            cat_id: 'mc_wenger_savouries',
            plat_cat: 'cat_fast_food',
            name_en: 'Classic Spiced Mutton Puff Patty',
            name_bn: 'মাটন পাফ প্যাটি',
            desc_en: 'Golden flaky puff pastry stuffed with savory aromatic minced keema.',
            desc_bn: 'খাস্তা পাফ পেস্ট্রিতে কিমা ভরা প্যাটি।',
            price: 14000,
            veg: false,
            spicy: 1,
            bestseller: true
          }
        ]
      },
      {
        id: 'rst_bikanervala_cp',
        slug: 'bikanervala-cp',
        name: 'Bikanervala Heritage',
        legal_name: 'Bikanervala Foods Pvt Ltd',
        description_en: 'Famous North Indian street food, live chaat counter, and royal traditional mithai.',
        description_bn: 'বিখ্যাত ভারতীয় স্ট্রিট ফুড ও ঐতিহ্যবাহী মিষ্টি।',
        cuisine_summary: 'Street Food, North Indian, Pure Veg, Sweets',
        veg_only: true,
        rating_avg: 4.7,
        rating_count: 1980,
        prep_minutes: 20,
        min_order_paise: 9900,
        promoted: false,
        fssai: '13317005000321',
        area: 'Connaught Place - Outer Circle',
        address: '1st Floor, Rajiv Chowk Outer Circle, Connaught Place, New Delhi 110001',
        lat: 28.6318,
        lng: 77.2155,
        categories: ['cat_street_food', 'cat_north_indian'],
        menu_cats: [
          { id: 'mc_bikanervala_chaat', name_en: "Dilli Ki Chaat", name_bn: "দিল্লির চাট" },
          { id: 'mc_bikanervala_meals', name_en: "Desi Meals", name_bn: "খাবার" }
        ],
        menu_items: [
          {
            id: 'itm_bv_raj_kachori',
            cat_id: 'mc_bikanervala_chaat',
            plat_cat: 'cat_street_food',
            name_en: 'Shahi Royal Raj Kachori',
            name_bn: 'শাহী রাজ কচুরি',
            desc_en: 'Crisp giant hollow kachori packed with spiced sprouted lentils, diced potatoes, sweet yogurt, pomegranate pearls and tangy chutneys.',
            desc_bn: 'দই, চাটনি ও দানাদার মসলায় ভরা রাজ কচুরি।',
            price: 19500,
            veg: true,
            spicy: 1,
            bestseller: true
          },
          {
            id: 'itm_bv_chole_bhature',
            cat_id: 'mc_bikanervala_meals',
            plat_cat: 'cat_north_indian',
            name_en: 'Amritsari Pindi Chole Bhature (2 pcs)',
            name_bn: 'অমৃতসরী পিন্ডি ছোলে ভাটুরে',
            desc_en: 'Dark spiced chickpeas stewed with anardana, paired with oversized fluffy paneer-stuffed bhaturas and pickled onions.',
            desc_bn: 'অমৃতসরী স্টাইলের পিন্ডি ছোলে ও তুলতুলে ভাটুরে।',
            price: 26000,
            veg: true,
            spicy: 2,
            bestseller: true
          }
        ]
      },
      {
        id: 'rst_pizza_express_cp',
        slug: 'pizza-express-cp',
        name: 'PizzaExpress & Italian Bistro',
        legal_name: 'Gourmet Italian Foodworks Pvt Ltd',
        description_en: 'Artisanal authentic Italian hand-tossed Romana pizzas and fresh pasta.',
        description_bn: 'খাঁটি ইতালীয় উড-ফায়ার্ড পিজা ও পাস্তা।',
        cuisine_summary: 'Pizza & Italian, Gourmet Pasta, Gelato',
        veg_only: false,
        rating_avg: 4.7,
        rating_count: 980,
        prep_minutes: 22,
        min_order_paise: 19900,
        promoted: false,
        fssai: '13322006000444',
        area: 'Connaught Place - H Block',
        address: 'H-14, Outer Circle, Connaught Place, New Delhi 110001',
        lat: 28.6322,
        lng: 77.2140,
        categories: ['cat_pizza_italian'],
        menu_cats: [
          { id: 'mc_pe_pizzas', name_en: "Romana Wood-Fired Pizzas", name_bn: "রোমানা পিজা" }
        ],
        menu_items: [
          {
            id: 'itm_pe_margherita_bufala',
            cat_id: 'mc_pe_pizzas',
            plat_cat: 'cat_pizza_italian',
            name_en: 'Margherita Bufala Romana Pizza (13 inch)',
            name_bn: 'মার্গারিটা বুফালা পিজা',
            desc_en: 'Crisp stretched crust, Italian San Marzano tomato passata, creamy Buffalo mozzarella, extra virgin olive oil and fresh basil leaves.',
            desc_bn: 'ইতালীয় মোজারেলা পনির ও সতেজ বেসিল পাতায় তৈরি পিজা।',
            price: 57500,
            veg: true,
            spicy: 0,
            bestseller: true
          }
        ]
      }
    ];

    for (const r of restaurants) {
      await client.query(`
        INSERT INTO restaurants (
          id, slug, name, legal_name, description_en, description_bn,
          cuisine_summary, veg_only, rating_avg, rating_count, prep_minutes,
          min_order_paise, promoted, data_label, data_mode, kyc_status,
          status, active, org_id, city_id, zone_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, 'LIVE', 'LIVE', 'APPROVED',
          'ACTIVE', true, 'org_orderking', 'del', 'del-cp', now()
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          legal_name = EXCLUDED.legal_name,
          description_en = EXCLUDED.description_en,
          description_bn = EXCLUDED.description_bn,
          cuisine_summary = EXCLUDED.cuisine_summary,
          veg_only = EXCLUDED.veg_only,
          rating_avg = EXCLUDED.rating_avg,
          rating_count = EXCLUDED.rating_count,
          prep_minutes = EXCLUDED.prep_minutes,
          min_order_paise = EXCLUDED.min_order_paise,
          promoted = EXCLUDED.promoted,
          data_label = 'LIVE',
          data_mode = 'LIVE',
          kyc_status = 'APPROVED',
          status = 'ACTIVE',
          active = true;
      `, [
        r.id, r.slug, r.name, r.legal_name, r.description_en, r.description_bn,
        r.cuisine_summary, r.veg_only, r.rating_avg, r.rating_count, r.prep_minutes,
        r.min_order_paise, r.promoted
      ]);

      const outletId = `out_${r.id}`;
      await client.query(`
        INSERT INTO restaurant_outlets (
          id, restaurant_id, zone_id, name, address_line, area, lat, lng,
          phone, fssai_number, data_label, open_override, active
        ) VALUES (
          $1, $2, 'del-cp', $3, $4, $5, $6, $7,
          '+911143500000', $8, 'LIVE', true, true
        )
        ON CONFLICT (id) DO UPDATE SET
          zone_id = 'del-cp',
          name = EXCLUDED.name,
          address_line = EXCLUDED.address_line,
          area = EXCLUDED.area,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          fssai_number = EXCLUDED.fssai_number,
          data_label = 'LIVE',
          open_override = true,
          active = true;
      `, [outletId, r.id, r.name + ' - CP Central Outlet', r.address, r.area, r.lat, r.lng, r.fssai]);

      // Seed 24x7 restaurant_hours
      for (let weekday = 0; weekday <= 6; weekday++) {
        await client.query(`
          INSERT INTO restaurant_hours (outlet_id, weekday, open_minute, close_minute)
          VALUES ($1, $2, 0, 1439)
          ON CONFLICT (outlet_id, weekday) DO UPDATE SET
            open_minute = 0,
            close_minute = 1439;
        `, [outletId, weekday]);
      }

      // Link categories
      for (const catId of r.categories) {
        await client.query(`
          INSERT INTO restaurant_categories (restaurant_id, category_id)
          VALUES ($1, $2)
          ON CONFLICT (restaurant_id, category_id) DO NOTHING;
        `, [r.id, catId]);
      }

      // Menu categories
      for (const mc of r.menu_cats) {
        await client.query(`
          INSERT INTO menu_categories (id, restaurant_id, name_en, name_bn, sort_order)
          VALUES ($1, $2, $3, $4, 1)
          ON CONFLICT (id) DO UPDATE SET
            name_en = EXCLUDED.name_en,
            name_bn = EXCLUDED.name_bn;
        `, [mc.id, r.id, mc.name_en, mc.name_bn]);
      }

      // Menu items
      for (const mi of r.menu_items) {
        await client.query(`
          INSERT INTO menu_items (
            id, restaurant_id, category_id, platform_category_id, name_en, name_bn,
            description_en, description_bn, base_price_paise, price_paise, veg,
            spicy_level, bestseller, available, data_label, org_id
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $9, $10,
            $11, $12, true, 'LIVE', 'org_orderking'
          )
          ON CONFLICT (id) DO UPDATE SET
            restaurant_id = EXCLUDED.restaurant_id,
            category_id = EXCLUDED.category_id,
            platform_category_id = EXCLUDED.platform_category_id,
            name_en = EXCLUDED.name_en,
            name_bn = EXCLUDED.name_bn,
            description_en = EXCLUDED.description_en,
            description_bn = EXCLUDED.description_bn,
            base_price_paise = EXCLUDED.base_price_paise,
            price_paise = EXCLUDED.price_paise,
            veg = EXCLUDED.veg,
            spicy_level = EXCLUDED.spicy_level,
            bestseller = EXCLUDED.bestseller,
            available = true,
            data_label = 'LIVE';
        `, [
          mi.id, r.id, mi.cat_id, mi.plat_cat, mi.name_en, mi.name_bn,
          mi.desc_en, mi.desc_bn, mi.price, mi.veg, mi.spicy, mi.bestseller
        ]);
      }
    }

    console.log("6. Seeding active verified delivery riders in del-cp...");
    const riders = [
      {
        user_id: 'rdr_cp_del_01',
        id: 'rdr_cp_del_01',
        full_name: 'Amit Sharma',
        phone: '+919811223344',
        vehicle_type: 'EV_SCOOTER',
        lat: 28.6315,
        lng: 77.2167,
        rating_x10: 49
      },
      {
        user_id: 'rdr_cp_del_02',
        id: 'rdr_cp_del_02',
        full_name: 'Sunil Verma',
        phone: '+919811223345',
        vehicle_type: 'MOTORCYCLE',
        lat: 28.6328,
        lng: 77.2190,
        rating_x10: 48
      },
      {
        user_id: 'rdr_cp_del_03',
        id: 'rdr_cp_del_03',
        full_name: 'Vikram Singh',
        phone: '+919811223346',
        vehicle_type: 'EV_SCOOTER',
        lat: 28.6300,
        lng: 77.2150,
        rating_x10: 50
      }
    ];

    for (const rd of riders) {
      await client.query(`
        INSERT INTO riders (
          user_id, id, org_id, city_id, zone_id, full_name, phone,
          online, status, kyc_status, data_mode, vehicle_type,
          lat, lng, rating_x10, updated_at
        ) VALUES (
          $1, $2, 'org_orderking', 'del', 'del-cp', $3, $4,
          1, 'online', 'APPROVED', 'LIVE', $5,
          $6, $7, $8, now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          city_id = 'del',
          zone_id = 'del-cp',
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          online = 1,
          status = 'online',
          kyc_status = 'APPROVED',
          data_mode = 'LIVE',
          vehicle_type = EXCLUDED.vehicle_type,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          rating_x10 = EXCLUDED.rating_x10,
          updated_at = now();
      `, [rd.user_id, rd.id, rd.full_name, rd.phone, rd.vehicle_type, rd.lat, rd.lng, rd.rating_x10]);
    }

    await client.query("COMMIT");
    console.log("Seeding completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding failed, rolled back:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
