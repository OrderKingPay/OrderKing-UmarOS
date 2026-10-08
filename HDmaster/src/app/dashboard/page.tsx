import React from 'react';

import { getSql } from '@/lib/db';

async function getDashboardData() {
  const sql = await getSql();
  const revenueRes = await sql<{ total: number }>`SELECT SUM(total_paise) as total FROM orders`;
  const ordersRes = await sql<{ count: number }>`SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('DELIVERED', 'CANCELLED')`;
  const customersRes = await sql<{ count: number }>`SELECT COUNT(*) as count FROM customers`;
  
  const revenue = revenueRes[0]?.total ? `$${(revenueRes[0].total / 100).toLocaleString()}` : "$0";
  const activeOrders = ordersRes[0]?.count || 0;
  const totalCustomers = customersRes[0]?.count || 0;

  return {
    founderRevenue: revenue,
    activeOrders: activeOrders,
    totalCustomers: totalCustomers
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
          <h2 className="text-lg font-semibold text-gray-700">Total Customers</h2>
          <p className="text-4xl font-bold text-purple-600 mt-2">{data.totalCustomers}</p>
        </div>
      </div>
    </div>
  );
}
