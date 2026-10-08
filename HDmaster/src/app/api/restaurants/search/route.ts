import { NextRequest, NextResponse } from 'next/server';
import { searchRestaurants } from '../../../../lib/orderking/discovery/full-text-search';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const numLat = lat ? parseFloat(lat) : undefined;
  const numLng = lng ? parseFloat(lng) : undefined;

  try {
    const results = await searchRestaurants(q, numLat, numLng);
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
