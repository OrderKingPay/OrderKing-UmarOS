# Section 12 — real pilot → launch gate

`PUBLIC_LAUNCH=OFF` by default. The only permitted progression is OFF → CONTROLLED_PILOT → ON after evidence.

## S12-01 Pilot geography
Select a compact service cell using demand, restaurant density, rider supply, road/serviceability, flood/waterlogging risk, ETA and contribution-margin evidence.

## S12-02 Real restaurants
Only real, verified restaurants. Record contract/compliance/menu/hours state. No seeded/demo restaurants count as live supply.

## S12-03 Real riders
Only real riders with required identity/eligibility, consent, availability, GPS, dispatch and payout state. No invented capacity or GPS traces.

## S12-04 Real customers
Use consented real accounts. Every pilot order must be reconstructible from customer → order → payment → restaurant → dispatch → rider → proof → settlement/refund/support.

## S12-05 Pilot batch
Run multiple orders, including normal flow plus payment failure/retry, restaurant reject, rider decline/reassignment, address issue, cancellation, refund, support and late-delivery handling.

## S12-06 Economics
Measure revenue minus discounts, payment costs, rider variable cost/incentives, refunds and variable support cost. Do not scale on GMV alone.

## S12-07 Support
AI-first triage with accountable escalation. Payment, safety, legal, privacy and fraud cases require an owner.

## S12-08 Growth
Run controlled local acquisition/referral/CRM/offer experiments with budgets, control groups where practical and contribution-margin stop conditions.

## S12-09 Geo expansion
Expand only when service quality, on-time delivery, rider utilization, support rate, restaurant reliability and contribution margin meet the approved threshold.

## S12-10 Launch decision
`PUBLIC_LAUNCH=ON` requires every P0 prerequisite from Sections 1–11, healthy enabled providers, current Cloudflare deployment evidence, legal approval, passed pilot batch, support operation, monitoring/rollback and a dated founder decision.

Otherwise keep `PUBLIC_LAUNCH=OFF`. There is no '99% ready' status.
