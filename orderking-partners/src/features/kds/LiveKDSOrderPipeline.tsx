import React, { useState, useEffect, useCallback, useRef } from "react";

export type OrderStatus =
  | "NEW"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "DISPATCHED"
  | "DELIVERED"
  | "REJECTED";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  variant?: string;
  notes?: string;
  isVeg: boolean;
  pricePaise: number;
  station?: "Tandoor" | "Curry" | "Fryer" | "Grill" | "Packing" | string;
}

export interface AssignedRider {
  riderId: string;
  name: string;
  phoneMasked: string;
  distanceKm?: number;
  etaMinutes: number;
  pickupOtp: string; // 4-digit OTP provided by rider
}

export interface KDSOrder {
  orderId: string;
  displayNumber: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  totalPaise: number;
  kptMinutes: number;
  initialEtaMinutes: number;
  customerName: string;
  customerPhoneMasked: string;
  specialInstructions?: string;
  riderAssigned?: AssignedRider;
  rejectionReason?: string;
  penaltyDebitedPaise?: number;
}

interface LiveKDSOrderPipelineProps {
  restaurantId: string;
  onPrintKOT: (order: KDSOrder) => Promise<boolean>;
  onUpdateStatusInDb: (
    orderId: string,
    nextStatus: OrderStatus,
    kptMinutes: number,
    metadata?: { rejectionReason?: string; penaltyPaise?: number; handoverOtp?: string }
  ) => Promise<boolean>;
  initialOrders: KDSOrder[];
}

export const LiveKDSOrderPipeline: React.FC<LiveKDSOrderPipelineProps> = ({
  restaurantId,
  onPrintKOT,
  onUpdateStatusInDb,
  initialOrders,
}) => {
  const [orders, setOrders] = useState<KDSOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");

  // Prep time selector state for incoming orders
  const [selectedPrepMap, setSelectedPrepMap] = useState<Record<string, number>>({});

  // Handover modal state
  const [handoverOrderId, setHandoverOrderId] = useState<string | null>(null);
  const [enteredHandoverOtp, setEnteredHandoverOtp] = useState("");
  const [handoverError, setHandoverError] = useState<string | null>(null);

  // Rejection modal state
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("Item out of stock");

  // Continuous Acoustic Siren State
  const audioContextRef = useRef<AudioContext | null>(null);
  const sirenOscRef = useRef<OscillatorNode | null>(null);
  const sirenGainRef = useRef<GainNode | null>(null);
  const [isSirenActive, setIsSirenActive] = useState(false);

  // =========================================================================
  // 1. UN-SILENCEABLE CONTINUOUS HIGH-PRIORITY ACOUSTIC SIREN
  // Plays until kitchen staff manually accepts or rejects all NEW orders
  // =========================================================================
  const startContinuousSiren = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      if (sirenOscRef.current) return; // Already running

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, ctx.currentTime);

      lfo.type = "sine";
      lfo.frequency.setValueAtTime(2.5, ctx.currentTime); // 2.5Hz siren modulation
      lfoGain.gain.setValueAtTime(400, ctx.currentTime); // modulate 400Hz - 1200Hz

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      lfo.start();

      sirenOscRef.current = osc;
      sirenGainRef.current = gain;
      setIsSirenActive(true);
    } catch {
      // Audio permissions
    }
  }, []);

  const stopContinuousSiren = useCallback(() => {
    try {
      if (sirenOscRef.current) {
        sirenOscRef.current.stop();
        sirenOscRef.current.disconnect();
        sirenOscRef.current = null;
      }
      if (sirenGainRef.current) {
        sirenGainRef.current.disconnect();
        sirenGainRef.current = null;
      }
      setIsSirenActive(false);
    } catch {
      // Stop error
    }
  }, []);

  // Monitor incoming NEW orders: trigger siren if any NEW order exists
  useEffect(() => {
    const hasNewOrders = orders.some((o) => o.status === "NEW");
    if (hasNewOrders) {
      startContinuousSiren();
    } else {
      stopContinuousSiren();
    }
    return () => {
      stopContinuousSiren();
    };
  }, [orders, startContinuousSiren, stopContinuousSiren]);

  // =========================================================================
  // 2. ORDER ACCEPTANCE & PREPARATION DURATION SELECTION (10, 15, 20, 25, 30, 45m)
  // =========================================================================
  const handleAcceptOrder = async (orderId: string) => {
    const target = orders.find((o) => o.orderId === orderId);
    if (!target) return;
    const prepMinutes = selectedPrepMap[orderId] || target.kptMinutes || 20;

    const success = await onUpdateStatusInDb(orderId, "ACCEPTED", prepMinutes);
    if (success) {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: "ACCEPTED", kptMinutes: prepMinutes } : o))
      );
      await onPrintKOT({ ...target, status: "ACCEPTED", kptMinutes: prepMinutes });
    }
  };

  // Emergency +5m / +10m Prep Extension
  const handleExtendPrepTime = async (orderId: string, extraMinutes: number) => {
    const target = orders.find((o) => o.orderId === orderId);
    if (!target) return;
    const newKpt = target.kptMinutes + extraMinutes;
    const success = await onUpdateStatusInDb(orderId, target.status, newKpt);
    if (success) {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, kptMinutes: newKpt } : o))
      );
    }
  };

  // Food Ready Trigger
  const handleMarkFoodReady = async (orderId: string) => {
    const target = orders.find((o) => o.orderId === orderId);
    if (!target) return;
    const success = await onUpdateStatusInDb(orderId, "READY_FOR_PICKUP", target.kptMinutes);
    if (success) {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: "READY_FOR_PICKUP" } : o))
      );
    }
  };

  // =========================================================================
  // 3. RIDER HANDOVER GATE WITH 4-DIGIT OTP VERIFICATION
  // =========================================================================
  const handleConfirmRiderHandover = async () => {
    if (!handoverOrderId) return;
    const target = orders.find((o) => o.orderId === handoverOrderId);
    if (!target) return;

    const numericDigits = target.displayNumber.replace(/\D/g, "") || target.orderId.replace(/\D/g, "");
    const expectedOtp = target.riderAssigned?.pickupOtp || (numericDigits.length >= 4 ? numericDigits.slice(-4) : numericDigits.padStart(4, "0"));
    if (enteredHandoverOtp.trim() !== expectedOtp) {
      setHandoverError(`Invalid Handover OTP! Rider must provide correct 4-digit code (Expected: ${expectedOtp}).`);
      return;
    }

    setHandoverError(null);
    const success = await onUpdateStatusInDb(handoverOrderId, "DISPATCHED", target.kptMinutes, {
      handoverOtp: enteredHandoverOtp,
    });

    if (success) {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === handoverOrderId ? { ...o, status: "DISPATCHED" } : o))
      );
      setHandoverOrderId(null);
      setEnteredHandoverOtp("");
    }
  };

  // =========================================================================
  // 4. MERCHANT ORDER REJECTION & FAULT PENALTY CALCULATION
  // =========================================================================
  const handleConfirmRejection = async () => {
    if (!rejectOrderId) return;
    const target = orders.find((o) => o.orderId === rejectOrderId);
    if (!target) return;

    // Minimum ₹100 or 100% order value penalty
    const penaltyPaise = Math.max(10000, target.totalPaise);

    const success = await onUpdateStatusInDb(rejectOrderId, "REJECTED", target.kptMinutes, {
      rejectionReason,
      penaltyPaise,
    });

    if (success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === rejectOrderId
            ? { ...o, status: "REJECTED", rejectionReason, penaltyDebitedPaise: penaltyPaise }
            : o
        )
      );
      setRejectOrderId(null);
    }
  };

  const activeOrders = orders.filter((o) => !["DELIVERED", "REJECTED"].includes(o.status));
  const completedOrders = orders.filter((o) => ["DELIVERED", "REJECTED"].includes(o.status));
  const displayedOrders = activeTab === "ACTIVE" ? activeOrders : completedOrders;

  return (
    <div style={{ padding: "16px", backgroundColor: "#0F172A", minHeight: "100vh", color: "#F8FAFC", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header Bar */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #334155", paddingBottom: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#EA580C" }}>
              OrderKing Kitchen Display System (KDS)
            </h1>
            {isSirenActive && (
              <span style={{ backgroundColor: "#DC2626", color: "#FFF", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 800, animation: "pulse 1s infinite" }}>
                SIREN ACTIVE (NEW ORDERS)
              </span>
            )}
          </div>
          <span style={{ fontSize: "13px", color: "#94A3B8" }}>
            Outlet: {restaurantId} | Real-Time PostgreSQL Synced | High-Throughput Kitchen Display System
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setActiveTab("ACTIVE")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              backgroundColor: activeTab === "ACTIVE" ? "#EA580C" : "#1E293B",
              color: "#FFF",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Active Orders ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              backgroundColor: activeTab === "COMPLETED" ? "#EA580C" : "#1E293B",
              color: "#FFF",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            History / Dispatched ({completedOrders.length})
          </button>
        </div>
      </header>

      {/* Orders Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
        {displayedOrders.map((order) => {
          const isNew = order.status === "NEW";
          const currentPrep = selectedPrepMap[order.orderId] || order.kptMinutes || 20;

          return (
            <div
              key={order.orderId}
              style={{
                backgroundColor: "#1E293B",
                borderRadius: "10px",
                border: isNew ? "2px solid #EA580C" : "1px solid #334155",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* Order Card Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#EA580C" }}>#{order.displayNumber}</span>
                    <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                      {new Date(order.createdAt).toLocaleTimeString("en-IN")} · Customer: {order.customerName}
                    </div>
                  </div>
                  <span
                    style={{
                      backgroundColor:
                        order.status === "NEW"
                          ? "#DC2626"
                          : order.status === "READY_FOR_PICKUP"
                          ? "#16A34A"
                          : order.status === "PREPARING"
                          ? "#D97706"
                          : "#334155",
                      color: "#FFF",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Items Breakdown */}
                <div style={{ margin: "10px 0", borderTop: "1px dashed #475569", borderBottom: "1px dashed #475569", padding: "10px 0" }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            borderRadius: "9999px",
                            backgroundColor: item.isVeg ? "#22C55E" : "#EF4444",
                          }}
                        />
                        <strong>{item.quantity}x</strong> {item.name}
                        {item.variant && <span style={{ fontSize: "11px", color: "#94A3B8" }}>({item.variant})</span>}
                        {item.station && (
                          <span style={{ fontSize: "10px", backgroundColor: "#334155", padding: "1px 5px", borderRadius: "3px" }}>
                            {item.station}
                          </span>
                        )}
                      </span>
                      <span style={{ color: "#CBD5E1" }}>₹{((item.pricePaise * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.specialInstructions && (
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#FDE047", backgroundColor: "#422006", padding: "4px 8px", borderRadius: "4px" }}>
                      Chef Note: {order.specialInstructions}
                    </div>
                  )}
                </div>

                {/* Prep Duration Selector for NEW Orders */}
                {isNew && (
                  <div style={{ backgroundColor: "#0F172A", padding: "8px 12px", borderRadius: "6px", marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "6px" }}>
                      Select Preparation Duration (ETA SLA):
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "4px" }}>
                      {[10, 15, 20, 25, 30, 45].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setSelectedPrepMap({ ...selectedPrepMap, [order.orderId]: mins })}
                          style={{
                            padding: "6px 2px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: currentPrep === mins ? "#EA580C" : "#334155",
                            color: "#FFF",
                          }}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Prep Time & Emergency Extension Buttons */}
                {!isNew && order.status !== "REJECTED" && order.status !== "DISPATCHED" && (
                  <div style={{ backgroundColor: "#0F172A", padding: "8px 12px", borderRadius: "6px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>Kitchen Prep SLA:</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#F97316" }}>{order.kptMinutes} mins</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                      <button
                        onClick={() => handleExtendPrepTime(order.orderId, 5)}
                        style={{ flex: 1, padding: "5px", backgroundColor: "#334155", color: "#FFF", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                      >
                        +5m Buffer
                      </button>
                      <button
                        onClick={() => handleExtendPrepTime(order.orderId, 10)}
                        style={{ flex: 1, padding: "5px", backgroundColor: "#334155", color: "#FFF", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                      >
                        +10m Buffer
                      </button>
                    </div>
                  </div>
                )}

                {/* Assigned Rider Profile */}
                {order.riderAssigned && (
                  <div style={{ backgroundColor: "#0F172A", padding: "8px 12px", borderRadius: "6px", marginBottom: "12px", border: "1px solid #1E3A8A" }}>
                    <div style={{ fontSize: "11px", color: "#60A5FA", fontWeight: 700 }}>ASSIGNED ORDERKING RIDER</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "13px" }}>
                      <span>{order.riderAssigned.name}</span>
                      <span style={{ color: "#93C5FD" }}>ETA: {order.riderAssigned.etaMinutes}m ({order.riderAssigned.distanceKm || 1.2} km)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                {isNew && (
                  <>
                    <button
                      onClick={() => handleAcceptOrder(order.orderId)}
                      style={{ flex: 2, padding: "10px", backgroundColor: "#EA580C", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Accept & Print KOT ({currentPrep}m)
                    </button>
                    <button
                      onClick={() => setRejectOrderId(order.orderId)}
                      style={{ flex: 1, padding: "10px", backgroundColor: "#991B1B", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Decline
                    </button>
                  </>
                )}

                {order.status === "ACCEPTED" && (
                  <button
                    onClick={() => handleExtendPrepTime(order.orderId, 0)}
                    style={{ flex: 1, padding: "10px", backgroundColor: "#D97706", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Cooking in Progress
                  </button>
                )}

                {(order.status === "ACCEPTED" || order.status === "PREPARING") && (
                  <button
                    onClick={() => handleMarkFoodReady(order.orderId)}
                    style={{ flex: 1, padding: "10px", backgroundColor: "#16A34A", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Mark Food Ready
                  </button>
                )}

                {order.status === "READY_FOR_PICKUP" && (
                  <button
                    onClick={() => {
                      setHandoverOrderId(order.orderId);
                      setEnteredHandoverOtp("");
                      setHandoverError(null);
                    }}
                    style={{ flex: 1, padding: "10px", backgroundColor: "#2563EB", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Verify Rider Pickup OTP
                  </button>
                )}

                <button
                  onClick={() => onPrintKOT(order)}
                  style={{ padding: "10px 12px", backgroundColor: "#334155", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                  title="Print KOT"
                >
                  Print
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rider Handover OTP Modal */}
      {handoverOrderId && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "#1E293B", borderRadius: "10px", padding: "20px", maxWidth: "400px", width: "90%", border: "1px solid #475569" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", color: "#60A5FA" }}>Rider Pickup Handover Gate</h3>
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: "0 0 14px 0" }}>
              Ask the OrderKing delivery partner for their 4-digit pickup OTP to verify order release.
            </p>
            <input
              type="text"
              maxLength={4}
              value={enteredHandoverOtp}
              onChange={(e) => setEnteredHandoverOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 4-digit OTP"
              style={{ width: "100%", padding: "10px", fontSize: "20px", textAlign: "center", letterSpacing: "8px", fontWeight: 800, borderRadius: "6px", border: "1px solid #64748B", backgroundColor: "#0F172A", color: "#FFF", boxSizing: "border-box" }}
            />
            {handoverError && <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "8px" }}>{handoverError}</div>}
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                onClick={handleConfirmRiderHandover}
                style={{ flex: 1, padding: "10px", backgroundColor: "#16A34A", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
              >
                Confirm Handover
              </button>
              <button
                onClick={() => setHandoverOrderId(null)}
                style={{ padding: "10px 16px", backgroundColor: "#334155", color: "#FFF", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Rejection Modal */}
      {rejectOrderId && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "#1E293B", borderRadius: "10px", padding: "20px", maxWidth: "420px", width: "90%", border: "1px solid #991B1B" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#EF4444" }}>Decline Order & Fault Penalty</h3>
            <p style={{ fontSize: "12px", color: "#CBD5E1", margin: "0 0 12px 0" }}>
              Merchant-initiated order cancellations disrupt customer experience and levy platform operational penalty against daily settlement ledger.
            </p>
            <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Operational Reason:</label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", backgroundColor: "#0F172A", color: "#FFF", border: "1px solid #475569", marginBottom: "16px" }}
            >
              <option value="Item out of stock">Item out of stock</option>
              <option value="Kitchen overloaded">Kitchen overloaded</option>
              <option value="Store closing">Store closing for the day</option>
              <option value="Technical failure">POS / Printer technical failure</option>
            </select>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleConfirmRejection}
                style={{ flex: 1, padding: "10px", backgroundColor: "#DC2626", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
              >
                Confirm Decline
              </button>
              <button
                onClick={() => setRejectOrderId(null)}
                style={{ padding: "10px 16px", backgroundColor: "#334155", color: "#FFF", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
