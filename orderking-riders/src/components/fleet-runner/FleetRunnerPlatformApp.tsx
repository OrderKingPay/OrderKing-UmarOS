import React, { useMemo, useState } from 'react';

export function FleetRunnerPlatformApp() {
  const [onDuty, setOnDuty] = useState(true);
  const [shift, setShift] = useState<'DAY_12KM' | 'EVENING_7_5KM' | 'LATE_NIGHT_3_5KM'>('EVENING_7_5KM');
  const [rainSurge, setRainSurge] = useState(true);
  const [batchedCount, setBatchedCount] = useState<1 | 2>(2);
  const [waitMins, setWaitMins] = useState(6);
  const [completedOrders, setCompletedOrders] = useState(10);
  const [otpInput, setOtpInput] = useState('4829');
  const [dropVerified, setDropVerified] = useState(false);
  const [codFloatingPaise, setCodFloatingPaise] = useState(145000);

  const earnings = useMemo(() => {
    const firstMilePaise = 600;
    const waitPaise = Math.min(800, Math.max(0, waitMins - 3) * 100);
    const lastMilePaise = Math.round(3.6 * 1500);
    const touchpointPaise = (1 + batchedCount) * 500;
    const surgePaise = rainSurge ? Math.round((firstMilePaise + lastMilePaise + touchpointPaise) * 0.3) : 0;
    const milestonePaise = completedOrders >= 30 ? 50000 : completedOrders >= 20 ? 30000 : completedOrders >= 10 ? 15000 : 0;
    const fiveStarBonusPaise = 1000;
    const customerTipPaise = 2500;
    const mgTopUpPaise = 7000;
    const totalPaise =
      firstMilePaise +
      waitPaise +
      lastMilePaise +
      touchpointPaise +
      surgePaise +
      milestonePaise +
      fiveStarBonusPaise +
      customerTipPaise +
      mgTopUpPaise;
    return {
      firstMilePaise,
      waitPaise,
      lastMilePaise,
      touchpointPaise,
      surgePaise,
      milestonePaise,
      fiveStarBonusPaise,
      customerTipPaise,
      mgTopUpPaise,
      totalPaise,
    };
  }, [waitMins, batchedCount, rainSurge, completedOrders]);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#09090b', color: '#fafafa', minHeight: '100vh', padding: 16 }}>
      <header style={{ maxWidth: 1100, margin: '0 auto 14px auto', background: '#18181b', padding: '12px 16px', borderRadius: 10, border: '1px solid #27272a', display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#22c55e' }}>OrderKing Delivery Partner</span>
          <span style={{ marginLeft: 10, fontSize: 12, color: '#a1a1aa' }}>COD Settlement VPAs: orderking@ybl • 9395065587@ybl</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setOnDuty((v) => !v)}
            style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: onDuty ? '#15803d' : '#b91c1c', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            {onDuty ? 'ON DUTY (GIG ACTIVE)' : 'OFF DUTY'}
          </button>
          <button
            type="button"
            onClick={() => setRainSurge((v) => !v)}
            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: rainSurge ? '#2563eb' : '#3f3f46', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            {rainSurge ? '+30% Rain/Night Surge ON' : 'Standard Rate'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <section style={{ background: '#18181b', borderRadius: 10, border: '1px solid #27272a', padding: 16 }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 700 }}>Gig Shift Perimeter &amp; Hotspot Zones</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              { id: 'DAY_12KM', label: 'Day Gig (12.0 km • MG ₹450)' },
              { id: 'EVENING_7_5KM', label: 'Dinner Peak Gig (7.5 km • MG ₹550)' },
              { id: 'LATE_NIGHT_3_5KM', label: 'Late-Night Gig (3.5 km • MG ₹500)' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setShift(s.id as typeof shift)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: shift === s.id ? '1.5px solid #22c55e' : '1px solid #3f3f46',
                  background: shift === s.id ? '#14532d' : '#27272a',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={() => setBatchedCount(1)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #3f3f46', background: batchedCount === 1 ? '#22c55e' : '#27272a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              Single Order (2 Touchpoints)
            </button>
            <button type="button" onClick={() => setBatchedCount(2)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #3f3f46', background: batchedCount === 2 ? '#22c55e' : '#27272a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              Smart Corridor Batch (Max 2 • 3 Touchpoints)
            </button>
          </div>

          <div style={{ padding: 12, borderRadius: 8, background: '#09090b', border: '1px solid #27272a', fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#4ade80', marginBottom: 6 }}>Mandatory 4-Digit Doorstep Delivery OTP Gate</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="4829"
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #3f3f46', background: '#18181b', color: '#fff', width: 90 }}
              />
              <button
                type="button"
                onClick={() => {
                  if (otpInput.trim() === '4829') setDropVerified(true);
                }}
                style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: otpInput.trim() === '4829' ? '#22c55e' : '#3f3f46', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                {dropVerified ? '✓ DROP COMPLETED' : 'Verify OTP (4829) & Complete'}
              </button>
            </div>
          </div>
        </section>

        <section style={{ background: '#18181b', borderRadius: 10, border: '1px solid #27272a', padding: 16, fontSize: 12 }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 700 }}>OrderKing Touchpoint Rate Card & COD Settlement</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>First-Mile Approach + Wait Time Pay ({waitMins}m)</span><strong>₹{((earnings.firstMilePaise + earnings.waitPaise) / 100).toFixed(2)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Last-Mile (3.6 km @ ₹15/km) + Touchpoints</span><strong>₹{((earnings.lastMilePaise + earnings.touchpointPaise) / 100).toFixed(2)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rain/Night Surge (+30%) + 5-Star Bonus</span><strong>₹{((earnings.surgePaise + earnings.fiveStarBonusPaise) / 100).toFixed(2)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Milestone Target ({completedOrders} Orders) + 100% Tip</span><strong>₹{((earnings.milestonePaise + earnings.customerTipPaise) / 100).toFixed(2)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}><span>Gig Minimum Guarantee (MG) Safety Top-Up</span><strong>+₹{(earnings.mgTopUpPaise / 100).toFixed(2)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#22c55e', paddingTop: 6, borderTop: '1px solid #27272a' }}>
              <strong>Total Net Earnings (Zero Platform Deduction)</strong>
              <strong>₹{(earnings.totalPaise / 100).toFixed(2)}</strong>
            </div>
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Floating COD Cash: ₹{(codFloatingPaise / 100).toFixed(2)} / ₹2,000 Limit</span>
            <button
              type="button"
              onClick={() => setCodFloatingPaise(0)}
              style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
            >
              Deposit COD via orderking@ybl
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default FleetRunnerPlatformApp;
