import React, { useState, useEffect } from "react";
import { Flag, MapPin } from "lucide-react";
export interface TripOffer {
  tripId: string;
  orderNumber: string;
  restaurantName: string;
  restaurantAddress: string;
  pickupDistanceKm: number;
  customerDropAddress: string;
  dropDistanceKm: number;
  totalDistanceKm: number;
  estimatedDurationMins: number;
  basePayPaise: number;
  surgePayPaise: number;
  tipPaise: number;
  totalPayPaise: number;
  itemCount: number;
  paymentMode: "PREPAID" | "COD";
  codCollectionAmountPaise?: number;
}
interface FloatingTripOfferRadarProps {
  offer: TripOffer;
  onAccept: (tripId: string) => Promise<void>;
  onReject: (tripId: string) => Promise<void>;
}
export const FloatingTripOfferRadar: React.FC<FloatingTripOfferRadarProps> = ({
  offer,
  onAccept,
  onReject,
}) => {
  const [countdown, setCountdown] = useState(45);
  useEffect(() => {
    if (countdown <= 0) {
      onReject(offer.tripId);
      return;
    }
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, offer.tripId, onReject]);
  const totalPayInr = (offer.totalPayPaise / 100).toFixed(0);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
      <div style={{ backgroundColor: "#030712", borderRadius: "16px", border: "2px solid #D97706", width: "100%", maxWidth: "420px", color: "#F9FAFB", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}>
        {/* Header with Countdown Bar */}
        <div style={{ backgroundColor: "#111827", padding: "16px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "12px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "1px" }}>Incoming Trip Offer</span>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#10B981" }}>₹{totalPayInr}</div>
          </div>
          <div style={{ width: "50px", height: "50px", borderRadius: "50%", border: "4px solid #D97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800 }}>
            {countdown}s
          </div>
        </div>
        {/* Trip Core Metrics */}
        <div style={{ padding: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", backgroundColor: "#1F2937", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#9CA3AF" }}>TOTAL DISTANCE</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{offer.totalDistanceKm} km</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#9CA3AF" }}>EST. TIME</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{offer.estimatedDurationMins} mins</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#9CA3AF" }}>ITEMS</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{offer.itemCount} Units</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#9CA3AF" }}>PAYMENT</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: offer.paymentMode === "COD" ? "#F59E0B" : "#10B981" }}>
                {offer.paymentMode} {offer.paymentMode === "COD" && `(₹${(offer.codCollectionAmountPaise || 0) / 100})`}
              </div>
            </div>
          </div>
          {/* Pickup & Drop Points */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ color: "#D97706", lineHeight: 1, marginTop: "2px" }}>
                <MapPin className="size-4" />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>PICKUP ({offer.pickupDistanceKm} km away)</div>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>{offer.restaurantName}</div>
                <div style={{ fontSize: "12px", color: "#D1D5DB" }}>{offer.restaurantAddress}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div style={{ color: "#10B981", lineHeight: 1, marginTop: "2px" }}>
                <Flag className="size-4" />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>DROP ({offer.dropDistanceKm} km from pickup)</div>
                <div style={{ fontSize: "13px", color: "#D1D5DB" }}>{offer.customerDropAddress}</div>
              </div>
            </div>
          </div>
          {/* Pay Breakdown */}
          <div style={{ borderTop: "1px solid #1F2937", paddingTop: "12px", marginBottom: "20px", fontSize: "12px", color: "#9CA3AF" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span>Base Transit Rate (₹15/km):</span>
              <span>₹{(offer.basePayPaise / 100).toFixed(0)}</span>
            </div>
            {offer.surgePayPaise > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#F59E0B" }}>
                <span>Surge Allowance:</span>
                <span>+₹{(offer.surgePayPaise / 100).toFixed(0)}</span>
              </div>
            )}
            {offer.tipPaise > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#10B981" }}>
                <span>100% Customer Tip:</span>
                <span>+₹{(offer.tipPaise / 100).toFixed(0)}</span>
              </div>
            )}
          </div>
          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => onReject(offer.tripId)}
              style={{ flex: 1, padding: "14px", backgroundColor: "#374151", color: "#FFF", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}
            >
              Pass
            </button>
            <button
              onClick={() => onAccept(offer.tripId)}
              style={{ flex: 2, padding: "14px", backgroundColor: "#D97706", color: "#FFF", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: "16px", cursor: "pointer" }}
            >
              Accept Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
