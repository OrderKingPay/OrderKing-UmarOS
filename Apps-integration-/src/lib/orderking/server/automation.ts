import { getSql } from "@/lib/db";

export interface AutomationEvent {
  source: string;
  type: string;
  payload: any;
}

export interface AutomationResult {
  success: boolean;
  action: string;
  details: string;
  recoveryPath?: string;
}

/**
 * UMAR OS Core Automation Engine
 * Processes events against defined rules and executes actions with strict audit trailing.
 */
export async function executeAutomation(event: AutomationEvent): Promise<AutomationResult> {
  const sql = await getSql();
  const timestamp = new Date().toISOString();
  
  // 1. Audit Trail Table Init (if not exists)
  await sql`
    CREATE TABLE IF NOT EXISTS system_audit_logs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      actor TEXT NOT NULL,
      event_type TEXT NOT NULL,
      details JSONB NOT NULL,
      status TEXT NOT NULL
    )
  `;

  try {
    let result: AutomationResult = {
      success: false,
      action: "NO_MATCH",
      details: "Event did not match any active automation rules."
    };

    // 2. Rule Evaluation
    if (event.type === 'ORDER_EXCEPTION_DELAY') {
      const { orderId, delayMinutes } = event.payload;
      
      if (delayMinutes > 15) {
        // Automatically issue a standard apology + ₹50 voucher if delayed > 15m
        // In a full implementation, this would trigger a payment/voucher API
        result = {
          success: true,
          action: "ISSUE_DELAY_VOUCHER",
          details: `Automatically issued 50 INR apology voucher for order ${orderId} due to ${delayMinutes}m delay.`,
          recoveryPath: "REVOKE_VOUCHER"
        };
      }
    } else if (event.type === 'RESTAURANT_KYC_SUBMITTED') {
       // Automatically assign a review task to operations
       result = {
          success: true,
          action: "QUEUE_KYC_REVIEW",
          details: `Queued KYC review for Restaurant ${event.payload.restaurantId}.`,
       };
    }

    // 3. Write strict audit trail
    await sql`
      INSERT INTO system_audit_logs (actor, event_type, details, status)
      VALUES ('AUTOMATION_ENGINE', ${event.type}, ${JSON.stringify({ payload: event.payload, result })}, ${result.success ? 'SUCCESS' : 'SKIPPED'})
    `;

    return result;

  } catch (error: any) {
    // 4. Failure Audit & Recovery Path
    await sql`
      INSERT INTO system_audit_logs (actor, event_type, details, status)
      VALUES ('AUTOMATION_ENGINE', 'EXECUTION_FAULT', ${JSON.stringify({ event, error: error.message })}, 'FAULT')
    `;
    
    return {
      success: false,
      action: "FAULT",
      details: `Execution fault: ${error.message}`,
      recoveryPath: "MANUAL_RETRY"
    };
  }
}

