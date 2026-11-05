import React, { useState, useEffect } from 'react';
import {
  RIDER_SHIFT_PERIMETERS_KM,
  RIDER_PAYOUT_CONSTANTS,
  buildFloatingTripOfferRadar,
  evaluateDualOrderCorridorBatching,
  verifyMandatoryCustomerDeliveryOtp,
  buildRiderCodDepositUpiUri,
  type RiderShiftType,
  type RiderOrderState,
} from '../../lib/dispatch/rider-dispatch-engine';

interface ActiveRiderOrder {
  orderId: string;
  shortCode: string;
  restaurantName: string;
  pickupAddress: string;
  customerName: string;
  dropAddress: string;
  pickupLocation: { lat: number; lng: number };
  dropLocation: { lat: number; lng: number };
  pickupDistanceKm: number;
  dropDistanceKm: number;
  itemCount: number;
  payoutPaise: number;
  codAmountPaise: number;
  pickupCode4Digit: string;
  deliveryOtp4Digit: string;
  state: RiderOrderState;
}

export function FleetRunnerPlatformApp() {
  const [activeTab, setActiveTab] = useState<'duty' | 'earnings' | 'cod' | 'profile'>('duty');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [shift, setShift] = useState<RiderShiftType>('DAY');
  const [riderGps] = useState<{ lat: number; lng: number }>({ lat: 26.1445, lng: 91.7362 });
  const [countdown, setCountdown] = useState<number>(45);
  const [activeOrders, setActiveOrders] = useState<ActiveRiderOrder[]>([]);
  const [completedTrips, setCompletedTrips] = useState<
    Array<{ orderId: string; shortCode: string; payoutPaise: number; time: string }>
  >([]);
  const [cashInHandPaise, setCashInHandPaise] = useState<number>(42000); // Rs 420.00
  const [pickupPinInput, setPickupPinInput] = useState<Record<string, string>>({});
  const [deliveryOtpInput, setDeliveryOtpInput] = useState<Record<string, string>>({});
  const [failedOtpAttempts, setFailedOtpAttempts] = useState<Record<string, number>>({});
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [sosActive, setSosActive] = useState<boolean>(false);

  // Incoming live offer radar (when online and holding < 2 orders)
  const sampleOffer = buildFloatingTripOfferRadar({
    offerId: 'off_901',
    orderId: 'ord_8421',
    restaurantName: 'Bawarchi Royal Kitchen',
    riderLocation: riderGps,
    pickupLocation: { lat: 26.148, lng: 91.741 },
    dropLocation: { lat: 26.161, lng: 91.755 },
    itemCount: 3,
    isRaining: false,
    isLateNight: shift === 'LATE_NIGHT',
    customerTipPaise: 2000,
  });

  const secondCorridorOffer = buildFloatingTripOfferRadar({
    offerId: 'off_902',
    orderId: 'ord_8422',
    restaurantName: 'Assam Spice Hub',
    riderLocation: riderGps,
    pickupLocation: { lat: 26.149, lng: 91.742 },
    dropLocation: { lat: 26.163, lng: 91.758 },
    itemCount: 2,
    isRaining: false,
    isLateNight: shift === 'LATE_NIGHT',
    customerTipPaise: 1500,
  });

  const currentOffer =
    !isOnline || activeOrders.length >= 2
      ? null
      : activeOrders.length === 0
      ? sampleOffer
      : secondCorridorOffer;

  useEffect(() => {
    if (!currentOffer) return;
    setCountdown(45);
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 45));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentOffer?.offerId, isOnline, activeOrders.length]);

  const showNotice = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  const handleToggleOnline = () => {
    if (isOnline && activeOrders.length > 0) {
      showNotice('Complete active delivery before going offline.');
      return;
    }
    setIsOnline(!isOnline);
  };

  const handleAcceptOffer = () => {
    if (!currentOffer) return;
    const batchCheck = evaluateDualOrderCorridorBatching({
      activeOrders: activeOrders.map((o) => ({
        orderId: o.orderId,
        pickupLocation: o.pickupLocation,
        dropLocation: o.dropLocation,
      })),
      candidateOrder: {
        orderId: currentOffer.orderId,
        pickupLocation: currentOffer.pickupLocation,
        dropLocation: currentOffer.dropLocation,
      },
    });

    if (!batchCheck.canBatch) {
      showNotice(batchCheck.reason);
      return;
    }

    const newOrder: ActiveRiderOrder = {
      orderId: currentOffer.orderId,
      shortCode: currentOffer.orderId === 'ord_8421' ? '#OK-8421' : '#OK-8422',
      restaurantName: currentOffer.restaurantName,
      pickupAddress: 'GS Road, Guwahati',
      customerName: currentOffer.orderId === 'ord_8421' ? 'Arjun D.' : 'Priya S.',
      dropAddress: 'Beltola Tiniali, Guwahati',
      pickupLocation: currentOffer.pickupLocation,
      dropLocation: currentOffer.dropLocation,
      pickupDistanceKm: currentOffer.pickupDistanceKm,
      dropDistanceKm: currentOffer.dropDistanceKm,
      itemCount: currentOffer.itemCount,
      payoutPaise: currentOffer.payoutBreakdown.guaranteedTotalPayoutPaise,
      codAmountPaise: currentOffer.orderId === 'ord_8421' ? 38000 : 0,
      pickupCode4Digit: currentOffer.orderId === 'ord_8421' ? '4821' : '4822',
      deliveryOtp4Digit: currentOffer.orderId === 'ord_8421' ? '7391' : '5520',
      state: 'ACCEPTED',
    };

    setActiveOrders((prev) => [...prev, newOrder]);
    showNotice(`Accepted ${newOrder.shortCode}`);
  };

  const handleOrderStep = (order: ActiveRiderOrder) => {
    if (order.state === 'ACCEPTED') {
      setActiveOrders((prev) =>
        prev.map((o) => (o.orderId === order.orderId ? { ...o, state: 'ARRIVED_AT_KITCHEN' } : o))
      );
      return;
    }
    if (order.state === 'ARRIVED_AT_KITCHEN') {
      const enteredPickup = (pickupPinInput[order.orderId] || '').trim();
      if (enteredPickup !== order.pickupCode4Digit) {
        showNotice(`Enter 4-digit KOT Pickup Code (${order.pickupCode4Digit})`);
        return;
      }
      setActiveOrders((prev) =>
        prev.map((o) => (o.orderId === order.orderId ? { ...o, state: 'ON_THE_WAY' } : o))
      );
      showNotice(`Picked up ${order.shortCode}`);
      return;
    }
    if (order.state === 'ON_THE_WAY') {
      const submittedOtp = (deliveryOtpInput[order.orderId] || '').trim();
      const attempts = failedOtpAttempts[order.orderId] || 0;
      const check = verifyMandatoryCustomerDeliveryOtp({
        orderId: order.orderId,
        currentState: order.state,
        expected4DigitOtp: order.deliveryOtp4Digit,
        submittedOtp,
        failedAttempts: attempts,
      });

      if (!check.verified) {
        setFailedOtpAttempts((prev) => ({ ...prev, [order.orderId]: attempts + 1 }));
        showNotice(check.reason || 'Invalid 4-digit Customer Delivery OTP');
        return;
      }

      setActiveOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
      setCompletedTrips((prev) => [
        {
          orderId: order.orderId,
          shortCode: order.shortCode,
          payoutPaise: order.payoutPaise,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
      if (order.codAmountPaise > 0) {
        setCashInHandPaise((prev) => prev + order.codAmountPaise);
      }
      showNotice(`Delivered ${order.shortCode} · +₹${(order.payoutPaise / 100).toFixed(0)} credited`);
    }
  };

  const todayEarningsPaise = completedTrips.reduce((acc, t) => acc + t.payoutPaise, 0);
  const codPrimary = buildRiderCodDepositUpiUri({
    riderId: 'RDR-101',
    cashInHandPaise,
    useSecondaryVpa: false,
  });
  const codSecondary = buildRiderCodDepositUpiUri({
    riderId: 'RDR-101',
    cashInHandPaise,
    useSecondaryVpa: true,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      {/* Top Duty Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleOnline}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition ${
              isOnline
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-slate-950' : 'bg-slate-500'}`} />
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
          <select
            aria-label="Shift Perimeter"
            value={shift}
            onChange={(e) => setShift(e.target.value as RiderShiftType)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200"
          >
            <option value="DAY">Day ({RIDER_SHIFT_PERIMETERS_KM.DAY} km)</option>
            <option value="EVENING">Evening ({RIDER_SHIFT_PERIMETERS_KM.EVENING} km)</option>
            <option value="LATE_NIGHT">Night ({RIDER_SHIFT_PERIMETERS_KM.LATE_NIGHT} km)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200">
            COD ₹{(cashInHandPaise / 100).toFixed(0)}
          </span>
          <button
            type="button"
            onClick={() => {
              setSosActive(!sosActive);
              showNotice(sosActive ? 'SOS cleared' : 'SOS Beacon sent to UmarOS Control');
            }}
            className={`rounded-lg px-3 py-1 text-xs font-bold ${
              sosActive ? 'bg-red-600 text-white animate-pulse' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            SOS
          </button>
        </div>
      </header>

      {statusToast && (
        <div className="mx-4 mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/80 px-4 py-2.5 text-xs font-medium text-emerald-200">
          {statusToast}
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-lg p-4 space-y-4">
        {activeTab === 'duty' && (
          <>
            {/* Quick Summary Strip */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
              <div>
                <p className="text-[11px] text-slate-400">Today</p>
                <p className="text-base font-bold text-emerald-400">₹{(todayEarningsPaise / 100).toFixed(0)}</p>
              </div>
              <div className="border-x border-slate-800">
                <p className="text-[11px] text-slate-400">Trips</p>
                <p className="text-base font-bold text-slate-100">{completedTrips.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Active Batch</p>
                <p className="text-base font-bold text-amber-400">
                  {activeOrders.length}/{RIDER_PAYOUT_CONSTANTS.MAX_CORRIDOR_BATCH_ORDERS}
                </p>
              </div>
            </div>

            {/* Active Orders Execution Stack */}
            {activeOrders.map((order, idx) => (
              <div
                key={order.orderId}
                className="rounded-2xl border border-emerald-500/40 bg-slate-900 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    ORDER {idx + 1} · {order.shortCode}
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    ₹{(order.payoutPaise / 100).toFixed(0)}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-slate-100">
                    Pickup: {order.restaurantName} ({order.pickupDistanceKm} km)
                  </p>
                  <p className="text-slate-400">
                    Drop: {order.customerName} · {order.dropAddress} ({order.dropDistanceKm} km)
                  </p>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${
                      order.state === 'ON_THE_WAY'
                        ? `${order.dropLocation.lat},${order.dropLocation.lng}`
                        : `${order.pickupLocation.lat},${order.pickupLocation.lng}`
                    }`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-center text-xs font-semibold text-slate-100"
                  >
                    Navigate Map
                  </a>
                </div>

                {order.state === 'ARRIVED_AT_KITCHEN' && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      maxLength={4}
                      value={pickupPinInput[order.orderId] || ''}
                      onChange={(e) =>
                        setPickupPinInput((p) => ({ ...p, [order.orderId]: e.target.value.replace(/\D/g, '') }))
                      }
                      placeholder={`Enter 4-digit KOT Pickup Code (${order.pickupCode4Digit})`}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-100"
                    />
                  </div>
                )}

                {order.state === 'ON_THE_WAY' && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      maxLength={4}
                      value={deliveryOtpInput[order.orderId] || ''}
                      onChange={(e) =>
                        setDeliveryOtpInput((p) => ({ ...p, [order.orderId]: e.target.value.replace(/\D/g, '') }))
                      }
                      placeholder={`Enter 4-digit Customer Delivery OTP (${order.deliveryOtp4Digit})`}
                      className="w-full rounded-xl border border-amber-500/50 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-100"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleOrderStep(order)}
                  className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                >
                  {order.state === 'ACCEPTED' && 'MARK ARRIVED AT KITCHEN'}
                  {order.state === 'ARRIVED_AT_KITCHEN' && 'VERIFY KOT CODE & PICK UP'}
                  {order.state === 'ON_THE_WAY' && 'VERIFY 4-DIGIT OTP & COMPLETE DELIVERY'}
                </button>
              </div>
            ))}

            {/* Floating Trip Offer Radar Modal */}
            {currentOffer && (
              <div className="rounded-2xl border-2 border-amber-500 bg-slate-900 p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-slate-950">
                    {activeOrders.length === 1 ? 'CORRIDOR BATCH OFFER (2/2)' : 'NEW TRIP OFFER'}
                  </span>
                  <span className="font-mono text-sm font-bold text-amber-400">{countdown}s</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
                  <div>
                    <p className="text-xs text-slate-400">Guaranteed Payout</p>
                    <p className="text-2xl font-extrabold text-emerald-400">
                      ₹{(currentOffer.payoutBreakdown.guaranteedTotalPayoutPaise / 100).toFixed(0)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <p>Distance: ₹{(currentOffer.payoutBreakdown.distancePayPaise / 100).toFixed(0)} (₹15/km)</p>
                    <p>Customer Tip: ₹{(currentOffer.payoutBreakdown.customerTipPaise / 100).toFixed(0)} (100%)</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-100">{currentOffer.restaurantName}</p>
                  <p className="text-slate-300">
                    Pickup: {currentOffer.pickupDistanceKm} km · Drop: {currentOffer.dropDistanceKm} km ·{' '}
                    {currentOffer.itemCount} items
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAcceptOffer}
                  className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-extrabold text-slate-950 hover:bg-emerald-400"
                >
                  ACCEPT TRIP (₹{(currentOffer.payoutBreakdown.guaranteedTotalPayoutPaise / 100).toFixed(0)})
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'earnings' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-100">Earnings Ledger (₹15/km + Surge + 100% Tips)</h2>
            <p className="text-2xl font-extrabold text-emerald-400">
              ₹{(todayEarningsPaise / 100).toFixed(2)}
            </p>
            <div className="space-y-2 pt-2">
              {completedTrips.length === 0 ? (
                <p className="text-xs text-slate-400">Complete a trip on the Duty tab to record payout entries.</p>
              ) : (
                completedTrips.map((t) => (
                  <div
                    key={t.orderId}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                  >
                    <span>
                      {t.shortCode} · {t.time}
                    </span>
                    <span className="font-bold text-emerald-400">+₹{(t.payoutPaise / 100).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'cod' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">COD Cash in Hand</p>
                <p className="text-xl font-bold text-slate-100">
                  ₹{(cashInHandPaise / 100).toFixed(2)} / ₹2,500
                </p>
              </div>
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                  codPrimary.isBlockedFromNewCod
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {codPrimary.isBlockedFromNewCod ? 'LIMIT REACHED' : 'ELIGIBLE'}
              </span>
            </div>

            <div className="space-y-2">
              <a
                href={codPrimary.upiUri}
                onClick={() => {
                  setCashInHandPaise(0);
                  showNotice('COD settlement initiated to orderking@ybl');
                }}
                className="block w-full rounded-xl bg-emerald-500 py-3 text-center text-xs font-bold text-slate-950"
              >
                DEPOSIT COD VIA UPI ({codPrimary.vpa})
              </a>
              <a
                href={codSecondary.upiUri}
                className="block w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-center text-xs font-semibold text-slate-200"
              >
                Backup UPI VPA ({codSecondary.vpa})
              </a>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3 text-xs">
            <p className="text-sm font-bold text-slate-100">Delivery Partner Profile</p>
            <p className="text-slate-300">Active Shift: {shift} ({RIDER_SHIFT_PERIMETERS_KM[shift]} km radius)</p>
            <p className="text-slate-300">Settlement UPI: {RIDER_PAYOUT_CONSTANTS.PRIMARY_UPI_VPA}</p>
            <a
              href="/login"
              className="mt-2 inline-block rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-200"
            >
              Switch Account
            </a>
          </div>
        )}
      </main>

      {/* Bottom 4-Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 grid grid-cols-4 border-t border-slate-800 bg-slate-900/95 py-2 text-center text-xs">
        {(['duty', 'earnings', 'cod', 'profile'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`py-1.5 font-bold uppercase ${
              activeTab === tab ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default FleetRunnerPlatformApp;