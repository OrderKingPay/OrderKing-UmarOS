import test from "node:test";
import assert from "node:assert/strict";
import { quoteCrownPromotionalCredits, quoteEligibleFoodDiscount, microTaskEngine } from "./micro-tasks.ts";

const base = {
  verifiedSettled: true, settledCommissionPaise: 10000,
  providerFeePaise: 1000, taxPaise: 1000, refundReservePaise: 500,
  serviceCostPaise: 500, founderRetainedMinimumPaise: 5500,
};
test("unsettled cannot earn Crown promotional credits", () => {
 assert.equal(quoteCrownPromotionalCredits({...base,verifiedSettled:false}).maxPromotionalCreditPaise,0);
});
test("founder reserve is retained and credit capped", () => {
 const q=quoteCrownPromotionalCredits(base);
 assert.equal(q.maxPromotionalCreditPaise,1050);
 assert.equal(q.founderContributionAfterCreditPaise,5950);
});
test("loss-making commission creates no promotional entitlement",()=>{
 const q=quoteCrownPromotionalCredits({...base,refundReservePaise:10000});
 assert.equal(q.maxPromotionalCreditPaise,0);
});
test("high reserve prevents credit above retained contribution",()=>{
 const q=quoteCrownPromotionalCredits({...base,founderRetainedMinimumPaise:6800});
 assert.equal(q.maxPromotionalCreditPaise,200);
});
test("reject negative/invalid fee and out-of-range share",()=>{
 assert.throws(()=>quoteCrownPromotionalCredits({...base,taxPaise:-1}));
 assert.throws(()=>quoteCrownPromotionalCredits({...base,rewardShareBps:9999}));
});
test("discount cannot exceed verified credit, food order margin or subtotal",()=>{
 const x={
 eligibleOrder:true,verifiedPostedCreditPaise:2000,unredeemedCreditPaise:1200,
 payableFoodSubtotalPaise:4000,confirmedOrderContributionPaise:1400,
 founderRetainedMinimumPaise:1000,
 };
 assert.equal(quoteEligibleFoodDiscount(x),400);
 assert.equal(quoteEligibleFoodDiscount({...x,eligibleOrder:false}),0);
});
test("all local cash minting and UPI payouts fail closed",()=>{
 assert.equal(microTaskEngine.getWalletBalance("any").balancePaise,0);
 assert.deepEqual(microTaskEngine.getCustomerLedger("any"),[]);
 assert.equal(microTaskEngine.canClaimTask("any","SURVEY").allowed,false);
 assert.throws(()=>microTaskEngine.verifyTask(),/forbidden/);
 assert.throws(()=>microTaskEngine.payoutTask(),/disabled/);
});
