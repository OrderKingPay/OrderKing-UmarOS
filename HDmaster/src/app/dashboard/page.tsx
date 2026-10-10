import React from 'react';

import { getSql } from '@/lib/db';
import { UmarOS_Supreme_AI } from '@/components/dashboard/UmarOS_Supreme_AI';

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
    <div className="p-8 font-sans space-y-6 bg-slate-50 min-h-screen text-slate-900">
      <UmarOS_Supreme_AI />
      <h1 className="text-3xl font-bold mb-6 text-slate-900">OrderKing Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Founder Revenue</h2>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {data.founderRevenue !== "$0" ? data.founderRevenue : "Awaiting Live Operations"}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Active Orders</h2>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {data.activeOrders > 0 ? data.activeOrders : "Awaiting Live Operations"}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Customers</h2>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {data.totalCustomers > 0 ? data.totalCustomers : "Awaiting Live Operations"}
          </p>
        </div>
      </div>
    </div>
  );
}
