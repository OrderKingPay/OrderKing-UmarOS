export interface DecodeResult {
  vpa: string | null;
  amount: number | null;
}

/**
 * Extracts the target VPA (UPI ID) and amount from the scanned BharatQR code.
 * Assuming standard UPI URI format: upi://pay?pa=vpa@bank&pn=Name&am=100.00
 */
export function decodeScannedQR(qrString: string): DecodeResult {
  try {
    const url = new URL(qrString);
    if (url.protocol !== 'upi:') {
      throw new Error('Invalid QR code format. Expected UPI URI.');
    }
    const vpa = url.searchParams.get('pa');
    const amountStr = url.searchParams.get('am');
    const amount = amountStr ? parseFloat(amountStr) : null;
    return { vpa, amount };
  } catch (error) {
    console.error('Error decoding QR string:', error);
    return { vpa: null, amount: null };
  }
}

/**
 * Verifies the user has enough funds in their KingPay ecosystem wallet.
 * (Blueprint logic for database/wallet integration)
 */
export async function chargeUserWallet(userId: string, amount: number): Promise<boolean> {
  // TODO: Replace with actual DB calls (e.g., Prisma, Supabase)
  console.log(`Checking balance for user ${userId} for amount ${amount}...`);
  
  // Mock logic: assume balance is sufficient for this blueprint
  const mockUserBalance = 5000; 

  if (mockUserBalance >= amount) {
    console.log(`Deducting ${amount} from user ${userId}'s wallet...`);
    // TODO: Perform atomic transaction to deduct amount from user's wallet table
    return true;
  } else {
    console.error(`Insufficient funds for user ${userId}.`);
    return false;
  }
}

/**
 * The actual API blueprint to hit RazorpayX/Cashfree to send real money to the public bank.
 */
export async function executeRazorpayXPayout(targetVpa: string, amount: number): Promise<any> {
  // Ensure RazorpayX environment variables are set securely
  const RAZORPAYX_ACCOUNT_NUMBER = process.env.RAZORPAYX_ACCOUNT_NUMBER;
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials missing from environment variables.');
  }

  console.log(`Initiating payout of ${amount} to VPA: ${targetVpa}`);

  // Construct the RazorpayX Payout payload
  const payload = {
    account_number: RAZORPAYX_ACCOUNT_NUMBER,
    fund_account: {
      account_type: "vpa",
      vpa: {
        address: targetVpa
      },
      contact: {
        name: "OrderKing Beneficiary",
        type: "customer"
      }
    },
    amount: Math.round(amount * 100), // Amount in paise
    currency: "INR",
    mode: "UPI",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: `payout_${Date.now()}`,
    narration: "KingPay P2P Transfer"
  };

  try {
    const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`;
    
    const response = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('RazorpayX Payout failed:', errorData);
      throw new Error('Payout execution failed');
    }

    const data = await response.json();
    console.log('Payout successful:', data);
    return data;
  } catch (error) {
    console.error('Error executing RazorpayX Payout:', error);
    throw error;
  }
}
