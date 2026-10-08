export interface EmployeeOrder {
  employeeId: string;
  items: OrderItem[];
  totalCost: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CorporateAllowance {
  dailyLimitPerEmployee: number;
  companyWalletBalance: number;
}

export interface SplitResult {
  employeeId: string;
  coveredByCompany: number;
  coveredByEmployee: number;
}

export interface TeamOrderBill {
  totalOrderCost: number;
  totalCompanyCost: number;
  totalEmployeeCost: number;
  companyWalletRemaining: number;
  employeeSplits: SplitResult[];
}

export class TeamOrderSplitter {
  
  /**
   * Generates a shared link for the team order.
   * @param companyId The ID of the enterprise company.
   * @param eventId A unique identifier for the lunch/event.
   * @returns A string representing the shared cart link.
   */
  public generateSharedCartLink(companyId: string, eventId: string): string {
    const baseUrl = process.env.ORDERKING_BASE_URL || 'https://app.orderking.com';
    return `${baseUrl}/corporate/cart/${companyId}/${eventId}`;
  }

  /**
   * Calculates the split for a team order between the corporate wallet and individual employees.
   * @param employeeOrders List of orders placed by individuals.
   * @param allowance The corporate allowance details.
   * @returns A detailed breakdown of the bill.
   */
  public splitTeamOrder(
    employeeOrders: EmployeeOrder[],
    allowance: CorporateAllowance
  ): TeamOrderBill {
    let totalOrderCost = 0;
    let totalCompanyCost = 0;
    let totalEmployeeCost = 0;
    const employeeSplits: SplitResult[] = [];
    
    let currentWalletBalance = allowance.companyWalletBalance;

    for (const order of employeeOrders) {
      totalOrderCost += order.totalCost;

      // Calculate how much the company will cover for this employee
      // It covers up to the daily limit, or whatever is left in the wallet, whichever is smaller
      const potentialCompanyCover = Math.min(order.totalCost, allowance.dailyLimitPerEmployee);
      const actualCompanyCover = Math.min(potentialCompanyCover, currentWalletBalance);

      const employeeCover = order.totalCost - actualCompanyCover;

      currentWalletBalance -= actualCompanyCover;
      totalCompanyCost += actualCompanyCover;
      totalEmployeeCost += employeeCover;

      employeeSplits.push({
        employeeId: order.employeeId,
        coveredByCompany: actualCompanyCover,
        coveredByEmployee: employeeCover
      });
    }

    return {
      totalOrderCost,
      totalCompanyCost,
      totalEmployeeCost,
      companyWalletRemaining: currentWalletBalance,
      employeeSplits
    };
  }
}
