import React from 'react';

import { searchRestaurants as discoverySearch } from '@/lib/orderking/discovery/full-text-search';

async function searchRestaurants(query: string) {
  if (!query) return [];
  const res = await discoverySearch(query);
  return res.map((r: any) => ({
    id: r.id,
    name: r.name,
    matchScore: r.rank ? r.rank.toFixed(2) : 0
  }));
}

export default async function RestaurantsPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';
  const results = await searchRestaurants(query);

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6">Restaurant Discovery</h1>
      
      <form className="mb-8" method="GET">
        <input 
          type="text" 
          name="q" 
          defaultValue={query} 
          placeholder="Search restaurants..." 
          className="border border-gray-300 p-3 rounded-l-md w-64 text-black"
        />
        <button type="submit" className="bg-blue-600 text-white p-3 rounded-r-md hover:bg-blue-700">Search</button>
      </form>

      {results.length > 0 ? (
        <ul className="space-y-4">
          {results.map((restaurant: any) => (
            <li key={restaurant.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h2 className="text-xl font-semibold text-gray-900">{restaurant.name}</h2>
              <p className="text-sm text-gray-500">Match Score: {restaurant.matchScore}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No restaurants found matching your query.</p>
      )}
    </div>
  );
}
