export interface PaymentPayload {
  amount: number;
  currency: string;
  qrData: string;
  merchantId: string;
  provider: 'SETU' | 'RAZORPAY';
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * NPCI Core Routing Switch
 * Securely routes incoming QR payloads to the Setu API gateway or Razorpay API.
 */
export class NPCICoreSwitch {
  private setuApiKey: string | undefined;
  private razorpayApiKey: string | undefined;

  constructor(setuKey?: string, razorpayKey?: string) {
    // Keys will be injected when legal constraints are lifted and production keys are available
    this.setuApiKey = setuKey || process.env.SETU_API_KEY;
    this.razorpayApiKey = razorpayKey || process.env.RAZORPAY_API_KEY;
  }

  /**
   * Routes the payment to the appropriate gateway provider.
   */
  public async routePayment(payload: PaymentPayload): Promise<PaymentResponse> {
    console.log(`[NPCI Core Switch] Routing payment of ${payload.amount} to ${payload.provider}`);

    try {
      if (payload.provider === 'SETU') {
        return await this.routeToSetu(payload);
      } else if (payload.provider === 'RAZORPAY') {
        return await this.routeToRazorpay(payload);
      } else {
        throw new Error(`Unsupported provider: ${payload.provider}`);
      }
    } catch (error: any) {
      console.error(`[NPCI Core Switch] Routing failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  private async routeToSetu(payload: PaymentPayload): Promise<PaymentResponse> {
    if (!this.setuApiKey) {
      throw new Error('Setu API keys not configured. Waiting for production keys.');
    }
    
    // Provider-side authorization, request, response and settlement verification
    // are not implemented in this adapter. Never manufacture success.
    throw new Error('Setu QR processing is not connected to a verified provider.');
  }

  private async routeToRazorpay(payload: PaymentPayload): Promise<PaymentResponse> {
    if (!this.razorpayApiKey) {
      throw new Error('Razorpay API keys not configured. Waiting for production keys.');
    }

    // A configured API key is not proof of an authorized QR order, captured
    // payment or reconciled settlement. Fail closed until that flow exists.
    throw new Error('Razorpay QR processing is not connected to a verified provider.');
  }
}
