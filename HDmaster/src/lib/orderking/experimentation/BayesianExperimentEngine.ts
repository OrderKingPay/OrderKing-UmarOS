import * as crypto from 'crypto';

export interface VariantStats {
  id: string;
  visitors: number;
  conversions: number;
}

export interface Experiment {
  id: string;
  variants: VariantStats[];
  trafficAllocation: Record<string, number>; // variantId -> percentage (0-100)
  winner: string | null;
  confidenceThreshold: number;
}

export class BayesianExperimentEngine {
  private experiments: Map<string, Experiment> = new Map();

  constructor() {}

  /**
   * Initialize an experiment.
   * Example: createExperiment("checkout-ui", ["control", "variant"], { "control": 80, "variant": 20 })
   */
  public createExperiment(
    id: string, 
    variantIds: string[], 
    trafficAllocation: Record<string, number>, 
    confidenceThreshold = 0.95
  ) {
    const variants = variantIds.map(vId => ({ id: vId, visitors: 0, conversions: 0 }));
    this.experiments.set(id, {
      id,
      variants,
      trafficAllocation,
      winner: null,
      confidenceThreshold
    });
  }

  /**
   * Deterministically route a user to a variant based on traffic allocation.
   */
  public getVariant(experimentId: string, userId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    if (experiment.winner) {
      return experiment.winner;
    }

    // Deterministic hashing for consistent user routing
    const hash = crypto.createHash('sha256').update(`${experimentId}-${userId}`).digest('hex');
    const hashNum = parseInt(hash.substring(0, 8), 16);
    const rand = (hashNum / 0xffffffff) * 100;

    let cumulative = 0;
    for (const [variantId, alloc] of Object.entries(experiment.trafficAllocation)) {
      cumulative += alloc;
      if (rand <= cumulative) {
        return variantId;
      }
    }

    return experiment.variants[0].id;
  }

  public trackVisitor(experimentId: string, variantId: string) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    const variant = experiment.variants.find(v => v.id === variantId);
    if (variant) {
      variant.visitors++;
      this.evaluateExperiment(experimentId);
    }
  }

  public trackConversion(experimentId: string, variantId: string) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    const variant = experiment.variants.find(v => v.id === variantId);
    if (variant) {
      variant.conversions++;
      this.evaluateExperiment(experimentId);
    }
  }

  private evaluateExperiment(experimentId: string) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.winner || experiment.variants.length < 2) return;

    const [varA, varB] = experiment.variants;

    // Minimum sample size to prevent premature early stopping
    if (varA.visitors < 100 || varB.visitors < 100) return;

    const probBBeatsA = this.calculateProbabilityBBeatsA(
      varA.conversions, varA.visitors - varA.conversions,
      varB.conversions, varB.visitors - varB.conversions
    );

    // If Variant B wins
    if (probBBeatsA >= experiment.confidenceThreshold) {
      experiment.winner = varB.id;
      experiment.trafficAllocation = { [varA.id]: 0, [varB.id]: 100 };
    } 
    // If Variant A wins (Variant B loses)
    else if (probBBeatsA <= 1 - experiment.confidenceThreshold) {
      experiment.winner = varA.id;
      experiment.trafficAllocation = { [varA.id]: 100, [varB.id]: 0 };
    }
  }

  /**
   * Calculates the probability that variant B is better than variant A
   * using a Monte Carlo simulation of Beta distributions.
   */
  private calculateProbabilityBBeatsA(
    conversionsA: number, failuresA: number, 
    conversionsB: number, failuresB: number, 
    simulations = 10000
  ): number {
    let bWins = 0;
    
    // Add prior (Beta(1,1) represents a uniform prior)
    const alphaA = conversionsA + 1;
    const betaA = failuresA + 1;
    const alphaB = conversionsB + 1;
    const betaB = failuresB + 1;

    for (let i = 0; i < simulations; i++) {
      const sampleA = this.sampleBeta(alphaA, betaA);
      const sampleB = this.sampleBeta(alphaB, betaB);
      if (sampleB > sampleA) {
        bWins++;
      }
    }

    return bWins / simulations;
  }

  // Box-Muller transform for Gamma distribution approximation
  private sampleGamma(alpha: number): number {
    if (alpha < 1) {
      return this.sampleGamma(1 + alpha) * Math.pow(Math.random(), 1 / alpha);
    }
    const d = alpha - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x = 0, v = 0;
      do {
        x = this.randomNormal();
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v;
      }
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  private randomNormal(): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  private sampleBeta(alpha: number, beta: number): number {
    const x = this.sampleGamma(alpha);
    const y = this.sampleGamma(beta);
    return x / (x + y);
  }
  
  public getExperimentData(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }
}

// Export a singleton instance for use across the application
export const experimentEngine = new BayesianExperimentEngine();
