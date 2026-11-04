import React, { useState } from "react";
export interface MasterDialSettings {
  flightConvenienceFeeInr: number;
  trainConvenienceFeeInr: number;
  hotelConvenienceFeeInr: number;
  dayShiftPerimeterKm: number;
  eveningShiftPerimeterKm: number;
  nightShiftPerimeterKm: number;
  telecomPrimaryGateway: "FAST2SMS_ROUTE_Q" | "WHATSAPP_CLOUD_API";
  telecomFailoverPriority: "WHATSAPP_THEN_SMS" | "SMS_THEN_WHATSAPP";
}
interface FounderMasterDialsProps {
  currentSettings: MasterDialSettings;
  onSaveDialsToDb: (updated: MasterDialSettings) => Promise<boolean>;
}
export const FounderMasterDials: React.FC<FounderMasterDialsProps> = ({
  currentSettings,
  onSaveDialsToDb,
}) => {
  const [settings, setSettings] = useState<MasterDialSettings>(currentSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const ok = await onSaveDialsToDb(settings);
      setSaveStatus(ok ? "Platform master dials updated in PostgreSQL." : "Failed to persist dials.");
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div style={{ backgroundColor: "#020617", padding: "24px", color: "#F8FAFC", borderRadius: "12px", border: "1px solid #1E293B", maxWidth: "800px" }}>
      <header style={{ borderBottom: "1px solid #1E293B", paddingBottom: "16px", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "20px", color: "#F59E0B" }}>Umar OS: Founder Operational Master Dials</h2>
        <span style={{ fontSize: "13px", color: "#94A3B8" }}>Central dynamic parameters for convenience fees, rider shift boundaries, and telecom gateways.</span>
      </header>
      {/* Convenience Fees Section */}
      <section style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "15px", color: "#38BDF8", marginBottom: "12px" }}>1. Travel Platform Convenience Fees</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Flight Booking Fee (INR)</label>
            <input
              type="number"
              value={settings.flightConvenienceFeeInr}
              onChange={e => setSettings({ ...settings, flightConvenienceFeeInr: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#FFF" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Train Booking Fee (INR)</label>
            <input
              type="number"
              value={settings.trainConvenienceFeeInr}
              onChange={e => setSettings({ ...settings, trainConvenienceFeeInr: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#FFF" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Hotel Booking Fee (INR)</label>
            <input
              type="number"
              value={settings.hotelConvenienceFeeInr}
              onChange={e => setSettings({ ...settings, hotelConvenienceFeeInr: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#FFF" }}
            />
          </div>
        </div>
      </section>
      {/* Rider Shift Boundaries Section */}
      <section style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "15px", color: "#10B981", marginBottom: "12px" }}>2. Rider Shift Geo-Perimeters (Max Radius)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Day Shift (06:00 - 18:00)</label>
            <input
              type="number"
              step="0.5"
              value={settings.dayShiftPerimeterKm}
              onChange={e => setSettings({ ...settings, dayShiftPerimeterKm: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#FFF" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Evening Rush (18:00 - 23:00)</label>
            <input
              type="number"
              step="0.5"
              value={settings.eveningShiftPerimeterKm}
              onChange={e => setSettings({ ...settings, eveningShiftPerimeterKm: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#FFF" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Late-Night (23:00 - 06:00)</label>
            <input
              type="number"
              step="0.5"
              value={settings.nightShiftPerimeterKm}
              onChange={e => setSettings({ ...settings, nightShiftPerimeterKm: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#FFF" }}
            />
          </div>
        </div>
      </section>
      {/* Telecom Gateways Section */}
      <section style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "15px", color: "#A855F7", marginBottom: "12px" }}>3. Telecom & Handover OTP Gateway Routing</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Primary Dispatch Route</label>
            <select
              value={settings.telecomPrimaryGateway}
              onChange={e => setSettings({ ...settings, telecomPrimaryGateway: e.target.value as MasterDialSettings["telecomPrimaryGateway"] })}
              style={{ width: "100%", padding: "8px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#FFF" }}
            >
              <option value="FAST2SMS_ROUTE_Q">Fast2SMS Quick Route 'q'</option>
              <option value="WHATSAPP_CLOUD_API">WhatsApp Business Cloud API</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Failover Sequence</label>
            <select
              value={settings.telecomFailoverPriority}
              onChange={e => setSettings({ ...settings, telecomFailoverPriority: e.target.value as MasterDialSettings["telecomFailoverPriority"] })}
              style={{ width: "100%", padding: "8px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#FFF" }}
            >
              <option value="WHATSAPP_THEN_SMS">Primary Route &rarr; WhatsApp Failover</option>
              <option value="SMS_THEN_WHATSAPP">Primary Route &rarr; SMS Failover</option>
            </select>
          </div>
        </div>
      </section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1E293B", paddingTop: "16px" }}>
        {saveStatus && <span style={{ fontSize: "13px", color: saveStatus.includes("updated") ? "#10B981" : "#EF4444" }}>{saveStatus}</span>}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{ padding: "10px 24px", backgroundColor: "#F59E0B", color: "#000", border: "none", borderRadius: "6px", fontWeight: 800, cursor: isSaving ? "not-allowed" : "pointer", marginLeft: "auto" }}
        >
          {isSaving ? "Persisting Dials..." : "Apply Master Dials"}
        </button>
      </div>
    </div>
  );
};
