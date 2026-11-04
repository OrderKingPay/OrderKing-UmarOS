import React from "react";
interface UnserviceabilityFallbackProps {
  customerCoordinates: { latitude: number; longitude: number };
  detectedLocationName: string;
  onExploreService: (serviceRoute: string) => void;
}
export const UnserviceabilityFallback: React.FC<UnserviceabilityFallbackProps> = ({
  customerCoordinates,
  detectedLocationName,
  onExploreService,
}) => {
  return (
    <div style={{ padding: "20px 16px", minHeight: "80vh", backgroundColor: "#0B1B3D", color: "#F8FAFC", fontFamily: "-apple-system, sans-serif" }}>
      {/* Informative Location Header */}
      <div style={{ backgroundColor: "#1A365D", padding: "16px", borderRadius: "12px", border: "1px solid #2B6CB0", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "18px" }}>📍</span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#90CDF4" }}>Location: {detectedLocationName}</span>
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "#E2E8F0", lineHeight: 1.4 }}>
          Food delivery kitchens are currently outside standard shift radius at these coordinates ({customerCoordinates.latitude.toFixed(4)}, {customerCoordinates.longitude.toFixed(4)}).
        </p>
      </div>
      <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "16px", color: "#FFF" }}>
        Essential Services Available In Your Area
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
        {/* Travel Ticketing */}
        <div
          onClick={() => onExploreService("/travel")}
          style={{ backgroundColor: "#1E293B", padding: "16px", borderRadius: "10px", border: "1px solid #334155", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#38BDF8", marginBottom: "4px" }}>✈️ Travel & Ticketing</div>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>Direct IRCTC Train reservations, Flight search, and Hotel booking.</div>
          </div>
          <span style={{ fontSize: "20px", color: "#64748B" }}>➔</span>
        </div>
        {/* BBPS Utility Bills */}
        <div
          onClick={() => onExploreService("/bills")}
          style={{ backgroundColor: "#1E293B", padding: "16px", borderRadius: "10px", border: "1px solid #334155", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#10B981", marginBottom: "4px" }}>💡 Utility Bill Payments (BBPS)</div>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>APDCL Electricity, Piped Gas, Water, and Prepaid Mobile Recharges.</div>
          </div>
          <span style={{ fontSize: "20px", color: "#64748B" }}>➔</span>
        </div>
        {/* My Garage */}
        <div
          onClick={() => onExploreService("/garage")}
          style={{ backgroundColor: "#1E293B", padding: "16px", borderRadius: "10px", border: "1px solid #334155", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#F59E0B", marginBottom: "4px" }}>🚗 My Garage & Vehicle Services</div>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>Instant NETC FASTag recharge, e-Challan lookup, and 24x7 Breakdown Assist.</div>
          </div>
          <span style={{ fontSize: "20px", color: "#64748B" }}>➔</span>
        </div>
        {/* Inter-City Local Courier */}
        <div
          onClick={() => onExploreService("/courier")}
          style={{ backgroundColor: "#1E293B", padding: "16px", borderRadius: "10px", border: "1px solid #334155", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#A855F7", marginBottom: "4px" }}>📦 Local Parcel Courier</div>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>Dispatch documents, medicines, or parcels to nearby towns.</div>
          </div>
          <span style={{ fontSize: "20px", color: "#64748B" }}>➔</span>
        </div>
      </div>
    </div>
  );
};
