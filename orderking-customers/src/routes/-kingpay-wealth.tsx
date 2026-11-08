import React from 'react';
import { Link } from '@tanstack/react-router';

const KingPayWealth = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 sm:p-10 font-sans flex items-center justify-center">
      <div className="max-w-md w-full bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5 text-center">
        <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl">
          🪙
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Investments &amp; Savings</h1>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            Digital gold and savings features are launching soon. You can continue using KingPay for instant UPI payments and wallet transactions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/king-pay"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
          >
            Go to KingPay
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 text-gray-200 font-semibold text-xs hover:bg-white/15 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default KingPayWealth;
