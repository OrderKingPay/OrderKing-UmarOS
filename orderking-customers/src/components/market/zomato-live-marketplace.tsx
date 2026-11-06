// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { OutOfCoverageKingPayFallback } from "../out-of-coverage-kingpay-fallback";

interface VariantOption {
  id: string;
  label: string;
  pricePaise: number;
}

interface DishItem {
  id: string;
  name: string;
  category: "Pizza" | "Momo" | "Biryani" | "Rolls" | "Burger" | "Thali" | "Cake";
  diet: "VEG" | "NONVEG";
  basePricePaise: number;
  desc: string;
  bestseller?: boolean;
  sizes: VariantOption[];
  crusts: VariantOption[];
  spices: VariantOption[];
}

interface KarimganjRestaurant {
  id: string;
  name: string;
  rating: string;
  prepTime: string;
  offerBadge: string;
  cuisine: string;
  distanceKm: string;
  fssai: string;
  pureVeg: boolean;
  featuredDishTag: string;
  imageUrl: string;
  dishes: DishItem[];
}

const KARIMGANJ_RESTAURANTS: KarimganjRestaurant[] = [
  {
    id: "la_trio_pizza",
    name: "La Trio Pizza",
    rating: "4.5",
    prepTime: "40-45 mins",
    offerBadge: "30% OFF up to ₹50",
    cuisine: "Pizza, Italian, Fast Food",
    distanceKm: "1.8 km",
    fssai: "10324001000492",
    pureVeg: false,
    featuredDishTag: "Tandoori Chicken Pizza • ₹299",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    dishes: [
      {
        id: "lt_1",
        name: "Tandoori Chicken Pizza",
        category: "Pizza",
        diet: "NONVEG",
        basePricePaise: 29900,
        desc: "Chargrilled tandoori chicken chunks, smoky mozzarella, capsicum & red paprika.",
        bestseller: true,
        sizes: [
          { id: "sz_reg", label: "Regular (7 inch)", pricePaise: 0 },
          { id: "sz_med", label: "Medium (10 inch)", pricePaise: 11000 },
          { id: "sz_lrg", label: "Large (12 inch)", pricePaise: 19000 },
        ],
        crusts: [
          { id: "cr_ht", label: "Classic Hand Tossed", pricePaise: 0 },
          { id: "cr_cb", label: "Liquid Cheese Burst", pricePaise: 7500 },
          { id: "cr_tc", label: "Crispy Thin Crust", pricePaise: 4000 },
        ],
        spices: [
          { id: "sp_m", label: "Medium Oregano & Chili", pricePaise: 0 },
          { id: "sp_h", label: "Extra Peri-Peri Spice", pricePaise: 1000 },
        ],
      },
      {
        id: "lt_2",
        name: "Farmhouse Peppy Paneer Pizza",
        category: "Pizza",
        diet: "VEG",
        basePricePaise: 24900,
        desc: "Fresh malai paneer cubes, crisp bell peppers, sweet corn & 100% mozzarella.",
        bestseller: true,
        sizes: [
          { id: "sz_reg", label: "Regular (7 inch)", pricePaise: 0 },
          { id: "sz_med", label: "Medium (10 inch)", pricePaise: 10000 },
        ],
        crusts: [
          { id: "cr_ht", label: "Classic Hand Tossed", pricePaise: 0 },
          { id: "cr_cb", label: "Cheese Burst", pricePaise: 7500 },
        ],
        spices: [
          { id: "sp_m", label: "Classic Italian Herbs", pricePaise: 0 },
          { id: "sp_h", label: "Spicy Jalapeno Boost", pricePaise: 1500 },
        ],
      },
    ],
  },
  {
    id: "hotel_chandan",
    name: "Hotel Chandan",
    rating: "4.7",
    prepTime: "45-50 mins",
    offerBadge: "₹200 OFF above ₹449",
    cuisine: "Biryani, North Indian, Mughlai, Thali",
    distanceKm: "2.1 km",
    fssai: "10324001000518",
    pureVeg: false,
    featuredDishTag: "Special Chicken Dum Biryani • ₹190",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    dishes: [
      {
        id: "hc_1",
        name: "Special Chicken Dum Biryani",
        category: "Biryani",
        diet: "NONVEG",
        basePricePaise: 19000,
        desc: "Aromatic long-grain basmati rice layered with spiced chicken, egg & potato.",
        bestseller: true,
        sizes: [
          { id: "sz_h", label: "Regular (650ml)", pricePaise: 0 },
          { id: "sz_f", label: "Jumbo Full (1000ml + 2 pcs)", pricePaise: 8500 },
        ],
        crusts: [
          { id: "cr_r", label: "With Mint Raita & Salad", pricePaise: 0 },
          { id: "cr_g", label: "With Chicken Chaap Gravy", pricePaise: 6000 },
        ],
        spices: [
          { id: "sp_1", label: "Classic Shahi Mild", pricePaise: 0 },
          { id: "sp_2", label: "Spicy Barak Masala", pricePaise: 0 },
        ],
      },
      {
        id: "hc_2",
        name: "Shahi Paneer Butter Masala Thali",
        category: "Thali",
        diet: "VEG",
        basePricePaise: 17500,
        desc: "Paneer butter masala, dal tadka, jeera rice, 3 butter rotis, pickle & sweet.",
        sizes: [
          { id: "sz_s", label: "Standard Thali", pricePaise: 0 },
          { id: "sz_d", label: "Deluxe Maharaja Thali", pricePaise: 5500 },
        ],
        crusts: [
          { id: "cr_t", label: "3 Tandoori Butter Rotis", pricePaise: 0 },
          { id: "cr_n", label: "2 Butter Garlic Naans", pricePaise: 3000 },
        ],
        spices: [
          { id: "sp_m", label: "Medium Homestyle", pricePaise: 0 },
          { id: "sp_s", label: "Extra Tadka", pricePaise: 0 },
        ],
      },
    ],
  },
  {
    id: "chill_out",
    name: "Chill Out",
    rating: "3.9",
    prepTime: "55-60 mins",
    offerBadge: "30% OFF up to ₹50",
    cuisine: "Momos, Chinese, Rolls, Burgers",
    distanceKm: "2.4 km",
    fssai: "20324001000744",
    pureVeg: false,
    featuredDishTag: "Crispy Peri-Peri Chicken Momos • ₹149",
    imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    dishes: [
      {
        id: "co_1",
        name: "Crispy Peri-Peri Chicken Momos (8 Pcs)",
        category: "Momo",
        diet: "NONVEG",
        basePricePaise: 14900,
        desc: "Juicy minced chicken dumplings tossed in peri-peri seasoning with fiery red chutney.",
        bestseller: true,
        sizes: [
          { id: "sz_6", label: "Half Plate (6 Pcs)", pricePaise: 0 },
          { id: "sz_10", label: "Full Platter (10 Pcs)", pricePaise: 5000 },
        ],
        crusts: [
          { id: "cr_st", label: "Steamed Classic", pricePaise: 0 },
          { id: "cr_fr", label: "Kurkure Pan-Fried", pricePaise: 3000 },
        ],
        spices: [
          { id: "sp_1", label: "Medium Dip", pricePaise: 0 },
          { id: "sp_2", label: "Fiery Schezwan Dip", pricePaise: 1000 },
        ],
      },
      {
        id: "co_2",
        name: "Double Cheese Veg Zinger Burger",
        category: "Burger",
        diet: "VEG",
        basePricePaise: 12900,
        desc: "Herb-crusted potato & corn patty, cheddar slice, jalapenos & chipotle mayo.",
        sizes: [
          { id: "sz_s", label: "Single Burger", pricePaise: 0 },
          { id: "sz_m", label: "Meal with Fries & Coke", pricePaise: 7000 },
        ],
        crusts: [
          { id: "cr_b", label: "Toasted Sesame Bun", pricePaise: 0 },
          { id: "cr_c", label: "Extra Double Cheese Slice", pricePaise: 2500 },
        ],
        spices: [
          { id: "sp_m", label: "Classic Mayo", pricePaise: 0 },
          { id: "sp_p", label: "Spicy Peri-Peri Dust", pricePaise: 0 },
        ],
      },
    ],
  },
  {
    id: "fusion_frenzy",
    name: "Fusion Frenzy",
    rating: "4.3",
    prepTime: "55-60 mins",
    offerBadge: "₹200 OFF above ₹449",
    cuisine: "Pizza, Rolls, Continental, Desserts",
    distanceKm: "2.0 km",
    fssai: "20324001000891",
    pureVeg: true,
    featuredDishTag: "Smoked Paneer Tikka Pizza • ₹269",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    dishes: [
      {
        id: "ff_1",
        name: "Smoked Paneer Tikka Fusion Pizza",
        category: "Pizza",
        diet: "VEG",
        basePricePaise: 26900,
        desc: "Pure veg artisan pizza with marinated paneer tikka, olives, red onions & mozzarella.",
        bestseller: true,
        sizes: [
          { id: "sz_r", label: "Regular (8 inch)", pricePaise: 0 },
          { id: "sz_m", label: "Medium (10 inch)", pricePaise: 9000 },
        ],
        crusts: [
          { id: "cr_h", label: "Fresh Pan Crust", pricePaise: 0 },
          { id: "cr_c", label: "Stuffed Cheese Crust", pricePaise: 6500 },
        ],
        spices: [
          { id: "sp_1", label: "Mild Herbs", pricePaise: 0 },
          { id: "sp_2", label: "Spicy Tandoori Drizzle", pricePaise: 0 },
        ],
      },
    ],
  },
];

const ORDER_STAGES = [
  "Placed & Paid",
  "Kitchen Accepted",
  "Food Prepared & Ready",
  "Rider Assigned",
  "Out for Delivery",
  "Delivered",
];

export function ZomatoLiveMarketplace() {
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addressSub, setAddressSub] = useState("Bakarshal , Kanisail Pt I");
  const [isOutOfCoverage, setIsOutOfCoverage] = useState(false);

  // Veg Mode Popover & Bottom Sheet (Exact match to image_5.png & image_2.png)
  const [vegModeOn, setVegModeOn] = useState(false);
  const [showVegPopover, setShowVegPopover] = useState(false);
  const [showVegSheet, setShowVegSheet] = useState(false);
  const [vegSource, setVegSource] = useState<"ALL_REST" | "PURE_VEG_ONLY">("ALL_REST");
  const [vegDaysMode, setVegDaysMode] = useState<"ALL_DAYS" | "SELECT_DAYS">("ALL_DAYS");
  const [selectedVegDays, setSelectedVegDays] = useState<string[]>(["M", "T", "W", "T2", "F", "S", "S2"]);

  // Full Profile Drawer (Exact match to image.png, image_6.png, image_7.png, image_10.png)
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [profileModalMsg, setProfileModalMsg] = useState<string | null>(null);
  const [personalisedRatings, setPersonalisedRatings] = useState(true);
  const [appearanceMode, setAppearanceMode] = useState<"Light" | "Dark">("Light");
  const [goldMemberActive, setGoldMemberActive] = useState(false);

  // Search, Category & Quick Filters (Exact match to image_3.png & image_9.png)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [under250Filter, setUnder250Filter] = useState(false);
  const [under200Filter, setUnder200Filter] = useState(false);
  const [greatOffersFilter, setGreatOffersFilter] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"DELIVERY" | "HISTORY">("DELIVERY");

  // Train PNR Modal ("Food on train" / "Order on train")
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [pnrInput, setPnrInput] = useState("");
  const [trainOrderMsg, setTrainOrderMsg] = useState<string | null>(null);

  // Selected Restaurant Menu & Customizer Modal
  const [openRest, setOpenRest] = useState<KarimganjRestaurant | null>(null);
  const [customizingItem, setCustomizingItem] = useState<{ rest: KarimganjRestaurant; dish: DishItem } | null>(null);
  const [selSize, setSelSize] = useState<VariantOption | null>(null);
  const [selCrust, setSelCrust] = useState<VariantOption | null>(null);
  const [selSpice, setSelSpice] = useState<VariantOption | null>(null);
  const [qty, setQty] = useState<number>(1);

  // Cart & Live Order Tracking
  const [cart, setCart] = useState<
    Array<{
      id: string;
      restName: string;
      fssai: string;
      dishName: string;
      sizeLabel: string;
      crustLabel: string;
      spiceLabel: string;
      qty: number;
      unitPaise: number;
      lineTotalPaise: number;
    }>
  >([]);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [riderTipPaise, setRiderTipPaise] = useState<number>(2000);
  const [activeOrder, setActiveOrder] = useState<{
    code: string;
    doorstepOtp: string;
    stageIdx: number;
    totalPaise: number;
    restName: string;
    fssai: string;
    createdAt: string;
  } | null>(null);

  const fmt = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

  function handleVoiceSearch() {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.lang = "en-IN";
        rec.onresult = (e: any) => {
          const transcript = e.results?.[0]?.[0]?.transcript;
          if (transcript) setSearchQuery(transcript);
        };
        rec.start();
        return;
      } catch {}
    }
    setSearchQuery((prev) => (prev === "pizza" ? "biryani" : "pizza"));
  }

  function openDishCustomizer(rest: KarimganjRestaurant, dish: DishItem) {
    setCustomizingItem({ rest, dish });
    setSelSize(dish.sizes[0]);
    setSelCrust(dish.crusts[0]);
    setSelSpice(dish.spices[0]);
    setQty(1);
  }

  function confirmAddToCart() {
    if (!customizingItem || !selSize || !selCrust || !selSpice) return;
    const unitPaise =
      customizingItem.dish.basePricePaise +
      selSize.pricePaise +
      selCrust.pricePaise +
      selSpice.pricePaise;
    const lineTotalPaise = unitPaise * qty;
    setCart((prev) => [
      ...prev,
      {
        id: "c_" + Date.now(),
        restName: customizingItem.rest.name,
        fssai: customizingItem.rest.fssai,
        dishName: customizingItem.dish.name,
        sizeLabel: selSize.label,
        crustLabel: selCrust.label,
        spiceLabel: selSpice.label,
        qty,
        unitPaise,
        lineTotalPaise,
      },
    ]);
    setCustomizingItem(null);
    setShowCartSheet(true);
  }

  const foodSubtotalPaise = cart.reduce((s, c) => s + c.lineTotalPaise, 0);
  const packagingPaise = cart.length > 0 ? 2000 : 0;
  const taxablePaise = foodSubtotalPaise + packagingPaise;
  const cgstPaise = Math.round((taxablePaise * 250) / 10000);
  const sgstPaise = Math.round((taxablePaise * 250) / 10000);
  const deliveryFeePaise =
    cart.length === 0 ? 0 : goldMemberActive && foodSubtotalPaise >= 9900 ? 0 : 3500;
  const grandTotalPaise =
    taxablePaise + cgstPaise + sgstPaise + deliveryFeePaise + (cart.length > 0 ? riderTipPaise : 0);

  function handlePlaceOrder() {
    if (cart.length === 0) return;
    const code = "OK-" + Math.floor(1000 + Math.random() * 9000);
    const doorstepOtp = String(Math.floor(1000 + Math.random() * 9000));
    const created = {
      code,
      doorstepOtp,
      stageIdx: 0,
      totalPaise: grandTotalPaise,
      restName: cart[0].restName,
      fssai: cart[0].fssai,
      createdAt: new Date().toLocaleTimeString(),
    };
    setActiveOrder(created);
    setCart([]);
    setShowCartSheet(false);
    setOpenRest(null);

    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("orderking_partner_live_orders_v2");
        const list = raw ? JSON.parse(raw) : [];
        list.unshift({
          id: "ord_" + Date.now(),
          code,
          customerName: "Hasan (Bakarshal, Kanisail Pt I)",
          customerPhone: "+91 98640 22190",
          lines: cart.map((c) => ({
            itemId: c.id,
            name: c.dishName,
            qty: c.qty,
            baseUnitPricePaise: c.unitPaise,
            customizations: [
              { groupName: "Size", selection: c.sizeLabel, pricePaise: 0 },
              { groupName: "Crust", selection: c.crustLabel, pricePaise: 0 },
              { groupName: "Spice Level", selection: c.spiceLabel, pricePaise: 0 },
            ],
            lineTotalPaise: c.lineTotalPaise,
          })),
          foodSubtotalPaise,
          packagingPaise,
          cgstPaise,
          sgstPaise,
          totalPaise: grandTotalPaise,
          prepMins: 15,
          pickupPin: "4821",
          doorstepOtp,
          status: "PLACED",
          station: "MAIN_KITCHEN",
          createdAt: new Date().toISOString(),
        });
        window.localStorage.setItem("orderking_partner_live_orders_v2", JSON.stringify(list));
      } catch {}
    }
  }

  const visibleRestaurants = KARIMGANJ_RESTAURANTS.filter((r) => {
    if (vegModeOn && vegSource === "PURE_VEG_ONLY" && !r.pureVeg) return false;
    if (selectedCategory !== "All") {
      const hasCat = r.dishes.some((d) => d.category.toLowerCase() === selectedCategory.toLowerCase());
      if (!hasCat && !r.cuisine.toLowerCase().includes(selectedCategory.toLowerCase())) return false;
    }
    if (under200Filter) {
      const hasUnder200 = r.dishes.some((d) => d.basePricePaise <= 20000);
      if (!hasUnder200) return false;
    }
    if (under250Filter) {
      const hasUnder250 = r.dishes.some((d) => d.basePricePaise <= 25000);
      if (!hasUnder250) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.dishes.some((d) => d.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-28">
      {/* 1. EXACT ZOMATO GOLD TOP HEADER & HERO BANNER (image_3.png) */}
      <div className="bg-gradient-to-b from-[#F9E7BA] via-[#FDF3D7] to-white px-4 pt-3 pb-5 border-b border-amber-200/60">
        <div className="max-w-xl mx-auto space-y-3.5">
          {/* Location + GOLD ₹1 + Wallet + Profile Avatar Row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (!isOutOfCoverage) {
                  setIsOutOfCoverage(true);
                  setAddressLabel("Out of Coverage Zone");
                  setAddressSub("Expanding Pin · Explore KingPay");
                } else {
                  setIsOutOfCoverage(false);
                  setAddressLabel("Home");
                  setAddressSub("Bakarshal , Kanisail Pt I");
                }
              }}
              className="text-left group"
            >
              <div className="flex items-center gap-1.5 text-lg font-extrabold text-slate-900 leading-tight">
                <span>📍 {addressLabel}</span>
                <span className="text-xs text-slate-600">⌄</span>
              </div>
              <div className="text-xs font-medium text-slate-600 truncate max-w-[210px]">
                {addressSub}
              </div>
            </button>

            <div className="flex items-center gap-2.5">
              {/* GOLD ₹1 Pill */}
              <button
                type="button"
                onClick={() => setGoldMemberActive(!goldMemberActive)}
                className="rounded-full border border-amber-500/60 bg-gradient-to-r from-amber-100 to-amber-200 px-3 py-1 text-center shadow-sm"
              >
                <div className="text-[10px] font-black tracking-wider text-amber-900 leading-none">GOLD</div>
                <div className="text-[10px] font-bold text-amber-800 leading-tight">
                  {goldMemberActive ? "ACTIVE" : "₹1"}
                </div>
              </button>

              {/* Wallet Icon Button */}
              <Link
                to="/kingpay"
                aria-label="OrderKing Money Wallet"
                className="size-9 rounded-full bg-white/90 border border-slate-300 flex items-center justify-center text-slate-800 shadow-sm text-sm font-bold"
              >
                💳
              </Link>

              {/* User Avatar Button (Opens Exact Full Profile Drawer from image.png / image_6.png) */}
              <button
                type="button"
                aria-label="Open Hasan Profile"
                onClick={() => setShowProfileDrawer(true)}
                className="size-9 rounded-full bg-slate-900 text-amber-300 font-extrabold text-sm flex items-center justify-center border-2 border-white shadow"
              >
                H
              </button>
            </div>
          </div>

          {/* Search Bar + Voice Mic + VEG MODE Switch Row (image_3.png & image_5.png) */}
          <div className="flex items-center gap-2 relative">
            <div className="flex-1 flex items-center bg-white rounded-2xl border border-slate-200 px-3.5 h-12 shadow-sm">
              <span className="text-rose-500 mr-2.5 text-base">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search "pizza", "paneer", "biryani" or restaurant...'
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-700 px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Microphone Voice Button */}
            <button
              type="button"
              onClick={handleVoiceSearch}
              aria-label="Voice Search"
              className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-rose-500 text-base shrink-0"
            >
              🎙️
            </button>

            {/* VEG MODE Toggle (image_3.png / image_5.png) */}
            <div className="flex flex-col items-center shrink-0">
              <span className="text-[9px] font-black leading-none text-slate-800 tracking-tight">VEG</span>
              <span className="text-[8px] font-extrabold leading-none text-slate-700 mb-1">MODE</span>
              <button
                type="button"
                aria-label="Toggle Veg Mode"
                onClick={() => {
                  if (!vegModeOn) {
                    setShowVegPopover(true);
                  } else {
                    setVegModeOn(false);
                    setShowVegPopover(false);
                  }
                }}
                className={`w-10 h-5 rounded-full p-0.5 transition flex items-center ${
                  vegModeOn ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                <span className="size-4 rounded-full bg-white shadow" />
              </button>
            </div>

            {/* VEG MODE POPOVER (Exact match to image_5.png) */}
            {showVegPopover && (
              <div className="absolute right-0 top-14 z-40 w-72 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 space-y-3 text-slate-900">
                <div className="text-sm font-extrabold">See veg dishes from</div>
                <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    checked={vegSource === "ALL_REST"}
                    onChange={() => setVegSource("ALL_REST")}
                    className="accent-emerald-600"
                  />
                  <span>All restaurants</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    checked={vegSource === "PURE_VEG_ONLY"}
                    onChange={() => setVegSource("PURE_VEG_ONLY")}
                    className="accent-emerald-600"
                  />
                  <span>Pure Veg restaurants only</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setVegModeOn(true);
                    setShowVegPopover(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVegPopover(false);
                    setShowVegSheet(true);
                  }}
                  className="w-full text-center text-xs font-bold text-emerald-700 hover:underline pt-0.5"
                >
                  More settings
                </button>
              </div>
            )}
          </div>

          {/* Gold Free Delivery Envelope Banner (Exact match to image_3.png) */}
          <div className="rounded-2xl bg-gradient-to-r from-[#EED294] via-[#F5DFAC] to-[#E9C87B] p-4 text-center shadow-sm border border-amber-300/80 space-y-2">
            <div className="text-xl font-black tracking-tight text-amber-950">
              FREE DELIVERY <span className="block text-xs font-bold text-amber-900">above ₹99</span>
            </div>
            <button
              type="button"
              onClick={() => setGoldMemberActive(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 text-amber-300 px-4 py-1.5 text-xs font-bold shadow"
            >
              <span>
                {goldMemberActive
                  ? "✓ GOLD Active · Free Delivery Unlocked"
                  : "Renew GOLD for 3 months at ₹1 >"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Out-of-Coverage Intelligent Fallback (When Customer Tests Expanding Pin) */}
      {isOutOfCoverage ? (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <OutOfCoverageKingPayFallback
            detectedPincode="788710"
            detectedCity="Expanding Zone · Karimganj"
          />
        </div>
      ) : (
        <div className="max-w-xl mx-auto px-4 pt-4 space-y-6">
          {/* Active Multi-Stage Order Tracking Stepper (If Order Placed) */}
          {activeOrder && (
            <div className="rounded-2xl border-2 border-emerald-600 bg-white p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    LIVE ORDER TRACKING · #{activeOrder.code}
                  </span>
                  <div className="text-sm font-extrabold text-slate-900">
                    {activeOrder.restName} (FSSAI: {activeOrder.fssai})
                  </div>
                </div>
                <span className="rounded-xl bg-amber-100 border border-amber-400 px-2.5 py-1 text-xs font-extrabold text-amber-900">
                  Doorstep OTP: <strong className="font-mono">{activeOrder.doorstepOtp}</strong>
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {ORDER_STAGES.map((st, idx) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setActiveOrder({ ...activeOrder, stageIdx: idx })}
                    className={`rounded-lg p-1.5 text-center text-[10px] font-bold border ${
                      idx <= activeOrder.stageIdx
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    {idx + 1}. {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. MEALS UNDER ₹250 + CATEGORY STRIP (All, Pizza, Momo, Biryani, Rolls, Burger, Thali) (image_3.png) */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button
              type="button"
              onClick={() => setUnder250Filter(!under250Filter)}
              className={`shrink-0 rounded-2xl border p-2.5 text-center transition ${
                under250Filter
                  ? "border-sky-600 bg-sky-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-[9px] font-black uppercase bg-rose-600 text-white px-1.5 py-0.5 rounded">
                MEALS UNDER
              </div>
              <div className="text-base font-black text-sky-900 mt-0.5">₹250</div>
              <div className="text-[10px] font-bold text-sky-700">Explore &gt;</div>
            </button>

            {[
              { id: "All", label: "All", emoji: "🍱" },
              { id: "Pizza", label: "Pizza", emoji: "🍕" },
              { id: "Momo", label: "Momo", emoji: "🥟" },
              { id: "Biryani", label: "Biryani", emoji: "🍲" },
              { id: "Rolls", label: "Rolls", emoji: "🌯" },
              { id: "Burger", label: "Burger", emoji: "🍔" },
              { id: "Thali", label: "Thali", emoji: "🍽️" },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 flex flex-col items-center px-3 py-1.5 border-b-2 transition ${
                    active ? "border-rose-600 text-slate-900 font-extrabold" : "border-transparent text-slate-600 font-medium"
                  }`}
                >
                  <span className="text-2xl mb-1">{cat.emoji}</span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3. QUICK FILTER PILLS (Filters, Great offers, Under ₹200, Loved by locals) (image_3.png) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setUnder200Filter(false);
                setUnder250Filter(false);
                setGreatOffersFilter(false);
                setSelectedCategory("All");
              }}
              className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm"
            >
              ⚙️ Filters ▾
            </button>
            <button
              type="button"
              onClick={() => setGreatOffersFilter(!greatOffersFilter)}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-sm ${
                greatOffersFilter ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-300 bg-white text-slate-800"
              }`}
            >
              Great offers
            </button>
            <button
              type="button"
              onClick={() => setUnder200Filter(!under200Filter)}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-sm ${
                under200Filter ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-300 bg-white text-slate-800"
              }`}
            >
              Under ₹200
            </button>
            <button
              type="button"
              onClick={() => setShowVegSheet(true)}
              className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm"
            >
              🫶 Loved by locals
            </button>
          </div>

          {/* 4. RECOMMENDED FOR YOU HORIZONTAL CARDS (La Trio Pizza, Hotel Chandan, Chill Out) (image_3.png) */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              RECOMMENDED FOR YOU
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {visibleRestaurants.slice(0, 3).map((rest) => (
                <button
                  key={rest.id}
                  type="button"
                  onClick={() => setOpenRest(rest)}
                  className="text-left rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <div className="relative h-28 bg-slate-200">
                    <img src={rest.imageUrl} alt={rest.name} className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {rest.offerBadge}
                    </span>
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-emerald-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {rest.rating} ★
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-extrabold text-slate-900 truncate">{rest.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">⏱ {rest.prepTime}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 5. EXPLORE MORE 4-TILE STRIP (Offers, Food on train, Collections, Gift cards) (image_9.png) */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              EXPLORE MORE
            </h2>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { label: "Offers", icon: "🏷️", action: () => setGreatOffersFilter(true) },
                { label: "Food on train", icon: "🚆", action: () => setShowTrainModal(true) },
                { label: "Collections", icon: "🔖", action: () => setSelectedCategory("Biryani") },
                { label: "Gift cards", icon: "🎁", action: () => setShowProfileDrawer(true) },
              ].map((tile) => (
                <button
                  key={tile.label}
                  type="button"
                  onClick={tile.action}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm hover:border-rose-400 transition"
                >
                  <div className="text-2xl mb-1">{tile.icon}</div>
                  <div className="text-[11px] font-bold text-slate-800 leading-tight">{tile.label}</div>
                </button>
              ))}
            </div>
          </section>

          {/* 6. IN THE SPOTLIGHT (Fusion Frenzy) (image_9.png) */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              IN THE SPOTLIGHT
            </h2>
            {KARIMGANJ_RESTAURANTS.filter((r) => r.id === "fusion_frenzy").map((spot) => (
              <div
                key={spot.id}
                onClick={() => setOpenRest(spot)}
                className="relative h-48 rounded-3xl overflow-hidden shadow-md cursor-pointer border border-slate-200"
              >
                <img src={spot.imageUrl} alt={spot.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute top-3 left-3 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                  {spot.offerBadge}
                </span>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                  <div>
                    <div className="text-lg font-extrabold">{spot.name}</div>
                    <div className="text-xs text-slate-200">⏱ {spot.prepTime} · FSSAI {spot.fssai}</div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-lg bg-emerald-700 px-2 py-0.5 text-xs font-bold">
                      {spot.rating} ★
                    </span>
                    <div className="text-[10px] text-slate-200 mt-0.5">For you</div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* 7. 26 RESTAURANTS DELIVERING TO YOU (Featured Full Cards) (image_9.png) */}
          <section className="space-y-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                26 RESTAURANTS DELIVERING TO YOU
              </h2>
              <div className="text-xs text-slate-400">Featured in {addressSub}</div>
            </div>

            <div className="space-y-4">
              {visibleRestaurants.map((rest) => (
                <div
                  key={rest.id}
                  className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <div
                    onClick={() => setOpenRest(rest)}
                    className="relative h-48 bg-slate-200 cursor-pointer"
                  >
                    <img src={rest.imageUrl} alt={rest.name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-bold text-white">
                      {rest.featuredDishTag}
                    </span>
                    <span className="absolute bottom-3 left-3 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
                      {rest.offerBadge}
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{rest.name}</h3>
                        <p className="text-xs text-slate-500">
                          {rest.cuisine} · ⏱ {rest.prepTime} · {rest.distanceKm}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          FSSAI Lic: {rest.fssai}
                        </p>
                      </div>
                      <span className="rounded-lg bg-emerald-700 px-2 py-1 text-xs font-bold text-white">
                        {rest.rating} ★
                      </span>
                    </div>

                    {/* Inline Dish Quick-Add Strip */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {rest.dishes.map((dish) => (
                        <div key={dish.id} className="flex items-center justify-between text-xs py-1">
                          <div>
                            <span className={dish.diet === "VEG" ? "text-emerald-600 font-bold mr-1" : "text-rose-600 font-bold mr-1"}>
                              ●
                            </span>
                            <span className="font-bold text-slate-800">{dish.name}</span>
                            <span className="ml-2 font-mono font-semibold text-slate-600">
                              {fmt(dish.basePricePaise)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openDishCustomizer(rest, dish)}
                            className="rounded-xl border border-rose-500 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-extrabold px-3 py-1 text-xs transition"
                          >
                            ADD +
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 8. FLOATING BOTTOM NAVIGATION PILL (Delivery | History | KingPay ↗) (Exact match to image_3.png & image_9.png) */}
      <div className="fixed bottom-4 inset-x-0 z-30 px-4 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 pointer-events-auto">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCartSheet(true)}
              className="rounded-full bg-emerald-600 text-white px-4 py-3 text-xs font-extrabold shadow-xl"
            >
              🛒 {cart.length} item(s) · {fmt(grandTotalPaise)}
            </button>
          )}
          <div className="flex items-center rounded-full bg-white/95 backdrop-blur border border-slate-300 p-1 shadow-xl mx-auto">
            <button
              type="button"
              onClick={() => setActiveBottomTab("DELIVERY")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition ${
                activeBottomTab === "DELIVERY" ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              <span>🏠</span>
              <span>Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveBottomTab("HISTORY");
                setShowCartSheet(true);
              }}
              className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition ${
                activeBottomTab === "HISTORY" ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              <span>🛍️</span>
              <span>History</span>
            </button>
          </div>
          <Link
            to="/kingpay"
            className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 text-xs font-black shadow-xl shrink-0"
          >
            KingPay ↗
          </Link>
        </div>
      </div>

      {/* 9. VEG MODE FULL BOTTOM SHEET (Exact match to image_2.png) */}
      {showVegSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 space-y-4 text-slate-900 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Veg Mode</h3>
              <button type="button" onClick={() => setShowVegSheet(false)} className="size-8 rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="text-sm font-bold">See veg dishes from</div>
              <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                <span>All restaurants</span>
                <input
                  type="radio"
                  checked={vegSource === "ALL_REST"}
                  onChange={() => setVegSource("ALL_REST")}
                  className="accent-emerald-600"
                />
              </label>
              <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                <span>Pure Veg restaurants only</span>
                <input
                  type="radio"
                  checked={vegSource === "PURE_VEG_ONLY"}
                  onChange={() => setVegSource("PURE_VEG_ONLY")}
                  className="accent-emerald-600"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="text-sm font-bold">Select Veg Mode days</div>
              <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                <span>All days</span>
                <input
                  type="radio"
                  checked={vegDaysMode === "ALL_DAYS"}
                  onChange={() => setVegDaysMode("ALL_DAYS")}
                  className="accent-emerald-600"
                />
              </label>
              <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                <span>Select days of the week</span>
                <input
                  type="radio"
                  checked={vegDaysMode === "SELECT_DAYS"}
                  onChange={() => setVegDaysMode("SELECT_DAYS")}
                  className="accent-emerald-600"
                />
              </label>
              <div className="flex justify-between pt-1">
                {[
                  { id: "M", l: "M" },
                  { id: "T", l: "T" },
                  { id: "W", l: "W" },
                  { id: "T2", l: "T" },
                  { id: "F", l: "F" },
                  { id: "S", l: "S" },
                  { id: "S2", l: "S" },
                ].map((d) => {
                  const sel = selectedVegDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() =>
                        setSelectedVegDays(
                          sel ? selectedVegDays.filter((x) => x !== d.id) : [...selectedVegDays, d.id]
                        )
                      }
                      className={`size-9 rounded-full text-xs font-bold ${
                        sel ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {d.l}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setVegModeOn(true);
                setShowVegSheet(false);
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-sm"
            >
              Switch on Veg Mode
            </button>
          </div>
        </div>
      )}

      {/* 10. FULL ZOMATO CUSTOMER PROFILE DRAWER (Exact match to image.png, image_6.png, image_7.png, image_10.png) */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-50 bg-[#F4F5F7] overflow-y-auto text-slate-900">
          <div className="max-w-md mx-auto p-4 space-y-4 pb-16">
            <button
              type="button"
              onClick={() => setShowProfileDrawer(false)}
              className="size-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm"
            >
              ←
            </button>

            {/* User Card + Gold Membership Banner */}
            <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 flex items-center gap-4">
                <div className="size-16 rounded-full bg-slate-900 text-amber-300 text-2xl font-black flex items-center justify-center">
                  H
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Hasan</h2>
                  <p className="text-xs text-slate-600">hmhabibullah9@gmail.com</p>
                  <button
                    type="button"
                    onClick={() => setProfileModalMsg("Profile verified: Hasan (hmhabibullah9@gmail.com · Bakarshal, Kanisail Pt I, Karimganj - 788710)")}
                    className="text-xs font-bold text-slate-800 mt-1 inline-flex items-center gap-1"
                  >
                    <span>Edit profile ▸</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGoldMemberActive(true);
                  setProfileModalMsg("OrderKing Gold Membership activated! Enjoy Free Delivery on orders above ₹99.");
                }}
                className="w-full bg-[#1C1C1C] px-5 py-4 flex items-center justify-between text-amber-300 font-bold text-sm"
              >
                <span className="flex items-center gap-2.5">
                  <span className="size-7 rounded-full bg-amber-400/20 flex items-center justify-center">👑</span>
                  <span>{goldMemberActive ? "Gold Membership Active" : "Renew your Gold Membership"}</span>
                </span>
                <span>&gt;</span>
              </button>
            </div>

            {profileModalMsg && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-400 p-3.5 text-xs font-bold text-emerald-900 flex justify-between">
                <span>{profileModalMsg}</span>
                <button type="button" onClick={() => setProfileModalMsg(null)}>✕</button>
              </div>
            )}

            {/* Wallet & Coupons 2-Card Row (image_6.png) */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/kingpay"
                className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3 shadow-sm"
              >
                <span className="text-xl">👛</span>
                <div>
                  <div className="text-xs font-bold text-slate-800">OrderKing Money</div>
                  <div className="text-xs font-extrabold text-emerald-600">₹0</div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setProfileModalMsg("Active Coupons: WELCOME50 (30% OFF up to ₹50), ASSAM200 (₹200 OFF above ₹449).")}
                className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3 shadow-sm text-left"
              >
                <span className="text-xl">🏷️</span>
                <div className="text-xs font-bold text-slate-800">Your coupons</div>
              </button>
            </div>

            {/* Your preferences (image_6.png) */}
            <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
              <div className="text-sm font-extrabold border-l-4 border-rose-500 pl-2.5">Your preferences</div>
              <div className="divide-y divide-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileDrawer(false);
                    setShowVegSheet(true);
                  }}
                  className="w-full py-3 flex items-center justify-between font-medium"
                >
                  <span>🟢 Veg Mode</span>
                  <span className="text-slate-400">{vegModeOn ? "On >" : "Off >"}</span>
                </button>
                <div className="py-3 flex items-center justify-between font-medium">
                  <span>⭐ Show personalised ratings</span>
                  <button
                    type="button"
                    onClick={() => setPersonalisedRatings(!personalisedRatings)}
                    className={`w-10 h-5 rounded-full p-0.5 flex items-center ${
                      personalisedRatings ? "bg-rose-500 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <span className="size-4 rounded-full bg-white shadow" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setAppearanceMode(appearanceMode === "Light" ? "Dark" : "Light")}
                  className="w-full py-3 flex items-center justify-between font-medium"
                >
                  <span>🎨 Appearance</span>
                  <span className="text-slate-400">{appearanceMode} &gt;</span>
                </button>
                <Link to="/kingpay" className="w-full py-3 flex items-center justify-between font-medium">
                  <span>💳 Payment methods</span>
                  <span className="text-slate-400">&gt;</span>
                </Link>
              </div>
            </div>

            {/* Food delivery (image_6.png & image_7.png) */}
            <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
              <div className="text-sm font-extrabold border-l-4 border-rose-500 pl-2.5">Food delivery</div>
              <div className="divide-y divide-slate-100 text-xs">
                {[
                  { label: "🛍️ Your orders", msg: "Your live & past orders in Bakarshal, Kanisail Pt I are synced." },
                  { label: "📒 Address book", msg: "Saved Address: Home — Bakarshal, Kanisail Pt I, Karimganj, Assam - 788710" },
                  { label: "🔖 Your collections", msg: "Saved Collections: Top Pizza & Biryani in Karimganj." },
                  { label: "🫶 Manage recommendations", msg: "Personalised Assam & Barak Valley restaurant recommendations active." },
                  { label: "🚆 Order on train", action: () => { setShowProfileDrawer(false); setShowTrainModal(true); } },
                  { label: "💬 Online ordering help", msg: "24x7 Instant Order & Refund Support Desk Ready." },
                  { label: "🙈 Hidden Restaurants", msg: "No hidden restaurants in your profile." },
                  { label: "🏪 Hear from restaurants", msg: "Direct restaurant offers & hygiene updates enabled." },
                ].map((row) => (
                  <button
                    key={row.label}
                    type="button"
                    onClick={() => (row.action ? row.action() : setProfileModalMsg(row.msg))}
                    className="w-full py-3 flex items-center justify-between font-medium text-left"
                  >
                    <span>{row.label}</span>
                    <span className="text-slate-400">&gt;</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gift cards & credits + Enterprise + Feeding India + More (image.png, image_7.png, image_10.png) */}
            <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
              <div className="text-sm font-extrabold border-l-4 border-rose-500 pl-2.5">Gift cards &amp; credits</div>
              <div className="divide-y divide-slate-100 text-xs">
                <button type="button" onClick={() => setProfileModalMsg("Instant Gift Cards (₹250, ₹500, ₹1,000, ₹2,500) available via UPI.")} className="w-full py-3 flex justify-between font-medium">
                  <span>🎁 Buy Gift Card</span><span>&gt;</span>
                </button>
                <button type="button" onClick={() => setProfileModalMsg("Enter 16-digit Gift Card PIN to claim instant OrderKing Credits.")} className="w-full py-3 flex justify-between font-medium">
                  <span>🎟️ Claim Gift Card</span><span>&gt;</span>
                </button>
                <button type="button" onClick={() => setProfileModalMsg("OrderKing Credits Balance: ₹0.00 (Auto-applied at checkout).")} className="w-full py-3 flex justify-between font-medium">
                  <span>🪙 OrderKing Credits</span><span>&gt;</span>
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
              <div className="text-sm font-extrabold border-l-4 border-rose-500 pl-2.5">More</div>
              <div className="divide-y divide-slate-100 text-xs">
                <button type="button" onClick={() => setProfileModalMsg("Feedback submitted to Orderkingpay Principal Engineering Council.")} className="w-full py-3 flex justify-between font-medium">
                  <span>👍 Your feedback</span><span>&gt;</span>
                </button>
                <button type="button" onClick={() => setProfileModalMsg("Entity: Orderkingpay | GSTIN: 18AFXPH9838M1Z9 (Assam - 788710)")} className="w-full py-3 flex justify-between font-medium">
                  <span>ℹ️ About</span><span>&gt;</span>
                </button>
                <button type="button" onClick={() => setProfileModalMsg("24x7 Safety Emergency Helpline & RSA Dispatch connected.")} className="w-full py-3 flex justify-between font-medium">
                  <span>⚠️ Report a safety emergency</span><span>&gt;</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem("orderking_authenticated_user");
                      window.localStorage.removeItem("orderking_phone_session");
                    }
                    setShowProfileDrawer(false);
                  }}
                  className="w-full py-3 flex justify-between font-bold text-rose-600"
                >
                  <span>⏻ Log out</span><span>&gt;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. FOOD ON TRAIN (IRCTC PNR SEAT DELIVERY MODAL) (image_7.png & image_9.png) */}
      {showTrainModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 space-y-4 text-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">🚆 Order Food on Train (IRCTC PNR)</h3>
              <button type="button" onClick={() => setShowTrainModal(false)} className="text-slate-400">✕</button>
            </div>
            <p className="text-xs text-slate-600">
              Enter your 10-digit IRCTC PNR number to get hot FSSAI-certified meals delivered directly to your train coach &amp; berth at Badarpur, Silchar, Lumding, or Guwahati Junction.
            </p>
            <input
              type="text"
              maxLength={10}
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Enter 10-digit PNR (e.g. 6428910342)"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono text-sm"
            />
            {trainOrderMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-400 p-3 text-xs font-bold text-emerald-900">
                {trainOrderMsg}
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                setTrainOrderMsg(
                  `PNR ${pnrInput || "6428910342"} verified: Next boarding delivery station Badarpur / Guwahati Jn unlocked. Select any dish to deliver to your seat!`
                )
              }
              className="w-full py-3 rounded-xl bg-rose-600 text-white font-extrabold text-xs"
            >
              Fetch Train Coach &amp; Station Menu
            </button>
          </div>
        </div>
      )}

      {/* 12. MULTI-TIER DISH CUSTOMIZATION SHEET (Size, Crust, Spice Level) */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-slate-500">{customizingItem.rest.name}</div>
                <h3 className="text-base font-extrabold text-slate-900">{customizingItem.dish.name}</h3>
              </div>
              <button type="button" onClick={() => setCustomizingItem(null)} className="size-8 rounded-full bg-slate-100 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto">
              <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2 border border-slate-200">
                <div className="font-extrabold text-slate-800">Size (Required · Select 1)</div>
                {customizingItem.dish.sizes.map((s) => (
                  <label key={s.id} className="flex items-center justify-between py-1 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input type="radio" checked={selSize?.id === s.id} onChange={() => setSelSize(s)} className="accent-rose-600" />
                      <span>{s.label}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700">+{fmt(s.pricePaise)}</span>
                  </label>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2 border border-slate-200">
                <div className="font-extrabold text-slate-800">Crust / Accompaniment (Required · Select 1)</div>
                {customizingItem.dish.crusts.map((c) => (
                  <label key={c.id} className="flex items-center justify-between py-1 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input type="radio" checked={selCrust?.id === c.id} onChange={() => setSelCrust(c)} className="accent-rose-600" />
                      <span>{c.label}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700">+{fmt(c.pricePaise)}</span>
                  </label>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2 border border-slate-200">
                <div className="font-extrabold text-slate-800">Spice Level (Required · Select 1)</div>
                {customizingItem.dish.spices.map((sp) => (
                  <label key={sp.id} className="flex items-center justify-between py-1 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input type="radio" checked={selSpice?.id === sp.id} onChange={() => setSelSpice(sp)} className="accent-rose-600" />
                      <span>{sp.label}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700">+{fmt(sp.pricePaise)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-3 py-1.5">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="font-extrabold text-rose-600">-</button>
                <span className="font-mono text-sm font-extrabold">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} className="font-extrabold text-rose-600">+</button>
              </div>
              <button
                type="button"
                onClick={confirmAddToCart}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow"
              >
                Add item ·{" "}
                {fmt(
                  (customizingItem.dish.basePricePaise +
                    (selSize?.pricePaise || 0) +
                    (selCrust?.pricePaise || 0) +
                    (selSpice?.pricePaise || 0)) *
                    qty
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. CART & INTEGER-PAISE STATUTORY CHECKOUT SHEET */}
      {showCartSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold">Your Cart &amp; Statutory Bill (Paise Precision)</h3>
              <button type="button" onClick={() => setShowCartSheet(false)} className="size-8 rounded-full bg-slate-100 font-bold">✕</button>
            </div>

            {cart.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                Your cart is empty. Tap <strong>ADD +</strong> on any dish from La Trio Pizza, Hotel Chandan, Chill Out, or Fusion Frenzy!
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {cart.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <div className="font-bold text-slate-900">{c.qty}x {c.dishName}</div>
                      <div className="text-[10px] text-slate-500">{c.sizeLabel} · {c.crustLabel} · {c.spiceLabel}</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">{fmt(c.lineTotalPaise)}</div>
                  </div>
                ))}

                <div className="rounded-2xl bg-slate-50 p-3.5 space-y-1.5 border border-slate-200">
                  <div className="flex justify-between"><span>Item Total:</span><span className="font-mono">{fmt(foodSubtotalPaise)}</span></div>
                  <div className="flex justify-between"><span>Restaurant Packaging:</span><span className="font-mono">{fmt(packagingPaise)}</span></div>
                  <div className="flex justify-between"><span>Sec 9(5) CGST (2.5%):</span><span className="font-mono">{fmt(cgstPaise)}</span></div>
                  <div className="flex justify-between"><span>Sec 9(5) SGST (2.5%):</span><span className="font-mono">{fmt(sgstPaise)}</span></div>
                  <div className="flex justify-between">
                    <span>Delivery Partner Fee:</span>
                    <span className="font-mono">{deliveryFeePaise === 0 ? "FREE (GOLD)" : fmt(deliveryFeePaise)}</span>
                  </div>
                  <div className="flex justify-between"><span>Delivery Partner Tip:</span><span className="font-mono">{fmt(riderTipPaise)}</span></div>
                  <div className="flex justify-between text-sm font-extrabold pt-1.5 border-t border-slate-200">
                    <span>To Pay:</span>
                    <span className="font-mono text-emerald-700">{fmt(grandTotalPaise)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-sm shadow"
                >
                  Place Order &amp; Generate 4-Digit Doorstep OTP →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default ZomatoLiveMarketplace;
