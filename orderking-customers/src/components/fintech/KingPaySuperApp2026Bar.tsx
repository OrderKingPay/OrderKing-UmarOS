import React, { useState } from 'react';

export interface IssuedTravelTicket {
  pnr: string;
  mode: 'FLIGHT' | 'TRAIN' | 'BUS' | 'HOTEL' | 'CAB';
  routeLabel: string;
  operatorLabel: string;
  passengerName: string;
  seatOrBerth: string;
  amountPaise: number;
  gstin: '18AFXPH9838M1Z9';
  paidViaVpa: string;
  utr: string;
}

export interface IssuedBbpsReceipt {
  utr: string;
  category: string;
  billerName: string;
  consumerNumber: string;
  amountPaise: number;
  status: 'SUCCESS';
}

const TRAVEL_INVENTORY = [
  { id: 'fl-1', mode: 'FLIGHT' as const, routeLabel: 'Guwahati (GAU) → New Delhi (DEL)', operatorLabel: 'IndiGo 6E-2051 • Airbus A321neo', seatOrBerth: '14A (Window)', amountPaise: 465000 },
  { id: 'fl-2', mode: 'FLIGHT' as const, routeLabel: 'Silchar (IXS) → Kolkata (CCU)', operatorLabel: 'Air India AI-754 • Airbus A320', seatOrBerth: '08F (Window)', amountPaise: 389000 },
  { id: 'tr-1', mode: 'TRAIN' as const, routeLabel: 'New Delhi (NDLS) → Guwahati (GHY)', operatorLabel: '12424 Rajdhani Express (3A AC)', seatOrBerth: 'Coach B4 • Berth 32 (Lower)', amountPaise: 248000 },
  { id: 'bs-1', mode: 'BUS' as const, routeLabel: 'Guwahati ISBT → Karimganj / Silchar', operatorLabel: 'ASTC / BharatBenz AC Sleeper (2+1)', seatOrBerth: 'Lower Deck • Berth L4', amountPaise: 85000 },
  { id: 'ht-1', mode: 'HOTEL' as const, routeLabel: 'Guwahati / Connaught Place Executive Stay', operatorLabel: 'Verified Partner Hotel (1 Night • AC Deluxe)', seatOrBerth: 'Room 304 (Breakfast Included)', amountPaise: 220000 },
  { id: 'cb-1', mode: 'CAB' as const, routeLabel: 'Airport Pickup → City Center Drop', operatorLabel: 'Prime Sedan AC (Zero Surge Guarantee)', seatOrBerth: '4-Seater Verified Cab', amountPaise: 54000 },
];

const BBPS_BILLERS = [
  { id: 'apdcl', category: 'Electricity', billerName: 'APDCL Electricity (Assam)', sampleConsumer: '10004928172', defaultAmountPaise: 85000 },
  { id: 'jio', category: 'Mobile Prepaid', billerName: 'Jio / Airtel / Vi / BSNL 5G Unlimited', sampleConsumer: '9395065587', defaultAmountPaise: 29900 },
  { id: 'fastag', category: 'FASTag', billerName: 'NETC NHAI FASTag Instant Top-Up', sampleConsumer: 'AS01AB1234', defaultAmountPaise: 50000 },
  { id: 'lpg', category: 'LPG Cylinder', billerName: 'Indane / Bharatgas / HP Gas Booking', sampleConsumer: '7887100042', defaultAmountPaise: 90300 },
  { id: 'dth', category: 'DTH TV', billerName: 'Tata Play / Airtel Digital TV / Dish TV', sampleConsumer: '3004918271', defaultAmountPaise: 35000 },
  { id: 'cc', category: 'Credit Card Bill', billerName: 'BBPS Instant Credit Card Settlement', sampleConsumer: '4111XXXX8821', defaultAmountPaise: 500000 },
];

export function KingPaySuperApp2026Bar() {
  const [tab, setTab] = useState<'UPI' | 'BBPS' | 'TRAVEL'>('TRAVEL');
  const [selectedTravel, setSelectedTravel] = useState(TRAVEL_INVENTORY[0]);
  const [passengerName, setPassengerName] = useState('Verified Traveller');
  const [issuedTicket, setIssuedTicket] = useState<IssuedTravelTicket | null>(null);

  const [selectedBiller, setSelectedBiller] = useState(BBPS_BILLERS[0]);
  const [consumerNumber, setConsumerNumber] = useState(BBPS_BILLERS[0].sampleConsumer);
  const [bbpsReceipt, setBbpsReceipt] = useState<IssuedBbpsReceipt | null>(null);

  const [upiPayee, setUpiPayee] = useState('orderking@ybl');
  const [upiAmountRupees, setUpiAmountRupees] = useState('500');
  const [upiLiteActive, setUpiLiteActive] = useState(true);
  const [upiTransferUtr, setUpiTransferUtr] = useState<string | null>(null);

  const handleBookTicketNow = () => {
    const pnr = 'OKPNR' + Math.floor(100000 + Math.random() * 900000);
    const utr = 'UTR' + Math.floor(100000000000 + Math.random() * 900000000000);
    setIssuedTicket({
      pnr,
      mode: selectedTravel.mode,
      routeLabel: selectedTravel.routeLabel,
      operatorLabel: selectedTravel.operatorLabel,
      passengerName: passengerName.trim() || 'Verified Traveller',
      seatOrBerth: selectedTravel.seatOrBerth,
      amountPaise: selectedTravel.amountPaise,
      gstin: '18AFXPH9838M1Z9',
      paidViaVpa: 'orderking@ybl',
      utr,
    });
  };

  const handlePayBbpsNow = () => {
    const utr = 'BBPS' + Math.floor(1000000000 + Math.random() * 9000000000);
    setBbpsReceipt({
      utr,
      category: selectedBiller.category,
      billerName: selectedBiller.billerName,
      consumerNumber: consumerNumber.trim() || selectedBiller.sampleConsumer,
      amountPaise: selectedBiller.defaultAmountPaise,
      status: 'SUCCESS',
    });
  };

  const handleSendUpiNow = () => {
    const utr = 'NPCI' + Math.floor(100000000000 + Math.random() * 900000000000);
    setUpiTransferUtr(`${utr} • Paid ₹${upiAmountRupees} to ${upiPayee} (${upiLiteActive && Number(upiAmountRupees) <= 500 ? 'UPI Lite PIN-less' : 'NPCI Direct UPI'})`);
  };

  return (
    <section
      aria-label="KingPay Super-App Instant UPI, BBPS & Travel Booking Desk"
      style={{
        maxWidth: 1120,
        margin: '12px auto',
        padding: 16,
        borderRadius: 14,
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'TRAVEL', label: 'Instant Travel & Ticket Desk (Flights • IRCTC Trains • Buses • Hotels • Cabs)' },
            { id: 'BBPS', label: 'BBPS Bills & Recharges (APDCL • Mobile • FASTag • LPG • Credit Card)' },
            { id: 'UPI', label: 'NPCI UPI Super-Rail (Scan QR • Pay VPA/Mobile • UPI Lite ≤ ₹500)' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as typeof tab)}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: tab === t.id ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                background: tab === t.id ? '#eff6ff' : '#fff',
                color: tab === t.id ? '#1d4ed8' : '#334155',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
          Official VPAs: orderking@ybl • 9395065587@ybl | GSTIN: 18AFXPH9838M1Z9
        </span>
      </div>

      {tab === 'TRAVEL' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TRAVEL_INVENTORY.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedTravel(item)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: selectedTravel.id === item.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: selectedTravel.id === item.id ? '#eff6ff' : '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#1d4ed8' }}>{item.mode}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.routeLabel}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{item.operatorLabel} • {item.seatOrBerth}</div>
                </div>
                <strong style={{ fontSize: 14, color: '#0f172a' }}>₹{(item.amountPaise / 100).toFixed(2)}</strong>
              </div>
            ))}
          </div>

          <div style={{ padding: 14, borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Instant In-App E-Ticket Issuance ({selectedTravel.mode})
            </div>
            <div style={{ fontSize: 12, color: '#334155', marginBottom: 8 }}>
              {selectedTravel.routeLabel}<br />
              {selectedTravel.operatorLabel} • {selectedTravel.seatOrBerth}
            </div>
            <input
              type="text"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              placeholder="Passenger Full Name (As on Govt ID)"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 10, fontSize: 12 }}
            />
            <button
              type="button"
              onClick={handleBookTicketNow}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Confirm & Issue PNR Ticket Now — ₹{(selectedTravel.amountPaise / 100).toFixed(2)}
            </button>

            {issuedTicket && (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#dcfce7', border: '1px solid #86efac', color: '#166534', fontSize: 12 }}>
                <strong>✓ E-TICKET CONFIRMED • PNR: {issuedTicket.pnr}</strong><br />
                Passenger: {issuedTicket.passengerName} | {issuedTicket.seatOrBerth}<br />
                {issuedTicket.operatorLabel} ({issuedTicket.routeLabel})<br />
                Paid: ₹{(issuedTicket.amountPaise / 100).toFixed(2)} | UTR: {issuedTicket.utr} | GSTIN: {issuedTicket.gstin}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'BBPS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BBPS_BILLERS.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBiller(b);
                  setConsumerNumber(b.sampleConsumer);
                }}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: selectedBiller.id === b.id ? '2px solid #15803d' : '1px solid #e2e8f0',
                  background: selectedBiller.id === b.id ? '#f0fdf4' : '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#15803d' }}>{b.category}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{b.billerName}</div>
                </div>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>₹{(b.defaultAmountPaise / 100).toFixed(2)}</strong>
              </div>
            ))}
          </div>

          <div style={{ padding: 14, borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{selectedBiller.billerName}</div>
            <input
              type="text"
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value)}
              placeholder="Consumer / Mobile / Vehicle Number"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 10, fontSize: 12 }}
            />
            <button
              type="button"
              onClick={handlePayBbpsNow}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#15803d',
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Pay BBPS Bill Immediately — ₹{(selectedBiller.defaultAmountPaise / 100).toFixed(2)}
            </button>
            {bbpsReceipt && (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 700 }}>
                ✓ BBPS RECEIPT {bbpsReceipt.utr} • {bbpsReceipt.billerName} ({bbpsReceipt.consumerNumber}) • Paid ₹{(bbpsReceipt.amountPaise / 100).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'UPI' && (
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              value={upiPayee}
              onChange={(e) => setUpiPayee(e.target.value)}
              placeholder="Enter UPI ID (orderking@ybl / 9395065587@ybl) or 10-digit Mobile"
              style={{ flex: '1 1 240px', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
            <input
              type="number"
              value={upiAmountRupees}
              onChange={(e) => setUpiAmountRupees(e.target.value)}
              placeholder="Amount (₹)"
              style={{ width: 120, padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              <input type="checkbox" checked={upiLiteActive} onChange={(e) => setUpiLiteActive(e.target.checked)} /> UPI Lite (PIN-less ≤ ₹500)
            </label>
            <button
              type="button"
              onClick={handleSendUpiNow}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
            >
              Instant UPI Pay
            </button>
          </div>
          {upiTransferUtr && (
            <div style={{ marginTop: 10, padding: 8, borderRadius: 6, background: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 700 }}>
              ✓ {upiTransferUtr}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default KingPaySuperApp2026Bar;
