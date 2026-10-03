// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { withVendor, writeAudit } from "./helpers";

const VERIFIED_JOB_SOURCES = new Set(["ORDERKING_CREATED", "CONTRACTED_EMPLOYER", "APPROVED_FEED"]);

function money(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;
}

function workControlConfig() {
  return {
    url: process.env.HDMASTER_URL?.trim().replace(/\/+$/, "") || "",
    token: process.env.ORDERKING_SERVICE_TOKEN?.trim() || "",
  };
}

async function notifyUmarOS(event: Record<string, unknown>): Promise<"SYNCED" | "NOT_CONFIGURED" | "FAILED"> {
  const cfg = workControlConfig();
  if (!cfg.url || !cfg.token) return "NOT_CONFIGURED";
  try {
    const response = await fetch(`${cfg.url}/v1/admin/work/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.token}`,
        "Idempotency-Key": String(event.eventId),
      },
      body: JSON.stringify({
        contractVersion: "1",
        ...event,
      }),
    });
    if (!response.ok) return "FAILED";
    return "SYNCED";
  } catch {
    return "FAILED";
  }
}

function payoutRailStatus() {
  return {
    connected: false as const,
    provider: "NOT_CONNECTED" as const,
    message: "Worker payout release is unavailable until an approved payout provider/rail is connected and verified.",
  };
}

export const getWorkSnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const profileRows = await sql<{
      user_id: string;
      display_name: string;
      state: string;
      district: string;
      city: string;
      pincode: string;
      languages: string;
      skills: string;
      remote_available: boolean;
      availability_status: string;
    }>`select user_id, display_name, state, district, city, pincode, languages, skills, remote_available, availability_status
        from work_profiles where user_id = ${context.userId} limit 1`;
    const profile = profileRows[0] ?? null;

    const jobs = await sql<{
      id: string; title: string; category: string; description: string;
      client_budget_paise: number; worker_payout_paise: number;
      payment_cost_paise: number; verification_cost_paise: number;
      platform_fee_paise: number; applicable_tax_paise: number;
      estimated_minutes: number; requirements: string;
      source_type: string; status: string; expires_at: string | null;
    }>`select id, title, category, description, client_budget_paise, worker_payout_paise,
        payment_cost_paise, verification_cost_paise, platform_fee_paise, applicable_tax_paise,
        estimated_minutes, requirements, source_type, status, expires_at::text
        from remote_jobs
        where status = 'OPEN'
          and remote_only = true
          and source_type = any(${Array.from(VERIFIED_JOB_SOURCES)})
          and (expires_at is null or expires_at > now())
        order by created_at desc limit 40`;

    const acceptances = await sql<{
      id: string; job_id: string; status: string; started_at: string;
      submitted_at: string | null; submission_note: string;
      verification_status: string; verification_note: string;
      payout_status: string; title: string; worker_payout_paise: number;
      estimated_minutes: number;
    }>`select a.id, a.job_id, a.status, a.started_at::text, a.submitted_at::text,
        a.submission_note, a.verification_status, a.verification_note,
        a.payout_status, j.title, j.worker_payout_paise, j.estimated_minutes
        from job_acceptances a join remote_jobs j on j.id = a.job_id
        where a.worker_user_id = ${context.userId}
        order by a.updated_at desc limit 20`;

    const projects = await sql<{
      id: string; title: string; category: string; description: string;
      state: string; district: string; city: string; pincode: string;
      mode: string; status: string; platform_commission_bps: number | null;
      control_sync_status: string; created_at: string;
    }>`select id, title, category, description, state, district, city, pincode,
        mode, status, platform_commission_bps, control_sync_status, created_at::text
        from project_requests
        where owner_user_id = ${context.userId}
        order by updated_at desc limit 20`;

    const projectIds = projects.map((p) => p.id);
    const quotes = projectIds.length
      ? await sql<{
          id: string; project_id: string; provider_id: string; display_name: string;
          quote_paise: number; estimated_days: number; notes: string; status: string;
        }>`select q.id, q.project_id, q.provider_id, p.display_name, q.quote_paise,
            q.estimated_days, q.notes, q.status
            from project_quotes q join project_providers p on p.id = q.provider_id
            where q.project_id = any(${projectIds})
            order by q.created_at desc`
      : [];

    return {
      profile,
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        category: j.category,
        description: j.description,
        clientBudgetPaise: money(j.client_budget_paise),
        workerPayoutPaise: money(j.worker_payout_paise),
        paymentCostPaise: money(j.payment_cost_paise),
        verificationCostPaise: money(j.verification_cost_paise),
        platformFeePaise: money(j.platform_fee_paise),
        applicableTaxPaise: money(j.applicable_tax_paise),
        estimatedMinutes: Number(j.estimated_minutes),
        requirements: j.requirements,
        sourceType: j.source_type,
      })),
      acceptances: acceptances.map((a) => ({
        ...a,
        workerPayoutPaise: money(a.worker_payout_paise),
        estimatedMinutes: Number(a.estimated_minutes),
      })),
      projects: projects.map((p) => ({
        ...p,
        platformCommissionBps: p.platform_commission_bps == null ? null : Number(p.platform_commission_bps),
        quotes: quotes.filter((q) => q.project_id === p.id).map((q) => ({
          ...q,
          quotePaise: money(q.quote_paise),
          estimatedDays: Number(q.estimated_days),
        })),
      })),
      payoutRail: payoutRailStatus(),
      controlLayer: {
        configured: Boolean(workControlConfig().url && workControlConfig().token),
        provider: "Umar OS / HDmaster",
      },
    };
  });

export const saveWorkProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    displayName: string; state: string; district: string; city: string;
    pincode: string; languages: string; skills: string; remoteAvailable: boolean;
  }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const values = {
      displayName: data.displayName.trim().slice(0, 120),
      state: data.state.trim().slice(0, 80),
      district: data.district.trim().slice(0, 80),
      city: data.city.trim().slice(0, 80),
      pincode: data.pincode.trim().slice(0, 10),
      languages: data.languages.trim().slice(0, 300),
      skills: data.skills.trim().slice(0, 600),
      remoteAvailable: Boolean(data.remoteAvailable),
    };
    if (!values.displayName || !values.skills || !values.languages) {
      throw new Error("Name, skills, and languages are required.");
    }
    await sql`insert into work_profiles
      (user_id, display_name, state, district, city, pincode, languages, skills, remote_available, updated_at)
      values (${context.userId}, ${values.displayName}, ${values.state}, ${values.district}, ${values.city},
              ${values.pincode}, ${values.languages}, ${values.skills}, ${values.remoteAvailable}, now())
      on conflict (user_id) do update set
        display_name=excluded.display_name, state=excluded.state, district=excluded.district,
        city=excluded.city, pincode=excluded.pincode, languages=excluded.languages,
        skills=excluded.skills, remote_available=excluded.remote_available, updated_at=now()`;
    return { ok: true as const };
  });

export const acceptJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { jobId: string; idempotencyKey: string }) => d)
  .handler(async ({ context, data }) => {
    if (!data.idempotencyKey || data.idempotencyKey.length < 8) throw new Error("Idempotency key required");
    const sql = await getSql();
    const profile = await sql<{ remote_available: boolean; skills: string; languages: string }>`select remote_available, skills, languages from work_profiles where user_id=${context.userId} limit 1`;
    if (!profile[0]?.remote_available) throw new Error("Enable your remote work profile before accepting a job.");
    if (!profile[0].skills.trim() || !profile[0].languages.trim()) throw new Error("Complete your skills and languages before accepting a job.");

    const job = (await sql<{ id: string; status: string; source_type: string }>`select id, status, source_type from remote_jobs where id=${data.jobId} and remote_only=true limit 1`)[0];
    if (!job || job.status !== "OPEN" || !VERIFIED_JOB_SOURCES.has(job.source_type)) {
      throw new Error("This job is not currently available through a verified source.");
    }

    const prior = await sql<{ id: string; status: string }>`select id, status from job_acceptances where job_id=${data.jobId} and worker_user_id=${context.userId} limit 1`;
    if (prior[0]) return { ok: true as const, duplicate: true as const, acceptanceId: prior[0].id, status: prior[0].status };

    const acceptanceId = newId("job");
    await sql`insert into job_acceptances
      (id, job_id, worker_user_id, status, payout_status)
      values (${acceptanceId}, ${data.jobId}, ${context.userId}, 'ACCEPTED', 'NOT_RELEASED')`;

    const sync = await notifyUmarOS({
      eventId: `job-accept:${acceptanceId}`,
      type: "JOB_ACCEPTED",
      actorUserId: context.userId,
      jobId: data.jobId,
      acceptanceId,
    });

    await writeAudit(sql, {
      actorUserId: context.userId,
      action: "job_accept",
      entityType: "job_acceptance",
      entityId: acceptanceId,
      detail: `controlSync=${sync}`,
    });
    return { ok: true as const, duplicate: false as const, acceptanceId, status: "ACCEPTED", controlSync: sync, payout: payoutRailStatus() };
  });

export const submitJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { acceptanceId: string; submissionNote: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const note = data.submissionNote.trim().slice(0, 4000);
    if (!note) throw new Error("Describe the completed work before submitting.");
    const updated = await sql.query<{ id: string }>(
      `update job_acceptances
       set status='SUBMITTED', submitted_at=now(), submission_note=$1, verification_status='PENDING',
           updated_at=now()
       where id=$2 and worker_user_id=$3 and status='ACCEPTED'
       returning id`,
      [note, data.acceptanceId, context.userId],
    );
    if (!updated[0]) throw new Error("Job is not currently in an accepted state.");

    const sync = await notifyUmarOS({
      eventId: `job-submit:${data.acceptanceId}`,
      type: "JOB_SUBMITTED",
      actorUserId: context.userId,
      acceptanceId: data.acceptanceId,
    });

    await sql`update job_acceptances set verification_note=${`Control sync: ${sync}`}, updated_at=now() where id=${data.acceptanceId}`;
    await writeAudit(sql, {
      actorUserId: context.userId,
      action: "job_submit",
      entityType: "job_acceptance",
      entityId: data.acceptanceId,
      detail: `controlSync=${sync}`,
    });
    return {
      ok: true as const,
      status: "SUBMITTED",
      verificationStatus: "PENDING",
      payout: payoutRailStatus(),
      controlSync: sync,
    };
  });

export const createProjectRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    restaurantId?: string; title: string; category: string; description: string;
    state: string; district: string; city: string; pincode: string;
    serviceRadiusKm?: number; budgetMinPaise?: number; budgetMaxPaise?: number;
  }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
      const title = data.title.trim().slice(0, 140);
      const description = data.description.trim().slice(0, 6000);
      const category = data.category.trim().slice(0, 80);
      const state = data.state.trim().slice(0, 80);
      const district = data.district.trim().slice(0, 80);
      const city = data.city.trim().slice(0, 80);
      const pincode = data.pincode.trim().slice(0, 10);
      if (!title || !category || !description || !state || !city || !pincode) {
        throw new Error("Title, category, description, state, city, and PIN code are required.");
      }
      const radius = Math.max(1, Math.min(250, Math.trunc(data.serviceRadiusKm ?? 25)));
      const min = data.budgetMinPaise == null ? null : money(data.budgetMinPaise);
      const max = data.budgetMaxPaise == null ? null : money(data.budgetMaxPaise);
      if ((min == null) !== (max == null) || (min != null && max != null && max < min)) throw new Error("Budget range is invalid.");

      const id = newId("proj");
      await sql`insert into project_requests
        (id, owner_user_id, restaurant_id, title, category, description, state, district, city, pincode, service_radius_km,
         mode, status, budget_min_paise, budget_max_paise, control_sync_status)
        values (${id}, ${context.userId}, ${ctx.restaurantId}, ${title}, ${category}, ${description}, ${state},
                ${district}, ${city}, ${pincode}, ${radius}, 'MARKETPLACE', 'OPEN', ${min}, ${max}, 'PENDING')`;
      const sync = await notifyUmarOS({
        eventId: `project-create:${id}`,
        type: "PROJECT_CREATED",
        actorUserId: context.userId,
        projectId: id,
        category,
        state,
        district,
        city,
        pincode,
        mode: "MARKETPLACE",
      });
      await sql`update project_requests set control_sync_status=${sync}, updated_at=now() where id=${id}`;
      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: "project_create",
        entityType: "project",
        entityId: id,
        detail: `mode=MARKETPLACE;controlSync=${sync}`,
      });
      return { ok: true as const, projectId: id, mode: "MARKETPLACE", status: "OPEN", controlSync: sync };
    });
  });

export const selectProjectProvider = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; projectId: string; quoteId: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
      const row = (await sql<{
        qid: string; pid: string; quote_paise: number; project_status: string;
        provider_name: string; provider_verification: string;
      }>`select q.id as qid, q.provider_id as pid, q.quote_paise, r.status as project_status,
          p.display_name as provider_name, p.verification_status as provider_verification
          from project_quotes q
          join project_requests r on r.id=q.project_id
          join project_providers p on p.id=q.provider_id
          where q.id=${data.quoteId} and q.project_id=${data.projectId} and r.owner_user_id=${context.userId}
            and r.restaurant_id=${ctx.restaurantId}
          limit 1`)[0];
      if (!row) throw new Error("Quote not found.");
      if (row.project_status !== "OPEN" && row.project_status !== "QUOTING") throw new Error("Project is not open for provider selection.");
      if (row.provider_verification !== "VERIFIED") throw new Error("Provider verification is not complete.");

      const sync = await notifyUmarOS({
        eventId: `project-provider:${data.projectId}:${data.quoteId}`,
        type: "PROJECT_PROVIDER_SELECTED",
        actorUserId: context.userId,
        projectId: data.projectId,
        quoteId: data.quoteId,
        providerId: row.pid,
        quotePaise: money(row.quote_paise),
      });

      await sql`update project_requests
        set selected_provider_id=${row.pid}, status='PROVIDER_SELECTED', control_sync_status=${sync}, updated_at=now()
        where id=${data.projectId} and owner_user_id=${context.userId} and restaurant_id=${ctx.restaurantId}`;

      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: "project_provider_select",
        entityType: "project",
        entityId: data.projectId,
        detail: `provider=${row.pid};quote=${money(row.quote_paise)};controlSync=${sync}`,
      });
      return {
        ok: true as const,
        status: "PROVIDER_SELECTED",
        providerName: row.provider_name,
        quotePaise: money(row.quote_paise),
        controlSync: sync,
        contractStatus: "PENDING_CONTRACT",
      };
    });
  });

export const submitProjectQuote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { projectId: string; quotePaise: number; estimatedDays: number; notes: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const provider = (await sql<{ id: string; display_name: string; verification_status: string }>`select id, display_name, verification_status from project_providers where user_id=${context.userId} limit 1`)[0];
    if (!provider || provider.verification_status !== "VERIFIED") throw new Error("Verified project-provider access is required to quote.");
    const project = (await sql<{ id: string; status: string; category: string }>`select id, status, category from project_requests where id=${data.projectId} limit 1`)[0];
    if (!project || !["OPEN", "QUOTING"].includes(project.status)) throw new Error("Project is not open for quotes.");
    const quote = money(data.quotePaise);
    const days = Math.max(1, Math.min(365, Math.trunc(data.estimatedDays)));
    if (!quote || !data.notes.trim()) throw new Error("Quote amount and notes are required.");
    const id = newId("quote");
    await sql`insert into project_quotes (id, project_id, provider_id, quote_paise, estimated_days, notes)
      values (${id}, ${data.projectId}, ${provider.id}, ${quote}, ${days}, ${data.notes.trim().slice(0, 3000)})
      on conflict (project_id, provider_id) do update set quote_paise=excluded.quote_paise,
        estimated_days=excluded.estimated_days, notes=excluded.notes, status='SUBMITTED', updated_at=now()`;
    await sql`update project_requests set status='QUOTING', updated_at=now() where id=${data.projectId}`;
    const sync = await notifyUmarOS({
      eventId: `project-quote:${id}`,
      type: "PROJECT_QUOTE_SUBMITTED",
      actorUserId: context.userId,
      projectId: data.projectId,
      quoteId: id,
      providerId: provider.id,
      quotePaise: quote,
    });
    await writeAudit(sql, { actorUserId: context.userId, action: "project_quote_submit", entityType: "project_quote", entityId: id, detail: `controlSync=${sync}` });
    return { ok: true as const, quoteId: id, controlSync: sync };
  });
