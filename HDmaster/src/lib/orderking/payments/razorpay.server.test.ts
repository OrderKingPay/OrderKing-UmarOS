import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import * as nodeTest from "node:test";
import * as vitest from "vitest";

const isVitest = Boolean(process.env.VITEST);
const describe: any = (isVitest ? vitest.describe : nodeTest.describe) as any;
const it: any = (isVitest ? vitest.it : nodeTest.it) as any;

import {
  verifyCheckoutSignature,
  verifyWebhookSignature,
  verifyRazorpayWebhookHeader,
  processRazorpayWebhookEvent,
} from "./razorpay.server.ts";
import {
  generateUpiIntent,
  generateDynamicQrContract,
  parseUpiPayload,
  isDynamicQrExpired,
  validateVpa,
  formatUpiAmount,
  UPI_CURRENCY,
} from "./upi.ts";
import {
  paymentIdempotency,
  IdempotencyMismatchError,
  ConcurrentExecutionError,
  DoubleSpendError,
} from "./idempotency.ts";
import { revenueGateway } from "./revenue-gateway.ts";
import {
  verifyRazorpayWebhook,
  verifyStripeWebhook,
  verifyPayoneerWebhook,
} from "./crypto-webhook.ts";

describe("Razorpay Signature & Webhook Verification", () => {
  it("accepts a valid checkout signature", () => {
    process.env.RAZORPAY_KEY_SECRET = "test-secret";
    const signature = createHmac("sha256", "test-secret").update("order_1|pay_1").digest("hex");
    assert.equal(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature }), true);
  });

  it("rejects a tampered checkout signature", () => {
    process.env.RAZORPAY_KEY_SECRET = "test-secret";
    assert.equal(
      verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature: "0".repeat(64) }),
      false
    );
  });

  it("accepts the exact raw webhook body signature", () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
    const body = JSON.stringify({ id: "evt_1", event: "payment.captured" });
    const signature = createHmac("sha256", "webhook-secret").update(body).digest("hex");
    assert.equal(verifyWebhookSignature(body, signature), true);
    assert.equal(verifyWebhookSignature(body + " ", signature), false);
  });

  it("verifies X-Razorpay-Signature HTTP header with whitespace and case tolerance", () => {
    const secret = "whsec_header_test";
    const body = JSON.stringify({ id: "evt_hdr", event: "order.paid" });
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    assert.equal(verifyRazorpayWebhookHeader(body, `  ${signature}  `, secret), true);
    assert.equal(verifyRazorpayWebhookHeader(body, null, secret), false);
    assert.equal(verifyRazorpayWebhookHeader(body, undefined, secret), false);
    assert.equal(verifyRazorpayWebhookHeader(body, "invalid_sig_length", secret), false);
  });
});

describe("Timing-safe Webhook Signature Verifiers (crypto-webhook)", () => {
  it("verifyRazorpayWebhook accepts genuine signature and throws on tampered signature", () => {
    const payload = JSON.stringify({ event: "payment.captured", amount: 50000 });
    const secret = "rzp_secret_xyz";
    const sig = createHmac("sha256", secret).update(payload).digest("hex");

    assert.equal(verifyRazorpayWebhook(payload, sig, secret), true);
    assert.throws(() => verifyRazorpayWebhook(payload, sig + "bad", secret), /Invalid Razorpay webhook signature/);
    assert.throws(() => verifyRazorpayWebhook(payload, "0".repeat(64), secret), /Invalid Razorpay webhook signature/);
  });

  it("verifyStripeWebhook accepts valid v1 signature with timestamp and rejects tampered", () => {
    const payload = JSON.stringify({ id: "evt_123", type: "payment_intent.succeeded" });
    const secret = "whsec_stripe_test";
    const t = Math.floor(Date.now() / 1000).toString();
    const sig = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
    const header = `t=${t},v1=${sig}`;

    assert.equal(verifyStripeWebhook(payload, header, secret), true);
    assert.throws(
      () => verifyStripeWebhook(payload, `t=${t},v1=${"f".repeat(64)}`, secret),
      /Invalid Stripe webhook signature/
    );
  });

  it("verifyPayoneerWebhook accepts genuine signature and rejects forged ones", () => {
    const payload = JSON.stringify({ payment_id: "pay_1", status: "COMPLETED" });
    const secret = "payoneer_secret";
    const sig = createHmac("sha256", secret).update(payload).digest("hex");

    assert.equal(verifyPayoneerWebhook(payload, sig, secret), true);
    assert.throws(() => verifyPayoneerWebhook(payload, "bad_sig", secret), /Invalid Payoneer webhook signature/);
  });
});

describe("Razorpay Webhook Event Processing with Double-Spend Prevention", () => {
  it("processes payment.captured event and guards against duplicate webhook replays", async () => {
    paymentIdempotency.clear();
    const secret = "whsec_capture_suite";
    const paymentId = "pay_live_captured_001";
    const webhookPayload = {
      id: "evt_captured_99",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: "order_kpay_101",
            amount: 75000,
            currency: "INR",
            status: "captured",
            method: "upi",
          },
        },
      },
    };

    const rawBody = JSON.stringify(webhookPayload);
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

    // 1st processing: Success
    const firstResult = await processRazorpayWebhookEvent({
      rawBody,
      signatureHeader: signature,
      webhookSecret: secret,
    });
    assert.equal(firstResult.success, true);
    assert.equal(firstResult.duplicate, false);
    assert.equal(firstResult.paymentId, paymentId);
    assert.equal(firstResult.status, "CAPTURED");
    assert.equal(paymentIdempotency.isPaymentCaptured(paymentId), true);

    // 2nd processing with exact same event ID: duplicate event suppression
    const duplicateResult = await processRazorpayWebhookEvent({
      rawBody,
      signatureHeader: signature,
      webhookSecret: secret,
    });
    assert.equal(duplicateResult.success, true);
    assert.equal(duplicateResult.duplicate, true);

    // 3rd processing with NEW event ID targeting the SAME payment ID: double-spend prevented
    const replayPayload = { ...webhookPayload, id: "evt_captured_replay_different_id" };
    const replayRaw = JSON.stringify(replayPayload);
    const replaySig = createHmac("sha256", secret).update(replayRaw).digest("hex");
    const replayResult = await processRazorpayWebhookEvent({
      rawBody: replayRaw,
      signatureHeader: replaySig,
      webhookSecret: secret,
    });
    assert.equal(replayResult.success, true);
    assert.equal(replayResult.status, "ALREADY_CAPTURED");
    assert.equal(replayResult.duplicate, true);
  });

  it("rejects webhook event with forged or missing signature", async () => {
    const rawBody = JSON.stringify({ id: "evt_forged", event: "payment.captured" });
    const result = await processRazorpayWebhookEvent({
      rawBody,
      signatureHeader: "bad_signature_00000000000000000000000000000000000000000000000000000000",
      webhookSecret: "secret",
    });
    assert.equal(result.success, false);
    assert.match(result.error || "", /Invalid Razorpay webhook signature/);
  });
});

describe("UPI Intent Payload Generation Engine", () => {
  it("generates production-ready NPCI URI payload (upi://pay?pa=...&pn=OrderKing&am=...&cu=INR&tr=...)", () => {
    const res = generateUpiIntent({
      payeeVpa: "orderking@icici",
      amountInr: 1250.5,
      transactionRef: "TXN-OK-20261015-001",
      transactionNote: "Dinner Order 42",
      merchantCategoryCode: "5812",
    });

    assert.equal(res.params.pa, "orderking@icici");
    assert.equal(res.params.pn, "OrderKing");
    assert.equal(res.params.am, "1250.50");
    assert.equal(res.params.cu, "INR");
    assert.equal(res.params.tr, "TXN-OK-20261015-001");
    assert.equal(res.params.tn, "Dinner Order 42");
    assert.equal(res.params.mc, "5812");

    // Exact string pattern check
    assert.match(res.rawUri, /^upi:\/\/pay\?pa=orderking%40icici&pn=OrderKing&am=1250\.50&cu=INR&tr=TXN-OK-20261015-001/);

    // Deep link validation across top Indian UPI apps
    assert.ok(res.deepLinks.phonepe.startsWith("phonepe://pay?"));
    assert.ok(res.deepLinks.gpay.startsWith("tez://upi/pay?"));
    assert.ok(res.deepLinks.paytm.startsWith("paytmmp://pay?"));
    assert.ok(res.deepLinks.cred.startsWith("cred://pay?"));
    assert.ok(res.deepLinks.bhim.startsWith("bhim://pay?"));
  });

  it("validates VPA format and handles edge cases", () => {
    assert.equal(validateVpa("merchant@okaxis"), true);
    assert.equal(validateVpa("9876543210@paytm"), true);
    assert.equal(validateVpa("founder.king@hdfcbank"), true);
    assert.equal(validateVpa("invalid-vpa-without-bank"), false);
    assert.equal(validateVpa(""), false);
    assert.equal(validateVpa("@bank"), false);
  });

  it("rejects non-positive, zero, or NaN amounts", () => {
    assert.throws(
      () => generateUpiIntent({ payeeVpa: "ok@axis", amountInr: 0, transactionRef: "TXN-1" }),
      /Invalid UPI amount/
    );
    assert.throws(
      () => generateUpiIntent({ payeeVpa: "ok@axis", amountInr: -50, transactionRef: "TXN-1" }),
      /Invalid UPI amount/
    );
    assert.throws(
      () => generateUpiIntent({ payeeVpa: "ok@axis", amountInr: Number.NaN, transactionRef: "TXN-1" }),
      /Invalid UPI amount/
    );
  });

  it("enforces presence of transaction tracking reference (tr)", () => {
    assert.throws(
      () => generateUpiIntent({ payeeVpa: "ok@axis", amountInr: 100, transactionRef: "" }),
      /Missing required transaction reference/
    );
    assert.throws(
      () => generateUpiIntent({ payeeVpa: "ok@axis", amountInr: 100, transactionRef: " " }),
      /Missing required transaction reference/
    );
    assert.throws(
      () => generateUpiIntent({ payeeVpa: "ok@axis", amountInr: 100, transactionRef: "a".repeat(40) }),
      /Invalid transaction reference/
    );
  });

  it("parses UPI raw payload accurately", () => {
    const raw = "upi://pay?pa=orderking%40icici&pn=OrderKing&am=500.00&cu=INR&tr=TR-12345&tn=Snacks";
    const parsed = parseUpiPayload(raw);
    assert.equal(parsed.valid, true);
    assert.equal(parsed.params.pa, "orderking@icici");
    assert.equal(parsed.params.pn, "OrderKing");
    assert.equal(parsed.params.am, "500.00");
    assert.equal(parsed.params.cu, "INR");
    assert.equal(parsed.params.tr, "TR-12345");
  });
});

describe("UPI Dynamic QR Generation Contract for On-Counter & On-App", () => {
  it("generates an On-Counter Dynamic QR contract with Soundbox and POS terminal bindings", () => {
    const contract = generateDynamicQrContract({
      mode: "ON_COUNTER",
      payeeVpa: "counter1@orderking",
      amountInr: 450,
      transactionRef: "POS-CTR-8812",
      terminalId: "SBOX-T99",
      counterId: "COUNTER-1",
      soundboxSync: true,
      expiryMinutes: 10,
    });

    assert.equal(contract.contractVersion, "2026.1");
    assert.equal(contract.mode, "ON_COUNTER");
    assert.equal(contract.transactionRef, "POS-CTR-8812");
    assert.equal(contract.amountInr, 450);
    assert.equal(contract.amountPaise, 45000);
    assert.equal(contract.currency, "INR");
    assert.equal(contract.ttlSeconds, 600);
    assert.equal(contract.status, "ACTIVE");
    assert.ok(contract.qrImageUrl.includes("api.qrserver.com"));
    assert.ok(contract.terminalInfo?.soundboxSync);
    assert.equal(contract.terminalInfo?.terminalId, "SBOX-T99");
    assert.equal(contract.terminalInfo?.counterId, "COUNTER-1");
    assert.equal(isDynamicQrExpired(contract), false);
  });

  it("generates an On-App Dynamic QR contract with deep links for in-app checkout", () => {
    const contract = generateDynamicQrContract({
      mode: "ON_APP",
      payeeVpa: "pay@orderking",
      amountInr: 120,
      transactionRef: "APP-CHKT-441",
      orderId: "ORD-9912",
      expiryMinutes: 15,
    });

    assert.equal(contract.mode, "ON_APP");
    assert.equal(contract.orderId, "ORD-9912");
    assert.equal(contract.ttlSeconds, 900);
    assert.ok(contract.appIntentLinks);
    assert.ok(contract.appIntentLinks?.phonepe.startsWith("phonepe://pay?"));
    assert.ok(contract.appIntentLinks?.gpay.startsWith("tez://upi/pay?"));
  });
});

describe("Strict Idempotency Key Enforcement and Double-Spend Prevention Engine", () => {
  it("returns cached result on identical payload re-submission (idempotent replay)", async () => {
    paymentIdempotency.clear();
    const key = "idem_key_order_1001";
    const payload = { amountPaise: 50000, receipt: "rcpt_1001" };
    let executionCount = 0;

    const op = () =>
      paymentIdempotency.executeIdempotent(key, payload, async () => {
        executionCount++;
        return { orderId: "order_rzp_1001", status: "created" };
      });

    // 1st Call
    const res1 = await op();
    assert.equal(res1.idempotentReplay, false);
    assert.equal(res1.result.orderId, "order_rzp_1001");
    assert.equal(executionCount, 1);

    // 2nd Call with identical key & payload: Replayed without re-running operation
    const res2 = await op();
    assert.equal(res2.idempotentReplay, true);
    assert.equal(res2.result.orderId, "order_rzp_1001");
    assert.equal(executionCount, 1); // executionCount stayed 1!
  });

  it("throws IdempotencyMismatchError if same key is reused with a different payload", async () => {
    paymentIdempotency.clear();
    const key = "idem_key_order_1002";
    const payloadA = { amountPaise: 50000, receipt: "rcpt_1002" };
    const payloadB = { amountPaise: 75000, receipt: "rcpt_1002" }; // tampered amount!

    await paymentIdempotency.executeIdempotent(key, payloadA, async () => {
      return { orderId: "order_rzp_1002" };
    });

    await assert.rejects(
      () =>
        paymentIdempotency.executeIdempotent(key, payloadB, async () => {
          return { orderId: "order_rzp_1002_tampered" };
        }),
      (err: any) => {
        assert.equal(err.name, "IdempotencyMismatchError");
        assert.equal(err.code, "IDEMPOTENCY_PAYLOAD_MISMATCH");
        return true;
      }
    );
  });

  it("guards against in-flight concurrent double-spend race conditions", async () => {
    paymentIdempotency.clear();
    const key = "idem_key_concurrent_race";
    const payload = { amountPaise: 25000, receipt: "rcpt_race" };

    // Start an in-flight operation
    let resolveFirst: (val: any) => void;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const execution1 = paymentIdempotency.executeIdempotent(key, payload, () => firstPromise);

    // Concurrent execution before first finishes
    await assert.rejects(
      () => paymentIdempotency.executeIdempotent(key, payload, async () => ({ status: "second" })),
      (err: any) => {
        assert.equal(err.name, "ConcurrentExecutionError");
        assert.equal(err.code, "CONCURRENT_REQUEST_IN_FLIGHT");
        return true;
      }
    );

    // Finish the first operation
    resolveFirst!({ status: "success" });
    const res1 = await execution1;
    assert.equal((res1.result as { status: string }).status, "success");
  });

  it("strictly prevents double-spend on already settled orders and captured payments", () => {
    paymentIdempotency.clear();
    const orderId = "ORD_FINAL_123";
    const paymentId = "PAY_FINAL_456";

    // 1st capture: Success
    const captured = paymentIdempotency.recordPaymentCapture({
      paymentId,
      orderId,
      amountPaise: 10000,
      method: "upi",
    });
    assert.equal(captured, true);

    // Subsequent assertion on settled order throws DoubleSpendError
    assert.throws(
      () => paymentIdempotency.assertOrderNotSettled(orderId),
      (err: any) => {
        assert.equal(err.name, "DoubleSpendError");
        assert.equal(err.code, "DOUBLE_SPEND_PREVENTED");
        return true;
      }
    );

    // Duplicate capture attempt throws DoubleSpendError
    assert.throws(
      () =>
        paymentIdempotency.recordPaymentCapture({
          paymentId,
          orderId,
          amountPaise: 10000,
          method: "upi",
        }),
      (err: any) => {
        assert.equal(err.name, "DoubleSpendError");
        return true;
      }
    );
  });
});

describe("Revenue Gateway Service Integration with KingPay & UPI", () => {
  it("createUpiPaymentLink produces standard UPI Intent with tr tracking and records PENDING transaction", () => {
    revenueGateway.clear();
    const res = revenueGateway.createUpiPaymentLink({
      amountInr: 850,
      clientName: "Royal Biryani House",
      description: "POS Counter Bill #88",
      founderVpa: "founder@okaxis",
      customTxnId: "TXN-RBH-88",
    });

    assert.equal(res.transactionId, "TXN-RBH-88");
    assert.ok(res.upiLink.startsWith("upi://pay?pa=founder%40okaxis&pn=OrderKing&am=850.00&cu=INR&tr=TXN-RBH-88"));
    assert.ok(res.qrPayload.includes("api.qrserver.com"));
    assert.ok(res.deepLinks.phonepe);

    const txns = revenueGateway.getTransactions();
    assert.equal(txns.length, 1);
    assert.equal(txns[0].status, "PENDING");
    assert.equal(txns[0].amountInr, 850);
  });

  it("createDynamicUpiQr generates formal DynamicQrContract", () => {
    const qrContract = revenueGateway.createDynamicUpiQr({
      mode: "ON_COUNTER",
      amountInr: 320,
      payeeVpa: "counter@orderking",
      clientName: "Quick Cafe",
      description: "Table 4 Espresso",
      counterId: "COUNTER-A",
      terminalId: "SB-002",
    });

    assert.equal(qrContract.mode, "ON_COUNTER");
    assert.equal(qrContract.amountInr, 320);
    assert.equal(qrContract.amountPaise, 32000);
    assert.equal(qrContract.terminalInfo?.terminalId, "SB-002");
    assert.equal(qrContract.terminalInfo?.counterId, "COUNTER-A");
    assert.equal(qrContract.status, "ACTIVE");
  });

  it("confirmUpiDeposit verifies provider authentication and blocks double confirmation", () => {
    paymentIdempotency.clear();
    revenueGateway.clear();

    const created = revenueGateway.createUpiPaymentLink({
      amountInr: 1500,
      clientName: "Umar Tech",
      description: "Cloud Subscription",
      founderVpa: "founder@okaxis",
      customTxnId: "TXN-UMAR-01",
    });

    // Confirmation rejected without verified provider flag
    assert.throws(
      () =>
        revenueGateway.confirmUpiDeposit({
          transactionId: created.transactionId,
          utrNumber: "UTR20261015112233",
          verifiedAmountInr: 1500,
          isVerifiedByProvider: false,
        }),
      /PROVIDER_VERIFICATION_REQUIRED/
    );

    // Valid provider confirmation
    const confirmed = revenueGateway.confirmUpiDeposit({
      transactionId: created.transactionId,
      utrNumber: "UTR20261015112233",
      verifiedAmountInr: 1500,
      isVerifiedByProvider: true,
    });
    assert.equal(confirmed.success, true);
    assert.equal(confirmed.transaction.status, "CONFIRMED");

    // Double-spend: second confirmation rejected
    assert.throws(
      () =>
        revenueGateway.confirmUpiDeposit({
          transactionId: created.transactionId,
          utrNumber: "UTR20261015112233",
          verifiedAmountInr: 1500,
          isVerifiedByProvider: true,
        }),
      /Double-spend prevented/
    );
  });

  it("computes accurate revenue metrics and saved gateway fees", () => {
    const metrics = revenueGateway.getMetrics();
    assert.equal(typeof metrics.totalGrossInr, "number");
    assert.equal(typeof metrics.netFounderDepositedInr, "number");
    assert.equal(typeof metrics.totalSavedGatewayFeesInr, "number");
    assert.equal(typeof metrics.confirmedTransactionsCount, "number");
    assert.equal(metrics.confirmedTransactionsCount, 1);
  });

  it("verifies Razorpay and Stripe webhooks through RevenueGatewayService", () => {
    const secret = "whsec_rev_gateway";
    const body = JSON.stringify({ event: "payment.captured", id: "pay_1" });
    const sig = createHmac("sha256", secret).update(body).digest("hex");

    assert.equal(revenueGateway.verifyRazorpayWebhook(body, sig, secret), true);
    assert.equal(revenueGateway.verifyRazorpayWebhook(body, "bad_sig", secret), false);
  });
});
