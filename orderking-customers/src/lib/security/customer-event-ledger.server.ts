import { getSql } from "@/lib/db";

export async function appendCustomerSecurityEvent(input: {
  streamKey: string;
  actorId: string;
  actorType: string;
  eventType: string;
  deviceId: string | null;
  ipAddress: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into audit_logs (
      id, actor_user_id, actor_role, action, entity, entity_id, metadata
    ) values (
      ${crypto.randomUUID()},
      ${input.actorId},
      ${input.actorType},
      ${input.eventType},
      ${input.streamKey},
      ${input.deviceId},
      ${JSON.stringify({
        deviceId: input.deviceId,
        ipAddress: input.ipAddress,
        ...input.payload,
      })}
    )
  `;
}
