import React from 'react';

export default function KingPayTransit() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
          KingPay Transit
        </h1>
        <p className="mt-2 text-gray-400">Seamless mobility. Premium rewards.</p>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FASTag Section */}
        <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl hover:border-yellow-500 transition-colors">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="bg-green-500 p-2 rounded-lg mr-3 text-sm text-black">FASTag</span>
            Recharge
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Vehicle Number</label>
              <input type="text" placeholder="e.g. MH 01 AB 1234" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Amount (₹)</label>
              <input type="number" placeholder="500" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500" />
            </div>
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 text-sm text-yellow-300">
              🎁 <strong>Offer:</strong> Recharge FASTag, earn Food Cash!
            </div>
            <button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold py-3 rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all">
              Recharge Now
            </button>
          </div>
        </section>

        {/* NCMC Metro Card Section */}
        <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl hover:border-blue-500 transition-colors">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="bg-blue-500 p-2 rounded-lg mr-3 text-sm text-black">NCMC</span>
            Metro Card
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Card Number</label>
              <input type="text" placeholder="16-digit NCMC number" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Amount (₹)</label>
              <input type="number" placeholder="200" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="bg-transparent border border-transparent rounded-lg p-3 text-sm text-transparent select-none">
              Spacer
            </div>
            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 rounded-lg hover:from-blue-500 hover:to-blue-700 transition-all mt-6">
              Top Up Card
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
