import React, { useState } from 'react';

export const PineLabsIntegration = () => {
  const [status, setStatus] = useState('Disconnected');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">POS Terminal Integration Hub</h1>
      <p className="text-gray-600 mb-8">B2B API connector interface for PineLabs and Razorpay offline swipe machines.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 p-6 rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800">PineLabs</h2>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Link physical PineLabs swipe machines to the OrderKing ecosystem.
          </p>
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            onClick={() => setStatus('Connecting...')}
          >
            Link PineLabs Terminal
          </button>
        </div>
        
        <div className="border border-gray-200 p-6 rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Razorpay POS</h2>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              Disconnected
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Link physical Razorpay swipe machines to the OrderKing ecosystem.
          </p>
          <button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Link Razorpay Terminal
          </button>
        </div>
      </div>
    </div>
  );
};

export default PineLabsIntegration;
