import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Provider = "razorpay" | "twilio" | "messagebird";

type WebhookEventInput = {
  provider: Provider;
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  signatureValid: boolean;
};

type WebhookEventRow = {
  id: string;
  status: "received" | "processing" | "processed" | "failed" | "ignored";
  attempts: number;
};

let client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase webhook persistence is not configured");
  }

  client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

export async function recordWebhookEvent(
  input: WebhookEventInput,
): Promise<{ event: WebhookEventRow; duplicate: boolean }> {
  const supabase = getClient();
  const row = {
    provider: input.provider,
    provider_event_id: input.providerEventId,
    event_type: input.eventType,
    payload: input.payload,
    signature_valid: input.signatureValid,
  };

  const { data, error } = await supabase
    .from("webhook_events")
    .upsert(row, { onConflict: "provider,provider_event_id", ignoreDuplicates: true })
    .select("id,status,attempts")
    .maybeSingle();

  if (error) throw new Error(`Unable to persist webhook event: ${error.message}`);

  if (data) {
    return { event: data as WebhookEventRow, duplicate: false };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("webhook_events")
    .select("id,status,attempts")
    .eq("provider", input.provider)
    .eq("provider_event_id", input.providerEventId)
    .single();

  if (lookupError || !existing) {
    throw new Error(`Unable to resolve duplicate webhook event: ${lookupError?.message ?? "not found"}`);
  }

  return { event: existing as WebhookEventRow, duplicate: true };
}

export async function markWebhookProcessed(eventId: string): Promise<void> {
  const { error } = await getClient()
    .from("webhook_events")
    .update({ status: "processed", processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", eventId)
    .in("status", ["received", "processing"]);
  if (error) throw new Error(`Unable to mark webhook processed: ${error.message}`);
}

export async function markWebhookFailed(eventId: string, errorMessage: string): Promise<void> {
  const { error } = await getClient()
    .from("webhook_events")
    .update({ status: "failed", last_error: errorMessage.slice(0, 2000), updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw new Error(`Unable to mark webhook failed: ${error.message}`);
}

export function getWebhookEventId(headers: Headers, payload: Record<string, unknown>): string {
  const explicit = headers.get("x-event-id") ?? headers.get("x-razorpay-event-id") ?? headers.get("messagebird-event-id");
  if (explicit?.trim()) return explicit.trim();

  const serialized = JSON.stringify(payload);
  return `sha256:${createHash("sha256").update(serialized).digest("hex")}`;
}
