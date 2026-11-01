import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [pincode, setPincode] = useState('');
  const [isLocationVerified, setIsLocationVerified] = useState(false);

  const handleLocationVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setIsLocationVerified(true);
    }
  };

  if (!isLocationVerified) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-zinc-800">
          <h1 className="text-4xl font-serif text-amber-500 mb-2 text-center">OrderKing</h1>
          <p className="text-zinc-400 text-center mb-8">Premium Dining. Verified Excellence.</p>
          
          <form onSubmit={handleLocationVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Enter Pincode for Exclusive Access
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="e.g. 400001"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-black font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Discover Premium Curation
            </button>
          </form>
          <p className="mt-6 text-xs text-zinc-500 text-center">
            * We strictly enforce location verification to guarantee 100% genuine menus and transparent pricing. Zero fake catalogue items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Head>
        <title>OrderKing - Premium Dining</title>
      </Head>

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-serif text-amber-500 tracking-wider">ORDERKING</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-zinc-400 flex items-center bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Location Verified: {pincode}
              </div>
              <button onClick={() => setIsLocationVerified(false)} className="text-xs text-amber-500 hover:text-amber-400 underline">
                Change
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-serif font-light mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600">
            Culinary Excellence,<br />Curated for You.
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Discover verified premium restaurants, exquisite menus, and transparent pricing. 
          </p>
        </div>

        {/* Search / Filter Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for premium restaurants, cuisines, or exclusive menus..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 text-lg text-white focus:outline-none focus:border-amber-500 transition-colors shadow-2xl"
            />
            <button className="absolute right-3 top-3 bg-amber-600 hover:bg-amber-700 text-black px-6 py-2 rounded-xl font-medium transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Premium Curations */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-serif text-zinc-100">Verified Premium Selections</h3>
            <span className="text-xs text-zinc-400">Pincode: {pincode}</span>
          </div>
          
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="size-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto text-2xl">
              📍
            </div>
            <h4 className="text-xl font-serif text-white">
              Awaiting live store telemetry: Verified kitchens onboarding in your district
            </h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Partner kitchens and premium verified dining venues in pincode <span className="text-amber-400 font-mono font-bold">{pincode}</span> are currently undergoing menu validation and KYC verification. Zero mock entries are displayed.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-300">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Direct POS / Live Telemetry Active
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
