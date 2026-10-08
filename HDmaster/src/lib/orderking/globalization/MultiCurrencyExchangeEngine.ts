export type CurrencyCode = 'INR' | 'USD' | 'AED' | 'EUR';

export interface ExchangeRates {
    [key: string]: number;
}

export class MultiCurrencyExchangeEngine {
    private baseCurrency: CurrencyCode = 'INR';
    private rates: ExchangeRates = {
        INR: 1.0,
        USD: 0.012,
        AED: 0.044,
        EUR: 0.011,
    };

    constructor(initialRates?: ExchangeRates, baseCurrency: CurrencyCode = 'INR') {
        if (initialRates) {
            this.rates = { ...this.rates, ...initialRates };
        }
        this.baseCurrency = baseCurrency;
    }

    /**
     * Update exchange rates dynamically.
     */
    public updateRates(newRates: ExchangeRates): void {
        this.rates = { ...this.rates, ...newRates };
    }

    /**
     * Converts an amount from the base currency to the target currency.
     */
    public convert(amount: number, targetCurrency: CurrencyCode): number {
        if (!this.rates[targetCurrency]) {
            throw new Error(`Exchange rate for ${targetCurrency} not available.`);
        }
        if (this.baseCurrency === targetCurrency) {
            return amount;
        }
        const converted = amount * this.rates[targetCurrency];
        return Number(converted.toFixed(2));
    }
    
    /**
     * Converts an amount between any two supported currencies using the base currency as an intermediary.
     */
    public convertFromTo(amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
        if (!this.rates[fromCurrency] || !this.rates[toCurrency]) {
             throw new Error(`Exchange rate not available for conversion.`);
        }
        if (fromCurrency === toCurrency) {
            return amount;
        }
        const inBase = amount / this.rates[fromCurrency];
        return this.convert(inBase, toCurrency);
    }
}
