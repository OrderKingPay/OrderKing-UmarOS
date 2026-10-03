import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MoneyText } from "@/components/money-text";
import { useVendor } from "@/components/use-vendor";
import { formatINR } from "@/lib/money";
import {
  acceptJob,
  createProjectRequest,
  getWorkSnapshot,
  saveWorkProfile,
  selectProjectProvider,
  submitJob,
} from "@/lib/server/api-work";
import { cn } from "@/lib/utils";

type Mode = "projects" | "jobs";

const PROJECT_CATEGORIES = [
  "Interior design",
  "Construction / renovation",
  "Commercial kitchen",
  "Furniture",
  "Electrical",
  "Plumbing",
  "CCTV / security",
  "AC / HVAC",
  "Solar",
  "Signage / fabrication",
  "POS / printer installation",
  "Repair / maintenance",
  "Photography / video",
  "Printing / branding",
  "Cleaning / pest control",
  "Logistics / transport",
  "Staffing / manpower",
  "Equipment supply",
  "Business setup",
  "Other",
] as const;

export function WorkOpportunitiesCard() {
  const vendor = useVendor();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>("projects");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    displayName: vendor.selected?.restaurantName ?? "",
    state: "",
    district: "",
    city: "",
    pincode: "",
    languages: "",
    skills: "",
    remoteAvailable: true,
  });

  const [project, setProject] = useState({
    title: "",
    category: "Commercial kitchen",
    description: "",
    state: "",
    district: "",
    city: "",
    pincode: "",
    serviceRadiusKm: "25",
    budgetMin: "",
    budgetMax: "",
  });

  const [submission, setSubmission] = useState<Record<string, string>>({});

  const q = useQuery({
    queryKey: ["work-opportunities"],
    queryFn: () => getWorkSnapshot(),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!q.data?.profile) return;
    const p = q.data.profile;
    setProfile({
      displayName: p.display_name,
      state: p.state,
      district: p.district,
      city: p.city,
      pincode: p.pincode,
      languages: p.languages,
      skills: p.skills,
      remoteAvailable: p.remote_available,
    });
  }, [q.data?.profile]);

  useEffect(() => {
    try {
      const savedProject = localStorage.getItem("orderking:partner:project-draft");
      if (savedProject) setProject((old) => ({ ...old, ...JSON.parse(savedProject) }));
      const savedSubmission = localStorage.getItem("orderking:partner:job-submission-drafts");
      if (savedSubmission) setSubmission(JSON.parse(savedSubmission));
    } catch {
      /* local drafts are best-effort only */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("orderking:partner:project-draft", JSON.stringify(project));
    } catch {
      /* ignore local-storage failures */
    }
  }, [project]);

  useEffect(() => {
    try {
      localStorage.setItem("orderking:partner:job-submission-drafts", JSON.stringify(submission));
    } catch {
      /* ignore local-storage failures */
    }
  }, [submission]);

  const accepted = useMemo(
    () => (q.data?.acceptances ?? []).filter((x) => x.status === "ACCEPTED" || x.status === "SUBMITTED"),
    [q.data?.acceptances],
  );

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["work-opportunities"] });
  }

  async function saveProfile() {
    setBusy("profile");
    setError(null);
    try {
      await saveWorkProfile({ data: { ...profile, remoteAvailable: true } });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save work profile.");
    } finally {
      setBusy(null);
    }
  }

  async function handleAccept(jobId: string) {
    setBusy("accept:" + jobId);
    setError(null);
    try {
      await acceptJob({ data: { jobId, idempotencyKey: crypto.randomUUID() } });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept this job.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmit(acceptanceId: string) {
    setBusy("submit:" + acceptanceId);
    setError(null);
    try {
      await submitJob({
        data: {
          acceptanceId,
          submissionNote: submission[acceptanceId] ?? "",
        },
      });
      setSubmission((old) => ({ ...old, [acceptanceId]: "" }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the work.");
    } finally {
      setBusy(null);
    }
  }

  async function createProject() {
    if (!vendor.restaurantId) {
      setError("Restaurant context is required for Projects.");
      return;
    }
    setBusy("project");
    setError(null);
    try {
      await createProjectRequest({
        data: {
          restaurantId: vendor.restaurantId,
          title: project.title,
          category: project.category,
          description: project.description,
          state: project.state,
          district: project.district,
          city: project.city,
          pincode: project.pincode,
          serviceRadiusKm: Number(project.serviceRadiusKm) || 25,
          budgetMinPaise: project.budgetMin ? Math.round(Number(project.budgetMin) * 100) : undefined,
          budgetMaxPaise: project.budgetMax ? Math.round(Number(project.budgetMax) * 100) : undefined,
        },
      });
      setProject((old) => ({ ...old, title: "", description: "", budgetMin: "", budgetMax: "" }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the project request.");
    } finally {
      setBusy(null);
    }
  }

  async function selectProvider(projectId: string, quoteId: string) {
    setBusy("quote:" + quoteId);
    setError(null);
    try {
      await selectProjectProvider({
        data: {
          restaurantId: vendor.restaurantId,
          projectId,
          quoteId,
        },
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not select this provider.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("projects")}
          className={cn(
            "min-h-32 rounded-[18px] border p-4 text-left transition-colors",
            mode === "projects" ? "border-chili bg-chili-soft" : "border-line bg-surface hover:bg-surface-2",
          )}
        >
          <Building2 className="mb-3 size-6 text-chili" />
          <div className="font-display text-xl font-semibold">PROJECTS</div>
          <div className="mt-1 text-xs text-muted">Local business work with provider quotes and milestones.</div>
        </button>

        <button
          type="button"
          onClick={() => setMode("jobs")}
          className={cn(
            "min-h-32 rounded-[18px] border p-4 text-left transition-colors",
            mode === "jobs" ? "border-chili bg-chili-soft" : "border-line bg-surface hover:bg-surface-2",
          )}
        >
          <BriefcaseBusiness className="mb-3 size-6 text-chili" />
          <div className="font-display text-xl font-semibold">JOBS</div>
          <div className="mt-1 text-xs text-muted">Remote, part-time tasks with the exact worker payout shown first.</div>
        </button>
      </div>

      {error ? (
        <Card className="border-danger bg-danger-soft p-3 text-sm text-danger" role="alert">
          {error}
        </Card>
      ) : null}

      {mode === "jobs" ? (
        <div className="space-y-3">
          <Card className="space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-leaf" />
              <div>
                <h3 className="font-semibold">Remote work profile</h3>
                <p className="text-xs text-muted">
                  No long application or CV is required here. Tell OrderKing the skills and languages you can actually perform.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Name" value={profile.displayName} onChange={(v) => setProfile((x) => ({ ...x, displayName: v }))} />
              <Field label="Languages" placeholder="Hindi, Bengali, English" value={profile.languages} onChange={(v) => setProfile((x) => ({ ...x, languages: v }))} />
              <Field label="Skills" placeholder="Data checking, translation, chat support" value={profile.skills} onChange={(v) => setProfile((x) => ({ ...x, skills: v }))} />
              <Field label="City" value={profile.city} onChange={(v) => setProfile((x) => ({ ...x, city: v }))} />
            </div>
            <Button disabled={busy !== null} onClick={() => void saveProfile()}>
              {busy === "profile" ? "Saving…" : "Save work profile"}
            </Button>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg">Open jobs</h3>
                <p className="text-xs text-muted">Only approved OrderKing/provider sources are shown. No external job-site search.</p>
              </div>
              <span className="text-xs text-muted">{q.data?.jobs.length ?? 0} available</span>
            </div>

            {(q.data?.jobs.length ?? 0) === 0 ? (
              <div className="rounded-[14px] border border-dashed border-line p-4 text-sm text-muted">
                No verified remote jobs are available for this account right now. This does not imply guaranteed work or income.
              </div>
            ) : (
              q.data?.jobs.map((job) => (
                <Card key={job.id} className="space-y-3 bg-surface-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">{job.title}</h4>
                      <div className="mt-1 text-xs text-muted">{job.category} · Remote · Part-time</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted">You will receive</div>
                      <MoneyText paise={job.workerPayoutPaise} className="text-lg font-semibold text-leaf" />
                    </div>
                  </div>
                  <p className="text-sm text-muted">{job.description}</p>
                  <div className="grid gap-2 text-xs sm:grid-cols-3">
                    <Info icon={<Clock3 className="size-3.5" />} text={"~" + job.estimatedMinutes + " min"} />
                    <Info icon={<ShieldCheck className="size-3.5" />} text="Eligibility checked before acceptance" />
                    <Info icon={<CheckCircle2 className="size-3.5" />} text={"Client budget " + formatINR(job.clientBudgetPaise)} />
                  </div>
                  {job.requirements ? <p className="rounded-lg bg-surface px-3 py-2 text-xs"><strong>Requirements:</strong> {job.requirements}</p> : null}
                  <Button disabled={busy !== null} onClick={() => void handleAccept(job.id)}>
                    {busy === "accept:" + job.id ? "Accepting…" : "Accept job"}
                  </Button>
                </Card>
              ))
            )}
          </Card>

          {accepted.map((item) => (
            <Card key={item.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted">Your task</div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="mt-1 text-xs text-muted">Payout: {formatINR(item.workerPayoutPaise)} · Status: {item.status}</p>
                </div>
                <span className="rounded-full bg-warn-soft px-2 py-1 text-[11px] font-semibold text-warn">{item.verification_status}</span>
              </div>
              {item.status === "ACCEPTED" ? (
                <div className="space-y-2">
                  <Label>What did you complete?</Label>
                  <Textarea
                    value={submission[item.id] ?? ""}
                    onChange={(e) => setSubmission((old) => ({ ...old, [item.id]: e.target.value }))}
                    placeholder="Briefly describe the completed task and include any allowed evidence/reference."
                  />
                  <Button
                    disabled={busy !== null || !(submission[item.id] ?? "").trim()}
                    onClick={() => void handleSubmit(item.id)}
                  >
                    {busy === "submit:" + item.id ? "Submitting…" : "Submit for verification"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Submitted. Verification must complete before any payout can be released. Payout rail status: {q.data?.payoutRail.provider}.
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <Card className="space-y-3">
            <div>
              <h3 className="font-display text-lg">Tell us what you need</h3>
              <p className="text-xs text-muted">
                OrderKing creates the project requirement, matches verified providers by location/category, and shows quotes when they are actually available.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Project title" placeholder="CCTV installation for my restaurant" value={project.title} onChange={(v) => setProject((x) => ({ ...x, title: v }))} />
              <div>
                <Label>Category</Label>
                <select
                  className="h-11 w-full rounded-[12px] border border-line bg-surface px-3 text-sm"
                  value={project.category}
                  onChange={(e) => setProject((x) => ({ ...x, category: e.target.value }))}
                >
                  {PROJECT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              <Field label="State" value={project.state} onChange={(v) => setProject((x) => ({ ...x, state: v }))} />
              <Field label="District" value={project.district} onChange={(v) => setProject((x) => ({ ...x, district: v }))} />
              <Field label="City" value={project.city} onChange={(v) => setProject((x) => ({ ...x, city: v }))} />
              <Field label="PIN code" value={project.pincode} onChange={(v) => setProject((x) => ({ ...x, pincode: v }))} />
              <Field label="Service radius (km)" value={project.serviceRadiusKm} onChange={(v) => setProject((x) => ({ ...x, serviceRadiusKm: v }))} />
              <Field label="Budget min (₹, optional)" value={project.budgetMin} onChange={(v) => setProject((x) => ({ ...x, budgetMin: v }))} />
              <Field label="Budget max (₹, optional)" value={project.budgetMax} onChange={(v) => setProject((x) => ({ ...x, budgetMax: v }))} />
              <div className="md:col-span-2">
                <Label>What needs to be done?</Label>
                <Textarea
                  value={project.description}
                  onChange={(e) => setProject((x) => ({ ...x, description: e.target.value }))}
                  placeholder="Give the minimum details needed to understand the work, site, quantity, and timing."
                />
              </div>
            </div>
            <Button disabled={busy !== null || !vendor.restaurantId} onClick={() => void createProject()}>
              {busy === "project" ? "Creating…" : "Create project request"}
            </Button>
          </Card>

          {(q.data?.projects ?? []).map((p) => (
            <Card key={p.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted">{p.category}</div>
                  <h4 className="font-semibold">{p.title}</h4>
                  <p className="mt-1 text-xs text-muted">{p.city}, {p.state} · {p.status}</p>
                </div>
                <span className="rounded-full bg-surface-2 px-2 py-1 text-[11px] font-semibold">
                  {p.control_sync_status === "SYNCED" ? "Umar OS synced" : "Control sync pending"}
                </span>
              </div>

              {p.quotes.length === 0 ? (
                <p className="text-sm text-muted">
                  No verified provider quote has arrived yet. Nothing is awarded and no project money is being held.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted">Quotes</div>
                  {p.quotes.map((quote) => (
                    <div key={quote.id} className="rounded-[14px] border border-line bg-surface-2 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold">{quote.display_name}</div>
                          <div className="text-xs text-muted">{quote.estimatedDays} day(s)</div>
                        </div>
                        <div className="text-right">
                          <MoneyText paise={quote.quotePaise} className="font-semibold" />
                          <Button
                            className="mt-2"
                            size="sm"
                            disabled={busy !== null}
                            onClick={() => void selectProvider(p.id, quote.id)}
                          >
                            {busy === "quote:" + quote.id ? "Selecting…" : "Select provider"}
                          </Button>
                        </div>
                      </div>
                      {quote.notes ? <p className="mt-2 text-xs text-muted">{quote.notes}</p> : null}
                    </div>
                  ))}
                </div>
              )}

              {p.platformCommissionBps != null ? (
                <p className="text-xs text-muted">
                  OrderKing fee: {(p.platformCommissionBps / 100).toFixed(2)}% under the configured commercial agreement. Any applicable costs/taxes are shown in the contract before payment.
                </p>
              ) : (
                <p className="text-xs text-muted">OrderKing fee: determined by the approved commercial agreement before contract/payment.</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Info({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-2 text-muted">
      {icon}
      <span>{text}</span>
    </div>
  );
}
