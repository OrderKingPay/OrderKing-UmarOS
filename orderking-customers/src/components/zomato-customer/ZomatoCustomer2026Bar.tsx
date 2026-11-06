import React, { useMemo, useState } from 'react';

export interface ZomatoQuickDish {
  id: string;
  restaurantName: string;
  fssai: string;
  dishName: string;
  basePricePaise: number;
  packagingPaise: number;
  isPureVeg: boolean;
  healthyGrade: 'Super' | 'High';
  healthyScore: number;
  proteinGrams: number;
  fibreGrams: number;
  kcal: number;
  prepMins: number;
  distanceKm: number;
  variants: { id: string; label: string; addPaise: number }[];
  addons: { id: string; label: string; addPaise: number }[];
}

const VERIFIED_DISHES: ZomatoQuickDish[] = [
  {
    id: 'ok-dish-1',
    restaurantName: 'Gopinath Pure Veg Bhojanalaya',
    fssai: '10324001000492',
    dishName: 'Special Joha Rice Assamese Veg Thali',
    basePricePaise: 18500,
    packagingPaise: 1500,
    isPureVeg: true,
    healthyGrade: 'Super',
    healthyScore: 91,
    proteinGrams: 22,
    fibreGrams: 11,
    kcal: 540,
    prepMins: 14,
    distanceKm: 1.8,
    variants: [
      { id: 'v-joha', label: 'Aromatic Joha Rice (Regular)', addPaise: 0 },
      { id: 'v-red', label: 'High-Fibre Red Bao Rice', addPaise: 2000 },
    ],
    addons: [
      { id: 'a-dahi', label: 'Fresh Matka Dahi (100g)', addPaise: 3000 },
      { id: 'a-papad', label: 'Roasted Masala Papad', addPaise: 1500 },
    ],
  },
  {
    id: 'ok-dish-2',
    restaurantName: 'Barak Royal Dum Kitchen',
    fssai: '10324001000871',
    dishName: 'Shahi Chicken Dum Biryani',
    basePricePaise: 24000,
    packagingPaise: 2000,
    isPureVeg: false,
    healthyGrade: 'High',
    healthyScore: 79,
    proteinGrams: 38,
    fibreGrams: 5,
    kcal: 680,
    prepMins: 18,
    distanceKm: 2.6,
    variants: [
      { id: 'v-single', label: 'Single (1 Pc Chicken + 1 Egg)', addPaise: 0 },
      { id: 'v-full', label: 'Full (2 Pcs Chicken + 2 Eggs)', addPaise: 12000 },
    ],
    addons: [
      { id: 'a-raita', label: 'Burhani Garlic Raita', addPaise: 2500 },
      { id: 'a-salan', label: 'Mirchi Ka Salan', addPaise: 2500 },
    ],
  },
  {
    id: 'ok-dish-3',
    restaurantName: 'Green Bowl Healthy Kitchen',
    fssai: '10324001000915',
    dishName: 'High-Protein Tandoori Paneer Quinoa Bowl',
    basePricePaise: 21500,
    packagingPaise: 1500,
    isPureVeg: true,
    healthyGrade: 'Super',
    healthyScore: 95,
    proteinGrams: 34,
    fibreGrams: 14,
    kcal: 480,
    prepMins: 12,
    distanceKm: 1.5,
    variants: [
      { id: 'v-350', label: '350g Standard Bowl', addPaise: 0 },
      { id: 'v-500', label: '500g Double Protein Bowl', addPaise: 7500 },
    ],
    addons: [
      { id: 'a-hummus', label: 'Roasted Garlic Hummus Dip', addPaise: 3500 },
    ],
  },
];

const ORDER_STAGES = [
  'PLACED & PAID',
  'KITCHEN ACCEPTED',
  'FOOD PREPARED & READY',
  'RIDER ASSIGNED',
  'OUT FOR DELIVERY',
  'DELIVERED (OTP VERIFIED)',
] as const;

export function ZomatoCustomer2026Bar() {
  const [pureVegMode, setPureVegMode] = useState(false);
  const [healthyMode, setHealthyMode] = useState(false);
  const [under250Mode, setUnder250Mode] = useState(false);
  const [goldActive, setGoldActive] = useState(true);
  const [rescueClaimed, setRescueClaimed] = useState(false);
  const [selectedDish, setSelectedDish] = useState<ZomatoQuickDish>(VERIFIED_DISHES[0]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(VERIFIED_DISHES[0].variants[0].id);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [qty, setQty] = useState<number>(1);
  const [applyMerchantPromo, setApplyMerchantPromo] = useState<boolean>(true);
  const [riderTipPaise, setRiderTipPaise] = useState<number>(2000);
  const [liveStageIdx, setLiveStageIdx] = useState<number | null>(null);
  const [orderReceiptId, setOrderReceiptId] = useState<string | null>(null);

  const visibleDishes = useMemo(() => {
    return VERIFIED_DISHES.filter((d) => {
      if (pureVegMode && !d.isPureVeg) return false;
      if (healthyMode && d.healthyGrade !== 'Super') return false;
      if (under250Mode && d.basePricePaise > 25000) return false;
      return true;
    });
  }, [pureVegMode, healthyMode, under250Mode]);

  const bill = useMemo(() => {
    const variantObj = selectedDish.variants.find((v) => v.id === selectedVariantId) ?? selectedDish.variants[0];
    const addonsSum = selectedDish.addons
      .filter((a) => selectedAddonIds.includes(a.id))
      .reduce((acc, a) => acc + a.addPaise, 0);
    const unitFoodPaise = selectedDish.basePricePaise + (variantObj?.addPaise ?? 0) + addonsSum;
    const grossFoodPaise = unitFoodPaise * qty;
    const packagingPaise = selectedDish.packagingPaise * qty;
    const promoDiscountPaise = applyMerchantPromo && grossFoodPaise >= 18000 ? Math.min(8000, Math.round(grossFoodPaise * 0.2)) : 0;
    const netTaxableFoodPaise = Math.max(0, grossFoodPaise - promoDiscountPaise);
    const cgstPaise = Math.round(netTaxableFoodPaise * 0.025);
    const sgstPaise = Math.round(netTaxableFoodPaise * 0.025);
    const rawDeliveryPaise = 2900;
    const deliveryPaise = goldActive && netTaxableFoodPaise >= 9900 ? 0 : rawDeliveryPaise;
    const platformFeePaise = 1000;
    const totalPaise = netTaxableFoodPaise + packagingPaise + cgstPaise + sgstPaise + deliveryPaise + platformFeePaise + riderTipPaise;
    return {
      grossFoodPaise,
      packagingPaise,
      promoDiscountPaise,
      cgstPaise,
      sgstPaise,
      deliveryPaise,
      goldSavedPaise: goldActive && netTaxableFoodPaise >= 9900 ? rawDeliveryPaise : 0,
      platformFeePaise,
      totalPaise,
      etaMins: selectedDish.prepMins + Math.ceil(selectedDish.distanceKm * 3.5) + 4,
    };
  }, [selectedDish, selectedVariantId, selectedAddonIds, qty, applyMerchantPromo, goldActive, riderTipPaise]);

  const handleSelectDish = (d: ZomatoQuickDish) => {
    setSelectedDish(d);
    setSelectedVariantId(d.variants[0]?.id ?? '');
    setSelectedAddonIds([]);
  };

  const handleToggleAddon = (id: string) => {
    setSelectedAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleInstantOrder = () => {
    const newId = 'OK-' + Math.floor(100000 + Math.random() * 900000);
    setOrderReceiptId(newId);
    setLiveStageIdx(0);
  };

  return (
    <section
      aria-label="OrderKing Instant Zomato-Grade Discovery & Checkout"
      style={{
        maxWidth: 1120,
        margin: '12px auto',
        padding: 16,
        borderRadius: 14,
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
      }}
    >
      {/* Mode Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setPureVegMode((v) => !v)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: pureVegMode ? '1.5px solid #15803d' : '1px solid #d4d4d8',
              background: pureVegMode ? '#dcfce7' : '#fff',
              color: '#166534',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Pure Veg Fleet
          </button>
          <button
            type="button"
            onClick={() => setHealthyMode((v) => !v)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: healthyMode ? '1.5px solid #0f766e' : '1px solid #d4d4d8',
              background: healthyMode ? '#ccfbf1' : '#fff',
              color: '#115e59',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Healthy Mode (Super Score)
          </button>
          <button
            type="button"
            onClick={() => setUnder250Mode((v) => !v)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: under250Mode ? '1.5px solid #b45309' : '1px solid #d4d4d8',
              background: under250Mode ? '#fef3c7' : '#fff',
              color: '#92400e',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Pocket-Friendly &lt; ₹250
          </button>
          <button
            type="button"
            onClick={() => setGoldActive((v) => !v)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #b45309',
              background: goldActive ? '#fef3c7' : '#fff',
              color: '#92400e',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Gold Free Delivery (≥ ₹99): {goldActive ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Food Rescue Live Drop */}
        {!rescueClaimed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1px solid #f59e0b', padding: '5px 10px', borderRadius: 8, fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: '#b45309' }}>Food Rescue (1.1 km • Untampered Seal): Veg Thali ₹110</span>
            <button
              type="button"
              onClick={() => {
                setRescueClaimed(true);
                handleSelectDish(VERIFIED_DISHES[0]);
              }}
              style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: '#e23744', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
            >
              Claim Rescue
            </button>
          </div>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>✓ Food Rescue Order Applied</span>
        )}
      </div>

      {/* Dish Cards + Instant Customizer & Statutory Checkout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleDishes.map((d) => (
            <div
              key={d.id}
              onClick={() => handleSelectDish(d)}
              style={{
                padding: 12,
                borderRadius: 10,
                border: selectedDish.id === d.id ? '2px solid #e23744' : '1px solid #e4e4e7',
                background: selectedDish.id === d.id ? '#fff1f2' : '#fafafa',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#52525b', fontWeight: 600 }}>
                  {d.restaurantName} • FSSAI {d.fssai} • {d.distanceKm} km
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#18181b' }}>{d.dishName}</div>
                <div style={{ fontSize: 11, color: '#0f766e', fontWeight: 600 }}>
                  Healthy {d.healthyGrade} ({d.healthyScore}/100) • {d.proteinGrams}g Protein • {d.fibreGrams}g Fibre • {d.kcal} kcal
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#18181b' }}>₹{(d.basePricePaise / 100).toFixed(2)}</div>
                <span style={{ display: 'inline-block', marginTop: 4, padding: '4px 10px', borderRadius: 6, background: '#e23744', color: '#fff', fontWeight: 700, fontSize: 11 }}>
                  ADD +
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Customizer + Bill + Instant UPI Checkout */}
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid #e4e4e7', background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 14, color: '#18181b' }}>{selectedDish.dishName}</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ padding: '2px 8px', cursor: 'pointer' }}>-</button>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} style={{ padding: '2px 8px', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {selectedDish.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                style={{
                  padding: '4px 8px',
                  fontSize: 11,
                  borderRadius: 6,
                  border: selectedVariantId === v.id ? '1.5px solid #e23744' : '1px solid #d4d4d8',
                  background: selectedVariantId === v.id ? '#fff1f2' : '#fff',
                  cursor: 'pointer',
                }}
              >
                {v.label} {v.addPaise > 0 ? `(+₹${v.addPaise / 100})` : ''}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {selectedDish.addons.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => handleToggleAddon(a.id)}
                style={{
                  padding: '4px 8px',
                  fontSize: 11,
                  borderRadius: 6,
                  border: selectedAddonIds.includes(a.id) ? '1.5px solid #15803d' : '1px solid #d4d4d8',
                  background: selectedAddonIds.includes(a.id) ? '#dcfce7' : '#fff',
                  cursor: 'pointer',
                }}
              >
                + {a.label} (₹{a.addPaise / 100})
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: '#3f3f46', borderTop: '1px dashed #d4d4d8', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Item + Variant/Add-on Subtotal</span>
              <span>₹{(bill.grossFoodPaise / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: 600 }}>
              <label style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={applyMerchantPromo} onChange={(e) => setApplyMerchantPromo(e.target.checked)} /> Merchant Promo (MERCHANT20)
              </label>
              <span>-₹{(bill.promoDiscountPaise / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Packaging + Platform Fee</span>
              <span>₹{((bill.packagingPaise + bill.platformFeePaise) / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sec 9(5) Food GST (2.5% CGST + 2.5% SGST)</span>
              <span>₹{((bill.cgstPaise + bill.sgstPaise) / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery Partner Fee (100% Tip ₹{(riderTipPaise / 100).toFixed(0)})</span>
              <span>{bill.deliveryPaise === 0 ? 'FREE (Gold)' : `₹${(bill.deliveryPaise / 100).toFixed(2)}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: '#18181b', marginTop: 4 }}>
              <span>Total Payable • ETA {bill.etaMins} mins</span>
              <span>₹{(bill.totalPaise / 100).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              onClick={handleInstantOrder}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                background: '#e23744',
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Pay ₹{(bill.totalPaise / 100).toFixed(2)} (UPI: orderking@ybl / KingPay)
            </button>
            {liveStageIdx !== null && (
              <button
                type="button"
                onClick={() => setLiveStageIdx((i) => ((i ?? 0) + 1) % ORDER_STAGES.length)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #18181b',
                  background: '#fff',
                  color: '#18181b',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Next Stage →
              </button>
            )}
          </div>

          {liveStageIdx !== null && (
            <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 700 }}>
              Order {orderReceiptId} • Stage {liveStageIdx + 1}/6: {ORDER_STAGES[liveStageIdx]} • Doorstep OTP: 4829 • GSTIN: 18AFXPH9838M1Z9
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ZomatoCustomer2026Bar;
