export interface TaxBreakdown {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
}

export function calculateGST(amountPaise: number, category: string, isInterstate: boolean = false): TaxBreakdown {
    let rate = 0;
    switch (category.toLowerCase()) {
        case 'food_delivery':
            rate = 0.05;
            break;
        case 'platform_fees':
            rate = 0.18;
            break;
        case 'subscription':
            rate = 0.12;
            break;
        default:
            rate = 0.18;
    }
    
    const totalTax = Math.floor(amountPaise * rate);
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    
    if (isInterstate) {
        igst = totalTax;
    } else {
        cgst = Math.floor(totalTax / 2);
        sgst = totalTax - cgst;
    }
    
    return {
        cgst,
        sgst,
        igst,
        totalTax
    };
}
