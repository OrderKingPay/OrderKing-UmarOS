// Order King King AI: Automated Culinary Photo Studio & Menu Experience Engine
// Deterministic, studio-grade 4:3 food visual rendering, smart culinary taxonomy,
// dietary classification, and 1-tap automated dish photo generation for restaurant partners.

export type CulinaryStudioLightingStyle =
  | "warm_tandoor" // 3500K warm culinary lighting, amber highlights, claypot embers
  | "fine_dining" // Dramatic contrast, luxury dark obsidian slate, micro-herbs
  | "fresh_garden" // High vibrance, bright daylight, crisp natural textures
  | "royal_handi"; // Rich golden glow, slow-simmered gloss, brass/copper shine

export interface CulinaryStudioLightingSettings {
  brightness: number; // -15 to +28
  contrast: number; // 0.95 to 1.35
  saturation: number; // 0.95 to 1.40
  warmth: number; // 0.98 to 1.15
}

export const CULINARY_STUDIO_LIGHTING_PRESETS: Record<
  CulinaryStudioLightingStyle,
  { label: string; description: string; settings: CulinaryStudioLightingSettings }
> = {
  warm_tandoor: {
    label: "Warm Tandoor & Brass",
    description: "Golden 3500K embers, appetizing glaze, and authentic Indian claypot warmth",
    settings: { brightness: 10, contrast: 1.14, saturation: 1.18, warmth: 1.08 },
  },
  fine_dining: {
    label: "Fine Dining Dark Slate",
    description: "Dramatic contrast, deep charcoal background, focused top-down studio spotlight",
    settings: { brightness: 4, contrast: 1.25, saturation: 1.2, warmth: 1.02 },
  },
  fresh_garden: {
    label: "Fresh Natural Daylight",
    description: "Crisp white tabletop, vibrant herb greens, and daylight clarity",
    settings: { brightness: 14, contrast: 1.08, saturation: 1.22, warmth: 1.0 },
  },
  royal_handi: {
    label: "Royal Handi Simmer",
    description: "Rich copper sheen, simmering slow-cooked aroma, and luxurious sauce gloss",
    settings: { brightness: 8, contrast: 1.16, saturation: 1.15, warmth: 1.06 },
  },
};

export interface CulinaryVisualPreset {
  id: string;
  dishName: string;
  keywords: string[];
  category: string;
  diet: "VEG" | "NONVEG" | "EGG";
  prepMinutes: number;
  basePriceRupees: number;
  servingSize: string;
  description: string;
  tags: string[];
  primaryPhotoUrl: string;
  alternatePhotoUrls: string[];
}

export const CULINARY_PHOTO_DATABASE: CulinaryVisualPreset[] = [
  {
    id: "paneer-tikka",
    dishName: "Paneer Tikka",
    keywords: ["paneer tikka", "tandoori paneer", "paneer starter", "paneer kabab", "paneer kebab", "tikka"],
    category: "Starters & Tandoor",
    diet: "VEG",
    prepMinutes: 18,
    basePriceRupees: 289,
    servingSize: "Serves 1-2 (6 pcs · 300g)",
    description:
      "Charcoal-grilled cottage cheese cubes marinated in spiced mustard oil, hung curd, and roasted tandoori spices. Served with mint chutney and charred bell peppers.",
    tags: ["🌱 Pure Veg", "Charcoal Smoked", "Clay Oven Grilled", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chicken-biryani",
    dishName: "Chicken Dum Biryani",
    keywords: [
      "chicken biryani",
      "biryani",
      "dum biryani",
      "hyderabadi biryani",
      "chicken dum biryani",
      "lucknowi biryani",
    ],
    category: "Biryani & Rice",
    diet: "NONVEG",
    prepMinutes: 25,
    basePriceRupees: 349,
    servingSize: "Serves 1-2 (500g Handi)",
    description:
      "Aged long-grain Basmati rice layered with tender marinated chicken, slow-cooked on dum in a sealed handi with saffron, pure ghee, and crisp fried onions. Accompanied by burani raita.",
    tags: ["🌙 Halal Certified", "Slow Dum Cooked", "Aged Basmati", "Serves 1-2 (500g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "mutton-biryani",
    dishName: "Mutton Dum Biryani",
    keywords: ["mutton biryani", "gosht biryani", "mutton dum biryani", "lamb biryani"],
    category: "Biryani & Rice",
    diet: "NONVEG",
    prepMinutes: 30,
    basePriceRupees: 449,
    servingSize: "Serves 1-2 (550g Royal Handi)",
    description:
      "Slow-cooked tender cuts of prime bone-in mutton infused with royal Awadhi spices, saffron milk, and aromatic aged basmati rice. Served with cooling cucumber raita and spicy salan.",
    tags: ["🌙 Halal Certified", "Royal Awadhi Recipe", "Pure Ghee", "Serves 1-2 (500g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "veg-biryani",
    dishName: "Veg Dum Biryani",
    keywords: ["veg biryani", "vegetable biryani", "veg dum biryani", "paneer biryani", "subz biryani"],
    category: "Biryani & Rice",
    diet: "VEG",
    prepMinutes: 20,
    basePriceRupees: 279,
    servingSize: "Serves 1-2 (450g Handi)",
    description:
      "Fragrant Basmati rice dum-cooked with garden-fresh cauliflower, beans, carrots, and soft paneer in aromatic whole spices and saffron ghee.",
    tags: ["🌱 Pure Veg", "Slow Dum Cooked", "Garden Vegetables", "Serves 1-2 (500g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "butter-chicken",
    dishName: "Murgh Makhani (Butter Chicken)",
    keywords: ["butter chicken", "murgh makhani", "chicken makhani", "makhani chicken"],
    category: "Main Course & Curries",
    diet: "NONVEG",
    prepMinutes: 20,
    basePriceRupees: 389,
    servingSize: "Serves 2 (450ml)",
    description:
      "Tender tandoori chicken simmered in a velvety tomato makhani gravy enriched with slow-churned butter, fresh cream, and fragrant kasuri methi.",
    tags: ["🌙 Halal Certified", "Clay Oven Charcoal Smoked", "Rich Cashew Makhani", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dal-makhani",
    dishName: "Dal Makhani",
    keywords: ["dal makhani", "maa ki dal", "dal bukhara", "black dal", "makhani dal"],
    category: "Main Course & Curries",
    diet: "VEG",
    prepMinutes: 15,
    basePriceRupees: 269,
    servingSize: "Serves 2 (400ml Handi)",
    description:
      "Whole black urad lentils slow-simmered overnight over charcoal embers, blended with vine-ripened tomatoes, pure butter, and fresh cream.",
    tags: ["🌱 Pure Veg", "Overnight Charcoal Simmer", "Slow Churned Butter", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "paneer-butter-masala",
    dishName: "Paneer Butter Masala",
    keywords: ["paneer butter masala", "paneer makhani", "shahi paneer", "butter paneer"],
    category: "Main Course & Curries",
    diet: "VEG",
    prepMinutes: 18,
    basePriceRupees: 299,
    servingSize: "Serves 2 (400ml Handi)",
    description:
      "Fresh malai paneer cubes simmered in a rich, buttery cashew-tomato gravy, finished with fresh ginger juliennes and crushed fenugreek leaves.",
    tags: ["🌱 Pure Veg", "Velvety Cashew Gravy", "Farm Fresh Malai Paneer", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "kadhai-paneer",
    dishName: "Kadhai Paneer",
    keywords: ["kadhai paneer", "kadai paneer", "karahi paneer"],
    category: "Main Course & Curries",
    diet: "VEG",
    prepMinutes: 18,
    basePriceRupees: 289,
    servingSize: "Serves 2 (400ml)",
    description:
      "Paneer cubes tossed with crunchy bell peppers, onions, and freshly pounded kadhai coriander-chilli spices in an aromatic semi-dry gravy.",
    tags: ["🌱 Pure Veg", "Freshly Pounded Spices", "Crunchy Bell Peppers", "🌶️🌶️ Medium Spicy"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "palak-paneer",
    dishName: "Palak Paneer",
    keywords: ["palak paneer", "saag paneer", "spinach paneer"],
    category: "Main Course & Curries",
    diet: "VEG",
    prepMinutes: 16,
    basePriceRupees: 279,
    servingSize: "Serves 2 (400ml)",
    description:
      "Soft paneer cubes cooked in a vibrant green pureed spinach gravy tempered with garlic, cumin, and topped with a splash of cream.",
    tags: ["🌱 Pure Veg", "Farm Fresh Spinach", "Garlic Cumin Tadka", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "butter-naan",
    dishName: "Butter Naan",
    keywords: [
      "butter naan",
      "naan",
      "garlic naan",
      "cheese naan",
      "tandoori roti",
      "roti",
      "paratha",
      "kulcha",
      "laccha paratha",
    ],
    category: "Indian Breads (Roti / Naan)",
    diet: "VEG",
    prepMinutes: 8,
    basePriceRupees: 59,
    servingSize: "1 Pc (Artisan Cut)",
    description:
      "Traditional artisan flatbread slapped onto the clay walls of our tandoor, baked blistered and golden, then generously brushed with melted butter.",
    tags: ["🌱 Pure Veg", "Clay Tandoor Baked", "Melted Amul Butter", "Serves 1 (250g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "masala-dosa",
    dishName: "Crispy Masala Dosa",
    keywords: ["masala dosa", "dosa", "plain dosa", "mysore masala dosa", "onion dosa", "ghee roast"],
    category: "South Indian",
    diet: "VEG",
    prepMinutes: 12,
    basePriceRupees: 169,
    servingSize: "1 Large Crepe with Sambar & 2 Chutneys",
    description:
      "Crisp, golden fermented rice and lentil crepe stuffed with spiced tempered potato masala. Served with hot vegetable sambar and fresh coconut chutney.",
    tags: ["🌱 Pure Veg", "Stone Ground Batter", "Fresh Coconut Chutney", "Serves 1 (250g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "idli-sambar",
    dishName: "Steamed Idli Sambar (2 Pcs)",
    keywords: ["idli", "idli sambar", "vada", "medu vada", "uttapam"],
    category: "South Indian",
    diet: "VEG",
    prepMinutes: 10,
    basePriceRupees: 119,
    servingSize: "2 Pcs with Hot Sambar & Chutney",
    description:
      "Steamed feather-light fermented rice cakes served piping hot with lentil vegetable sambar and stone-ground coconut chutney.",
    tags: ["🌱 Pure Veg", "Steamed & Healthy", "Stone Ground Chutney", "Serves 1 (250g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chole-bhature",
    dishName: "Amritsari Chole Bhature",
    keywords: ["chole bhature", "chole", "bhature", "chana bhatura", "amritsari chole"],
    category: "Main Course & Curries",
    diet: "VEG",
    prepMinutes: 15,
    basePriceRupees: 199,
    servingSize: "2 Fluffy Bhaturas + Chole Bowl",
    description:
      "Spicy dark Amritsari chickpeas cooked with dried pomegranate and house spices, paired with twin fluffy puffed golden bhaturas, pickled carrots, and green chillies.",
    tags: ["🌱 Pure Veg", "Amritsari Spiced", "Fluffy Puffed Bhaturas", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "samosa",
    dishName: "Special Punjabi Samosa (2 Pcs)",
    keywords: ["samosa", "punjabi samosa", "samosas", "aloo samosa"],
    category: "Starters & Tandoor",
    diet: "VEG",
    prepMinutes: 8,
    basePriceRupees: 79,
    servingSize: "2 Pcs with Sweet & Mint Chutneys",
    description:
      "Crispy, golden pastry crust stuffed with spiced potatoes, green peas, and whole coriander seeds. Served with sweet tamarind and spicy mint chutneys.",
    tags: ["🌱 Pure Veg", "Crisp Ajwain Crust", "Sweet & Tangy Chutneys", "Serves 1 (250g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "hakka-noodles",
    dishName: "Veg Hakka Noodles",
    keywords: ["hakka noodles", "noodles", "veg noodles", "chow mein", "schezwan noodles", "noodle"],
    category: "Indo-Chinese",
    diet: "VEG",
    prepMinutes: 15,
    basePriceRupees: 219,
    servingSize: "Serves 1-2 (400g Wok Box)",
    description:
      "Wok-tossed noodles with shredded cabbage, crunchy carrots, bell peppers, spring onions, and garlic-soy sauce with an appetizing wok hei aroma.",
    tags: ["🌱 Pure Veg", "High Heat Wok Tossed", "Crunchy Veggies", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "fried-rice",
    dishName: "Veg Schezwan Fried Rice",
    keywords: ["fried rice", "veg fried rice", "schezwan fried rice", "egg fried rice", "chicken fried rice"],
    category: "Indo-Chinese",
    diet: "VEG",
    prepMinutes: 15,
    basePriceRupees: 229,
    servingSize: "Serves 1-2 (420g Wok Box)",
    description:
      "Fluffy rice tossed on high heat with crisp diced vegetables, garlic, scallions, and signature spicy Schezwan sauce.",
    tags: ["🌱 Pure Veg", "Spicy Schezwan", "Wok Tossed", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "momos",
    dishName: "Steamed Veg Momos (6 Pcs)",
    keywords: ["momo", "momos", "steamed momos", "fried momos", "dumplings", "dim sum"],
    category: "Starters & Tandoor",
    diet: "VEG",
    prepMinutes: 14,
    basePriceRupees: 159,
    servingSize: "6 Pcs with Fiery Red Garlic Dip",
    description:
      "Delicate handcrafted dumplings stuffed with finely minced vegetables and Himalayan herbs, steamed to perfection and served with spicy red chilli garlic chutney.",
    tags: ["🌱 Pure Veg", "Handmade Thin Skin", "Fiery Garlic Chilli Dip", "Serves 1 (250g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "pizza",
    dishName: "Classic Margherita Pizza (10 Inch)",
    keywords: ["pizza", "margherita", "cheese pizza", "farmhouse pizza", "paneer pizza"],
    category: "Continental & Fast Food",
    diet: "VEG",
    prepMinutes: 18,
    basePriceRupees: 319,
    servingSize: "Serves 1-2 (6 Slices · 10 Inch)",
    description:
      "Hand-stretched crust topped with herb-infused Italian tomato sauce, 100% mozzarella cheese, and fresh aromatic basil leaves baked stone-crisp.",
    tags: ["🌱 Pure Veg", "100% Mozzarella", "Stone Baked Crust", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "burger",
    dishName: "Crispy Veg Supreme Burger",
    keywords: ["burger", "crispy burger", "veg burger", "chicken burger", "cheeseburger"],
    category: "Continental & Fast Food",
    diet: "VEG",
    prepMinutes: 12,
    basePriceRupees: 189,
    servingSize: "1 Large Burger with Dip",
    description:
      "Crispy seasoned vegetable patty tucked in a toasted sesame brioche bun with crunchy iceberg lettuce, ripe tomatoes, melted cheese, and our secret house dressing.",
    tags: ["🌱 Pure Veg", "Toasted Brioche Bun", "Crunchy Herb Patty", "Serves 1 (250g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "pasta",
    dishName: "Creamy Alfredo Penne Pasta",
    keywords: ["pasta", "penne", "white sauce pasta", "red sauce pasta", "alfredo", "arrabiata"],
    category: "Continental & Fast Food",
    diet: "VEG",
    prepMinutes: 16,
    basePriceRupees: 289,
    servingSize: "Serves 1-2 (380g)",
    description:
      "Al dente penne pasta tossed in a rich garlic parmesan cream sauce with sautéed mushrooms, sweet corn, and black olives. Finished with Italian herbs.",
    tags: ["🌱 Pure Veg", "Real Parmesan & Cream", "Al Dente Penne", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1621996346565-e3d5d6281057?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "gulab-jamun",
    dishName: "Hot Shahi Gulab Jamun (2 Pcs)",
    keywords: ["gulab jamun", "jamun", "kala jamun"],
    category: "Beverages & Desserts",
    diet: "VEG",
    prepMinutes: 5,
    basePriceRupees: 99,
    servingSize: "2 Pcs with Saffron Sugar Syrup",
    description:
      "Soft, melt-in-the-mouth golden khoya dumplings fried in pure desi ghee and soaked in warm rose and cardamom-scented sugar syrup, garnished with slivered pistachios.",
    tags: ["🌱 Pure Veg", "Pure Desi Ghee", "Saffron Cardamom Syrup", "Serves 1 (250g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1667792601704-5175cfc2c431?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "beverage-lassi",
    dishName: "Royal Mango Lassi",
    keywords: ["lassi", "mango lassi", "sweet lassi", "cold coffee", "shake", "milkshake", "beverage"],
    category: "Beverages & Desserts",
    diet: "VEG",
    prepMinutes: 5,
    basePriceRupees: 129,
    servingSize: "1 Glass (350ml)",
    description:
      "Thick, creamy churned yoghurt drink blended with sweet Alphonso mango pulp and a pinch of fragrant cardamom, topped with almond flakes.",
    tags: ["🌱 Pure Veg", "Thick Curd Blend", "Alphonso Mango", "Serves 1 (250g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "masala-chai",
    dishName: "Cutting Masala Chai",
    keywords: ["chai", "tea", "masala chai", "coffee", "filter coffee"],
    category: "Beverages & Desserts",
    diet: "VEG",
    prepMinutes: 6,
    basePriceRupees: 49,
    servingSize: "1 Kullad / Cup (150ml)",
    description:
      "Freshly brewed with premium Assam tea leaves, slow-simmered with crushed ginger, green cardamom, cloves, and rich dairy milk.",
    tags: ["🌱 Pure Veg", "Hand Pounded Spices", "Fresh Assam Tea", "Serves 1 (250g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "egg-curry",
    dishName: "Dhaba Style Egg Curry",
    keywords: ["egg", "egg curry", "anda", "omelette", "anda curry", "egg roll"],
    category: "Main Course & Curries",
    diet: "EGG",
    prepMinutes: 15,
    basePriceRupees: 229,
    servingSize: "Serves 1-2 (2 Eggs + Gravy · 350ml)",
    description:
      "Golden fried hard-boiled eggs simmered in a spiced onion-tomato gravy with aromatic garam masala and fresh coriander.",
    tags: ["🥚 Contains Egg", "Dhaba Style Recipe", "Fresh Coriander", "Serves 1-2 (350g)"],
    primaryPhotoUrl:
      "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80",
    alternatePhotoUrls: [
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    ],
  },
];

/**
 * Intelligent Culinary Taxonomy Matcher:
 * Infers category, dietary classification, standard prep time, benchmark pricing,
 * and matching studio culinary photography from dish name.
 */
export function matchDishCulinaryTaxonomy(dishName: string): {
  matchedPreset: CulinaryVisualPreset | null;
  category: string;
  diet: "VEG" | "NONVEG" | "EGG";
  prepMinutes: number;
  basePriceRupees: number;
  servingSize: string;
  description: string;
  tags: string[];
  suggestedPhotoUrl: string;
  alternatePhotoUrls: string[];
} {
  const norm = dishName.toLowerCase().trim();

  // 1. Direct keyword match in curated catalog
  for (const preset of CULINARY_PHOTO_DATABASE) {
    if (preset.keywords.some((kw) => norm.includes(kw))) {
      return {
        matchedPreset: preset,
        category: preset.category,
        diet: preset.diet,
        prepMinutes: preset.prepMinutes,
        basePriceRupees: preset.basePriceRupees,
        servingSize: preset.servingSize,
        description: preset.description,
        tags: preset.tags,
        suggestedPhotoUrl: preset.primaryPhotoUrl,
        alternatePhotoUrls: preset.alternatePhotoUrls,
      };
    }
  }

  // 2. Fallback heuristic detection for custom dishes
  let diet: "VEG" | "NONVEG" | "EGG" = "VEG";
  const nonVegTerms = [
    "chicken",
    "mutton",
    "fish",
    "prawn",
    "meat",
    "gosht",
    "pork",
    "beef",
    "keema",
    "seekh",
    "kebab",
    "kabab",
    "lamb",
  ];
  const eggTerms = ["egg", "anda", "omelette"];

  if (nonVegTerms.some((t) => norm.includes(t))) {
    diet = "NONVEG";
  } else if (eggTerms.some((t) => norm.includes(t))) {
    diet = "EGG";
  }

  let category = "Main Course & Curries";
  if (norm.includes("biryani") || norm.includes("pulao") || norm.includes("rice")) {
    category = "Biryani & Rice";
  } else if (
    norm.includes("roti") ||
    norm.includes("naan") ||
    norm.includes("paratha") ||
    norm.includes("kulcha")
  ) {
    category = "Indian Breads (Roti / Naan)";
  } else if (
    norm.includes("tikka") ||
    norm.includes("starter") ||
    norm.includes("kebab") ||
    norm.includes("chaap") ||
    norm.includes("fry") ||
    norm.includes("tandoor")
  ) {
    category = "Starters & Tandoor";
  } else if (
    norm.includes("dosa") ||
    norm.includes("idli") ||
    norm.includes("vada") ||
    norm.includes("sambar")
  ) {
    category = "South Indian";
  } else if (
    norm.includes("noodle") ||
    norm.includes("manchurian") ||
    norm.includes("chilli") ||
    norm.includes("momo")
  ) {
    category = "Indo-Chinese";
  } else if (
    norm.includes("pizza") ||
    norm.includes("burger") ||
    norm.includes("pasta") ||
    norm.includes("sandwich")
  ) {
    category = "Continental & Fast Food";
  } else if (
    norm.includes("sweet") ||
    norm.includes("dessert") ||
    norm.includes("shake") ||
    norm.includes("tea") ||
    norm.includes("chai") ||
    norm.includes("coffee")
  ) {
    category = "Beverages & Desserts";
  }

  // Fallback to closest thematic photo
  const fallbackPreset =
    CULINARY_PHOTO_DATABASE.find((p) => p.category === category) || CULINARY_PHOTO_DATABASE[0];

  return {
    matchedPreset: null,
    category,
    diet,
    prepMinutes: 20,
    basePriceRupees: diet === "NONVEG" ? 349 : 249,
    servingSize: "Serves 1-2 (350g)",
    description: `Chef's special ${dishName}, prepared with hand-selected authentic ingredients, house aromatic spices, and traditional culinary finesse.`,
    tags: [
      diet === "VEG" ? "🌱 Pure Veg" : diet === "EGG" ? "🥚 Contains Egg" : "🌙 Halal Certified",
      "Freshly Cooked",
      "Serves 1-2 (350g)",
    ],
    suggestedPhotoUrl: fallbackPreset.primaryPhotoUrl,
    alternatePhotoUrls: fallbackPreset.alternatePhotoUrls,
  };
}

/**
 * Procedural HTML5 Canvas Culinary Generator:
 * Generates an appetizing 4:3 high-res canvas plate when offline or for custom dishes.
 */
export function generateProceduralCulinaryCanvas(
  dishName: string,
  diet: "VEG" | "NONVEG" | "EGG",
  style: CulinaryStudioLightingStyle = "warm_tandoor"
): string {
  if (typeof document === "undefined") {
    // Return standard SVG culinary data URI when in SSR or node test environments
    const baseColor = diet === "VEG" ? "#059669" : diet === "EGG" ? "#d97706" : "#e11d48";
    const bgGradient =
      style === "fine_dining"
        ? "linear-gradient(135deg, #090d16 0%, #1e293b 100%)"
        : "linear-gradient(135deg, #1c1917 0%, #292524 100%)";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <radialGradient id="plateGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="#0f172a"/>
      <circle cx="400" cy="300" r="240" fill="#1e293b" stroke="#334155" stroke-width="4"/>
      <circle cx="400" cy="300" r="220" fill="url(#plateGlow)"/>
      <circle cx="400" cy="300" r="180" fill="#2d1e18" stroke="#78350f" stroke-width="6"/>
      <text x="400" y="290" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${dishName}</text>
      <text x="400" y="325" font-family="system-ui, sans-serif" font-size="16" fill="${baseColor}" text-anchor="middle font-weight="600"">${diet === "VEG" ? "● Pure Vegetarian" : diet === "EGG" ? "● Contains Egg" : "● Non-Vegetarian"}</text>
      <text x="400" y="355" font-family="system-ui, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">Order King AI Culinary Studio · 4:3 Certified</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Studio Backdrop (Slate / Dark Granite with directional rim light)
  const bgGrad = ctx.createRadialGradient(400, 300, 50, 400, 300, 500);
  if (style === "fine_dining") {
    bgGrad.addColorStop(0, "#1e293b");
    bgGrad.addColorStop(0.7, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
  } else if (style === "fresh_garden") {
    bgGrad.addColorStop(0, "#f8fafc");
    bgGrad.addColorStop(0.7, "#cbd5e1");
    bgGrad.addColorStop(1, "#64748b");
  } else {
    // Warm Tandoor & Royal Handi (rich warm terracotta embers)
    bgGrad.addColorStop(0, "#2c1c14");
    bgGrad.addColorStop(0.65, "#18110d");
    bgGrad.addColorStop(1, "#0c0806");
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 600);

  // 2. Cast shadow under serving vessel
  ctx.beginPath();
  ctx.ellipse(400, 345, 230, 110, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fill();

  // 3. Handcrafted Artisan Serving Dish (Matte Slate / Brass Karahi Rim)
  ctx.beginPath();
  ctx.arc(400, 300, 205, 0, Math.PI * 2);
  const rimGrad = ctx.createLinearGradient(200, 100, 600, 500);
  if (style === "warm_tandoor" || style === "royal_handi") {
    rimGrad.addColorStop(0, "#d97706");
    rimGrad.addColorStop(0.5, "#78350f");
    rimGrad.addColorStop(1, "#451a03");
  } else {
    rimGrad.addColorStop(0, "#64748b");
    rimGrad.addColorStop(0.5, "#334155");
    rimGrad.addColorStop(1, "#0f172a");
  }
  ctx.fillStyle = rimGrad;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.stroke();

  // 4. Inner Culinary Plate Base
  ctx.beginPath();
  ctx.arc(400, 300, 185, 0, Math.PI * 2);
  const plateInner = ctx.createRadialGradient(380, 280, 20, 400, 300, 185);
  plateInner.addColorStop(0, "#b45309");
  plateInner.addColorStop(0.4, "#92400e");
  plateInner.addColorStop(0.85, "#451a03");
  plateInner.addColorStop(1, "#1c0a00");
  ctx.fillStyle = plateInner;
  ctx.fill();

  // 5. Rich Culinary Texture Swirls (Gravy Gloss / Basmati Grains / Saffron Garnish)
  ctx.save();
  ctx.translate(400, 300);
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(50, 0, 70, 22, 0.3, 0, Math.PI * 2);
    ctx.fillStyle =
      diet === "VEG"
        ? "rgba(251, 191, 36, 0.28)"
        : diet === "EGG"
        ? "rgba(245, 158, 11, 0.32)"
        : "rgba(239, 68, 68, 0.28)";
    ctx.fill();
  }
  ctx.restore();

  // 6. Garnish: Fresh coriander micro-herbs, cream swirl, and ginger juliennes
  ctx.beginPath();
  ctx.arc(390, 290, 35, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.fill();

  // Green coriander specks
  for (let i = 0; i < 16; i++) {
    const rx = 340 + Math.random() * 120;
    const ry = 240 + Math.random() * 120;
    ctx.beginPath();
    ctx.arc(rx, ry, 3 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();
  }

  // 7. Ambient Lighting Specular Glaze
  const specGrad = ctx.createLinearGradient(250, 150, 500, 400);
  specGrad.addColorStop(0, "rgba(255, 255, 255, 0.3)");
  specGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.05)");
  specGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.beginPath();
  ctx.arc(400, 300, 185, 0, Math.PI * 2);
  ctx.fillStyle = specGrad;
  ctx.fill();

  // 8. Studio Grade Title Watermark Overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 530, 800, 70);

  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(dishName, 30, 565);

  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = diet === "VEG" ? "#34d399" : diet === "EGG" ? "#fbbf24" : "#fb7185";
  const dietBadgeText =
    diet === "VEG" ? "● Pure Veg" : diet === "EGG" ? "● Contains Egg" : "● Non-Veg";
  ctx.fillText(dietBadgeText, 30 + ctx.measureText(dishName).width + 16, 564);

  ctx.font = "12px monospace";
  ctx.fillStyle = "#fbbf24";
  ctx.textAlign = "right";
  ctx.fillText("Order King AI Culinary Studio · 4:3 Studio Grade", 770, 565);

  return canvas.toDataURL("image/jpeg", 0.92);
}
