import { createRazorpayOrder } from "./payments/razorpay.server";

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
    this.setuApiKey = setuKey || process.env.SETU_API_KEY;
    this.razorpayApiKey = razorpayKey || process.env.RAZORPAY_API_KEY || process.env.RAZORPAY_KEY_ID;
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
    
    const setuUrl = process.env.SETU_API_URL || "https://pine.setu.co/api/v1/payment-requests";
    const res = await fetch(setuUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Setu-Product-Instance-ID": process.env.SETU_PRODUCT_INSTANCE_ID || "",
        Authorization: `Bearer ${this.setuApiKey}`,
      },
      body: JSON.stringify({
        amount: {
          currencyCode: payload.currency || "INR",
          value: Math.round(payload.amount * 100),
        },
        merchantId: payload.merchantId,
        additionalInfo: { qrData: payload.qrData },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Setu API HTTP ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = (await res.json()) as { id?: string; data?: { id?: string } };
    const txnId = data.id || data.data?.id;
    if (!txnId) {
      throw new Error("Setu API response did not contain a valid transaction id");
    }

    return {
      success: true,
      transactionId: txnId,
    };
  }

  private async routeToRazorpay(payload: PaymentPayload): Promise<PaymentResponse> {
    const keyId = this.razorpayApiKey || process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      throw new Error('Razorpay API keys not configured. Waiting for production keys.');
    }

    const amountPaise = Math.round(payload.amount * 100);
    const receipt = `rcpt_${payload.merchantId.slice(0, 8)}_${Date.now()}`;
    const order = await createRazorpayOrder({
      amountPaise,
      receipt,
      notes: {
        merchantId: payload.merchantId,
        qrData: payload.qrData,
      },
    });

    return {
      success: true,
      transactionId: order.id,
    };
  }
}
