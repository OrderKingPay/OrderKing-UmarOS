// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { calculateRevenue } from '../../../lib/orderking/revenue-calculator';
import { checkRBAC } from '../../../lib/orderking/auth'; 

export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const authHeader = request.headers.get('authorization');
    const hasPermission = await checkRBAC(authHeader, 'admin:revenue');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const restaurantId = searchParams.get('restaurantId');

    const revenue = await calculateRevenue({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      restaurantId: restaurantId || undefined
    });

    return NextResponse.json(revenue);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
