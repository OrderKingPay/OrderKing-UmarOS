import React, { useState } from 'react';

export default function KingPayLoans() {
  const [amount, setAmount] = useState(100000);
  const [status, setStatus] = useState<'idle' | 'pending'>('idle');

  const handleApply = () => {
    setStatus('pending');
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#ffffff', minHeight: '100vh', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <h1 style={{ textAlign: 'center', color: '#e0e0e0' }}>KingPay Credit</h1>
        <p style={{ textAlign: 'center', color: '#a0a0a0', marginBottom: '2rem' }}>Instant Credit, Zero Hassle.</p>
        
        {status === 'idle' ? (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1.2rem' }}>
                Select Loan Amount: <strong>₹{amount.toLocaleString('en-IN')}</strong>
              </label>
              <input 
                type="range" 
                min="10000" 
                max="500000" 
                step="5000"
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <span>₹10,000</span>
                <span>₹5,00,000</span>
              </div>
            </div>
            
            <button 
              onClick={handleApply}
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', backgroundColor: '#bb86fc', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Apply Now
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ color: '#ffb74d' }}>Pending KYC / Awaiting RBI Partner Approval</h3>
            <p style={{ color: '#a0a0a0', marginTop: '1rem' }}>We are processing your application. Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
