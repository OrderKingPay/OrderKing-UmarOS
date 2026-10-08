import { getSql } from '../../db';

export interface DailyForecast {
    date: Date;
    projectedRevenuePaise: number;
}

export async function forecastRevenue(daysAhead: number): Promise<DailyForecast[]> {
    const sql = await getSql();
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const dailyRevenue = await sql`
        SELECT DATE(created_at) as day, COALESCE(SUM(total_amount_paise * 0.22), 0) as revenue
        FROM orders
        WHERE created_at >= ${thirtyDaysAgo} AND created_at < ${today} AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY day ASC
    `;
    
    if (dailyRevenue.length < 2) {
        return [];
    }
    
    // Linear regression: y = mx + b
    const n = dailyRevenue.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    const dataPoints = dailyRevenue.map((row: any, index: number) => {
        return { x: index, y: Number(row.revenue) };
    });
    
    for (const point of dataPoints) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const forecasts: DailyForecast[] = [];
    for (let i = 1; i <= daysAhead; i++) {
        const futureX = n - 1 + i;
        let projected = slope * futureX + intercept;
        if (projected < 0) projected = 0;
        
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);
        
        forecasts.push({
            date: forecastDate,
            projectedRevenuePaise: Math.floor(projected)
        });
    }
    
    return forecasts;
}
