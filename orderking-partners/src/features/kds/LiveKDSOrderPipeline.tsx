import React, { useState, useEffect, useCallback, useRef } from "react";
export type OrderStatus = "NEW" | "ACCEPTED" | "PREPARING" | "READY_FOR_PICKUP" | "DISPATCHED" | "DELIVERED";
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  variant?: string;
  notes?: string;
  isVeg: boolean;
  pricePaise: number;
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
  riderAssigned?: {
    riderId: string;
    name: string;
    phoneMasked: string;
    etaMinutes: number;
  };
}
interface LiveKDSOrderPipelineProps {
  restaurantId: string;
  onPrintKOT: (order: KDSOrder) => Promise<boolean>;
  onUpdateStatusInDb: (orderId: string, nextStatus: OrderStatus, kptAdjustmentMinutes: number) => Promise<boolean>;
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio playback permission check
    }
  }, []);
  const handleAcceptOrder = async (orderId: string, kptMinutes: number) => {
    const success = await onUpdateStatusInDb(orderId, "ACCEPTED", kptMinutes);
    if (success) {
      playChime();
      setOrders(prev =>
        prev.map(o => (o.orderId === orderId ? { ...o, status: "ACCEPTED", kptMinutes } : o))
      );
      const acceptedOrder = orders.find(o => o.orderId === orderId);
      if (acceptedOrder) {
        await onPrintKOT(acceptedOrder);
      }
    }
  };
  const handleAdjustKpt = async (orderId: string, deltaMinutes: number) => {
    const target = orders.find(o => o.orderId === orderId);
    if (!target) return;
    const newKpt = Math.max(5, target.kptMinutes + deltaMinutes);
    const success = await onUpdateStatusInDb(orderId, target.status, newKpt);
    if (success) {
      setOrders(prev =>
        prev.map(o => (o.orderId === orderId ? { ...o, kptMinutes: newKpt } : o))
      );
    }
  };
  const handleTransition = async (orderId: string, nextStatus: OrderStatus) => {
    const target = orders.find(o => o.orderId === orderId);
    if (!target) return;
    const success = await onUpdateStatusInDb(orderId, nextStatus, target.kptMinutes);
    if (success) {
      setOrders(prev =>
        prev.map(o => (o.orderId === orderId ? { ...o, status: nextStatus } : o))
      );
    }
  };
  const activeOrders = orders.filter(o => !["DELIVERED"].includes(o.status));
  return (
    <div style={{ padding: "16px", backgroundColor: "#0F172A", minHeight: "100vh", color: "#F8FAFC", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #334155", paddingBottom: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#EA580C" }}>OrderKing Kitchen Display System (KDS)</h1>
          <span style={{ fontSize: "13px", color: "#94A3B8" }}>Outlet ID: {restaurantId} | Real-Time PostgreSQL Synced</span>
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
            Active Pipeline ({activeOrders.length})
          </button>
        </div>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
        {activeOrders.map(order => (
          <div
            key={order.orderId}
            style={{
              backgroundColor: "#1E293B",
              borderRadius: "10px",
              border: order.status === "NEW" ? "2px solid #EA580C" : "1px solid #334155",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "#EA580C" }}>#{order.displayNumber}</span>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>{new Date(order.createdAt).toLocaleTimeString("en-IN")}</div>
                </div>
                <span
                  style={{
                    backgroundColor: order.status === "NEW" ? "#7C2D12" : "#065F46",
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
              <div style={{ margin: "12px 0", borderTop: "1px dashed #475569", borderBottom: "1px dashed #475569", padding: "10px 0" }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: item.isVeg ? "#22C55E" : "#EF4444", fontSize: "10px" }}>●</span>
                      <strong>{item.quantity}x</strong> {item.name}
                      {item.variant && <span style={{ fontSize: "12px", color: "#94A3B8" }}>({item.variant})</span>}
                    </span>
                    <span style={{ color: "#CBD5E1" }}>₹{(item.pricePaise * item.quantity / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ backgroundColor: "#0F172A", padding: "8px 12px", borderRadius: "6px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Dynamic Kitchen Prep Time:</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#F97316" }}>{order.kptMinutes} mins</span>
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  <button
                    onClick={() => handleAdjustKpt(order.orderId, 5)}
                    style={{ flex: 1, padding: "4px", backgroundColor: "#334155", color: "#FFF", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                  >
                    +5m
                  </button>
                  <button
                    onClick={() => handleAdjustKpt(order.orderId, 10)}
                    style={{ flex: 1, padding: "4px", backgroundColor: "#334155", color: "#FFF", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                  >
                    +10m
                  </button>
                  <button
                    onClick={() => handleAdjustKpt(order.orderId, 15)}
                    style={{ flex: 1, padding: "4px", backgroundColor: "#334155", color: "#FFF", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                  >
                    +15m
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              {order.status === "NEW" && (
                <button
                  onClick={() => handleAcceptOrder(order.orderId, order.kptMinutes)}
                  style={{ flex: 1, padding: "10px", backgroundColor: "#EA580C", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                >
                  Accept & Print KOT
                </button>
              )}
              {order.status === "ACCEPTED" && (
                <button
                  onClick={() => handleTransition(order.orderId, "PREPARING")}
                  style={{ flex: 1, padding: "10px", backgroundColor: "#D97706", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                >
                  Mark Preparing
                </button>
              )}
              {order.status === "PREPARING" && (
                <button
                  onClick={() => handleTransition(order.orderId, "READY_FOR_PICKUP")}
                  style={{ flex: 1, padding: "10px", backgroundColor: "#16A34A", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                >
                  Food Ready For Pickup
                </button>
              )}
              <button
                onClick={() => onPrintKOT(order)}
                style={{ padding: "10px 14px", backgroundColor: "#334155", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                title="Print KOT"
              >
                🖨️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
