import React, { useMemo, useState } from 'react';

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function verifyUidaiVerhoeff(aadhaar: string): boolean {
  const clean = aadhaar.replace(/\s+/g, '');
  if (!/^[2-9]\d{11}$/.test(clean)) return false;
  let c = 0;
  const rev = clean.split('').reverse().map(Number);
  for (let i = 0; i < rev.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][rev[i]]];
  }
  return c === 0;
}

interface KdsOrderCard {
  id: string;
  items: string[];
  subtotalPaise: number;
  prepMins: number;
  riderHandoverOtp: string;
  status: 'NEW' | 'PREPARING' | 'READY' | 'HANDED_OVER' | 'REJECTED';
  rejectReason?: string;
}

export function ZomatoPartnerPlatformApp() {
  const [outletOnline, setOutletOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'KDS' | 'MENU' | 'PAYOUTS' | 'CAMPAIGNS' | 'KYC'>('KDS');
  const [orders, setOrders] = useState<KdsOrderCard[]>([
    { id: '#OK-8421', items: ['2x Special Joha Rice Veg Thali', '1x Fresh Matka Dahi'], subtotalPaise: 40000, prepMins: 15, riderHandoverOtp: '4821', status: 'NEW' },
    { id: '#OK-8422', items: ['1x Shahi Chicken Dum Biryani (Full)'], subtotalPaise: 36000, prepMins: 20, riderHandoverOtp: '7390', status: 'PREPARING' },
    { id: '#OK-8419', items: ['1x High-Protein Tandoori Paneer Bowl'], subtotalPaise: 21500, prepMins: 12, riderHandoverOtp: '5104', status: 'READY' },
  ]);
  const [kotPreview, setKotPreview] = useState<string | null>(null);
  const [stockMap, setStockMap] = useState<Record<string, boolean>>({
    'Special Joha Rice Veg Thali': true,
    'Shahi Chicken Dum Biryani': true,
    'High-Protein Tandoori Paneer Bowl': true,
  });
  const [campaigns, setCampaigns] = useState([
    { code: 'BAWARCHI50', discountLabel: '₹50 OFF above ₹249', budgetPaise: 500000, spentPaise: 125000, clicks: 84, orders: 19 },
  ]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [fssai, setFssai] = useState('11826001000421');
  const [fssaiExpiry, setFssaiExpiry] = useState('2028-12-31');
  const [pan, setPan] = useState('ABCDE1234F');
  const [ifsc, setIfsc] = useState('SBIN0001234');
  const [aadhaar, setAadhaar] = useState('234567890124');
  const [gstin, setGstin] = useState('18AFXPH9838M1Z9');
  const [msaAccepted, setMsaAccepted] = useState(true);

  const aadhaarValid = useMemo(() => verifyUidaiVerhoeff(aadhaar), [aadhaar]);

  const moveOrder = (id: string, next: KdsOrderCard['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
    if (next === 'PREPARING') {
      const found = orders.find((o) => o.id === id);
      if (found) {
        setKotPreview(`[ESC/POS 80mm KOT] ${found.id} | SLA: ${found.prepMins}m | Handover OTP: ${found.riderHandoverOtp} | Items: ${found.items.join(', ')}`);
      }
    }
  };

  const extendPrep = (id: string, addMins: number) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, prepMins: o.prepMins + addMins } : o)));
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#0f172a', padding: 16 }}>
      <header style={{ maxWidth: 1180, margin: '0 auto 14px auto', background: '#ffffff', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#e23744' }}>OrderKing Partner</span>
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>ESC/POS: 58mm/80mm Ready • GSTIN: 18AFXPH9838M1Z9</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setOutletOnline((v) => !v)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: outletOnline ? '#15803d' : '#b91c1c',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {outletOnline ? 'OUTLET ONLINE' : 'OUTLET PAUSED'}
          </button>
        </div>
      </header>

      <nav style={{ maxWidth: 1180, margin: '0 auto 14px auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          { id: 'KDS', label: 'Live KDS (3-Col)' },
          { id: 'MENU', label: 'Menu, Variants & 86 Stock' },
          { id: 'PAYOUTS', label: 'Payouts & Sec 9(5)' },
          { id: 'CAMPAIGNS', label: 'Merchant Campaigns & CPC Ads' },
          { id: 'KYC', label: 'Statutory KYC (Verhoeff Verified)' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: activeTab === t.id ? '1.5px solid #e23744' : '1px solid #cbd5e1',
              background: activeTab === t.id ? '#fff1f2' : '#ffffff',
              color: activeTab === t.id ? '#be123c' : '#334155',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 1180, margin: '0 auto' }}>
        {kotPreview && (
          <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: '#4ade80', fontFamily: 'monospace', fontSize: 12 }}>
            {kotPreview}
          </div>
        )}

        {activeTab === 'KDS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {(['NEW', 'PREPARING', 'READY'] as const).map((col) => (
              <div key={col} style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 14 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  {col === 'NEW' ? 'NEW ORDERS' : col === 'PREPARING' ? 'PREPARING' : 'READY FOR PICKUP'}
                </h3>
                {orders
                  .filter((o) => o.status === col)
                  .map((o) => (
                    <div key={o.id} style={{ padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 10, background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13 }}>
                        <span>{o.id} • ₹{(o.subtotalPaise / 100).toFixed(2)}</span>
                        <span>SLA: {o.prepMins}m</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#334155', margin: '6px 0' }}>{o.items.join(' • ')}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        <button type="button" onClick={() => extendPrep(o.id, 5)} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>+5m</button>
                        <button type="button" onClick={() => extendPrep(o.id, 10)} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>+10m</button>
                        {col === 'NEW' && (
                          <button type="button" onClick={() => moveOrder(o.id, 'PREPARING')} style={{ padding: '5px 10px', fontSize: 11, borderRadius: 6, border: 'none', background: '#15803d', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                            ACCEPT & SILENT PRINT KOT (80mm)
                          </button>
                        )}
                        {col === 'PREPARING' && (
                          <button type="button" onClick={() => moveOrder(o.id, 'READY')} style={{ padding: '5px 10px', fontSize: 11, borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                            MARK READY FOR PICKUP
                          </button>
                        )}
                        {col === 'READY' && (
                          <button type="button" onClick={() => moveOrder(o.id, 'HANDED_OVER')} style={{ padding: '5px 10px', fontSize: 11, borderRadius: 6, border: 'none', background: '#0f766e', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                            VERIFY RIDER CODE ({o.riderHandoverOtp}) & HANDOVER
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'MENU' && (
          <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700 }}>1-Tap 86 Stock Control (Auto-Resets 06:00 AM IST)</h3>
            {Object.entries(stockMap).map(([dishName, inStock]) => (
              <div key={dishName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{dishName}</span>
                <button
                  type="button"
                  onClick={() => setStockMap((prev) => ({ ...prev, [dishName]: !prev[dishName] }))}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: inStock ? '#15803d' : '#b91c1c',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {inStock ? 'IN STOCK' : 'OUT OF STOCK (86)'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'PAYOUTS' && (
          <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16, fontSize: 13 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 700 }}>T+1 Statutory Settlement Breakdown (CGST Sec 9(5), Sec 52 TCS & Sec 194-O TDS)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Net Taxable Food Value</span><strong>₹650.00</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sec 9(5) Food GST (5% Paid by OrderKing ECO)</span><strong>₹32.50</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Platform Commission (10%–18%) + 18% GST</span><strong>-₹76.70</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sec 194-O TDS (0.1%) + Sec 52 CGST TCS (1.0%)</span><strong>-₹7.15</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#15803d', paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
                <strong>Net Partner T+1 Bank Settlement</strong>
                <strong>₹566.15</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CAMPAIGNS' && (
          <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 700 }}>Merchant-Funded Promotions & Self-Serve CPC Ads</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter Promo Code (e.g. ASSAM50)"
                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newPromoCode.trim()) return;
                  setCampaigns((prev) => [...prev, { code: newPromoCode.trim(), discountLabel: '₹50 OFF above ₹249', budgetPaise: 300000, spentPaise: 0, clicks: 0, orders: 0 }]);
                  setNewPromoCode('');
                }}
                style={{ padding: '7px 12px', borderRadius: 6, border: 'none', background: '#e23744', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Create Funded Promo
              </button>
            </div>
            {campaigns.map((c) => (
              <div key={c.code} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>{c.code}</strong> ({c.discountLabel})</span>
                <span>Budget: ₹{(c.budgetPaise / 100).toFixed(0)} • Clicks: {c.clicks} • Orders: {c.orders}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'KYC' && (
          <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 16, fontSize: 13 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 700 }}>Statutory Onboarding & UIDAI Verhoeff KYC Verification</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700 }}>14-Digit FSSAI License</label>
                <input value={fssai} onChange={(e) => setFssai(e.target.value)} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700 }}>FSSAI Expiry Date</label>
                <input type="date" value={fssaiExpiry} onChange={(e) => setFssaiExpiry(e.target.value)} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700 }}>Income Tax PAN</label>
                <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700 }}>Bank IFSC</label>
                <input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700 }}>12-Digit Aadhaar (UIDAI Verhoeff)</label>
                <input value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #cbd5e1' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: aadhaarValid ? '#15803d' : '#b91c1c', marginTop: 4 }}>
                  {aadhaarValid ? '✓ UIDAI Verhoeff Checksum Verified' : '✗ Invalid UIDAI Verhoeff Checksum'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700 }}>GSTIN (Optional Below ₹20L Threshold)</label>
                <input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #cbd5e1' }} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                <input type="checkbox" checked={msaAccepted} onChange={(e) => setMsaAccepted(e.target.checked)} /> Clickwrap Master Service Agreement (MSA) Accepted
              </label>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ZomatoPartnerPlatformApp;
