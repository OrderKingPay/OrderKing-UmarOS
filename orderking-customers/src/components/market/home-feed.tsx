import React, { useMemo, useState } from 'react';

export const ACTIVE_FLAGSHIP_HUBS = [
  {
    id: 'sribhumi-core',
    name: 'Sribhumi / Karimganj & Guwahati Core',
    flagshipLabel: 'Assam Flagship (788710)',
    description: 'Verified Assamese, Sylheti, North Indian & Mughlai Kitchens',
    cityId: 'karimganj',
    cityName: 'Karimganj / Guwahati',
    zoneId: 'karimganj_core',
    zoneName: 'Sribhumi Core',
    label: 'Station Road, Karimganj / Guwahati, Assam 788710',
    line1: 'Station Road, Karimganj, Assam 788710',
    lat: 24.8688,
    lng: 92.3511,
    highlight: 'Assam Core 15km Zone',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'delhi-cp',
    name: 'Connaught Place Central',
    flagshipLabel: 'Delhi NCR Flagship',
    description: 'Verified North Indian, Mughlai & Heritage Kitchens',
    cityId: 'del',
    cityName: 'New Delhi',
    zoneId: 'del-cp',
    zoneName: 'Connaught Place',
    label: 'Connaught Place Central, New Delhi',
    line1: 'Inner Circle, Connaught Place, New Delhi',
    lat: 28.6315,
    lng: 77.2167,
    highlight: 'Connaught Place Verified Kitchens',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'mumbai-metro',
    name: 'Mumbai Metropolitan',
    flagshipLabel: 'Bandra / BKC Flagship',
    description: 'Coastal, Tandoor & Late-Night Delivery Kitchens',
    cityId: 'mum',
    cityName: 'Mumbai',
    zoneId: 'mum-bandra',
    zoneName: 'Bandra / BKC',
    label: 'Bandra West / BKC, Mumbai',
    line1: 'Linking Road, Bandra West, Mumbai',
    lat: 19.06,
    lng: 72.8336,
    highlight: 'Bandra & BKC Kitchens',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'bengaluru-hub',
    name: 'Bengaluru Tech Hub',
    flagshipLabel: 'Indiranagar Flagship',
    description: 'South Indian Filter Coffee, Bowl & Biryani Kitchens',
    cityId: 'blr',
    cityName: 'Bengaluru',
    zoneId: 'blr-ind',
    zoneName: 'Indiranagar',
    label: 'Indiranagar Tech Hub, Bengaluru',
    line1: '100ft Road, Indiranagar, Bengaluru',
    lat: 12.9784,
    lng: 77.6408,
    highlight: 'Indiranagar & Koramangala Kitchens',
    gradient: 'from-purple-500 to-violet-600',
  },
];

export interface ZomatoMenuDish {
  id: string;
  name: string;
  category: 'Biryani' | 'Thali' | 'Pizza' | 'Rolls' | 'Healthy Bowls' | 'South Indian';
  basePricePaise: number;
  packagingPaise: number;
  isVeg: boolean;
  isBestseller: boolean;
  healthyGrade: 'Super' | 'High';
  healthyScore: number;
  proteinGrams: number;
  fibreGrams: number;
  kcal: number;
  variants: { id: string; label: string; addPaise: number }[];
  addons: { id: string; label: string; addPaise: number }[];
}

export interface VerifiedKitchenRecord {
  id: string;
  slug: string;
  name: string;
  cuisines: string[];
  rating: number;
  ratingCount: number;
  prepMinutes: number;
  distanceKm: number;
  priceForOneRupees: number;
  isPureVeg: boolean;
  fssaiLicense: string;
  merchantPromoCode: string | null;
  merchantPromoDiscountPercent: number;
  merchantPromoMaxPaise: number;
  dishes: ZomatoMenuDish[];
}

export const VERIFIED_AVAILABLE_KITCHENS: VerifiedKitchenRecord[] = [
  {
    id: 'rest-gopinath',
    slug: 'gopinath-pure-veg-bhojanalaya',
    name: 'Gopinath Pure Veg Bhojanalaya',
    cuisines: ['Thali', 'North Indian', 'Assamese', 'South Indian'],
    rating: 4.6,
    ratingCount: 1840,
    prepMinutes: 14,
    distanceKm: 1.6,
    priceForOneRupees: 185,
    isPureVeg: true,
    fssaiLicense: '10324001000492',
    merchantPromoCode: 'MERCHANT20',
    merchantPromoDiscountPercent: 20,
    merchantPromoMaxPaise: 8000,
    dishes: [
      {
        id: 'dish-joha-thali',
        name: 'Special Joha Rice Assamese Pure Veg Thali',
        category: 'Thali',
        basePricePaise: 18500,
        packagingPaise: 1500,
        isVeg: true,
        isBestseller: true,
        healthyGrade: 'Super',
        healthyScore: 92,
        proteinGrams: 22,
        fibreGrams: 11,
        kcal: 540,
        variants: [
          { id: 'v-joha-reg', label: 'Aromatic Joha Rice (Regular)', addPaise: 0 },
          { id: 'v-red-rice', label: 'High-Fibre Red Bao Rice', addPaise: 2000 },
        ],
        addons: [
          { id: 'a-dahi', label: 'Fresh Matka Dahi (100g)', addPaise: 3000 },
          { id: 'a-papad', label: 'Roasted Masala Papad (2 pcs)', addPaise: 1500 },
        ],
      },
      {
        id: 'dish-masala-dosa',
        name: 'Ghee Roast Mysore Masala Dosa',
        category: 'South Indian',
        basePricePaise: 14500,
        packagingPaise: 1000,
        isVeg: true,
        isBestseller: true,
        healthyGrade: 'High',
        healthyScore: 81,
        proteinGrams: 14,
        fibreGrams: 8,
        kcal: 410,
        variants: [
          { id: 'v-classic', label: 'Classic Sambar & Trio Chutney', addPaise: 0 },
          { id: 'v-podi', label: 'Gunpowder Ghee Podi Upgrade', addPaise: 2500 },
        ],
        addons: [
          { id: 'a-vada', label: 'Crispy Medu Vada (1 pc)', addPaise: 3500 },
        ],
      },
    ],
  },
  {
    id: 'rest-karims',
    slug: 'karims-connaught-place',
    name: "Karim's Royal Dum & Kebab Kitchen",
    cuisines: ['Biryani', 'Rolls', 'Mughlai'],
    rating: 4.7,
    ratingCount: 3420,
    prepMinutes: 18,
    distanceKm: 2.2,
    priceForOneRupees: 240,
    isPureVeg: false,
    fssaiLicense: '10324001000871',
    merchantPromoCode: 'BAWARCHI50',
    merchantPromoDiscountPercent: 15,
    merchantPromoMaxPaise: 7500,
    dishes: [
      {
        id: 'dish-dum-biryani',
        name: 'Shahi Chicken Dum Biryani',
        category: 'Biryani',
        basePricePaise: 24000,
        packagingPaise: 2000,
        isVeg: false,
        isBestseller: true,
        healthyGrade: 'High',
        healthyScore: 79,
        proteinGrams: 38,
        fibreGrams: 5,
        kcal: 680,
        variants: [
          { id: 'v-half', label: 'Single (1 Pc + 1 Egg)', addPaise: 0 },
          { id: 'v-full', label: 'Full (2 Pcs + 2 Eggs)', addPaise: 12000 },
        ],
        addons: [
          { id: 'a-raita', label: 'Burhani Garlic Raita', addPaise: 2500 },
          { id: 'a-salan', label: 'Mirchi Ka Salan', addPaise: 2500 },
        ],
      },
      {
        id: 'dish-kathi-roll',
        name: 'Charcoal Paneer Tikka Kathi Roll',
        category: 'Rolls',
        basePricePaise: 16500,
        packagingPaise: 1000,
        isVeg: true,
        isBestseller: false,
        healthyGrade: 'High',
        healthyScore: 80,
        proteinGrams: 21,
        fibreGrams: 6,
        kcal: 460,
        variants: [
          { id: 'v-wheat', label: 'Whole Wheat Lachha Roll', addPaise: 0 },
          { id: 'v-double', label: 'Double Paneer Stuffing', addPaise: 5000 },
        ],
        addons: [
          { id: 'a-mint', label: 'Extra Mint Curd Dip', addPaise: 1500 },
        ],
      },
    ],
  },
  {
    id: 'rest-green-bowl',
    slug: 'green-bowl-healthy-kitchen',
    name: 'Green Bowl Superfood & Artisan Pizza Kitchen',
    cuisines: ['Healthy Bowls', 'Pizza'],
    rating: 4.5,
    ratingCount: 980,
    prepMinutes: 12,
    distanceKm: 1.4,
    priceForOneRupees: 215,
    isPureVeg: true,
    fssaiLicense: '10324001000915',
    merchantPromoCode: 'HEALTHY20',
    merchantPromoDiscountPercent: 20,
    merchantPromoMaxPaise: 6000,
    dishes: [
      {
        id: 'dish-quinoa-bowl',
        name: 'High-Protein Tandoori Paneer Quinoa Bowl',
        category: 'Healthy Bowls',
        basePricePaise: 21500,
        packagingPaise: 1500,
        isVeg: true,
        isBestseller: true,
        healthyGrade: 'Super',
        healthyScore: 95,
        proteinGrams: 34,
        fibreGrams: 14,
        kcal: 480,
        variants: [
          { id: 'v-350', label: 'Regular (350g)', addPaise: 0 },
          { id: 'v-500', label: 'Pro Athlete (500g Double Protein)', addPaise: 7500 },
        ],
        addons: [
          { id: 'a-hummus', label: 'Roasted Garlic Hummus', addPaise: 3500 },
        ],
      },
      {
        id: 'dish-margherita',
        name: 'Wood-Fired Sourdough Margherita Pizza',
        category: 'Pizza',
        basePricePaise: 23500,
        packagingPaise: 2000,
        isVeg: true,
        isBestseller: true,
        healthyGrade: 'High',
        healthyScore: 78,
        proteinGrams: 24,
        fibreGrams: 7,
        kcal: 590,
        variants: [
          { id: 'v-8in', label: '8-Inch Regular Hand-Stretched', addPaise: 0 },
          { id: 'v-10in', label: '10-Inch Medium Bocconcini', addPaise: 9000 },
        ],
        addons: [
          { id: 'a-olives', label: 'Kalamata Olives & Basil', addPaise: 3000 },
        ],
      },
    ],
  },
];

const CATEGORIES = ['All', 'Biryani', 'Thali', 'Pizza', 'Rolls', 'Healthy Bowls', 'South Indian'] as const;

const LIVE_STAGES = [
  'PLACED & PAID',
  'KITCHEN ACCEPTED',
  'FOOD PREPARED & READY',
  'RIDER ASSIGNED',
  'OUT FOR DELIVERY',
  'DELIVERED (OTP 4829 VERIFIED)',
] as const;

export function HomeFeed() {
  const [selectedHubId, setSelectedHubId] = useState<string>(ACTIVE_FLAGSHIP_HUBS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pureVegOnly, setPureVegOnly] = useState<boolean>(false);
  const [healthyModeOnly, setHealthyModeOnly] = useState<boolean>(false);
  const [under250Only, setUnder250Only] = useState<boolean>(false);
  const [rating45Only, setRating45Only] = useState<boolean>(false);
  const [goldActive, setGoldActive] = useState<boolean>(true);
  const [rescueClaimed, setRescueClaimed] = useState<boolean>(false);

  const [activeKitchenId, setActiveKitchenId] = useState<string>(VERIFIED_AVAILABLE_KITCHENS[0].id);
  const [activeDish, setActiveDish] = useState<ZomatoMenuDish>(VERIFIED_AVAILABLE_KITCHENS[0].dishes[0]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(VERIFIED_AVAILABLE_KITCHENS[0].dishes[0].variants[0].id);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [qty, setQty] = useState<number>(1);
  const [applyPromo, setApplyPromo] = useState<boolean>(true);
  const [riderTipPaise, setRiderTipPaise] = useState<number>(2000);
  const [orderStageIdx, setOrderStageIdx] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const activeHub = useMemo(
    () => ACTIVE_FLAGSHIP_HUBS.find((h) => h.id === selectedHubId) ?? ACTIVE_FLAGSHIP_HUBS[0],
    [selectedHubId]
  );

  const filteredKitchens = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return VERIFIED_AVAILABLE_KITCHENS.filter((k) => {
      if (pureVegOnly && !k.isPureVeg) return false;
      if (rating45Only && k.rating < 4.5) return false;
      if (under250Only && k.priceForOneRupees > 250) return false;
      if (healthyModeOnly && !k.dishes.some((d) => d.healthyGrade === 'Super')) return false;
      if (selectedCategory !== 'All' && !k.cuisines.includes(selectedCategory) && !k.dishes.some((d) => d.category === selectedCategory)) {
        return false;
      }
      if (q.length > 0) {
        const nameMatch = k.name.toLowerCase().includes(q);
        const cuisineMatch = k.cuisines.some((c) => c.toLowerCase().includes(q));
        const dishMatch = k.dishes.some((d) => d.name.toLowerCase().includes(q));
        if (!nameMatch && !cuisineMatch && !dishMatch) return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, pureVegOnly, healthyModeOnly, under250Only, rating45Only]);

  const activeKitchen = useMemo(
    () => filteredKitchens.find((k) => k.id === activeKitchenId) ?? filteredKitchens[0] ?? VERIFIED_AVAILABLE_KITCHENS[0],
    [filteredKitchens, activeKitchenId]
  );

  const bill = useMemo(() => {
    const v = activeDish.variants.find((item) => item.id === selectedVariantId) ?? activeDish.variants[0];
    const addonsPaise = activeDish.addons
      .filter((a) => selectedAddonIds.includes(a.id))
      .reduce((acc, a) => acc + a.addPaise, 0);
    const unitFoodPaise = activeDish.basePricePaise + (v?.addPaise ?? 0) + addonsPaise;
    const grossFoodPaise = unitFoodPaise * qty;
    const packagingPaise = activeDish.packagingPaise * qty;
    const promoPaise =
      applyPromo && activeKitchen.merchantPromoCode && grossFoodPaise >= 15000
        ? Math.min(activeKitchen.merchantPromoMaxPaise, Math.round((grossFoodPaise * activeKitchen.merchantPromoDiscountPercent) / 100))
        : 0;
    const netTaxableFoodPaise = Math.max(0, grossFoodPaise - promoPaise);
    const cgstPaise = Math.round(netTaxableFoodPaise * 0.025);
    const sgstPaise = Math.round(netTaxableFoodPaise * 0.025);
    const rawDeliveryPaise = 2900;
    const deliveryPaise = goldActive && netTaxableFoodPaise >= 9900 ? 0 : rawDeliveryPaise;
    const platformFeePaise = 1000;
    const grandTotalPaise = netTaxableFoodPaise + packagingPaise + cgstPaise + sgstPaise + deliveryPaise + platformFeePaise + riderTipPaise;
    return {
      grossFoodPaise,
      packagingPaise,
      promoPaise,
      netTaxableFoodPaise,
      cgstPaise,
      sgstPaise,
      deliveryPaise,
      platformFeePaise,
      grandTotalPaise,
      etaMins: activeKitchen.prepMinutes + Math.ceil(activeKitchen.distanceKm * 3.5) + 4,
    };
  }, [activeDish, selectedVariantId, selectedAddonIds, qty, applyPromo, activeKitchen, goldActive, riderTipPaise]);

  const selectDish = (k: VerifiedKitchenRecord, d: ZomatoMenuDish) => {
    setActiveKitchenId(k.id);
    setActiveDish(d);
    setSelectedVariantId(d.variants[0]?.id ?? '');
    setSelectedAddonIds([]);
  };

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '12px 16px 88px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Location & Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #e4e4e7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#e23744' }}>Zone:</span>
          <select
            aria-label="Select Delivery Zone"
            value={selectedHubId}
            onChange={(e) => setSelectedHubId(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #d4d4d8', fontWeight: 700, fontSize: 13, background: '#fff' }}
          >
            {ACTIVE_FLAGSHIP_HUBS.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.cityName})
              </option>
            ))}
          </select>
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search restaurant, cuisine or dish..."
          style={{ flex: '1 1 260px', padding: '8px 12px', borderRadius: 8, border: '1px solid #d4d4d8', fontSize: 13 }}
        />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPureVegOnly((v) => !v)}
            style={{ padding: '6px 10px', borderRadius: 8, border: pureVegOnly ? '1.5px solid #15803d' : '1px solid #d4d4d8', background: pureVegOnly ? '#dcfce7' : '#fff', color: '#166534', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Pure Veg
          </button>
          <button
            type="button"
            onClick={() => setHealthyModeOnly((v) => !v)}
            style={{ padding: '6px 10px', borderRadius: 8, border: healthyModeOnly ? '1.5px solid #0f766e' : '1px solid #d4d4d8', background: healthyModeOnly ? '#ccfbf1' : '#fff', color: '#115e59', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Healthy Mode
          </button>
          <button
            type="button"
            onClick={() => setUnder250Only((v) => !v)}
            style={{ padding: '6px 10px', borderRadius: 8, border: under250Only ? '1.5px solid #b45309' : '1px solid #d4d4d8', background: under250Only ? '#fef3c7' : '#fff', color: '#92400e', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Under ₹250
          </button>
          <button
            type="button"
            onClick={() => setRating45Only((v) => !v)}
            style={{ padding: '6px 10px', borderRadius: 8, border: rating45Only ? '1.5px solid #1d4ed8' : '1px solid #d4d4d8', background: rating45Only ? '#dbeafe' : '#fff', color: '#1e40af', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Rating 4.5+
          </button>
          <button
            type="button"
            onClick={() => setGoldActive((v) => !v)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #b45309', background: goldActive ? '#fef3c7' : '#fff', color: '#92400e', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
          >
            Gold Free Delivery ≥ ₹99: {goldActive ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Category Pills (Human-Readable Names Only — Never cat-0) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '7px 14px',
              borderRadius: 999,
              border: selectedCategory === cat ? '1.5px solid #e23744' : '1px solid #e4e4e7',
              background: selectedCategory === cat ? '#e23744' : '#ffffff',
              color: selectedCategory === cat ? '#ffffff' : '#18181b',
              fontWeight: 700,
              fontSize: 12,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Live Food Rescue Alert */}
      {!rescueClaimed && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #f59e0b', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
            Food Rescue (1.1 km away • Untampered Kitchen Seal): 1x Special Joha Rice Pure Veg Thali — Rescue Price ₹110.00 (Orig. ₹200.00)
          </div>
          <button
            type="button"
            onClick={() => {
              setRescueClaimed(true);
              selectDish(VERIFIED_AVAILABLE_KITCHENS[0], VERIFIED_AVAILABLE_KITCHENS[0].dishes[0]);
            }}
            style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#e23744', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Claim Rescue Order
          </button>
        </div>
      )}

      {/* Main Two-Column Zomato Discovery + Instant Customizer & Checkout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Left: Verified Kitchens & Dishes in Active Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#18181b' }}>
            {selectedCategory === 'All' ? `Verified Kitchens in ${activeHub.zoneName}` : `Best in ${selectedCategory} — ${activeHub.zoneName}`}
          </h2>

          {filteredKitchens.map((k) => (
            <div key={k.id} style={{ background: '#ffffff', borderRadius: 12, border: k.id === activeKitchen.id ? '2px solid #e23744' : '1px solid #e4e4e7', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#18181b' }}>{k.name}</div>
                  <div style={{ fontSize: 12, color: '#52525b' }}>
                    {k.cuisines.join(', ')} • ₹{k.priceForOneRupees} for one • {k.prepMinutes}–{k.prepMinutes + 8} mins ({k.distanceKm} km)
                  </div>
                  <div style={{ fontSize: 11, color: '#71717a' }}>FSSAI License: {k.fssaiLicense}</div>
                </div>
                <span style={{ background: '#15803d', color: '#fff', fontWeight: 800, fontSize: 12, padding: '3px 8px', borderRadius: 6 }}>
                  {k.rating} ★ ({k.ratingCount})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {k.dishes.map((d) => (
                  <div
                    key={d.id}
                    style={{ padding: 10, borderRadius: 8, border: '1px solid #f4f4f5', background: activeDish.id === d.id ? '#fff1f2' : '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: d.isVeg ? '#15803d' : '#b91c1c', display: 'inline-block' }} />
                        <strong style={{ fontSize: 13, color: '#18181b' }}>{d.name}</strong>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#18181b', marginTop: 2 }}>₹{(d.basePricePaise / 100).toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: '#0f766e', fontWeight: 600 }}>
                        Healthy {d.healthyGrade} ({d.healthyScore}/100) • {d.proteinGrams}g Protein • {d.fibreGrams}g Fibre • {d.kcal} kcal
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectDish(k, d)}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e23744', background: '#fff', color: '#e23744', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                    >
                      ADD +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Dish Variant/Add-on Customizer + Statutory GST Bill + Live 6-Stage Order Tracker */}
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e4e4e7', padding: 16, alignSelf: 'start', position: 'sticky', top: 16 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 15, fontWeight: 800, color: '#18181b' }}>
            Order Customizer & Statutory Tax Checkout
          </h3>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 8 }}>
            {activeKitchen.name} (FSSAI {activeKitchen.fssaiLicense})
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 14, color: '#18181b' }}>{activeDish.name}</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ padding: '2px 8px', cursor: 'pointer' }}>-</button>
              <strong style={{ fontSize: 13 }}>{qty}</strong>
              <button type="button" onClick={() => setQty((q) => q + 1)} style={{ padding: '2px 8px', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525b', marginBottom: 4 }}>Select Portion / Variant (Required)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {activeDish.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  style={{
                    padding: '5px 10px',
                    fontSize: 11,
                    borderRadius: 6,
                    border: selectedVariantId === v.id ? '1.5px solid #e23744' : '1px solid #d4d4d8',
                    background: selectedVariantId === v.id ? '#fff1f2' : '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {v.label} {v.addPaise > 0 ? `(+₹${v.addPaise / 100})` : ''}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52525b', marginBottom: 4 }}>Optional Add-ons</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {activeDish.addons.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    setSelectedAddonIds((prev) => (prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]))
                  }
                  style={{
                    padding: '5px 10px',
                    fontSize: 11,
                    borderRadius: 6,
                    border: selectedAddonIds.includes(a.id) ? '1.5px solid #15803d' : '1px solid #d4d4d8',
                    background: selectedAddonIds.includes(a.id) ? '#dcfce7' : '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + {a.label} (₹{a.addPaise / 100})
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #d4d4d8', paddingTop: 10, fontSize: 12, color: '#3f3f46', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Item + Variant/Add-on Total</span>
              <span>₹{(bill.grossFoodPaise / 100).toFixed(2)}</span>
            </div>
            {activeKitchen.merchantPromoCode && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: 700 }}>
                <label style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={applyPromo} onChange={(e) => setApplyPromo(e.target.checked)} /> Merchant Promo ({activeKitchen.merchantPromoCode})
                </label>
                <span>-₹{(bill.promoPaise / 100).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Kitchen Packaging + Platform Fee</span>
              <span>₹{((bill.packagingPaise + bill.platformFeePaise) / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sec 9(5) Food GST (2.5% CGST + 2.5% SGST)</span>
              <span>₹{((bill.cgstPaise + bill.sgstPaise) / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery Partner Fee ({activeKitchen.distanceKm} km)</span>
              <span>{bill.deliveryPaise === 0 ? 'FREE (Gold)' : `₹${(bill.deliveryPaise / 100).toFixed(2)}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Delivery Partner Tip (100% to Rider)</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 2000, 3000, 5000].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRiderTipPaise(t)}
                    style={{ padding: '2px 6px', fontSize: 11, borderRadius: 4, border: riderTipPaise === t ? '1px solid #e23744' : '1px solid #d4d4d8', background: riderTipPaise === t ? '#fff1f2' : '#fff', cursor: 'pointer' }}
                  >
                    ₹{t / 100}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, color: '#18181b', marginTop: 6, paddingTop: 6, borderTop: '1px solid #e4e4e7' }}>
              <span>To Pay • ETA {bill.etaMins} mins</span>
              <span>₹{(bill.grandTotalPaise / 100).toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!orderId) setOrderId('OK-' + Math.floor(100000 + Math.random() * 900000));
              setOrderStageIdx((idx) => (idx === null ? 0 : (idx + 1) % LIVE_STAGES.length));
            }}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#e23744',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {orderStageIdx === null
              ? `Pay ₹${(bill.grandTotalPaise / 100).toFixed(2)} via UPI (orderking@ybl) & Place Order`
              : 'Advance Live Tracking Stage →'}
          </button>

          {orderStageIdx !== null && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#f0fdf4', border: '1px solid #86efac', fontSize: 12, color: '#166534' }}>
              <strong>Order {orderId} Confirmed • Doorstep OTP: 4829</strong>
              <div style={{ marginTop: 4, fontWeight: 700 }}>
                Current Stage ({orderStageIdx + 1}/6): {LIVE_STAGES[orderStageIdx]}
              </div>
              <div style={{ fontSize: 11, marginTop: 2 }}>
                Entity: Orderkingpay • ECO GSTIN: 18AFXPH9838M1Z9
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeFeed;
