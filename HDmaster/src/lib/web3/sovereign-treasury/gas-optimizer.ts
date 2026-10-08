import { Provider } from 'ethers';

export interface GasOptimizationResult {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
}

export class GasOptimizer {
    private provider: Provider;

    constructor(provider: Provider) {
        this.provider = provider;
    }

    public async getOptimalGasFees(): Promise<GasOptimizationResult> {
        const feeData = await this.provider.getFeeData();
        
        // Ethers v6 fee data resolution
        let baseFee = 0n;
        if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
            baseFee = feeData.maxFeePerGas - feeData.maxPriorityFeePerGas;
        }

        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 1500000000n; // fallback to 1.5 gwei
        
        // Optimization: 10% premium on base fee for faster transaction inclusion
        const optimizedBaseFee = (baseFee * 110n) / 100n;
        const maxFeePerGas = optimizedBaseFee + maxPriorityFeePerGas;

        return {
            maxFeePerGas,
            maxPriorityFeePerGas
        };
    }
}
