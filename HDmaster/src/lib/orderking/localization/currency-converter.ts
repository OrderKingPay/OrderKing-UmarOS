export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  
  const response = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`);
  if (!response.ok) {
    throw new Error('Failed to fetch currency conversion rates');
  }
  const data = await response.json();
  return data.rates[to] || amount;
}
