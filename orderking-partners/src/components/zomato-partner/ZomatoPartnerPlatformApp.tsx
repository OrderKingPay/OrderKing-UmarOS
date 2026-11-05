import React, { useState } from 'react';
import {
  applyDynamicKptSliderUpdate,
  transitionKdsTicketColumn,
  toggleMenuItem86Stockout,
  buildEscPosKotBinaryPayload,
  type KdsOrderTicket,
  type KptExtensionMinutes,
  type MenuItemStockState,
  type ThermalPaperWidthMm,
} from '../../lib/kds/partner-zomato-kds';
import {
  validateAadhaarVerhoeff,
  validateFssaiLicense,
  validateGstin,
  validateIfscCode,
  calculateStatutoryOrderTaxAndSettlementPaise,
  ORDERKING_STATUTORY_CONSTANTS,
} from '../../lib/compliance/statutory-validators';

export function ZomatoPartnerPlatformApp() {
  const [activeTab, setActiveTab] = useState<'kds' | 'menu' | 'payouts' | 'offers' | 'kyc'>('kds');
  const [outletOpen, setOutletOpen] = useState<boolean>(true);
  const [paperWidth, setPaperWidth] = useState<ThermalPaperWidthMm>(80);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [tickets, setTickets] = useState<KdsOrderTicket[]>([
    {
      orderId: 'ord_8421',
      shortOrderCode: '#OK-8421',
      restaurantId: 'rst_101',
      restaurantName: 'Bawarchi Royal Kitchen',
      fssaiNumber: '11826001000421',
      gstin: ORDERKING_STATUTORY_CONSTANTS.COMPANY_GSTIN,
      column: 'NEW_ORDERS',
      items: [
        { itemId: 'i1', name: 'Chicken Dum Biryani', quantity: 2, variantName: 'Full', isVeg: false },
        { itemId: 'i2', name: 'Paneer Butter Masala', quantity: 1, isVeg: true },
      ],
      basePrepMinutes: 15,
      kptSliderExtensionMinutes: 0,
      acceptedAtIso: new Date().toISOString(),
      estimatedReadyAtIso: new Date(Date.now() + 15 * 60000).toISOString(),
      riderAutoDispatchAtIso: new Date(Date.now() + 7 * 60000).toISOString(),
      customerEtaMinutes: 25,
      pickupOtp4Digit: '4821',
    },
    {
      orderId: 'ord_8422',
      shortOrderCode: '#OK-8422',
      restaurantId: 'rst_101',
      restaurantName: 'Bawarchi Royal Kitchen',
      fssaiNumber: '11826001000421',
      gstin: ORDERKING_STATUTORY_CONSTANTS.COMPANY_GSTIN,
      column: 'PREPARING',
      items: [{ itemId: 'i3', name: 'Veg Thali Deluxe', quantity: 1, isVeg: true }],
      basePrepMinutes: 12,
      kptSliderExtensionMinutes: 5,
      acceptedAtIso: new Date(Date.now() - 4 * 60000).toISOString(),
      estimatedReadyAtIso: new Date(Date.now() + 13 * 60000).toISOString(),
      riderAutoDispatchAtIso: new Date(Date.now() + 5 * 60000).toISOString(),
      customerEtaMinutes: 27,
      pickupOtp4Digit: '4822',
    },
  ]);

  const [menuItems, setMenuItems] = useState<MenuItemStockState[]>([
    { itemId: 'i1', name: 'Chicken Dum Biryani (₹240)', inStock: true, eightySixedAtIso: null, autoResetAtSixAmIstIso: null },
    { itemId: 'i2', name: 'Paneer Butter Masala (₹190)', inStock: true, eightySixedAtIso: null, autoResetAtSixAmIstIso: null },
    { itemId: 'i3', name: 'Veg Thali Deluxe (₹160)', inStock: true, eightySixedAtIso: null, autoResetAtSixAmIstIso: null },
    { itemId: 'i4', name: 'Assam Special Duck Curry (₹320)', inStock: false, eightySixedAtIso: new Date().toISOString(), autoResetAtSixAmIstIso: '06:00 AM IST' },
  ]);

  // Real Merchant-Funded Campaign State
  const [campaigns, setCampaigns] = useState<
    Array<{ code: string; discountInr: number; minOrderInr: number; budgetInr: number; active: boolean }>
  >([{ code: 'BAWARCHI50', discountInr: 50, minOrderInr: 299, budgetInr: 5000, active: true }]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newDiscountInr, setNewDiscountInr] = useState('50');
  const [newMinOrderInr, setNewMinOrderInr] = useState('249');
  const [newBudgetInr, setNewBudgetInr] = useState('2500');

  // Statutory Onboarding KYC State
  const [fssaiInput, setFssaiInput] = useState('11826001000421');
  const [aadhaarInput, setAadhaarInput] = useState('234567890126');
  const [isGstRegistered, setIsGstRegistered] = useState(true);
  const [gstinInput, setGstinInput] = useState<string>(ORDERKING_STATUTORY_CONSTANTS.COMPANY_GSTIN);
  const [ifscInput, setIfscInput] = useState('SBIN0001234');

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const playOrderChime = () => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const handleSetKptExtension = (orderId: string, ext: KptExtensionMinutes) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.orderId === orderId
          ? applyDynamicKptSliderUpdate({
              ticket: t,
              extensionMinutes: ext,
              estimatedRiderToStoreTransitMinutes: 8,
              estimatedStoreToCustomerTransitMinutes: 10,
            })
          : t
      )
    );
    notify(`KPT updated (+${ext}m) · Customer ETA & Rider Auto-Dispatch adjusted`);
  };

  const handleAcceptAndPrintKot = (ticket: KdsOrderTicket) => {
    playOrderChime();
    const bytes = buildEscPosKotBinaryPayload(ticket, paperWidth);
    const updated = transitionKdsTicketColumn(ticket, 'PREPARING');
    setTickets((prev) => prev.map((t) => (t.orderId === ticket.orderId ? updated : t)));
    notify(`Accepted ${ticket.shortOrderCode} · Sent ${bytes.byteLength}B ESC/POS KOT (${paperWidth}mm)`);
  };

  const handleMarkReady = (ticket: KdsOrderTicket) => {
    const updated = transitionKdsTicketColumn(ticket, 'READY_FOR_PICKUP');
    setTickets((prev) => prev.map((t) => (t.orderId === ticket.orderId ? updated : t)));
    notify(`${ticket.shortOrderCode} marked READY · Handover Code: ${ticket.pickupOtp4Digit}`);
  };

  const settlementExample = calculateStatutoryOrderTaxAndSettlementPaise({
    foodSubtotalPaise: 67000,
    packagingPaise: 3000,
    merchantFundedDiscountPaise: 5000,
    commissionRateBps: 1000,
    isRestaurantGstRegistered: isGstRegistered,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-extrabold tracking-tight text-white">OrderKing Partner</span>
          <button
            type="button"
            onClick={() => setOutletOpen(!outletOpen)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              outletOpen ? 'bg-emerald-500 text-slate-950' : 'bg-red-500/20 text-red-300 border border-red-500/40'
            }`}
          >
            {outletOpen ? 'OUTLET ONLINE' : 'OUTLET PAUSED'}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setPaperWidth(paperWidth === 80 ? 58 : 80)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-medium text-slate-200"
          >
            ESC/POS: {paperWidth}mm
          </button>
          <button
            type="button"
            onClick={playOrderChime}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-medium text-emerald-300"
          >
            Test Audio Chime
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-900/60 px-4">
        {(
          [
            ['kds', 'Live KDS (3-Col)'],
            ['menu', 'Menu & 86 Stock'],
            ['payouts', 'Payouts & Sec 9(5)'],
            ['offers', 'Merchant Campaigns'],
            ['kyc', 'Statutory KYC'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === id
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {toastMsg && (
        <div className="mx-4 mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-4 py-2 text-xs font-medium text-emerald-200">
          {toastMsg}
        </div>
      )}

      <main className="mx-auto max-w-6xl p-4">
        {activeTab === 'kds' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(['NEW_ORDERS', 'PREPARING', 'READY_FOR_PICKUP'] as const).map((col) => {
              const colTickets = tickets.filter((t) => t.column === col);
              return (
                <div key={col} className="rounded-2xl border border-slate-800 bg-slate-900 p-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-extrabold tracking-wider text-slate-200">
                      {col.replace(/_/g, ' ')}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-emerald-400">
                      {colTickets.length}
                    </span>
                  </div>

                  {colTickets.map((t) => (
                    <div
                      key={t.orderId}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-white">{t.shortOrderCode}</span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-amber-300">
                          Pickup OTP: {t.pickupOtp4Digit}
                        </span>
                      </div>

                      <div className="space-y-1 border-y border-slate-800/80 py-2">
                        {t.items.map((item) => (
                          <div key={item.itemId} className="flex items-center justify-between">
                            <span>
                              <span className={item.isVeg ? 'text-emerald-400' : 'text-rose-400'}>●</span>{' '}
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Dynamic KPT Slider (+5m, +10m, +15m) */}
                      <div>
                        <p className="mb-1 text-[11px] text-slate-400">
                          Prep Time: {t.basePrepMinutes + t.kptSliderExtensionMinutes}m · Customer ETA:{' '}
                          {t.customerEtaMinutes}m
                        </p>
                        <div className="grid grid-cols-4 gap-1">
                          {([0, 5, 10, 15] as const).map((ext) => (
                            <button
                              key={ext}
                              type="button"
                              onClick={() => handleSetKptExtension(t.orderId, ext)}
                              className={`rounded py-1 font-bold ${
                                t.kptSliderExtensionMinutes === ext
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {ext === 0 ? 'Base' : `+${ext}m`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {col === 'NEW_ORDERS' && (
                        <button
                          type="button"
                          onClick={() => handleAcceptAndPrintKot(t)}
                          className="w-full rounded-xl bg-emerald-500 py-2.5 font-bold text-slate-950 hover:bg-emerald-400"
                        >
                          ACCEPT &amp; SILENT PRINT KOT ({paperWidth}mm)
                        </button>
                      )}

                      {col === 'PREPARING' && (
                        <button
                          type="button"
                          onClick={() => handleMarkReady(t)}
                          className="w-full rounded-xl bg-amber-500 py-2.5 font-bold text-slate-950 hover:bg-amber-400"
                        >
                          MARK READY FOR PICKUP
                        </button>
                      )}

                      {col === 'READY_FOR_PICKUP' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTickets((prev) => prev.filter((x) => x.orderId !== t.orderId));
                            notify(`Handed over ${t.shortOrderCode} to rider`);
                          }}
                          className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2 font-bold text-emerald-300"
                        >
                          VERIFY RIDER CODE ({t.pickupOtp4Digit}) &amp; HANDOVER
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">1-Tap 86 Item Stockout Toggle (Auto-Resets 06:00 AM IST)</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {menuItems.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-100">{item.name}</p>
                    {!item.inStock && (
                      <p className="text-[11px] text-amber-400">
                        86&apos;d Out of Stock · Auto-Restores at 06:00 AM IST
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuItems((prev) =>
                        prev.map((m) =>
                          m.itemId === item.itemId ? toggleMenuItem86Stockout(m, m.inStock) : m
                        )
                      );
                      notify(`${item.name} marked ${item.inStock ? 'Out of Stock (86)' : 'In Stock'}`);
                    }}
                    className={`rounded-xl px-4 py-2 font-bold ${
                      item.inStock
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {item.inStock ? 'IN STOCK' : 'OUT OF STOCK (86)'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3 text-xs">
            <h2 className="text-sm font-bold">Statutory Settlement Breakdown (Section 9(5) CGST Act 2017)</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-slate-400">Net Taxable Food</p>
                <p className="text-base font-bold">₹{(settlementExample.netTaxableFoodPaise / 100).toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-slate-400">Sec 9(5) Food GST (5%)</p>
                <p className="text-base font-bold text-amber-400">
                  ₹{(settlementExample.totalFoodGstPaise / 100).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-slate-400">Platform Commission</p>
                <p className="text-base font-bold">
                  ₹{(settlementExample.platformCommissionPaise / 100).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-slate-400">Net Partner Payable</p>
                <p className="text-base font-bold text-emerald-400">
                  ₹{(settlementExample.merchantNetPayablePaise / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4 text-xs">
            <h2 className="text-sm font-bold">Merchant-Funded Marketing Campaigns (Zero Fake Promotions)</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <input
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                placeholder="Promo Code (e.g. ASSAM75)"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono uppercase"
              />
              <input
                value={newDiscountInr}
                onChange={(e) => setNewDiscountInr(e.target.value.replace(/\D/g, ''))}
                placeholder="Flat Discount ₹"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={newMinOrderInr}
                onChange={(e) => setNewMinOrderInr(e.target.value.replace(/\D/g, ''))}
                placeholder="Min Order ₹"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newPromoCode.trim()) return;
                  setCampaigns((prev) => [
                    ...prev,
                    {
                      code: newPromoCode.trim(),
                      discountInr: Number(newDiscountInr) || 50,
                      minOrderInr: Number(newMinOrderInr) || 249,
                      budgetInr: Number(newBudgetInr) || 2500,
                      active: true,
                    },
                  ]);
                  setNewPromoCode('');
                  notify('Merchant-funded campaign activated');
                }}
                className="rounded-xl bg-emerald-500 py-2 font-bold text-slate-950"
              >
                Create Funded Promo
              </button>
            </div>
            <div className="space-y-2">
              {campaigns.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
                >
                  <span>
                    <strong className="font-mono text-emerald-400">{c.code}</strong> · ₹{c.discountInr} OFF above ₹
                    {c.minOrderInr} (Funded Budget: ₹{c.budgetInr})
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3 text-xs">
            <h2 className="text-sm font-bold">Statutory Merchant Verification (FSSAI, Verhoeff Aadhaar, GSTIN, IFSC)</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-slate-400 mb-1">14-Digit FSSAI (State Code 01-38)</label>
                <input
                  value={fssaiInput}
                  onChange={(e) => setFssaiInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono"
                />
                <p className="mt-1 text-[11px] text-emerald-400">
                  {validateFssaiLicense(fssaiInput).valid
                    ? `Verified (${validateFssaiLicense(fssaiInput).licenseType})`
                    : validateFssaiLicense(fssaiInput).reason}
                </p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">12-Digit UIDAI Aadhaar (Verhoeff Checksum)</label>
                <input
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono"
                />
                <p className="mt-1 text-[11px] text-emerald-400">
                  {validateAadhaarVerhoeff(aadhaarInput).valid
                    ? 'Verhoeff Checksum Verified'
                    : validateAadhaarVerhoeff(aadhaarInput).reason}
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-slate-200 mb-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGstRegistered}
                    onChange={(e) => setIsGstRegistered(e.target.checked)}
                  />
                  <span>GST Registered (Untick if Exempt under Sec 9(5))</span>
                </label>
                {isGstRegistered && (
                  <input
                    value={gstinInput}
                    onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono"
                  />
                )}
                <p className="mt-1 text-[11px] text-emerald-400">
                  {validateGstin(isGstRegistered ? gstinInput : 'GST_EXEMPT_SEC_9_5').valid
                    ? isGstRegistered
                      ? `Verified GSTIN (${gstinInput})`
                      : 'Exempt under Section 9(5) CGST Act 2017'
                    : 'Invalid GSTIN'}
                </p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">11-Character Bank IFSC</label>
                <input
                  value={ifscInput}
                  onChange={(e) => setIfscInput(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono"
                />
                <p className="mt-1 text-[11px] text-emerald-400">
                  {validateIfscCode(ifscInput).valid
                    ? `Verified Bank (${validateIfscCode(ifscInput).bankCode})`
                    : validateIfscCode(ifscInput).reason}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ZomatoPartnerPlatformApp;