'use client';

import React, { useState } from 'react';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Simulate API call to KingPay backend
      const response = await fetch('/api/kingpay/create-session', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Checkout session created successfully');
        }
      } else {
         alert('Checkout initiated');
      }
    } catch (error) {
      console.error("Checkout failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md font-sans">
      <h1 className="text-2xl font-bold mb-4">Secure Checkout</h1>
      <p className="mb-6 text-gray-600">Complete your order securely via KingPay.</p>
      
      <button 
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}
