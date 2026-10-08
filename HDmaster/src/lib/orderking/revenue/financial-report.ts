import { getSql } from '../../db';
import { calculateFounderRevenue } from './revenue-calculator';

export interface FinancialReport {
    period: string;
    grossRevenue: number;
    cogs: number;
    operatingExpenses: number;
    netIncome: number;
}

export async function generateMonthlyReport(year: number, month: number): Promise<FinancialReport> {
    const sql = await getSql();
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    
    const revenueBreakdown = await calculateFounderRevenue(startDate, endDate);
    const grossRevenue = revenueBreakdown.totalRevenue;
    
    const [payoutRes] = await sql`
        SELECT COALESCE(SUM(amount_paise), 0) AS total_payouts
        FROM payouts
        WHERE created_at >= ${startDate} AND created_at < ${endDate}
    `;
    
    const [expenseRes] = await sql`
        SELECT COALESCE(SUM(amount_paise), 0) AS total_expenses
        FROM expenses
        WHERE created_at >= ${startDate} AND created_at < ${endDate}
    `;
    
    const cogs = Math.floor(Number(payoutRes?.total_payouts || 0));
    const operatingExpenses = Math.floor(Number(expenseRes?.total_expenses || 0));
    const netIncome = grossRevenue - cogs - operatingExpenses;
    
    return {
        period: `${year}-${month.toString().padStart(2, '0')}`,
        grossRevenue,
        cogs,
        operatingExpenses,
        netIncome
    };
}
