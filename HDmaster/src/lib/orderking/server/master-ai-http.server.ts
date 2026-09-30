// @ts-nocheck
import { requireUserId } from "@/lib/auth/verify.server";
import { ensureWorkspace, appendAudit } from "@/lib/orderking/server/workspace.server";
import { ForbiddenError, requirePermission } from "@/lib/orderking/rbac";
import { runMasterAi } from "@/lib/orderking/ai/master-ai-runtime";
import { z } from "zod";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function resolveUserId(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  const token = process.env.ORDERKING_SERVICE_TOKEN?.trim();
  const userId = process.env.ORDERKING_SERVICE_USER_ID?.trim();
  if (token && userId && authorization === `Bearer ${token}`) return userId;
  return requireUserId();
}

export async function handleMasterAiHttp(request: Request) {
  try {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const userId = await resolveUserId(request);
    const ws = await ensureWorkspace(userId);
    requirePermission(ws.ctx, "access_AI");

    const aiSchema = z.object({
      question: z.string().trim().min(1).max(12000),
      mode: z.enum(["ceo", "ops"]).default("ops"),
      conversation: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(12000)
      })).default([]),
      reasoningEffort: z.enum(["low", "medium", "high", "xhigh"]).default("high")
    });

    let input;
    try {
      input = aiSchema.parse(await request.json());
    } catch (e: any) {
      return json({ error: "Invalid request payload", details: e.errors }, 400);
    }

    const question = input.question;
    const mode = input.mode;
    if (mode === "ceo") requirePermission(ws.ctx, "access_CEO_dashboard");
    const conversation = input.conversation.slice(-20);
    const reasoningEffort = input.reasoningEffort;

    const result = await runMasterAi(ws, { question, mode, conversation, reasoningEffort });
    await appendAudit({
      orgId: ws.ctx.orgId,
      employeeId: ws.ctx.employeeId,
      userId: ws.ctx.userId,
      roleKey: ws.ctx.actingRoleKey,
      action: "ai.master.request",
      targetType: "master_ai",
      targetId: mode,
      reason: JSON.stringify({ questionLength: question.length, toolCalls: result.ok ? result.toolCalls : [], status: result.ok ? "completed" : "failed" }),
    });
    return json(result, result.ok ? 200 : result.status);
  } catch (err) {
    if (err instanceof ForbiddenError) return json({ error: err.message, code: "FORBIDDEN" }, 403);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return json({ error: message, code: message === "Unauthorized" ? "UNAUTHORIZED" : "BAD_REQUEST" }, message === "Unauthorized" ? 401 : 400);
  }
}
