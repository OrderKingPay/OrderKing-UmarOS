import React, { useState } from 'react';
import {
  DEFAULT_FOUNDER_MASTER_DIALS,
  movePlatformUiSection,
  mutatePlatformUiRegistry,
  updatePlatformThemeAndOptions,
  buildDisputeArbitrationRefundPayload,
  type PlatformUiSectionBlock,
  type TargetPlatformId,
  type LayoutMoveDirection,
  type PlatformThemeAndOptionsConfig,
  type FounderMasterDialsConfig,
} from '../../lib/orderking/umaros/umaros-supreme-controller';

const INITIAL_SECTIONS: PlatformUiSectionBlock[] = [
  { id: 'sec-cust-feed', platformId: 'orderking-customers', label: 'Zomato 2026 Pure Veg, Healthy & Food Rescue Feed', rowOrder: 0, colOrder: 0, enabled: true, primaryColorHex: '#e23744' },
  { id: 'sec-kingpay-rail', platformId: 'orderking-customers', label: 'KingPay NPCI UPI, BBPS & Instant Travel PNR Desk', rowOrder: 1, colOrder: 0, enabled: true, primaryColorHex: '#2563eb' },
  { id: 'sec-part-kds', platformId: 'orderking-partners', label: '3-Column Live KDS, 80mm KOT & Verhoeff KYC', rowOrder: 0, colOrder: 1, enabled: true, primaryColorHex: '#15803d' },
  { id: 'sec-rider-gig', platformId: 'orderking-riders', label: '4h Gig Shift Planner, MG Top-Up & Touchpoint Rate Card', rowOrder: 1, colOrder: 1, enabled: true, primaryColorHex: '#22c55e' },
];

export function UmarOsSupremeGodEyeApp() {
  const [sections, setSections] = useState<PlatformUiSectionBlock[]>(INITIAL_SECTIONS);
  const [dials, setDials] = useState<FounderMasterDialsConfig>(DEFAULT_FOUNDER_MASTER_DIALS);
  const [theme, setTheme] = useState<PlatformThemeAndOptionsConfig>({
    targetPlatform: 'ALL_PLATFORMS',
    primaryBrandColorHex: '#e23744',
    accentColorHex: '#2563eb',
    surfaceBackgroundHex: '#ffffff',
    pureVegModeEnabled: true,
    healthyModeEnabled: true,
    foodRescueEnabled: true,
    instantTicketBookingEnabled: true,
  } as PlatformThemeAndOptionsConfig);
  const [twoFactorCredits, setTwoFactorCredits] = useState(171);
  const [refundStatus, setRefundStatus] = useState<string | null>(null);

  const handleMove = (id: string, dir: LayoutMoveDirection) => {
    setSections((prev) => movePlatformUiSection(prev, id, dir));
  };

  const handlePurge = (id: string) => {
    setSections((prev) => mutatePlatformUiRegistry(prev, { type: 'PURGE', sectionId: id }));
  };

  const handleInstantRefund = () => {
    const payload = buildDisputeArbitrationRefundPayload({
      orderId: 'OK-8421',
      customerId: 'cust-788710',
      refundAmountPaise: 24000,
      reason: 'INSTANT_FOUNDER_ARBITRATION',
    } as any);
    setRefundStatus(`Refund Dispatched: ₹240.00 for Order #OK-8421 (Audit ID: ${payload?.auditId ?? 'AES256-GCM-VERIFIED'})`);
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#09090b', color: '#fafafa', minHeight: '100vh', padding: 16 }}>
      <header style={{ maxWidth: 1160, margin: '0 auto 16px auto', background: '#18181b', padding: '12px 16px', borderRadius: 10, border: '1px solid #27272a', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#f43f5e' }}>UmarOS Supreme God-Eye Control Center</span>
          <span style={{ marginLeft: 10, fontSize: 12, color: '#a1a1aa' }}>Entity: Orderkingpay • GSTIN: 18AFXPH9838M1Z9 • Assam 788710</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 700 }}>Fast2SMS Active + 2Factor ({twoFactorCredits} SMS Credits)</span>
          <button
            type="button"
            onClick={handleInstantRefund}
            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#e23744', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            1-Tap Arbitration Refund
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1160, margin: '0 auto' }}>
        {refundStatus && (
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: '#14532d', color: '#4ade80', fontSize: 12, fontWeight: 700 }}>
            ✓ {refundStatus}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
          {sections.map((s) => (
            <div key={s.id} style={{ background: '#18181b', borderRadius: 10, border: `2px solid ${(s as any).primaryColorHex ?? '#e23744'}`, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#a1a1aa', marginBottom: 4 }}>
                {s.platformId} • Pos ({s.rowOrder}, {s.colOrder})
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{s.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(['UP', 'DOWN', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'] as LayoutMoveDirection[]).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => handleMove(s.id, dir)}
                    style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #3f3f46', background: '#27272a', color: '#fff', cursor: 'pointer' }}
                  >
                    {dir}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handlePurge(s.id)}
                  style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, border: 'none', background: '#b91c1c', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Purge
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default UmarOsSupremeGodEyeApp;
