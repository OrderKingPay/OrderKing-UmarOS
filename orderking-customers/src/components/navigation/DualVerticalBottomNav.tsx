import React from "react";
export type VerticalMode = "ORDERKING_FOOD" | "KINGPAY_SUPERAPP";
interface DualVerticalBottomNavProps {
  currentVertical: VerticalMode;
  activeTab: string;
  onSwitchVertical: (vertical: VerticalMode) => void;
  onNavigateTab: (tabId: string) => void;
  liveOrderCount?: number;
}
export const DualVerticalBottomNav: React.FC<DualVerticalBottomNavProps> = ({
  currentVertical,
  activeTab,
  onSwitchVertical,
  onNavigateTab,
  liveOrderCount = 0,
}) => {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: currentVertical === "ORDERKING_FOOD" ? "#1C1C1C" : "#0B1B3D",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        height: "64px",
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 9000,
        boxShadow: "0 -4px 12px rgba(0,0,0,0.2)",
      }}
    >
      {currentVertical === "ORDERKING_FOOD" ? (
        <>
          {/* Tab 1: OrderKing Food Feed */}
          <button
            onClick={() => onNavigateTab("feed")}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              color: activeTab === "feed" ? "#FF5200" : "#9CA3AF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "20px" }}>🍔</span>
            <span style={{ fontSize: "11px", fontWeight: activeTab === "feed" ? 700 : 500, marginTop: "2px" }}>OrderKing</span>
          </button>
          {/* Tab 2: Switch to KingPay Super-App */}
          <button
            onClick={() => onSwitchVertical("KINGPAY_SUPERAPP")}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              color: "#38BDF8",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "20px" }}>⚡</span>
            <span style={{ fontSize: "11px", fontWeight: 700, marginTop: "2px" }}>KingPay</span>
          </button>
          {/* Tab 3: Orders (Food Tracking & History) */}
          <button
            onClick={() => onNavigateTab("orders")}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              color: activeTab === "orders" ? "#FF5200" : "#9CA3AF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <span style={{ fontSize: "20px" }}>📜</span>
            <span style={{ fontSize: "11px", fontWeight: activeTab === "orders" ? 700 : 500, marginTop: "2px" }}>Orders</span>
            {liveOrderCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "32%",
                  backgroundColor: "#FF5200",
                  color: "#FFF",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  fontSize: "10px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {liveOrderCount}
              </span>
            )}
          </button>
        </>
      ) : (
        <>
          {/* Tab 1: Switch to OrderKing Food Delivery */}
          <button
            onClick={() => onSwitchVertical("ORDERKING_FOOD")}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              color: "#FF5200",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "20px" }}>🍔</span>
            <span style={{ fontSize: "11px", fontWeight: 700, marginTop: "2px" }}>OrderKing</span>
          </button>
          {/* Tab 2: KingPay Active Grid */}
          <button
            onClick={() => onNavigateTab("grid")}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              color: activeTab === "grid" ? "#38BDF8" : "#9CA3AF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "20px" }}>💳</span>
            <span style={{ fontSize: "11px", fontWeight: activeTab === "grid" ? 700 : 500, marginTop: "2px" }}>KingPay</span>
          </button>
          {/* Tab 3: Bookings (Travel & Service Ledger) */}
          <button
            onClick={() => onNavigateTab("bookings")}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              color: activeTab === "bookings" ? "#38BDF8" : "#9CA3AF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "20px" }}>🎫</span>
            <span style={{ fontSize: "11px", fontWeight: activeTab === "bookings" ? 700 : 500, marginTop: "2px" }}>Bookings</span>
          </button>
        </>
      )}
    </nav>
  );
};
