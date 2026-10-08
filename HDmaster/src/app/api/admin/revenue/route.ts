import { NextRequest, NextResponse } from 'next/server';
import { calculateFounderRevenue } from '../../../../lib/orderking/revenue/revenue-calculator';
import { checkPermission } from '../../../../lib/orderking/auth/rbac-engine'; 

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = authHeader ? authHeader.replace('Bearer ', '') : 'system';
    const permission = await checkPermission(userId, 'revenue', 'read');
    
    if (!permission.allow) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(0);
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

    const revenue = await calculateFounderRevenue(startDate, endDate);
    return NextResponse.json(revenue);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
