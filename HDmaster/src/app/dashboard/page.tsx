import React from 'react';

// Assuming an internal API or direct SQL call is made here.
async function getDashboardData() {
  // Mocking the data fetch as the exact internal API isn't fully specified here.
  return {
    founderRevenue: "$10,500",
    activeOrders: 42,
    k8sCpu: "65%"
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6">OrderKing Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Founder Revenue</h2>
          <p className="text-4xl font-bold text-green-600 mt-2">{data.founderRevenue}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Active Orders</h2>
          <p className="text-4xl font-bold text-blue-600 mt-2">{data.activeOrders}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">K8s CPU Usage</h2>
          <p className="text-4xl font-bold text-purple-600 mt-2">{data.k8sCpu}</p>
        </div>
      </div>
    </div>
  );
}
