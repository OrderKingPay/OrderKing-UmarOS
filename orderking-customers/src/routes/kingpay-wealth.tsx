import React from 'react';

const KingPayWealth = () => {
  return (
    <div style={{ backgroundColor: '#0a0a0a', color: '#d4af37', minHeight: '100vh', fontFamily: 'serif', padding: '40px' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 'lighter' }}>KingPay Wealth</h1>
        <p style={{ fontSize: '1.2rem', color: '#888', marginTop: '10px' }}>Exquisite Swiss-Grade Digital Investment</p>
      </header>

      <main style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        <section style={{ flex: 1, minWidth: '300px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', padding: '30px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>24K Digital Gold</h2>
          <p style={{ color: '#aaa', marginBottom: '30px', lineHeight: 1.6 }}>
            Invest in fractional physical gold, vaulted securely in Geneva. Pure 99.99% gold, instant liquidity.
          </p>
          <div style={{ marginBottom: '30px' }}>
            <span style={{ fontSize: '1.2rem', color: '#888' }}>Current Price:</span>
            <span style={{ fontSize: '2rem', display: 'block', marginTop: '10px' }}>$74.25 / g</span>
          </div>
          <button style={{ backgroundColor: '#d4af37', color: '#000', border: 'none', padding: '15px 30px', fontSize: '1.1rem', cursor: 'pointer', borderRadius: '4px', width: '100%', fontWeight: 'bold' }}>
            Acquire Gold
          </button>
        </section>

        <section style={{ flex: 1, minWidth: '300px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', padding: '30px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Elite Mutual Funds</h2>
          <p style={{ color: '#aaa', marginBottom: '30px', lineHeight: 1.6 }}>
            Curated portfolios managed by industry veterans. Access private equity-like returns with public liquidity.
          </p>
          <div style={{ marginBottom: '30px' }}>
            <span style={{ fontSize: '1.2rem', color: '#888' }}>Top Performer:</span>
            <span style={{ fontSize: '1.5rem', display: 'block', marginTop: '10px' }}>KingPay Alpha Fund (+24.5% YTD)</span>
          </div>
          <button style={{ backgroundColor: 'transparent', color: '#d4af37', border: '1px solid #d4af37', padding: '15px 30px', fontSize: '1.1rem', cursor: 'pointer', borderRadius: '4px', width: '100%', fontWeight: 'bold' }}>
            Explore Funds
          </button>
        </section>
      </main>
    </div>
  );
};

export default KingPayWealth;
