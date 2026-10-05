interface Env {
  HDMASTER_ORIGIN: string;
  CRON_SECRET: string;
}

const TASKS: Record<string, string> = {
  "* * * * *": "/api/dispatch/cron/run-auto-dispatch",
  "0 2 * * 1": "/api/finance/cron/run-settlement",
};

async function runTask(cron: string, env: Env): Promise<void> {
  const path = TASKS[cron];
  if (!path) return;

  const origin = env.HDMASTER_ORIGIN.replace(/\/+$/, "");
  if (!origin.startsWith("https://")) {
    throw new Error("HDMASTER_ORIGIN must use HTTPS.");
  }
  if (!env.CRON_SECRET) {
    throw new Error("CRON_SECRET is not configured.");
  }

  const response = await fetch(`${origin}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
      Accept: "application/json",
    },
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Scheduled task ${cron} failed: HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  console.log(JSON.stringify({
    event: "orderking_scheduled_task",
    cron,
    path,
    status: response.status,
    body: body.slice(0, 1000),
  }));
}

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runTask(controller.cron, env));
  },

  async fetch(request: Request) {
    return new Response("OrderKing scheduler is active. Scheduled execution only.", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
