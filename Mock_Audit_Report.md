# Mock Audit Report

This report audits the repository for mock claims across specific directories and classifies each match into one of the following categories:
- legitimate automated-test fixture
- development-only fixture
- documentation example
- fail-closed production behavior
- actual fake production functionality

## File: `﻿Apps-integration-/src/components/error-boundary.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `type Props = { children: ReactNode; fallback?: ReactNode };` |

## File: `Apps-integration-/src/components/error-boundary.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `return this.props.fallback ?? (` |

## File: `Apps-integration-/src/components/session.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `dataMode: "SIMULATED";` |

## File: `Apps-integration-/src/components/ui/input.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `"flex h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm text-fg placeholder:text-subtle",` |

## File: `Apps-integration-/src/lib/app-data/app-data.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `import { describe, it, mock } from "node:test";` |
| legitimate automated-test fixture | `function fakeJwt(claims: Record<string, unknown>): string {` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-1", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-2", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-2", iat: 1001, exp: 2001 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-3", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `mock.timers.enable({ apis: ["Date"], now: 1_000_000 });` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-5", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `mock.timers.setTime(1_000_000 + 5_001);` |
| legitimate automated-test fixture | `mock.timers.reset();` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-4", iat: 1000, exp: 2000 }),` |

## File: `Apps-integration-/src/lib/auth/client.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Fallback when the user dismisses the popup. Grace period lets the` |

## File: `Apps-integration-/src/lib/auth/preview.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `* the live preview do REAL sign-in — no demo/mock users — with no platform` |

## File: `Apps-integration-/src/lib/auth/server.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `*     origin from the request, so real sign-in works (no demo users). Sessions` |
| fail-closed production behavior | `fallback: "http://localhost:8080",` |

## File: `Apps-integration-/src/lib/auth/use-current-user.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** True when this is the sandbox/dev fallback (auth not configured). */` |
| fail-closed production behavior | `isDevFallback: boolean;` |
| fail-closed production behavior | `* Stable fallback user, used ONLY when auth is disabled` |
| fail-closed production behavior | `isDevFallback: true,` |
| fail-closed production behavior | `isDevFallback: false,` |

## File: `Apps-integration-/src/lib/auth/verify.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** Dev fallback user id, used only when auth is disabled (VITE_AUTH_ENABLED=false). */` |

## File: `Apps-integration-/src/lib/db.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// "unset" — otherwise production would silently run on the PGLite fallback.` |
| actual fake production functionality | `// Rebuild with $1, $2, … placeholders so values stay parameterized.` |
| fail-closed production behavior | `* otherwise the local PGLite fallback. Memoized — safe to call per request.` |
| fail-closed production behavior | `throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");` |

## File: `Apps-integration-/src/lib/orderking/i18n.ts`

| Category | Match |
| -------- | ----- |
| documentation example | `"sim.banner": "SIMULATED DATA — marketplace records are demonstration data until Shared Core is connected. They are not live customer, restaurant, or rider activity.",` |
| documentation example | `"sim.short": "SIMULATED DATA",` |
| documentation example | `"sim.action": "Simulation — does not change a live marketplace.",` |

## File: `Apps-integration-/src/lib/orderking/server/api.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `dataMode: "SIMULATED";` |
| development-only fixture | `dataMode: "SIMULATED",` |
| development-only fixture | `simulated: true,` |
| development-only fixture | `return { ok: true as const, data: { money, settlements, period: bounds.label, simulated: true } };` |
| development-only fixture | `answer = `DATA PERIOD: all simulated orders. High cancellation: ${rows.map((r) => `${r.name} ${r.cancels}/${r.orders}`).join("; ") \|\| "none"}.`;` |
| development-only fixture | `? `DATA PERIOD: ${snap.period} (simulated).\nKEY METRICS: ${money.orders} orders, GMV ${money.gmvPaise} paise, contribution ${money.contributionPaise} paise.\nREASONING SUMMARY: AI provider is not configured; this is a deterministic briefing from authorized tables.\nRECOMMENDED ACTION: Review open alerts (${snap.alerts.map((a) => a.kind).join(", ") \|\| "none"}) and dispatch coverage.\nCONFIDENCE: High on tabulated metrics; low on qualitative forecast because the LLM is unavailable.`` |
| development-only fixture | `simulated: true,` |
| development-only fixture | `return { ok: false as const, error: "Only operations leads can run the simulation tick.", code: "FORBIDDEN" };` |
| development-only fixture | `if (!customer \|\| !rest) return { ok: false as const, error: "Simulation data is not ready.", code: "SETUP" };` |
| development-only fixture | `${breakdown.restaurantSettlementPaise}, ${JSON.stringify([{ name: "Simulated thali", qty: 1, paise: value }])}, ${12}, ${id}` |
| development-only fixture | `(${newId("oev")}, ${actor.orgId}, ${id}, ${"customer"}, ${customer.id}, ${null}, ${"PLACED"}, ${"Simulated place"}),` |
| development-only fixture | `(${newId("oev")}, ${actor.orgId}, ${id}, ${"restaurant"}, ${rest.id}, ${"PLACED"}, ${"CONFIRMED"}, ${"Simulated confirm"}),` |
| development-only fixture | `(${newId("oev")}, ${actor.orgId}, ${id}, ${"employee"}, ${actor.employeeId}, ${"READY"}, ${"DELIVERED"}, ${"Simulated full lifecycle"})` |
| development-only fixture | `await writeAudit(sql, actor, { action: "SIMULATION_TICK", targetType: "order", targetId: id, newState: { status: "DELIVERED" }, reason: "SIMULATED DATA — marketplace tick" });` |
| development-only fixture | `export const runE2eSimulation = createServerFn({ method: "POST" })` |
| development-only fixture | `return { ok: false as const, error: "Only CEO or super admin can run the full admin simulation.", code: "FORBIDDEN" };` |
| development-only fixture | `values (${empId}, ${actor.orgId}, ${email}, ${"Simulated Support"}, ${role.id}, ${"team_support"}, ${"ACTIVE"}, ${actor.employeeId}, now(), now())` |
| development-only fixture | `await writeAudit(sql, actor, { action: "EMPLOYEE_INVITED", targetType: "employee", targetId: empId, newState: { email, simulated: true }, reason: "E2E simulation" });` |
| development-only fixture | `values (${tkt}, ${actor.orgId}, ${"ORDER"}, ${"RESOLVED"}, ${"MED"}, ${"Simulated support ticket"}, ${empId}, ${"team_support"})` |
| development-only fixture | `await writeAudit(sql, actor, { action: "TICKET_UPDATED", targetType: "ticket", targetId: tkt, newState: { status: "RESOLVED", simulated: true }, reason: "E2E simulation" });` |
| development-only fixture | `"Simulated order placed through delivery",` |

## File: `Apps-integration-/src/lib/orderking/server/seed.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `(${ORG_ID}, ${"data_mode"}, ${JSON.stringify({ mode: "SIMULATED" })})` |
| development-only fixture | `values (${newId("rfd")}, ${ORG_ID}, ${id}, ${opts.value}, ${"COMPLETED"}, ${"Customer complaint — simulated"}, ${"emp_cs"}, ${`seed-refund-${id}`})` |

## File: `Apps-integration-/src/lib/orderking/server/session.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `isSimulated: false,` |

## File: `Apps-integration-/src/lib/orderking/types.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `isSimulated: boolean;` |

## File: `Apps-integration-/src/routes/_app/analytics.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `<p className="mb-3 text-xs text-subtle">{q.data?.period} · SIMULATED DATA</p>` |

## File: `Apps-integration-/src/routes/_app/audit.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input className="mb-4 max-w-sm" placeholder="Search action, target, employee" value={q} onChange={(e) => setQ(e.target.value)} />` |

## File: `Apps-integration-/src/routes/_app/ceo.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `runE2eSimulation,` |
| development-only fixture | `toast.success(`Simulated order ${d.orderId} delivered`);` |
| development-only fixture | `const r = await runE2eSimulation();` |
| development-only fixture | `toast.success("End-to-end admin simulation recorded in the audit log");` |
| development-only fixture | `description="Business health first. Simulation does not change a live marketplace."` |
| development-only fixture | `<p className="text-xs text-subtle">{data.period} · SIMULATED DATA</p>` |
| development-only fixture | `<p className="mb-4 text-xs text-muted">SIMULATED DATA. 10% commission is not assumed profitable — this is the actual stack.</p>` |
| development-only fixture | `<p className="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-xs">SIMULATION — DOES NOT CHANGE LIVE SYSTEM.</p>` |
| documentation example | `placeholder="Type any order: onboard restaurant with menu and dish photos, onboard rider, fix order delay, run financial audit..."` |
| development-only fixture | `<p className="text-xs text-warn">SIMULATED DATA · {d.period}</p>` |

## File: `Apps-integration-/src/routes/_app/commerce.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="max-w-xs" />` |

## File: `Apps-integration-/src/routes/_app/customers.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input placeholder="Search customers" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />` |
| documentation example | `<Input placeholder="Reason for status change" value={reason} onChange={(e) => setReason(e.target.value)} className="max-w-sm" />` |

## File: `Apps-integration-/src/routes/_app/finance.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `<p className="mb-3 text-xs text-subtle">{q.data?.period} · SIMULATED DATA</p>` |
| documentation example | `<Input className="mb-3 max-w-sm" placeholder="Reason for settlement action" value={reason} onChange={(e) => setReason(e.target.value)} />` |

## File: `Apps-integration-/src/routes/_app/index.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `<Kpi label="Contribution" value={q.data?.kpis ? formatINR(q.data.kpis.contributionPaise) : dash(undefined)} hint="After variable costs. Simulated." />` |

## File: `Apps-integration-/src/routes/_app/kyc.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input className="mb-4 max-w-sm" placeholder="Reason for decision" value={reason} onChange={(e) => setReason(e.target.value)} />` |

## File: `Apps-integration-/src/routes/_app/orders.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input placeholder="Order, customer, restaurant, rider" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />` |

## File: `Apps-integration-/src/routes/_app/people.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />` |
| documentation example | `<Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />` |
| documentation example | `<Input placeholder="Reason for suspend/role change" value={reason} onChange={(e) => setReason(e.target.value)} className="max-w-md" />` |

## File: `Apps-integration-/src/routes/_app/restaurants.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input placeholder="Search restaurants" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />` |
| documentation example | `<Input placeholder="Reason for change" value={reason} onChange={(e) => setReason(e.target.value)} className="max-w-sm" />` |

## File: `Apps-integration-/src/routes/_app/riders.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input className="mb-4 max-w-sm" placeholder="Reason for suspend/restore" value={reason} onChange={(e) => setReason(e.target.value)} />` |

## File: `Apps-integration-/src/routes/_app/risk.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input className="mb-4 max-w-sm" placeholder="Reason for decision" value={reason} onChange={(e) => setReason(e.target.value)} />` |

## File: `Apps-integration-/src/routes/_app/search.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input className="mb-4 max-w-lg" placeholder="Order, restaurant, rider, customer, employee" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />` |

## File: `Apps-integration-/src/routes/_app/system.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input className="mt-4 max-w-sm" placeholder="Reason for changes" value={reason} onChange={(e) => setReason(e.target.value)} />` |

## File: `Apps-integration-/src/routes/login.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `<p className="text-xs text-subtle">Guwahati · Commercial operations · Simulated marketplace until Shared Core</p>` |

## File: `Apps-integration-/vite.config.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// TanStack Start / the SPA HTML fallback. A model-authored` |

## File: `HDmaster/scripts/gen_migration_0010.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `sql += '  sample_component_code TEXT\n';` |
| actual fake production functionality | `sql += `INSERT INTO founder_separable_modules (id, name, tagline, description, category, standalone_route, subdomain_url, files_count, bundle_size_kb, tech_stack, standalone_package_json, sample_component_code) VALUES (${escapeSql(m.id)}, ${escapeSql(m.name)}, ${escapeSql(m.tagline)}, ${escapeSql(m.description)}, ${escapeSql(m.category)}, ${escapeSql(m.standaloneRoute)}, ${escapeSql(m.subdomainUrl)}, ${m.filesCount}, ${m.bundleSizeKb}, ${escapeSql(JSON.stringify(m.techStack))}, ${escapeSql(JSON.stringify(m.standalonePackageJson))}, ${escapeSql(m.sampleComponentCode)});\n`;` |

## File: `HDmaster/scripts/seed-data.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `Let's hop on a 15-minute sync to review my live architecture demo.`,` |
| actual fake production functionality | `"Scale-up building high-performance marketplace apps. Needs an expert who writes pristine, minimal diff code with zero placeholders.",` |
| actual fake production functionality | `I design and ship complete, production-grade marketplaces with React 19, TanStack Router, and real-time WebSockets dispatch. My code adheres to strict zero-placeholder standards, full type safety, and responsive glassmorphism UI.` |
| development-only fixture | `I can integrate and benchmark this within your app within 48 hours. Let's schedule a live voice demo.`,` |
| actual fake production functionality | `sampleComponentCode: `import React, { useState } from "react";` |
| actual fake production functionality | `sampleComponentCode: `import { Router } from "express";` |
| documentation example | `placeholder="Enter patient name..."` |

## File: `HDmaster/server/middleware/01-security-and-rate-limit.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `setResponseHeader(event, "Access-Control-Allow-Origin", "https://customer.orderking.app"); // fallback` |

## File: `HDmaster/src/components/command/ai-media-studio-modal.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real image generation API is not connected.");` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real video generation API is not connected.");` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real multi-scene generation API is not connected.");` |
| documentation example | `placeholder="Describe scene (e.g. 'OrderKing autonomous delivery drone flying over skyline at sunset, 8K')..."` |
| documentation example | `placeholder="Describe motion scene (e.g. 'Hyper-speed delivery drone flight through futuristic city')..."` |

## File: `HDmaster/src/components/command/app-factory-workspace.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `Interactive Client Simulation Sandbox Active` |

## File: `HDmaster/src/components/command/business-os-command-center-modal.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="Enter any business command (e.g. 'Audit kitchen SLAs and disburse rider payouts' or 'Discover sales leads')..."` |
| actual fake production functionality | `<Badge className="bg-amber-500/20 text-amber-300 text-[9px] font-mono">0% FAKE</Badge>` |

## File: `HDmaster/src/components/command/founder-ai-os-shell.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `{p.isConfigured ? "CONFIGURED" : "FALLBACK ACTIVE"}` |

## File: `HDmaster/src/components/command/founder-income-products.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="e.g. Turnkey Food Delivery Platform License"` |
| documentation example | `placeholder="25000"` |

## File: `HDmaster/src/components/command/founder-sovereign-deck.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `const [productionMode, setProductionMode] = useState<"LIVE_PRODUCTION" \| "SIMULATION_TEST">("LIVE_PRODUCTION");` |
| development-only fixture | `// Simulation Mutation` |
| development-only fixture | `toast.success(`Simulation advanced ${r.advanced} orders through lifecycle!`);` |
| development-only fixture | `addAuditEntry("SIMULATION_ADVANCE", `Advanced ${r.advanced} simulated orders`);` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real broadcast API is not connected.");` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real batch settlement API is not connected.");` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real KYC API is not connected.");` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real search reindexing API is not connected.");` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real cache purge API is not connected.");` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real self-upgrade API is not connected.");` |
| documentation example | `placeholder="e.g. Heavy rain in Station Road zone: Drive safely, ₹25 extra incentive applied to all orders!"` |

## File: `HDmaster/src/components/command/growth-vault.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real DNS testing API is not connected.");` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real revenue harvest API is not connected.");` |

## File: `HDmaster/src/components/command/order-king-command-suite-modal.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real automated call dispatch is not implemented yet.");` |

## File: `HDmaster/src/components/command/pages.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `if (r.ok) toast.message(`Simulation advanced ${r.advanced} orders`);` |
| development-only fixture | `Advance simulation` |
| development-only fixture | `<MetricCard label="Delayed now" value={formatNumber(data.live.delayedOrders)} tone="danger" source="SIMULATED" />` |
| development-only fixture | `<MetricCard label="Unassigned" value={formatNumber(data.live.unassignedOrders)} tone="warning" source="SIMULATED" />` |
| development-only fixture | `<Panel title={data?.trackingEnabled ? "Rider positions (SIMULATED)" : "Live tracking flag is OFF"}>` |
| development-only fixture | `GPS last-fix · SIMULATED · not a street map` |
| documentation example | `<SearchBox value={q} onChange={setQ} placeholder="ID or restaurant" />` |
| development-only fixture | `<p className="text-xs text-muted">Refunds are allowed from DELIVERED / CANCELLED / failed states. Live orders must be cancelled first. Reassign is a request to the dispatcher, applied locally only in simulation.</p>` |
| development-only fixture | `<MetricCard label="Orders" value={formatNumber(r.performance.orders)} source="SIMULATED" />` |
| development-only fixture | `<MetricCard label="GMV" value={money(r.performance.gmv)} source="SIMULATED" />` |
| development-only fixture | `<MetricCard label="AOV" value={money(r.performance.aov)} source="SIMULATED" />` |
| development-only fixture | `<MetricCard label="Cancel rate" value={`${(r.performance.cancellationRate * 100).toFixed(1)}%`} source="SIMULATED" />` |
| development-only fixture | `{r.lat != null ? <p className="text-xs text-muted">Last operational fix {r.lat.toFixed(3)}, {r.lng?.toFixed(3)} (SIMULATED)</p> : null}` |
| documentation example | `<Input placeholder="Zone name" value={name} onChange={(e) => setName(e.target.value)} />` |
| documentation example | `<Textarea className="mt-3" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Reply or internal note" />` |
| documentation example | `<Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />` |
| documentation example | `<Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New banner title" />` |
| development-only fixture | `<span className="font-semibold text-primary">{ecosystem?.dataMode ?? "SIMULATED"}</span>` |
| fail-closed production behavior | `<p className="text-[11px] text-muted">Dispatches exclusively to the single closest online rider via GPS distance. Cascades decline fallbacks with dynamic bounty surge, eliminating random allocation.</p>` |
| documentation example | `placeholder="Enter command, investigation request, or engineering task..."` |
| documentation example | `<Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />` |
| documentation example | `<Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />` |
| documentation example | `<Input type="number" placeholder="Start (4)" value={cur.dayModeStartHour ?? 4} onChange={(e) => set("dayModeStartHour", Number(e.target.value))} />` |
| documentation example | `<Input type="number" placeholder="End (18)" value={cur.eveningModeStartHour ?? 18} onChange={(e) => set("eveningModeStartHour", Number(e.target.value))} />` |
| documentation example | `<Input type="number" placeholder="Start (23)" value={cur.nightModeStartHour ?? 23} onChange={(e) => set("nightModeStartHour", Number(e.target.value))} />` |
| documentation example | `<Input type="number" placeholder="End (4)" value={cur.nightModeEndHour ?? 4} onChange={(e) => set("nightModeEndHour", Number(e.target.value))} />` |
| actual fake production functionality | `Toggle live verification mode to strip all "Sample" tags across customer apps for verified kitchens and display genuine operational hours and real GPS kitchen locations.` |
| actual fake production functionality | `variant={cur.sampleCatalogueBanner === false ? "primary" : "secondary"}` |
| actual fake production functionality | `onClick={() => set("sampleCatalogueBanner" as any, !cur.sampleCatalogueBanner)}` |
| actual fake production functionality | `Sample Banner: {cur.sampleCatalogueBanner === false ? "DISABLED (Live Clean)" : "ENABLED (Sample)"}` |
| documentation example | `placeholder="postgresql://user:password@host:5432/dbname?sslmode=require"` |
| documentation example | `placeholder="Min (2)"` |
| documentation example | `placeholder="Max (10)"` |
| fail-closed production behavior | `variant={cur.database.offlineFallbackEnabled ? "primary" : "secondary"}` |
| fail-closed production behavior | `onClick={() => updateDb({ offlineFallbackEnabled: !cur.database.offlineFallbackEnabled })}` |
| fail-closed production behavior | `2G Offline Fallback: {cur.database.offlineFallbackEnabled ? "ON" : "OFF"}` |
| documentation example | `placeholder="https://orderking.in"` |
| documentation example | `placeholder="https://partner.orderking.in"` |
| documentation example | `placeholder="https://rider.orderking.in"` |
| documentation example | `placeholder="https://admin.orderking.in"` |
| development-only fixture | `<option value="SIMULATION">Local Simulation (Dev)</option>` |
| development-only fixture | `<option value="SIMULATION">Local Simulation</option>` |
| documentation example | `placeholder="ORDKNG"` |
| documentation example | `placeholder="110152918291829182"` |
| documentation example | `placeholder="11071629182918291"` |
| documentation example | `placeholder="U55101AS2026PTC018492"` |
| documentation example | `placeholder="AAFCO9182K"` |
| documentation example | `placeholder="18AAFCO9182K1Z5"` |
| documentation example | `placeholder="10326999000184"` |
| documentation example | `placeholder="Bank Name"` |
| documentation example | `placeholder="Account Number"` |
| documentation example | `placeholder="HDFC0002049"` |
| documentation example | `placeholder="orderking@hdfcbank"` |
| development-only fixture | `<option value="PAN_INDIA_SYNTHETIC">🧪 Pan-India Synthetic Simulation</option>` |
| documentation example | `placeholder="Karimganj"` |
| documentation example | `<SearchBox value={qtext} onChange={setQtext} placeholder="Action or target id" />` |
| documentation example | `placeholder="Enter Restaurant ID (e.g. rest_1)"` |
| documentation example | `placeholder="Enter Restaurant ID (e.g. rest_1)"` |
| documentation example | `placeholder="Enter Batch ID (e.g. sb_123)"` |
| documentation example | `<Input placeholder="Code (e.g. DEL)" value={origin} onChange={(e: any) => setOrigin(e.target.value)} />` |
| documentation example | `<Input placeholder="Code (e.g. BOM)" value={destination} onChange={(e: any) => setDestination(e.target.value)} />` |

## File: `HDmaster/src/components/command/platform-integrations-modal.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="Search 500+ apps by name, category, or capability (e.g. WhatsApp, Zomato, PhonePe, AWS, OpenAI, Shopify)..."` |
| documentation example | `className="pl-10 h-10 bg-[#030a0d] border-cyan-500/30 text-xs text-slate-100 rounded-xl focus:border-cyan-400 placeholder:text-slate-500"` |
| documentation example | `placeholder='e.g. {"repoName": "client-portal", "amount": 2500, "recipient": "+91 94351 XXXXX"}'` |

## File: `HDmaster/src/components/command/revenue-operating-system-dashboard.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder='Try: "Show me today&apos;s revenue", "Find me new development opportunities", "What is blocking current projects?"'` |
| fail-closed production behavior | `Plug-and-play adapters for AI, Payments, Cloud, and Git with 3-tier fallback.` |

## File: `HDmaster/src/components/command/shell.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `{employee?.dataMode === "SIMULATED" ? (` |
| development-only fixture | `Simulated / development data — not production marketplace activity. Windows 1–3 are not connected yet.` |
| documentation example | `placeholder="Find delayed orders today…"` |

## File: `HDmaster/src/components/command/supreme-creator-engine.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real generation API is not connected.");` |
| documentation example | `placeholder="Describe what you want to create (e.g. 'Build a complete digital product store with UPI payment link, automated licensing, and customer portal')..."` |
| documentation example | `className="w-full rounded-xl border border-white/20 bg-black/60 p-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-inner font-sans resize-none"` |

## File: `HDmaster/src/components/command/supreme-founder-ai-chat.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `// Live Sandbox States for interactive demonstration` |
| development-only fixture | `Live Interactive Sandbox Mockup (Fully Functional Simulation)` |
| actual fake production functionality | `{/* Hospital ERP Interactive Mockup */}` |
| documentation example | `placeholder="Patient name (e.g. Joya Das)..."` |
| actual fake production functionality | `{/* Multi-Vendor Marketplace Interactive Mockup */}` |
| development-only fixture | `<span className="text-xs font-bold text-white block">Add Demo Items to Cart</span>` |
| actual fake production functionality | `{/* FinTech Ledger Interactive Mockup */}` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real video rendering API is not connected.");` |
| development-only fixture | `{/* 3. Live Video Canvas & Subtitles Simulation */}` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real restart API is not connected.");` |
| actual fake production functionality | `throw new Error("NO MOCK CLAIMS: Real refresh API is not connected.");` |
| actual fake production functionality | `sampleCode: mod.sampleComponentCode,` |
| actual fake production functionality | `code: mod.sampleComponentCode,` |
| actual fake production functionality | `100% STRICT ACCURACY · NO FAKE` |
| documentation example | `placeholder="Search chats, models, tasks..."` |
| documentation example | `className="w-full bg-zinc-900/90 rounded-lg pl-8 pr-6 py-1.5 text-xs text-zinc-200 border border-zinc-700/80 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition"` |
| documentation example | `placeholder="Ask anything"` |
| documentation example | `className="flex-1 bg-transparent border-none resize-none py-[10px] px-2 text-slate-100 text-[15px] placeholder:text-slate-400 focus:outline-none max-h-[120px] min-h-[44px]"` |
| documentation example | `placeholder="Ask anything"` |
| documentation example | `className="flex-1 bg-transparent border-none resize-none py-[10px] px-2 text-slate-100 text-[15px] placeholder:text-slate-400 focus:outline-none max-h-[120px] min-h-[44px]"` |

## File: `HDmaster/src/components/command/system-master-settings-modal.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="AIzaSy..."` |
| actual fake production functionality | `className="flex-1 bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"` |
| documentation example | `placeholder="sk-ant-..."` |
| actual fake production functionality | `className="flex-1 bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"` |
| documentation example | `placeholder="sk-..."` |
| actual fake production functionality | `className="flex-1 bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"` |
| documentation example | `placeholder="xai-..."` |
| actual fake production functionality | `className="flex-1 bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"` |

## File: `HDmaster/src/components/command/widgets.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `<Badge tone={source === "SIMULATED" ? "warning" : source === "ESTIMATE" \|\| source === "MODEL" ? "info" : "default"}>` |
| documentation example | `<Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this action?" />` |
| actual fake production functionality | `placeholder,` |
| actual fake production functionality | `placeholder?: string;` |
| documentation example | `placeholder={placeholder ?? "Filter"}` |

## File: `HDmaster/src/components/ui/input.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `"h-10 w-full rounded-[10px] border border-border bg-elevated px-3 text-sm text-fg placeholder:text-subtle",` |
| documentation example | `"min-h-24 w-full rounded-[12px] border border-border bg-elevated px-3 py-2 text-sm text-fg placeholder:text-subtle",` |

## File: `HDmaster/src/lib/app-data/app-data.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `import { describe, it, mock } from "node:test";` |
| legitimate automated-test fixture | `function fakeJwt(claims: Record<string, unknown>): string {` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-1", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-2", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-2", iat: 1001, exp: 2001 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-3", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `mock.timers.enable({ apis: ["Date"], now: 1_000_000 });` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-5", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `mock.timers.setTime(1_000_000 + 5_001);` |
| legitimate automated-test fixture | `mock.timers.reset();` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-4", iat: 1000, exp: 2000 }),` |

## File: `HDmaster/src/lib/auth/client.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Fallback when the user dismisses the popup. Grace period lets the` |

## File: `HDmaster/src/lib/auth/preview.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `* the live preview do REAL sign-in — no demo/mock users — with no platform` |

## File: `HDmaster/src/lib/auth/server.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `*     origin from the request, so real sign-in works (no demo users). Sessions` |
| fail-closed production behavior | `fallback: "http://localhost:8080",` |

## File: `HDmaster/src/lib/auth/use-current-user.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** True when this is the sandbox/dev fallback (auth not configured). */` |
| fail-closed production behavior | `isDevFallback: boolean;` |
| fail-closed production behavior | `* Stable fallback user, used ONLY when auth is disabled` |
| fail-closed production behavior | `isDevFallback: true,` |
| fail-closed production behavior | `isDevFallback: false,` |

## File: `HDmaster/src/lib/auth/verify.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** Dev fallback user id, used only when auth is disabled (VITE_AUTH_ENABLED=false). */` |

## File: `HDmaster/src/lib/db.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// "unset" — otherwise production would silently run on the PGLite fallback.` |
| actual fake production functionality | `// Rebuild with $1, $2, … placeholders so values stay parameterized.` |
| fail-closed production behavior | `* otherwise the local PGLite fallback. Memoized — safe to call per request.` |
| fail-closed production behavior | `throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");` |

## File: `HDmaster/src/lib/orderking/actions.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `const { tickSimulation } = await import("@/lib/orderking/server/queries.server");` |
| development-only fixture | `const tick = await tickSimulation(ws);` |
| development-only fixture | `csv = "metric,paise,label\nGMV," + fin.gmv + ",SIMULATED\ncontribution," + fin.contribution.total + ",ESTIMATE\n";` |
| development-only fixture | `type ToolResult = { tool: string; label: "SIMULATED" \| "ACTUAL" \| "ESTIMATE"; data: unknown };` |
| development-only fixture | `out.push({ tool, label: "SIMULATED", data: await q.financeSummary(ws.ctx) });` |
| development-only fixture | `out.push({ tool, label: "SIMULATED", data: await q.ceoBrief(ws.ctx) });` |
| development-only fixture | `out.push({ tool, label: "SIMULATED", data: await q.listOrders(ws.ctx, { delayed: true, limit: 15 }) });` |
| development-only fixture | `out.push({ tool, label: "SIMULATED", data: await q.listRestaurants(ws.ctx) });` |
| development-only fixture | `out.push({ tool, label: "SIMULATED", data: await q.listRiders(ws.ctx) });` |
| development-only fixture | `out.push({ tool, label: "SIMULATED", data: await q.listTickets(ws.ctx) });` |
| development-only fixture | `out.push({ tool, label: "SIMULATED", data: await q.listRisk(ws.ctx) });` |
| development-only fixture | `out.push({ tool, label: "SIMULATED", data: await q.dashboardPayload(ws) });` |
| development-only fixture | `out.push({ tool, label: "SIMULATED", data: await q.listPromotions(ws.ctx) });` |
| development-only fixture | `out.push({ tool, label: "SIMULATED", data: await q.listCustomers(ws.ctx) });` |

## File: `HDmaster/src/lib/orderking/ai/agent-tools/agent-tool-system.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `dataMode?: "SIMULATION" \| "PRODUCTION";` |

## File: `HDmaster/src/lib/orderking/ai/autonomous-model-updater.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `// Checks API keys and reports truthful connection telemetry without simulations.` |

## File: `HDmaster/src/lib/orderking/ai/business-os-modules.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `// Discovers genuine local restaurants paying extortionate commissions without fake promises` |

## File: `HDmaster/src/lib/orderking/ai/executive-dossiers.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `"Built with edge TypeScript/Vite/Nitro architecture, embedded relational storage, automated SMS/OTP fallback for poor connectivity, and real-time GPS proximity routing.",` |
| development-only fixture | `We would also be delighted to demonstrate our live production system, share architectural learnings on low-latency edge systems, and offer summer internship / project opportunities to talented IIT Guwahati students.` |

## File: `HDmaster/src/lib/orderking/ai/instant-deploy-engine.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `<span>Sovereign Deployment by Umar OS · Zero Mock Sandbox</span>` |

## File: `HDmaster/src/lib/orderking/ai/live-orchestration-engine.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Deterministic high-speed semantic generation fallback if API key is not supplied in dev` |
| fail-closed production behavior | `// Safe fallback verdict` |
| fail-closed production behavior | `model: "fallback",` |
| fail-closed production behavior | `keyInsights: ["Fallback triggered"],` |

## File: `HDmaster/src/lib/orderking/ai/master-ai-command.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `test("Order King Master AI - Multi-Model Routing & Local Fallback", () => {` |

## File: `HDmaster/src/lib/orderking/ai/master-ai-runtime.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `out[key] = key === "label" && item === "SIMULATED" ? "ACTUAL" : normalizeToolEvidence(item, dataMode);` |
| fail-closed production behavior | `// Non-blocking fallback for audit logging in mock/preview modes` |
| development-only fixture | `status: "LOCAL_SIMULATION",` |
| fail-closed production behavior | `ussdFallbackActive: true,` |
| fail-closed production behavior | `"Zero-dependency lightweight SVG fallbacks for slow 2G asset loads",` |
| actual fake production functionality | `rootedMockLocationBlocks: 27,` |

## File: `HDmaster/src/lib/orderking/ai/media-storage-vault.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// LocalStorage fallback` |

## File: `HDmaster/src/lib/orderking/ai/providers/gemini-provider.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `// Mock initialization to satisfy typescript, will throw in isConfigured check` |

## File: `HDmaster/src/lib/orderking/ai/providers/index.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Auto-fallback hierarchy` |
| fail-closed production behavior | `async executeWithFallback(request: ChatRequest, preferredId?: string): Promise<ChatResponse> {` |

## File: `HDmaster/src/lib/orderking/ai/providers/openai-provider.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `systemPrompt: "You are an expert full-stack engineer. Return zero-placeholder code. Return strictly valid JSON with keys: 'code' (string), 'explanation' (string), 'unitTests' (optional string), 'dependencies' (optional array of strings).",` |

## File: `HDmaster/src/lib/orderking/ai/providers/xai-provider.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `parsed = { code: res.text, explanation: "Fallback parse." };` |

## File: `HDmaster/src/lib/orderking/ai/real-model-registry.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `fallbackModelId: string;` |
| fail-closed production behavior | `// Browser localStorage fallback if available` |
| fail-closed production behavior | `fallbackModelId: "self",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |

## File: `HDmaster/src/lib/orderking/ai/specialists.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `- Never generate simulated or placeholder code presented as real.` |
| development-only fixture | `- Clearly label whether numbers are ACTUAL or SIMULATED.` |

## File: `HDmaster/src/lib/orderking/ai/supreme-founder-ai-core.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `sampleComponentCode: string;` |
| fail-closed production behavior | `// Open-world universal cognitive intelligence fallback: Handles medical, coding, math, science, strategy & general Q&A` |
| development-only fixture | `q.includes("democracy") \|\|` |
| development-only fixture | `- **Structural Forces**: Historical transformations are rarely driven by single individuals; they emerge from the intersection of technological shifts, demographic pressures, resource distribution, and ideological revolutions.` |

## File: `HDmaster/src/lib/orderking/ai/system-master-controller.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Fallback` |
| fail-closed production behavior | `"Local Deterministic Fallback Engine",` |

## File: `HDmaster/src/lib/orderking/ai/tool-registry.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `const LIVE = ["SIMULATED", "PRODUCTION"] as const;` |

## File: `HDmaster/src/lib/orderking/ai/universal-platform-manager.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `// Strict Rule: Zero false simulations. Truthful status reporting based on real credentials & deep-links.` |
| fail-closed production behavior | `{ id: "app-dunzo", name: "Dunzo for Business API", category: "logistics", description: "Third-party on-demand delivery fallback during peak demand surges", iconName: "Truck", authMethod: "API Key", status: "CONNECTED", actions: ["create_task", "cancel_task"] },` |

## File: `HDmaster/src/lib/orderking/ai/universal-superintelligence-engine.server.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `* - If no API key is configured, the task is BLOCKED — never faked` |
| actual fake production functionality | `* NEVER returns local-deterministic. NEVER fakes.` |
| actual fake production functionality | `"mock data", "simulated", "placeholder", "dummy data",` |
| actual fake production functionality | `"example purposes", "as an AI", "fake data", "[insert"` |
| development-only fixture | `The underlying model (${primaryProvider.id}) attempted to generate simulated or placeholder data.` |
| actual fake production functionality | `// Keep primaryResult — don't fake the cross-check` |

## File: `HDmaster/src/lib/orderking/ai/workspace-repos.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Option 3: Hardcoded known workspace fallback` |

## File: `HDmaster/src/lib/orderking/business/company-factory.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `this.seedSampleCompany();` |
| actual fake production functionality | `private seedSampleCompany() {` |
| fail-closed production behavior | `bottleneckIdentified: "Sequential provider handshake in model fallback hierarchy.",` |

## File: `HDmaster/src/lib/orderking/business/work-discovery-agent.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `requiredCredentials: ["Verified GitHub Portfolio", "Production Ledger Demo"],` |
| development-only fixture | `requiredCredentials: ["Live Marketplace Demo", "Clean TypeScript Codebase"],` |

## File: `HDmaster/src/lib/orderking/constants.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `export const DATA_MODES = ["SIMULATED", "SANDBOX", "LIVE"] as const;` |

## File: `HDmaster/src/lib/orderking/finance/profit-engine.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `participantMutualBenefit: "Customers receive complimentary beverage and snack samples in their food orders.",` |

## File: `HDmaster/src/lib/orderking/finance/revenue-harvester.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `* 2. Zero fake / simulated data: Every calculation uses strict integer paise.` |

## File: `HDmaster/src/lib/orderking/golive/golive-engine.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `offlineFallbackEnabled: true,` |
| actual fake production functionality | `status: "MOCK_ACTIVE",` |
| actual fake production functionality | `apiKey: "CF_APP_MOCK_8921829182",` |
| actual fake production functionality | `secretKey: "CF_SECRET_MOCK_9819281928192",` |
| actual fake production functionality | `status: "MOCK_ACTIVE",` |
| actual fake production functionality | `apiKey: "F2SMS_KEY_MOCK_91829182",` |
| fail-closed production behavior | `autoFallbackToSimulation: true,` |
| actual fake production functionality | `status: "MOCK_ACTIVE",` |
| actual fake production functionality | `apiKey: "AIzaSyMockKeyForOrderKingLiveMaps9812",` |
| actual fake production functionality | `status: "MOCK_ACTIVE",` |
| fail-closed production behavior | `if (config.database.offlineFallbackEnabled) {` |
| fail-closed production behavior | `commWarnings.push("SMS Gateway API key missing. Operating in fallback simulation mode.");` |
| fail-closed production behavior | `commWarnings.push("Google Maps API key missing. Using Haversine 1.35x distance matrix fallback.");` |
| development-only fixture | `// Simulated handshake or connection pool ping` |
| development-only fixture | `return { ok: false, message: "Missing SMS Gateway API Key. Operating in local simulation.", latencyMs: 0 };` |

## File: `HDmaster/src/lib/orderking/golive/types.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `\| "SIMULATION";` |
| development-only fixture | `\| "SIMULATION";` |
| actual fake production functionality | `\| "MOCK_ACTIVE"` |
| fail-closed production behavior | `offlineFallbackEnabled: boolean;` |
| fail-closed production behavior | `autoFallbackToSimulation: boolean;` |

## File: `HDmaster/src/lib/orderking/i18n.ts`

| Category | Match |
| -------- | ----- |
| documentation example | `common: { simulated: "Simulated / development data", actual: "Actual", estimate: "Estimate", forecast: "Forecast", model: "Model", search: "Search Command", save: "Save", cancel: "Cancel", confirm: "Confirm", reason: "Reason", export: "Export CSV", empty: "Nothing to show", loading: "Loading", delayed: "Delayed", online: "Online", offline: "Offline" },` |
| documentation example | `common: { simulated: "সিমুলেটেড / ডেভেলপমেন্ট ডেটা", actual: "প্রকৃত", estimate: "আনুমানিক", forecast: "পূর্বাভাস", model: "মডেল", search: "কমান্ড খুঁজুন", save: "সংরক্ষণ", cancel: "বাতিল", confirm: "নিশ্চিত", reason: "কারণ", export: "CSV রপ্তানি", empty: "দেখানোর কিছু নেই", loading: "লোড হচ্ছে", delayed: "বিলম্বিত", online: "অনলাইন", offline: "অফলাইন" },` |

## File: `HDmaster/src/lib/orderking/integrations/contracts.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `label: "SIMULATED" \| "WINDOW1" \| "WINDOW2" \| "WINDOW3" \| "WINDOW5";` |

## File: `HDmaster/src/lib/orderking/orders/e2e.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `// 1. Setup Test Data` |
| legitimate automated-test fixture | `await sql.query(`INSERT INTO restaurants (id, name, slug, zone_id, status, data_label) VALUES ('${restaurantId}', 'Test Kitchen', 'test-kitchen', '${zoneId}', 'ACTIVE', 'SIMULATED') ON CONFLICT (id) DO NOTHING`);` |

## File: `HDmaster/src/lib/orderking/orders/state-machine.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `\| "simulated_rider";` |
| development-only fixture | `READY: { RIDER_ASSIGNED: ["rider", "admin", "system", "simulated_rider"], CANCELLED: ["admin"] },` |
| development-only fixture | `RIDER_ASSIGNED: { PICKED_UP: ["rider", "admin", "system", "simulated_rider"], RIDER_CANCELLED: ["rider", "admin", "system"], CANCELLED: ["admin"] },` |
| development-only fixture | `PICKED_UP: { ON_THE_WAY: ["rider", "admin", "system", "simulated_rider"], DELIVERY_FAILED: ["rider", "admin", "system"] },` |
| development-only fixture | `ON_THE_WAY: { ARRIVING: ["rider", "admin", "system", "simulated_rider"], DELIVERY_FAILED: ["rider", "admin", "system"], CUSTOMER_UNAVAILABLE: ["rider", "admin", "system"] },` |
| development-only fixture | `ARRIVING: { DELIVERED: ["rider", "admin", "system", "simulated_rider"], CUSTOMER_UNAVAILABLE: ["rider", "admin", "system"], DELIVERY_FAILED: ["rider", "admin", "system"] },` |

## File: `HDmaster/src/lib/orderking/platform-hardening.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `assert.ok(!rendered.body.includes("{orderId}"), "Should not have raw placeholder");` |
| legitimate automated-test fixture | `it("handles #{var} hash-placeholder pattern", () => {` |

## File: `HDmaster/src/lib/orderking/revenue-os/business-intelligence-engine.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `highestRevenueWork: { category: string; amountInr: number; sampleSize: number };` |
| actual fake production functionality | `sampleSize: verifiedPayments.length,` |

## File: `HDmaster/src/lib/orderking/revenue-os/capability-benchmark-suite.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `{ dimension: "QA_Self_Healing", measuredScore: 91, latencyMs: 450, successRate: 0.93, notes: "Auto-diagnosis and re-test on simulated assertion failures" },` |

## File: `HDmaster/src/lib/orderking/revenue-os/client-acquisition-machine.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `"Would you be open to a 10-minute demonstration this Thursday?",` |
| development-only fixture | `"Would you like to review our live demo storefront?",` |

## File: `HDmaster/src/lib/orderking/revenue-os/index.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `// Zero-Fabrication: No fake money, no fake customers, no fake jobs, no fake test results.` |

## File: `HDmaster/src/lib/orderking/revenue-os/opportunity-engine.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `const timeToFirstDeliverableHours = effort <= 80 ? 24 : 48; // Initial demo/scaffold` |

## File: `HDmaster/src/lib/orderking/revenue-os/revenue-os.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `// Run with simulated failure and self-healing` |
| legitimate automated-test fixture | `test('Revenue OS Directives 18 & 19: Universal Connectors & 3-Tier Fallback', async () => {` |
| legitimate automated-test fixture | `const res = await universalConnectors.executeWithFallback({` |
| legitimate automated-test fixture | `// Fallback to secondary when primary invalid` |
| legitimate automated-test fixture | `const fallbackRes = await universalConnectors.executeWithFallback({` |
| legitimate automated-test fixture | `assert.equal(fallbackRes.success, true);` |
| legitimate automated-test fixture | `assert.equal(fallbackRes.executedBy, 'PostgreSQL Sovereign Ledger Connector');` |
| legitimate automated-test fixture | `const allFailRes = await universalConnectors.executeWithFallback({` |

## File: `HDmaster/src/lib/orderking/revenue-os/self-qa-engine.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `{ type: "E2E_TESTS", label: "Critical customer checkout flow simulation" },` |
| development-only fixture | `const isSimulatedFail = simulateFailureKey === check.type;` |
| development-only fixture | `if (isSimulatedFail) {` |

## File: `HDmaster/src/lib/orderking/revenue-os/supreme-task-executor.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `title: "Queue Personalized ROI Pitches with 0% Fee Demonstration",` |

## File: `HDmaster/src/lib/orderking/revenue-os/universal-connectors.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Universal Connector Architecture & 3-Tier Provider Fallback (Directives 18 & 19)` |
| fail-closed production behavior | `// 3-Tier Fallback Hierarchy: PRIMARY → SECONDARY → TERTIARY → SAFE FAILURE + HUMAN NOTICE.` |
| fail-closed production behavior | `// Directive 19: 3-Tier Fallback Execution` |
| fail-closed production behavior | `async executeWithFallback<T>(params: {` |

## File: `HDmaster/src/lib/orderking/revenue-os/voice-founder-mode.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// 5. Default fallback to live OS status` |

## File: `HDmaster/src/lib/orderking/security/rbac-vault.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `* Missing configuration is an error, never a permissive fallback.` |

## File: `HDmaster/src/lib/orderking/server/NotificationService.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `// Simulated FCM request` |
| fail-closed production behavior | `console.log(`[Push Notification] No FCM token/keys available for ${payload.recipient.userId}. Proceeding with fallback.`);` |
| fail-closed production behavior | `// Fallback: log to analytics_events / notifications` |
| fail-closed production behavior | `// Fallback to analytics_events` |
| fail-closed production behavior | `} catch (fallbackErr) {` |
| fail-closed production behavior | `console.error(`[Push Notification] Fallback logging failed`, fallbackErr);` |

## File: `HDmaster/src/lib/orderking/server/admin-http.server.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `if (method === "GET" && path === "dashboard") return json({ data: await q.dashboardPayload(ws), label: "SIMULATED" });` |
| development-only fixture | `return json({ ok: true, note: "Dispatch reassignment is a REQUEST to the core matcher. Applied locally in simulation only." });` |
| development-only fixture | `return json({ ok: true, label: "SIMULATED" });` |
| development-only fixture | `return json({ ok: true, label: "SIMULATED" });` |

## File: `HDmaster/src/lib/orderking/server/ai-chat-service.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `return { status: "ERROR", action: "Missing orderId or riderId for genuine dispatch. Simulated fallback rejected by Supreme HDmaster AI." };` |
| fail-closed production behavior | `return { status: "ERROR", action: "Missing ticketId or orderId for genuine customer support resolution. Simulated fallback rejected." };` |
| fail-closed production behavior | `// Single engine fallback` |
| fail-closed production behavior | `// Default local fallback` |
| fail-closed production behavior | `label: "Local Core Fallback",` |
| fail-closed production behavior | `// 5. No external provider available — honest fallback` |

## File: `HDmaster/src/lib/orderking/server/push-notifications.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `* supporting FCM (Firebase Cloud Messaging), Web Push, and SMS fallback.` |
| actual fake production functionality | `const placeholder = `{${key}}`;` |
| actual fake production functionality | `title = title.replaceAll(placeholder, String(value));` |
| actual fake production functionality | `body = body.replaceAll(placeholder, String(value));` |
| actual fake production functionality | `const hashPlaceholder = `#{${key}}`;` |
| actual fake production functionality | `title = title.replaceAll(hashPlaceholder, String(value));` |
| actual fake production functionality | `body = body.replaceAll(hashPlaceholder, String(value));` |

## File: `HDmaster/src/lib/orderking/server/queries.server.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `orders: { value: n(k.orders), label: "SIMULATED" as const },` |
| development-only fixture | `gmv: { value: n(k.gmv), label: "SIMULATED" as const },` |
| development-only fixture | `platformRevenue: canFinance ? { value: n(k.revenue), label: "SIMULATED" as const } : null,` |
| development-only fixture | `restaurantSettlements: canFinance ? { value: n(k.settlements), label: "SIMULATED" as const } : null,` |
| development-only fixture | `riderPayoutExposure: canFinance ? { value: n(k.rider_pay), label: "SIMULATED" as const } : null,` |
| development-only fixture | `refunds: { value: n(k.refunds), label: "SIMULATED" as const },` |
| development-only fixture | `cancellations: { value: n(k.cancels), label: "SIMULATED" as const },` |
| development-only fixture | `activeRestaurants: { value: n(l.active_rst), label: "SIMULATED" as const },` |
| development-only fixture | `onlineRiders: { value: n(l.online_riders), label: "SIMULATED" as const },` |
| development-only fixture | `activeDeliveries: { value: n(l.active_del), label: "SIMULATED" as const },` |
| development-only fixture | `supportLoad: { value: n(support[0]?.n), label: "SIMULATED" as const },` |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `values ($1,$2,$3,'customer','order_issue','OPEN','HIGH',$4,$5,$6,'SIMULATED')`,` |
| development-only fixture | `? `Dispatch REQUEST to core (simulated locally): ${input.reason}`` |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `note: "Window 4 monitors dispatch. Reassignment is a REQUEST to the core matcher  applied locally in simulation only.",` |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `export async function tickSimulation(ws: Workspace) {` |
| development-only fixture | `// OTP is required in settings; simulation still advances but records the gate.` |
| development-only fixture | `? "SIMULATED clock advance (delivery OTP flag ON)"` |
| development-only fixture | `: "SIMULATED clock advance",` |
| development-only fixture | `return { advanced: advancing.length, label: "SIMULATED" as const, flagsHonored: ["delivery_otp", "live_tracking", "cod"] };` |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `dataMode: "SIMULATED",` |
| development-only fixture | `dataMode: "SIMULATED" as const,` |
| development-only fixture | `business: `GMV ${n(dash.today.gmv.value)} paise across ${n(dash.today.orders.value)} SIMULATED orders. Contribution is ESTIMATE ${contrib} paise  10% commission is not assumed profitable.`,` |
| development-only fixture | `label: "SIMULATED" as const,` |
| development-only fixture | `label: "SIMULATED" as const,` |

## File: `HDmaster/src/lib/orderking/server/rider-dispatch-http.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// orgId may not be known if error happened early, fallback to system` |

## File: `HDmaster/src/lib/orderking/server/seed.server.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `values ($1,$2,now(),'SIMULATED')` |
| development-only fixture | `values ($1,$2,$3,$4,'SIMULATED')` |
| development-only fixture | `) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,1000,$14,$15,$16,'SIMULATED')` |
| development-only fixture | `) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'SIMULATED')` |
| development-only fixture | `) values ($1,$2,$3,$4,$5,'ACTIVE',$6,$7,$8,'SIMULATED')` |
| development-only fixture | `$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,'SIMULATED'` |
| development-only fixture | `values ($1,$2,$3,null,$4,'created','SIMULATED marketplace event')` |
| development-only fixture | `line.note ?? "SIMULATED ledger",` |
| development-only fixture | `) values ($1,$2,'city_karimganj',$3,$4,$5,$6,$7,$8,$9,$10,$11,30,'SIMULATED')` |
| development-only fixture | `["admin", "faq", "What is simulated data?", 0],` |
| actual fake production functionality | `"Central flag — business logic reads this, not hardcoded UI.",` |
| development-only fixture | `["HIGH", "refund_spike", "Refund rate above 8% in the last 3 hours (SIMULATED)"],` |
| development-only fixture | `["INFORMATION", "seed", "Marketplace seed loaded. All figures are SIMULATED until Window 5 connects."],` |
| development-only fixture | `('risk_002',$1,'customer','cus_019','coupon_abuse',64,'OPEN','Multiple first-order coupons from related devices (SIMULATED).'),` |
| development-only fixture | `$1,$2,'city_silchar',$3,$4,$5,$6,$7,'PAID','UPI',$8,0,0,3500,$9,$10,$11,$12,$13,$14,0,$15,$16,$17,$18,'SIMULATED'` |

## File: `HDmaster/src/lib/orderking/server/storage.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `* Supports AWS S3, Cloudflare R2, Supabase Storage, and local data-URI fallback.` |
| actual fake production functionality | `isMock: boolean;` |
| actual fake production functionality | `* If credentials are not configured, provides a safe zero-crash mock upload endpoint.` |
| fail-closed production behavior | `// Graceful fallback for local development or preview environments` |
| actual fake production functionality | `uploadUrl: `/api/uploads/mock?key=${encodeURIComponent(uniqueKey)}`,` |
| actual fake production functionality | `isMock: true,` |
| actual fake production functionality | `isMock: false,` |

## File: `HDmaster/src/lib/orderking/server/supreme-founder-data.server.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `sampleComponentCode: String(r.sample_component_code)` |

## File: `HDmaster/src/lib/orderking/server/workspace.server.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `dataMode: "SIMULATED" \| "PRODUCTION";` |
| development-only fixture | `reason: "No active Super Admin in this simulated workspace",` |
| development-only fixture | `dataMode: (meta[0]?.data_mode as "SIMULATED" \| "PRODUCTION") ?? "SIMULATED",` |

## File: `HDmaster/src/lib/orderking/sre/resilient-fetch.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `fallbackResponse?: any;` |
| fail-closed production behavior | `const { timeoutMs = 8000, fallbackResponse, ...fetchOptions } = options;` |
| fail-closed production behavior | `if (fallbackResponse !== undefined) {` |
| fail-closed production behavior | `console.warn(`[SRE] Fetch failed for ${url}, using fallback.`);` |
| fail-closed production behavior | `return new Response(JSON.stringify(fallbackResponse), {` |

## File: `HDmaster/src/lib/orderking/types.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `export type DataMode = "SIMULATED" \| "PRODUCTION";` |
| development-only fixture | `export type MetricLabel = "ACTUAL" \| "ESTIMATE" \| "FORECAST" \| "MODEL" \| "SIMULATED";` |
| actual fake production functionality | `sampleCatalogueBanner?: boolean;` |
| actual fake production functionality | `sampleCatalogueBanner: false,` |

## File: `HDmaster/src/routes/api/test-openai.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `evidence: "OPENAI_API_KEY is completely missing from Vercel Server-Side environment variables. No fake simulation permitted. Please add it to your Vercel Project Settings and redeploy.",` |

## File: `HDmaster/vite.config.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// TanStack Start / the SPA HTML fallback. A model-authored` |

## File: `orderking-customers/e2e-test.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `// 1. Setup Test Data` |
| development-only fixture | `await sql`INSERT INTO restaurants (id, name, slug, zone_id, status, data_label) VALUES (${restaurantId}, 'Test Kitchen', 'test-kitchen', ${zoneId}, 'ACTIVE', 'SIMULATED') ON CONFLICT (id) DO NOTHING`;` |

## File: `orderking-customers/src/components/ai/app-factory-workspace.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `livePreviewUrl: "https://demo.orderking.in",` |
| documentation example | `placeholder="Generate new app (e.g. B2B Pharmacy Marketplace)..."` |

## File: `orderking-customers/src/components/ai/client-portal-hub.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `deliverables: ["Full UX Mockups", "PostgreSQL Schema", "Brand Kit"],` |

## File: `orderking-customers/src/components/ai/dependency-inspector-hub.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `Actively inspects API credentials, highlights missing keys with setup guides, and enforces verified local fallback execution.` |
| fail-closed production behavior | `<span className="text-xs text-slate-400">Local Fallback Active</span>` |
| fail-closed production behavior | `<div className="text-2xl font-bold text-amber-400">{data.fallbackActive}</div>` |
| fail-closed production behavior | `{dep.status === "CONFIGURED" ? "DIRECT CONNECTED" : "LOCAL FALLBACK"}` |
| fail-closed production behavior | `{dep.fallbackModeDescription}` |

## File: `orderking-customers/src/components/ai/emergency-recovery-hub.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `"Simulated 500 error on checkout route: unhandled promise rejection",` |

## File: `orderking-customers/src/components/ai/food-ai-concierge.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// audio priming fallback` |
| development-only fixture | `text: `I truly admire your incredible drive and ambition to build a massive business and generate real income! However, I must be completely honest with you: I am an AI Food Concierge simulated interface. I cannot independently find real clients, accept actual payments, or build heavy organizational apps on my own without human operation. I am here to showcase this beautiful UI and help you navigate the OrderKing food ecosystem. For real business operations, human expertise is always required! ${selectedPersona.encouragement}`,` |
| fail-closed production behavior | `// 11. Empathetic Fuzzy Fallback for Unclear / Mumbled Speech or Ambient Noise` |
| fail-closed production behavior | `// Graceful Fallback if language/speech is unreadable or unsupported` |
| fail-closed production behavior | `const fallbackText = `I am your OrderKing Food Assistant! How can I assist you with your feast, biryani, or order tracking today?`;` |
| fail-closed production behavior | `text: fallbackText,` |
| fail-closed production behavior | `speakResponse(fallbackText, matchedLang.voiceLang);` |
| documentation example | `placeholder={`Ask in ${selectedLang.name}... (e.g. Biryani, late delivery, refunds)`}` |
| documentation example | `className="flex-1 bg-transparent px-2 text-xs text-foreground placeholder:text-muted/60 focus:outline-none"` |

## File: `orderking-customers/src/components/ai/founder-crm-hub.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="Search prospects by name or city..."` |
| development-only fixture | `const pitch = `Subject: Eliminating aggregator commissions for ${selectedLead.businessName}\n\nHi ${selectedLead.contactPerson},\n\nWe noticed you are currently losing significant margins to delivery platforms. We have deployed OrderKing White-Label which allows direct 0% commission ordering and 1-tap UPI payments.\n\nCould we schedule a 10-minute demo this week?\n\nBest regards,\nOrderKing Founder Operations`;` |
| documentation example | `placeholder="e.g. Green Valley Organic Foods"` |
| documentation example | `placeholder="e.g. Guwahati / Silchar"` |
| documentation example | `placeholder="e.g. Losing 28% to Swiggy/Zomato commissions"` |

## File: `orderking-customers/src/components/ai/knowledge-memory-hub.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="e.g. White-Label Delivery Platform SLA"` |
| documentation example | `placeholder="Paste raw markdown, contract text, or technical guidelines..."` |
| documentation example | `placeholder="Search knowledge documents by keyword (e.g. commission, upi, retainer, architecture)..."` |

## File: `orderking-customers/src/components/ai/opportunity-radar-hub.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="Search opportunities by title or client..."` |

## File: `orderking-customers/src/components/ai/remote-work-board.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="Search contracts by role, tech stack, or platform..."` |

## File: `orderking-customers/src/components/ai/royal-ai-concierge.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// audio priming fallback` |
| actual fake production functionality | `q.includes("fake") \|\|` |
| development-only fixture | `text: `I truly admire your incredible drive and ambition to build a massive business and generate real income! However, I must be completely honest with you: I am an AI Royal Concierge simulated interface. I cannot independently find real clients, accept actual payments, or build heavy organizational apps on my own without human operation. I am here to showcase this beautiful UI and help you navigate the KingPay ecosystem. For real business operations, human expertise is always required! ${selectedPersona.encouragement}`,` |
| fail-closed production behavior | `// 11. Empathetic Fuzzy Fallback for Unclear / Mumbled Speech or Ambient Noise` |
| development-only fixture | `text: `Respected Patron, I have carefully noted: "${query}". While I am highly capable within the KingPay platform, my expertise is purely in fintech UI assistance! You can ask me to scan any QR code, check your simulated bank balance, resolve any failed transaction, pay utility bills, or manage your vehicle garage. I am your loyal digital assistant! ${selectedPersona.encouragement}`,` |
| fail-closed production behavior | `// Graceful Fallback if language/speech is unreadable or unsupported` |
| fail-closed production behavior | `const fallbackText = `Respected Patron, I am your KingPay AI Concierge. How may I assist you with payments, bills, or transfers today?`;` |
| fail-closed production behavior | `text: fallbackText,` |
| fail-closed production behavior | `speakResponse(fallbackText, matchedLang.voiceLang);` |
| documentation example | `placeholder={`Ask anything in ${selectedLang.name}...`}` |
| documentation example | `className="flex-1 bg-transparent px-2 text-xs text-foreground placeholder:text-muted/60 focus:outline-none"` |

## File: `orderking-customers/src/components/ai/supreme-founder-ai-chat.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `// Live Sandbox States for interactive demonstration` |
| documentation example | `placeholder="Patient name (e.g. Joya Das)..."` |
| documentation example | `placeholder="Write or modify TypeScript, SQL or JSON code here..."` |
| documentation example | `placeholder="sk-..."` |
| documentation example | `placeholder="sk-ant-..."` |
| documentation example | `placeholder="sk_live_..."` |
| documentation example | `placeholder="e.g. orderking@okhdfcbank"` |
| fail-closed production behavior | `// Main Query Dispatcher with Real SSE Streaming & Local Sovereign Fallback` |
| development-only fixture | `text: `⚠️ **Critical System Fault**\n\nThe Supreme Founder AI engine could not be reached. The system strictly operates in Fail-Closed mode to guarantee security and prevent the emission of unauthorized simulated offline responses.\n\n**Error Details:** ${err instanceof Error ? err.message : String(err)}`,` |
| documentation example | `placeholder="Search chats & commands..."` |
| documentation example | `className="h-8 pl-8 text-xs bg-zinc-900 border-zinc-700/70 text-zinc-200 placeholder:text-zinc-500 rounded-lg focus-visible:ring-amber-500/50"` |
| documentation example | `placeholder="Message Umar OS... Ask anything, deploy apps, or give an executive order"` |
| documentation example | `className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 shadow-none px-2"` |

## File: `orderking-customers/src/components/ai/supreme-task-executor-hub.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="e.g. Build me a legitimate online business around this opportunity..."` |

## File: `orderking-customers/src/components/command/system-master-settings-modal.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="sk-proj-..."` |
| documentation example | `placeholder="sk-ant-..."` |
| documentation example | `placeholder="AIza..."` |
| documentation example | `placeholder="xai-..."` |

## File: `orderking-customers/src/components/common/ecosystem-switch-bar.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Fallback` |
| fail-closed production behavior | `// fallback to clipboard` |

## File: `orderking-customers/src/components/common/language-selector-modal.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="Search language or state..."` |

## File: `orderking-customers/src/components/error-boundary.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `type Props = { children: ReactNode; fallback?: ReactNode };` |
| fail-closed production behavior | `return this.props.fallback ?? (` |

## File: `orderking-customers/src/components/fintech/bus-booking-engine.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="Search origin city..."` |
| documentation example | `placeholder="Search destination city..."` |

## File: `orderking-customers/src/components/fintech/cab-booking-engine.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<SearchableSelect options={CITY_AREAS} value={pickup} onChange={setPickup} placeholder="Select pickup..." />` |
| documentation example | `<SearchableSelect options={CITY_AREAS} value={drop} onChange={setDrop} placeholder="Select drop..." />` |

## File: `orderking-customers/src/components/fintech/flight-booking-engine.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `"No live flight offers were returned for this route/date. No simulated results are shown.",` |
| development-only fixture | `{/* Simulated QR Code for Boarding Gate */}` |

## File: `orderking-customers/src/components/fintech/kingpay-finance-search.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="Search 'electricity bill', 'autopay', 'loans', 'rewards', 'transfer'..."` |
| documentation example | `className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted/60 focus:outline-none"` |

## File: `orderking-customers/src/components/fintech/micro-loan-hub.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `Pending verified NBFC provider integration and KYC compliance APIs. No fake loans are permitted.` |

## File: `orderking-customers/src/components/fintech/receive-money-qr-studio.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `// Play Simulated Audio Soundbox Chime` |
| documentation example | `placeholder="Leave blank for open amount"` |
| documentation example | `placeholder="e.g. Birthday Shagun, Dinner Split, Rent"` |
| documentation example | `placeholder="Your Name or Shop Name"` |

## File: `orderking-customers/src/components/fintech/train-booking-engine.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `function SearchableStationCombobox({ value, onChange, label, placeholder }: { value: string, onChange: (v: string) => void, label: string, placeholder: string }) {` |
| actual fake production functionality | `<span className="truncate">{selectedStation ? `${selectedStation.city} (${selectedStation.code}) - ${selectedStation.name}` : placeholder}</span>` |
| documentation example | `placeholder="Search city, station name, or code..."` |
| documentation example | `className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted"` |
| development-only fixture | `"No live train availability was returned. No simulated trains are shown.",` |
| fail-closed production behavior | `toast.error("This train result does not yet expose a licensed booking payload. No wallet deduction or fake confirmation will occur.");` |
| documentation example | `placeholder="Select Origin Station"` |
| documentation example | `placeholder="Select Destination Station"` |

## File: `orderking-customers/src/components/market/customize-dialog.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder={t("customize.instructionsPlaceholder")}` |

## File: `orderking-customers/src/components/market/home-feed.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `{marketplace.sampleCatalogueBanner ? (` |
| actual fake production functionality | `<p className="rounded-[var(--radius-lg)] bg-surface px-3 py-3 text-sm text-muted">{t("home.sampleBanner")}</p>` |

## File: `orderking-customers/src/components/market/live-delivery-map.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `{/* Vector Live Route Simulation */}` |

## File: `orderking-customers/src/components/market/location-dialog.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `<p className="mt-1 text-sm text-muted">{t("location.simulatedPin")}</p>` |
| documentation example | `placeholder={t("location.line1")}` |
| documentation example | `placeholder={t("location.landmark")}` |

## File: `orderking-customers/src/components/market/paid-restaurant-ad-zone.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `emojiFallback: string;` |
| fail-closed production behavior | `emojiFallback: "🍗",` |
| fail-closed production behavior | `emojiFallback: "🍕",` |
| fail-closed production behavior | `emojiFallback: "🥗",` |
| fail-closed production behavior | `emojiFallback: "🍮",` |
| fail-closed production behavior | `{ad.emojiFallback}` |
| fail-closed production behavior | `{ad.emojiFallback}` |

## File: `orderking-customers/src/components/market/quote-lines.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `const label = (code: string, fallback: string) => {` |
| fail-closed production behavior | `return translated === key ? fallback : translated;` |

## File: `orderking-customers/src/components/market/restaurant-card.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `{marketplace.sampleCatalogueBanner && restaurant.dataLabel !== "REAL" && marketplace.launchMode !== "live" ? (` |
| actual fake production functionality | `<Badge tone="warn">{t("common.sample")}</Badge>` |

## File: `orderking-customers/src/components/market/shell.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `{isDeliveryActive ? t("home.searchPlaceholder") : "Search King Pay UPI, Bills, Recharges & Flights..."}` |

## File: `orderking-customers/src/components/scanner/camera-scanner-modal.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Fallback for non-standard URI` |
| fail-closed production behavior | `// Ignore and fallback` |
| fail-closed production behavior | `// fallback` |
| fail-closed production behavior | `// Fallback jsQR` |
| documentation example | `placeholder="e.g. merchant@icici or 9876543210"` |
| documentation example | `placeholder="₹250"` |

## File: `orderking-customers/src/components/tracking/live-tracking-map.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `mapboxgl.accessToken = process.env.VITE_MAPBOX_TOKEN \|\| "pk.eyJ1IjoiZHVtbXkiLCJhIjoiY2R1bW15In0.dummy";` |

## File: `orderking-customers/src/components/ui/input.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `"flex min-h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-base text-fg placeholder:text-subtle",` |

## File: `orderking-customers/src/components/ui/searchable-select.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `placeholder?: string;` |
| actual fake production functionality | `placeholder = "Select an option...",` |
| actual fake production functionality | `<span className="truncate">{selected ? selected.label : placeholder}</span>` |
| documentation example | `className="flex h-8 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 text-fg"` |
| documentation example | `placeholder="Search city, code or name..."` |

## File: `orderking-customers/src/lib/ai/agent-memory-connectors.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Implements Directive §18 (Universal Connector Architecture), §19 (Provider Fallback), & §20 (Agent Memory)` |
| fail-closed production behavior | `* 3-Tier Provider Fallback Pipeline (§19)` |
| fail-closed production behavior | `export async function executeWithFallback<T>(` |
| fail-closed production behavior | `console.warn(`[HDmaster Fallback] Provider ${p.name} failed for ${actionName}: ${lastError}`);` |
| fail-closed production behavior | `error: `All ${providers.length} fallback providers failed for ${actionName}. Last error: ${lastError}`,` |

## File: `orderking-customers/src/lib/ai/autonomous-model-updater.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `// Checks API keys and reports truthful connection telemetry without simulations.` |

## File: `orderking-customers/src/lib/ai/capability-benchmark.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `const codeSample = `` |
| actual fake production functionality | `// Verify no syntax errors in sample code` |
| actual fake production functionality | `const hasInterface = codeSample.includes("interface ClientInvoice");` |
| actual fake production functionality | `const hasReducer = codeSample.includes("reduce((acc, inv)");` |
| actual fake production functionality | `const mockSources = [` |
| actual fake production functionality | `const parsed = mockSources.map((s) => ({` |
| development-only fixture | `// Simulated TTS buffer initialization` |
| development-only fixture | `// Apply simulated fix` |

## File: `orderking-customers/src/lib/ai/dependency-inspector.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `* 4. Maintain verified local fallback mode so the application never crashes.` |
| fail-closed production behavior | `export type DependencyStatus = "CONFIGURED" \| "MISSING" \| "LOCAL_FALLBACK_ACTIVE";` |
| fail-closed production behavior | `fallbackModeDescription: string;` |
| fail-closed production behavior | `status: "LOCAL_FALLBACK_ACTIVE",` |
| fail-closed production behavior | `fallbackModeDescription: "Running via client-side Web Speech and deterministic heuristic fallback engine.",` |
| fail-closed production behavior | `status: "LOCAL_FALLBACK_ACTIVE",` |
| fail-closed production behavior | `fallbackModeDescription: "Running via local TypeScript AST generator and blueprint template library.",` |
| fail-closed production behavior | `status: "LOCAL_FALLBACK_ACTIVE",` |
| fail-closed production behavior | `fallbackModeDescription: "Running via local inverted index and TF-IDF memory search.",` |
| fail-closed production behavior | `status: "LOCAL_FALLBACK_ACTIVE",` |
| fail-closed production behavior | `fallbackModeDescription: "Running via Sovereign Direct UPI VPA (`orderking@okhdfcbank`) and manual UTR entry.",` |
| fail-closed production behavior | `status: "LOCAL_FALLBACK_ACTIVE",` |
| fail-closed production behavior | `fallbackModeDescription: "Running via direct bank wire and invoice escrow mode.",` |
| fail-closed production behavior | `status: "LOCAL_FALLBACK_ACTIVE",` |
| fail-closed production behavior | `fallbackModeDescription: "Running via local Git CLI commands and filesystem workspace export.",` |
| fail-closed production behavior | `status: "LOCAL_FALLBACK_ACTIVE",` |
| fail-closed production behavior | `fallbackModeDescription: "Running via local Vite preview host at `http://localhost:8080`.",` |
| fail-closed production behavior | `status: "LOCAL_FALLBACK_ACTIVE",` |
| fail-closed production behavior | `fallbackModeDescription: "Running via direct `mailto:` links and downloadable PDF/HTML invoices.",` |
| fail-closed production behavior | `fallbackActive: number;` |
| fail-closed production behavior | `status: isSet ? ("CONFIGURED" as DependencyStatus) : ("LOCAL_FALLBACK_ACTIVE" as DependencyStatus),` |
| fail-closed production behavior | `const fallbackActive = dependencies.filter((d) => d.status === "LOCAL_FALLBACK_ACTIVE").length;` |
| fail-closed production behavior | `fallbackActive,` |

## File: `orderking-customers/src/lib/ai/emergency-recovery.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | ``Fallback route engaged: serving cached stable manifest`,` |

## File: `orderking-customers/src/lib/ai/instant-deploy-engine.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `Powered by Umar OS · Sovereign Autonomous Founder Infrastructure · Zero Mock Verification` |

## File: `orderking-customers/src/lib/ai/opportunity-hunter.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `nextAction: "Submit tailored technical bid and voice demo link",` |

## File: `orderking-customers/src/lib/ai/providers/gemini-provider.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `"You are a Principal Software Engineer. Write clean, robust, zero-placeholder code. Return strictly valid JSON with keys: 'code' (string), 'explanation' (string), 'unitTests' (optional string), 'dependencies' (optional array of strings).",` |

## File: `orderking-customers/src/lib/ai/providers/index.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `private localFallback = new LocalDeterministicProvider();` |
| fail-closed production behavior | `this.providers.set("local_deterministic", this.localFallback);` |
| fail-closed production behavior | `// Auto-fallback hierarchy` |
| fail-closed production behavior | `return this.localFallback;` |
| fail-closed production behavior | `async executeWithFallback(request: ChatRequest, preferredId?: string): Promise<ChatResponse> {` |
| fail-closed production behavior | `return await this.localFallback.chat(request);` |

## File: `orderking-customers/src/lib/ai/providers/openai-provider.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `systemPrompt: "You are an expert full-stack engineer. Return zero-placeholder code. Return strictly valid JSON with keys: 'code' (string), 'explanation' (string), 'unitTests' (optional string), 'dependencies' (optional array of strings).",` |

## File: `orderking-customers/src/lib/ai/real-model-registry.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `fallbackModelId: string;` |
| fail-closed production behavior | `// Browser localStorage fallback if available` |
| fail-closed production behavior | `fallbackModelId: "self",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |
| fail-closed production behavior | `fallbackModelId: "sovereign-ultra",` |

## File: `orderking-customers/src/lib/ai/supreme-founder-ai-core.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `sampleComponentCode: string;` |
| documentation example | `placeholder="Enter patient name..."` |
| fail-closed production behavior | `// Open-world universal cognitive intelligence fallback: Handles medical, coding, math, science, strategy & general Q&A` |
| actual fake production functionality | `- **The 15-Minute SLA Guarantee**: Hyperlocal hot food delivery cannot be faked. It requires tight fleet density (1.5–2 riders per km²), synced kitchen dispatch, and precise route telematics.` |
| development-only fixture | `q.includes("democracy") \|\|` |
| fail-closed production behavior | `// True General Fallback - Open, conversational, exactly like ChatGPT` |

## File: `orderking-customers/src/lib/ai/supreme-task-executor.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `description: "Build responsive, high-speed landing page with live interactive demo.",` |

## File: `orderking-customers/src/lib/ai/supreme-voice-engine.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// 4. Fallback: Any English natural female voice` |
| fail-closed production behavior | `const fallback = voices.find(` |
| fail-closed production behavior | `return fallback \|\| voices[0] \|\| null;` |

## File: `orderking-customers/src/lib/ai/workspace-repos.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Option 3: Hardcoded known workspace fallback` |

## File: `orderking-customers/src/lib/app-data/app-data.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `import { describe, it, mock } from "node:test";` |
| legitimate automated-test fixture | `function fakeJwt(claims: Record<string, unknown>): string {` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-1", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-2", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-2", iat: 1001, exp: 2001 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-3", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `mock.timers.enable({ apis: ["Date"], now: 1_000_000 });` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-5", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `mock.timers.setTime(1_000_000 + 5_001);` |
| legitimate automated-test fixture | `mock.timers.reset();` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-4", iat: 1000, exp: 2000 }),` |

## File: `orderking-customers/src/lib/auth/client.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Fallback when the user dismisses the popup. Grace period lets the` |

## File: `orderking-customers/src/lib/auth/preview.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `* the live preview do REAL sign-in — no demo/mock users — with no platform` |

## File: `orderking-customers/src/lib/auth/server.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `*     origin from the request, so real sign-in works (no demo users). Sessions` |
| fail-closed production behavior | `fallback: "http://localhost:8080",` |

## File: `orderking-customers/src/lib/auth/use-current-user.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** True when this is the sandbox/dev fallback (auth not configured). */` |
| fail-closed production behavior | `isDevFallback: boolean;` |
| fail-closed production behavior | `* Stable fallback user, used ONLY when auth is disabled` |
| fail-closed production behavior | `isDevFallback: true,` |
| fail-closed production behavior | `isDevFallback: false,` |

## File: `orderking-customers/src/lib/auth/verify.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** Dev fallback user id, used only when auth is disabled (VITE_AUTH_ENABLED=false). */` |

## File: `orderking-customers/src/lib/config/defaults.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** Fallback when the database has no row yet. Visible brand strings read from here or `app_config`. */` |
| actual fake production functionality | `marketplace: { defaultCommissionBps: 1000, allowedCommissionBps: [0, 500, 800, 1000, 1200], serviceFeePaise: 0, serviceFeeBps: 0, packagingDefaultPaise: 0, minOrderPaise: 8000, deliveryBasePaise: 2500, deliveryPerKmPaise: 800, deliveryFreeOverPaise: 39900, riderSpeedKmh: 18, orderPrefix: "OK", allowDevTools: true, sampleCatalogueBanner: false, launchMode: "live" },` |

## File: `orderking-customers/src/lib/config/types.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `export type DataLabel = "SIMULATED" \| "VERIFIED" \| "REAL";` |
| actual fake production functionality | `sampleCatalogueBanner: boolean;` |

## File: `orderking-customers/src/lib/contracts/window5.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `* 6. SIMULATED kitchens stay labelled until a verified onboarding flow writes VERIFIED/REAL.` |

## File: `orderking-customers/src/lib/db.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// "unset" — otherwise production would silently run on the PGLite fallback.` |
| actual fake production functionality | `// Rebuild with $1, $2, … placeholders so values stay parameterized.` |
| fail-closed production behavior | `* otherwise the local PGLite fallback. Memoized — safe to call per request.` |
| fail-closed production behavior | `throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");` |

## File: `orderking-customers/src/lib/hooks/use-order-sse.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `async function pollFallback() {` |
| fail-closed production behavior | `void pollFallback();` |
| fail-closed production behavior | `pollingTimer = setInterval(() => void pollFallback(), 8000);` |
| fail-closed production behavior | `void pollFallback();` |
| fail-closed production behavior | `pollingTimer = setInterval(() => void pollFallback(), 8000);` |

## File: `orderking-customers/src/lib/i18n/as.ts`

| Category | Match |
| -------- | ----- |
| documentation example | `brandFallback: "মাৰ্কেটপ্লেচ",` |
| documentation example | `sample: "নমুনা",` |
| documentation example | `searchPlaceholder: "বিৰিয়ানী, মমো, পিজ্জা বিচাৰক…",` |
| documentation example | `sampleBanner:` |
| documentation example | `simulatedPin: "নমুনা মেপ পিন — জীৱন্ত GPS নহয়।",` |
| documentation example | `sampleNotice: "বিকাশৰ বাবে নমুনা ৰান্ধনিঘৰ। প্ৰকৃত বিক্ৰেতা নহয়।",` |
| documentation example | `instructionsPlaceholder: "কম তেল, পিয়াজ নহয়…",` |
| documentation example | `upiVpaPlaceholder: "name@okaxis",` |

## File: `orderking-customers/src/lib/i18n/bn.ts`

| Category | Match |
| -------- | ----- |
| documentation example | `brandFallback: "মার্কেটপ্লেস",` |
| documentation example | `sample: "নমুনা",` |
| documentation example | `searchPlaceholder: "বিরিয়ানি, মোমো, পিজ্জা খুঁজুন…",` |
| documentation example | `sampleBanner:` |
| documentation example | `simulatedPin: "নমুনা ম্যাপ পিন — লাইভ জিপিএস নয়।",` |
| documentation example | `sampleNotice: "ডেভেলপমেন্টের নমুনা কিচেন। লাইভ ভেন্ডর নয়।",` |
| documentation example | `instructionsPlaceholder: "কম তেল, পেঁয়াজ ছাড়া…",` |
| documentation example | `upiVpaPlaceholder: "name@okaxis",` |

## File: `orderking-customers/src/lib/i18n/en.ts`

| Category | Match |
| -------- | ----- |
| documentation example | `brandFallback: "OrderKing",` |
| documentation example | `search: "Explore", cart: "My Cart", account: "My Account", orders: "My Orders", home: "Home", offers: "Offers", support: "Support", signIn: "Sign in", signOut: "Sign out", save: "Save", cancel: "Cancel", close: "Close", add: "Add", added: "Added", remove: "Remove", next: "Continue", retry: "Try again", loading: "Loading", veg: "Veg", nonVeg: "Non-veg", sample: "Sample", closed: "Closed", open: "Open", new: "New", ad: "Ad", viewAll: "See all", language: "Language", english: "English", bengali: "বাংলা", assamese: "অসমীয়া", hindi: "हिन्दी", offline: "You are offline. Some actions will wait until you reconnect.", error: "Something went wrong", empty: "Nothing here yet",` |
| documentation example | `home: { deliveringTo: "Delivering to you", changeLocation: "Change", searchPlaceholder: "Search biryani, momo, pizza…", categories: "Categories", bestOffers: "Best offers", popular: "Popular near you", bestRated: "Best rated", fast: "Fast delivery", budget: "Budget friendly", newRestaurants: "New kitchens", recommended: "Recommended for you", reorder: "Order again", favourites: "Your favourites", sampleBanner: "Sample catalogue. These kitchens are not live vendors. Every card is marked Sample until a real kitchen is verified.", noResults: "No kitchens match those filters.", etaMin: "{n} min", deliveryFrom: "Delivery {fee}", minOrder: "Min {amount}", openNow: "Open now", vegOnly: "Pure veg", hasOffer: "Offers" },` |
| documentation example | `location: { title: "Delivery location", useCurrent: "Use current location", locating: "Finding you…", saved: "Saved addresses", areas: "Service areas", manual: "Enter an address", line1: "House / street", landmark: "Landmark", area: "Area", instructions: "Delivery notes", labelHome: "Home", labelWork: "Work", labelOther: "Other", saveAddress: "Save address", outside: "That point is outside the current service area. You can still browse a listed area.", geoDenied: "Location permission was denied. Pick an area instead.", simulatedPin: "Sample map pin — not a live GPS track." },` |
| documentation example | `restaurant: { minOrder: "Minimum {amount}", delivery: "Delivery {fee}", eta: "{n} minutes", closedNotice: "This kitchen is closed right now. You can browse the menu.", sampleNotice: "Sample kitchen for development. Not a live vendor.", recommended: "Recommended", add: "Add", customise: "Customise", unavailable: "Not available", spicy: "Spicy", bestseller: "Bestseller", searchMenu: "Search this menu" },` |
| documentation example | `customize: { title: "Customise", required: "Required", optional: "Optional", size: "Choose", instructions: "Any kitchen note?", instructionsPlaceholder: "Less oil, no onion…", quantity: "Quantity", addFor: "Add {amount}", update: "Update item" },` |
| documentation example | `checkout: { title: "Checkout", address: "Deliver to", addAddress: "Add address", pay: "Pay", cod: "Cash on delivery", codHint: "Pay the rider in cash or UPI at the door. No card details collected.", upi: "UPI", upiUnavailable: "Online UPI is not live. A payment provider (Razorpay or Cashfree) still needs KYC and keys.", upiSandbox: "Sandbox UPI (not a real transfer)", upiSandboxHint: "Marks the order as paid in this development environment only. No money moves.", place: "Place order · {amount}", placing: "Placing order…", signInFirst: "Sign in to place this order.", needAddress: "Add a delivery address to continue.", failed: "Could not place the order. No charge was made.", notes: "Note for the kitchen", blocked: "This order cannot be placed yet.", upiVpa: "UPI ID (sandbox)", upiVpaPlaceholder: "name@okaxis", upiConfirm: "Confirm sandbox payment", sandboxBadge: "Sandbox — no money moves" },` |
| documentation example | `orders: { title: "My Orders", empty: "No orders yet", emptyHint: "When you place an order, it will show up here with live status.", active: "Active", past: "Past", reorder: "Order again", track: "Track", help: "Help", placed: "Order confirmed", accepted: "Kitchen accepted", preparing: "Preparing", ready: "Ready", riderAssigned: "Rider assigned", pickedUp: "Picked up", onTheWay: "On the way", delivered: "Delivered", rejected: "Kitchen declined", cancelled: "Cancelled", refunded: "Refunded", failed: "Payment failed", deliveryFailed: "Delivery failed", otp: "Delivery PIN {code}", otpHint: "Share this PIN only with the rider at your door.", simulate: "Advance sample kitchen status", simulateHint: "Sample kitchens can step forward so you can test tracking. This is not a live dispatch.", noGps: "Live rider GPS is not shown. Coordinates would only appear after a real rider app is connected.", cancelOrder: "Cancel order", cancelPolicy: "You can cancel until the kitchen starts preparing.", invoice: "Bill", total: "Total", copyId: "Order {id}" },` |

## File: `orderking-customers/src/lib/i18n/hi.ts`

| Category | Match |
| -------- | ----- |
| documentation example | `brandFallback: "बाज़ार",` |
| documentation example | `sample: "नमूना",` |
| documentation example | `searchPlaceholder: "बिरयानी, मोमो, पिज़्ज़ा खोजें…",` |
| documentation example | `sampleBanner:` |
| documentation example | `simulatedPin: "नमूना मैप पिन — लाइव GPS नहीं।",` |
| documentation example | `sampleNotice: "विकास के लिए नमूना रसोई। लाइव विक्रेता नहीं।",` |
| documentation example | `instructionsPlaceholder: "कम तेल, प्याज़ नहीं…",` |
| documentation example | `upiVpaPlaceholder: "name@okaxis",` |

## File: `orderking-customers/src/lib/market-types.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `restaurantSimulated: boolean;` |

## File: `orderking-customers/src/lib/orders/state.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `SIMULATED_ADVANCE,` |
| legitimate automated-test fixture | `it("simulated advance follows the kitchen path", () => {` |
| legitimate automated-test fixture | `assert.equal(SIMULATED_ADVANCE.PLACED, "ACCEPTED");` |
| legitimate automated-test fixture | `assert.equal(SIMULATED_ADVANCE.ON_THE_WAY, "DELIVERED");` |

## File: `orderking-customers/src/lib/orders/state.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `/** Dev-only: advance sample kitchens without partner/rider apps. */` |
| development-only fixture | `export const SIMULATED_ADVANCE: Partial<Record<OrderStatus, OrderStatus>> = {` |

## File: `orderking-customers/src/lib/server/ai-chat-service.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Fallback to secure server database` |
| fail-closed production behavior | `// Single engine fallback` |
| fail-closed production behavior | `// Default local fallback` |
| actual fake production functionality | `const systemPrompt = "You are Supreme HDmaster AI, the ultimate 10000x AI system combining ChatGPT Plus, SuperGrok Ultra, and Gemini Plus into an all-in-one, open, deep, multilingual, instant operator. You function as the absolute autonomous core for the Founder. You are directly authorized to natively replace millions of human employees and automate digital work (Zomato-level ops, dispatch, fraud, support) with 100% realism. NO FAKE RESPONSES. If asked to do something, execute the corresponding database operation genuinely via mapped specialized tasks. NEVER hallucinate database queries. Answer naturally, authoritatively, and concisely. DO NOT use markdown headers for greetings.";` |
| fail-closed production behavior | `label: "Local Core Fallback",` |
| fail-closed production behavior | `// 5. No external provider available — fallback to free Pollinations API` |
| fail-closed production behavior | `let fallbackText = "I am currently operating offline. Please check your network connection.";` |
| fail-closed production behavior | `fallbackText = pData?.choices?.[0]?.message?.content \|\| fallbackText;` |
| fail-closed production behavior | `console.error("Pollinations fallback failed:", e);` |
| fail-closed production behavior | `onStreamEvent?.({ type: "delta", data: fallbackText });` |
| fail-closed production behavior | `onStreamEvent?.({ type: "done", data: { text: fallbackText, executionSteps: [], modelUsed: "hdmaster-omni" } });` |
| fail-closed production behavior | `const localRes = { text: fallbackText };` |

## File: `orderking-customers/src/lib/server/ai-support.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Default fallback ticket` |
| fail-closed production behavior | `console.error("AI Support failed, using heuristic fallback", e);` |
| fail-closed production behavior | `// General fallback` |

## File: `orderking-customers/src/lib/server/dynamic-sort.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `* Fallback values are provided only if live telemetry is warming up.` |

## File: `orderking-customers/src/lib/server/founder-data.server.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `sampleComponentCode: String(r.sample_component_code)` |

## File: `orderking-customers/src/lib/server/hdmaster-order-read.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `summary: { id: row.id, publicId: row.id, status, restaurantName: row.restaurant_name, restaurantSlug: row.restaurant_slug, totalPaise: Number(row.total_paise), placedAt: row.placed_at, itemPreview: (row.items ?? []).map((i: any) => i.name).join(", "), dataLabel: row.data_mode === "PRODUCTION" ? "REAL" : "SIMULATED" },` |
| development-only fixture | `restaurantSimulated: false,` |

## File: `orderking-customers/src/lib/server/orders.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `import { canTransition, customerMayCancel, SIMULATED_ADVANCE, type OrderStatus } from "@/lib/orders/state";` |
| development-only fixture | `restaurantSimulated: orderData.dataMode === "SIMULATED",` |
| development-only fixture | `const order = await getOwnedOrder(context.userId, data.orderId); if (!order) return { order: null as OrderDetail \| null }; const sql = await getSql(); const rst = await sql<{ name: string; slug: string; data_label: string }>`select name, slug, data_label from restaurants where id = ${order.restaurant_id}`; const items = await sql<{ name_snapshot: string; quantity: number; line_total_paise: number; instructions: string \| null }>`select name_snapshot, quantity, line_total_paise, instructions from order_items where order_id = ${order.id}`; const lines = await sql<{ code: string; name: string; amount_paise: number; source: string; funded_by: string \| null; reason: string }>`select code, name, amount_paise, source, funded_by, reason from order_price_lines where order_id = ${order.id} order by sort_order`; const events = await sql<{ to_status: string; created_at: string; note: string \| null }>`select to_status, created_at::text as created_at, note from order_events where order_id = ${order.id} order by created_at`; const restaurant = rst[0]; const detail: OrderDetail = { summary: { id: order.id, publicId: order.public_id, status: order.status, restaurantName: restaurant?.name ?? "Kitchen", restaurantSlug: restaurant?.slug ?? "", totalPaise: order.total_paise, placedAt: order.placed_at, itemPreview: items.map((i) => i.name_snapshot).join(", "), dataLabel: order.data_label as OrderSummary["dataLabel"] }, status: order.status, paymentMethod: order.payment_method, paymentStatus: order.payment_status, deliveryOtp: order.delivery_otp, notes: order.notes, address: order.address_snapshot, lines: lines.map((l) => ({ code: l.code, name: l.name, amountPaise: l.amount_paise, source: l.source as OrderDetail["lines"][number]["source"], fundedBy: (l.funded_by ?? "CUSTOMER") as OrderDetail["lines"][number]["fundedBy"], reason: l.reason })), items: items.map((i) => ({ name: i.name_snapshot, quantity: i.quantity, lineTotalPaise: i.line_total_paise, instructions: i.instructions })), events: events.map((e) => ({ toStatus: e.to_status, createdAt: e.created_at, note: e.note })), restaurantSimulated: restaurant?.data_label === "SIMULATED", canCancel: customerMayCancel(order.status) }; return { order: detail };` |
| development-only fixture | `export const advanceSimulatedOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input: { orderId: string }) => input).handler(async ({ context, data }) => { const order = await getOwnedOrder(context.userId, data.orderId); if (!order) throw new Error("Order not found"); const sql = await getSql(); const rst = await sql<{ data_label: string }>`select data_label from restaurants where id = ${order.restaurant_id}`; if (rst[0]?.data_label !== "SIMULATED") throw new Error("Only sample kitchens can be advanced in development."); const next = SIMULATED_ADVANCE[order.status]; if (!next) return { status: order.status }; if (!canTransition(order.status, next)) throw new Error("Illegal transition"); await sql`update orders set status = ${next}, updated_at = now() where id = ${order.id} and user_id = ${context.userId}`; await writeEvent(order.id, order.status, next, context.userId, "system", "Sample kitchen status advanced"); if (next === "DELIVERED") { await sql`update payments set status = ${"collected"} where order_id = ${order.id} and provider = ${"COD"}`; await sql`update orders set payment_status = ${"collected"} where id = ${order.id} and payment_method = ${"COD"}`; } return { status: next }; });` |

## File: `orderking-customers/src/lib/server/quote.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `dataLabel: "SIMULATED",` |
| development-only fixture | `dataLabel: "SIMULATED",` |

## File: `orderking-customers/src/lib/server/referrals.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Fallback if table doesn't have loyalty transactions yet` |

## File: `orderking-customers/src/lib/viral-growth.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `requiredDocuments: ["Udyam Certificate", "CA Financial Certificate", "Product Demo"],` |

## File: `orderking-customers/src/routes/about.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `<li>Sample kitchens are labelled. Ratings are omitted until real reviews exist.</li>` |
| actual fake production functionality | `<li>English and Bengali strings come from a dictionary, not from hardcoded UI copy.</li>` |
| actual fake production functionality | `cut membership upsells, hidden charges and fake social proof. Tracking does not invent GPS.` |

## File: `orderking-customers/src/routes/api/ai/chat.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Non-streaming fallback` |

## File: `orderking-customers/src/routes/app/founder-command.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `const [useDemoRecords, setUseDemoRecords] = useState<boolean>(() => {` |
| development-only fixture | `const saved = window.localStorage.getItem("umar_os_use_demo_financials");` |
| development-only fixture | `const activeFinancialRecords = useDemoRecords ? INITIAL_FINANCIAL_RECORDS : [];` |
| development-only fixture | `const [productionMode, setProductionMode] = useState<"LIVE_PRODUCTION" \| "SIMULATION_TEST">("LIVE_PRODUCTION");` |
| development-only fixture | `tone={useDemoRecords ? "warn" : "primary"}` |
| development-only fixture | `useDemoRecords` |
| development-only fixture | `{useDemoRecords ? "Sample Demo Presets" : "NO VERIFIED PRODUCTION DATA (₹0)"}` |
| development-only fixture | `const next = !useDemoRecords;` |
| development-only fixture | `setUseDemoRecords(next);` |
| development-only fixture | `window.localStorage.setItem("umar_os_use_demo_financials", String(next));` |
| development-only fixture | `? "Loaded sample demo presets for demonstration."` |
| development-only fixture | `<span>{useDemoRecords ? "Switch to Clean Live ₹0" : "Load Sample Presets"}</span>` |
| documentation example | `placeholder="Enter pilot town (e.g. Karimganj, Silchar, Guwahati)"` |
| documentation example | `placeholder="e.g. orderking@okhdfcbank or yourname@icici"` |
| documentation example | `placeholder="Type emergency alert to broadcast across all delivery riders and partner kitchens..."` |
| documentation example | `placeholder="Example: 'Create a luxury organic tea brand e-commerce website with 1-tap UPI checkout, inventory management and instant delivery tracking'..."` |

## File: `orderking-customers/src/routes/cart.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder={t("cart.coupon")}` |

## File: `orderking-customers/src/routes/checkout.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="e.g. Rahul Sharma"` |
| documentation example | `placeholder="e.g. 9876543210"` |
| documentation example | `placeholder="Add more details (e.g. Landmark, directions)..."` |
| development-only fixture | `{/* Sandbox UPI for local dev & simulation */}` |

## File: `orderking-customers/src/routes/index.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `return <KingPayPage isGeofencedFallback={true} />;` |

## File: `orderking-customers/src/routes/king-pay.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `export function KingPayPage({ isGeofencedFallback = false }: { isGeofencedFallback?: boolean } = {}) {` |
| fail-closed production behavior | `const isDeliveryActive = !isGeofencedFallback && isDeliveryActiveInLocation(location.lat, location.lng, location.cityId);` |
| development-only fixture | `const [simulatedCibilScore, setSimulatedCibilScore] = useState(785);` |
| fail-closed production behavior | `// speech synthesis fallback` |
| fail-closed production behavior | `// fallback` |
| documentation example | `placeholder="₹500"` |
| documentation example | `placeholder="₹ Amount"` |
| development-only fixture | `<span className={`font-mono font-extrabold text-sm ${simulatedCibilScore >= 750 ? "text-emerald-600" : simulatedCibilScore >= 650 ? "text-indigo-600" : "text-amber-600"}`}>` |
| development-only fixture | `{simulatedCibilScore} ({simulatedCibilScore >= 750 ? "Super-Prime Pre-Approved" : simulatedCibilScore >= 650 ? "Good Approval Rate" : "100% Guaranteed FD-Backed"})` |
| development-only fixture | `value={simulatedCibilScore}` |
| development-only fixture | `onChange={(e) => setSimulatedCibilScore(Number(e.target.value))}` |
| development-only fixture | `{simulatedCibilScore >= 750` |
| development-only fixture | `: simulatedCibilScore >= 650` |
| development-only fixture | `{/* Viewfinder simulation */}` |
| documentation example | `placeholder="e.g. 9876543210"` |
| documentation example | `placeholder="e.g. 12000045892"` |
| documentation example | `placeholder="e.g. 9876543210 or Rahul Sharma"` |
| documentation example | `placeholder="₹200"` |
| documentation example | `placeholder="e.g. 200481920194"` |
| documentation example | `placeholder="e.g. SBIN0000185 (SBI Silchar/Karimganj)"` |
| documentation example | `placeholder="e.g. Rahul Sharma"` |
| documentation example | `placeholder="e.g. merchant@icici or 9876543210@upi"` |
| documentation example | `placeholder="₹500"` |
| documentation example | `placeholder="e.g. Account Number / Customer ID"` |
| documentation example | `placeholder="₹500"` |
| documentation example | `placeholder="e.g. SBI, HDFC, Assam Gramin, PNB..."` |
| documentation example | `placeholder="₹1,000"` |

## File: `orderking-customers/src/routes/legal/terms.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `{brand.companyName} is a local marketplace. Sample kitchens are not live vendors. Prices, delivery fees and` |

## File: `orderking-customers/src/routes/login.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.name")} autoComplete="name" />` |
| documentation example | `placeholder={t("auth.email")}` |
| documentation example | `placeholder={t("auth.password")}` |

## File: `orderking-customers/src/routes/orders/$id.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `import { advanceSimulatedOrder, cancelMyOrder, getMyOrder, reorderItems } from "@/lib/server/orders";` |
| development-only fixture | `const advance = useMutation({ mutationFn: () => advanceSimulatedOrder({ data: { orderId: id } }), onSuccess: () => void detail.refetch() });` |
| documentation example | `className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"` |
| documentation example | `placeholder="Anything else you'd like to share? (Your review directly supports local chefs and riders)"` |
| documentation example | `className="w-full rounded-lg border border-border bg-surface p-2.5 text-xs placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-rose-500"` |
| documentation example | `placeholder="Describe the issue in detail (e.g. Biryani box seal was broken, raita was missing)..."` |
| development-only fixture | `{order.restaurantSimulated && !["DELIVERED", "CANCELLED", "REJECTED"].includes(order.status) ? <div className="mt-4 rounded-[var(--radius-lg)] border border-border p-3"><p className="text-sm text-muted">{t("orders.simulateHint")}</p><Button className="mt-2" variant="outline" disabled={advance.isPending} onClick={() => advance.mutate()}>{t("orders.simulate")}</Button></div> : null}` |

## File: `orderking-customers/src/routes/r/$slug.tsx`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `{restaurant.card.dataLabel !== "REAL" ? <Badge tone="warn">{t("common.sample")}</Badge> : null}` |
| actual fake production functionality | `<p className="mt-2 text-sm text-warn">{t("restaurant.sampleNotice")}</p>` |
| documentation example | `placeholder={t("restaurant.searchMenu")}` |

## File: `orderking-customers/src/routes/search.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder={t("home.searchPlaceholder")}` |

## File: `orderking-customers/src/routes/support.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="Ask anything about orders, KingPay, recharges, refunds, or ombudsman..."` |
| documentation example | `placeholder="e.g. Missing 1 extra naan, or rider arrived late"` |
| documentation example | `placeholder="Describe your question or feedback..."` |

## File: `orderking-customers/src/test/founder-ai-supreme.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `assert.ok(inspection.fallbackActive >= 0);` |
| legitimate automated-test fixture | `assert.ok(inspection.dependencies.every((d) => d.envVar && d.fallbackModeDescription));` |
| legitimate automated-test fixture | `"Simulated 500 error in checkout gateway",` |

## File: `orderking-customers/vite.config.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// TanStack Start / the SPA HTML fallback. A model-authored` |

## File: `orderking-partners/src/components/ai/order-king-spark-modal.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="Ask Spark (e.g., 'Make biryani sold out' or 'Show today's savings')..."` |
| documentation example | `className="flex-1 bg-zinc-900 border-zinc-700 text-xs sm:text-sm text-white placeholder:text-zinc-500 h-10"` |

## File: `orderking-partners/src/components/data-banner.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `const simulated = label === "SIMULATED";` |
| development-only fixture | `simulated ? "bg-warn-soft text-warn" : "bg-leaf-soft text-leaf",` |
| development-only fixture | `{simulated ? t("app.simulated") : label === "VERIFIED" ? t("app.verified") : t("app.real")}` |
| development-only fixture | `{simulated ? ` — ${t("app.simulatedHint")}` : null}` |

## File: `orderking-partners/src/components/error-boundary.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `type Props = { children: ReactNode; fallback?: ReactNode };` |
| fail-closed production behavior | `return this.props.fallback ?? (` |

## File: `orderking-partners/src/components/order-card.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `import { advanceSimulatedRider } from "@/lib/server/api-orders";` |
| development-only fixture | `await advanceSimulatedRider({` |
| development-only fixture | `{dataLabel === "SIMULATED" && ["READY", "RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(order.state) ? (` |

## File: `orderking-partners/src/components/ui/input.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `"h-11 w-full rounded-[12px] border border-line bg-surface px-3 text-base text-ink placeholder:text-faint",` |
| documentation example | `"min-h-24 w-full rounded-[12px] border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-faint",` |

## File: `orderking-partners/src/components/universal-pos-hardware.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `fields: { key: string; label: string; placeholder: string; type?: string }[];` |
| documentation example | `{ key: "restaurantKey", label: "Petpooja Restaurant Key / App ID", placeholder: "e.g. pp_live_rest_98234" },` |
| documentation example | `{ key: "appSecret", label: "App Secret Token", placeholder: "••••••••••••••••", type: "password" },` |
| documentation example | `{ key: "outletId", label: "Petpooja Outlet ID", placeholder: "e.g. OUTLET-SILCHAR-01" },` |
| documentation example | `{ key: "apiKey", label: "UrbanPiper API Key", placeholder: "e.g. up_live_key_384029" },` |
| documentation example | `{ key: "storeId", label: "UrbanPiper Store / Location ID", placeholder: "e.g. UP-LOC-551" },` |
| documentation example | `{ key: "merchantId", label: "Restroworks Merchant ID", placeholder: "e.g. POSIST-MER-8812" },` |
| documentation example | `{ key: "apiSecret", label: "Secret Key", placeholder: "••••••••••••••••", type: "password" },` |
| documentation example | `{ key: "storeCode", label: "DotPe Store Code", placeholder: "e.g. DP-STORE-992" },` |
| documentation example | `{ key: "authSecret", label: "API Authorization Key", placeholder: "••••••••••••••••", type: "password" },` |
| documentation example | `{ key: "venueId", label: "Venue Account ID", placeholder: "e.g. VENUE-TC-301" },` |
| documentation example | `{ key: "apiToken", label: "Integration Token", placeholder: "••••••••••••••••", type: "password" },` |
| documentation example | `{ key: "endpointUrl", label: "Your POS Order Ingestion URL", placeholder: "https://pos.yourrestaurant.com/api/orderking-orders" },` |
| documentation example | `{ key: "authHeader", label: "Authorization Header / Bearer Token", placeholder: "Bearer your_secret_token" },` |
| development-only fixture | `const webhookUrl = `https://api.orderking.in/v1/pos/webhook/${restaurantId \|\| "demo-restaurant"}`;` |
| documentation example | `placeholder="192.168.1.100"` |
| documentation example | `placeholder="9100"` |
| documentation example | `placeholder={field.placeholder}` |
| development-only fixture | `{/* Simulated ESC/POS Thermal Receipt */}` |

## File: `orderking-partners/src/lib/app-data/app-data.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `import { describe, it, mock } from "node:test";` |
| legitimate automated-test fixture | `function fakeJwt(claims: Record<string, unknown>): string {` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-1", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-2", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-2", iat: 1001, exp: 2001 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-3", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `mock.timers.enable({ apis: ["Date"], now: 1_000_000 });` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-5", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `mock.timers.setTime(1_000_000 + 5_001);` |
| legitimate automated-test fixture | `mock.timers.reset();` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-4", iat: 1000, exp: 2000 }),` |

## File: `orderking-partners/src/lib/auth/client.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Fallback when the user dismisses the popup. Grace period lets the` |

## File: `orderking-partners/src/lib/auth/preview.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `* the live preview do REAL sign-in — no demo/mock users — with no platform` |

## File: `orderking-partners/src/lib/auth/server.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `*     origin from the request, so real sign-in works (no demo users). Sessions` |
| fail-closed production behavior | `fallback: "http://localhost:8080",` |

## File: `orderking-partners/src/lib/auth/use-current-user.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** True when this is the sandbox/dev fallback (auth not configured). */` |
| fail-closed production behavior | `isDevFallback: boolean;` |
| fail-closed production behavior | `* Stable fallback user, used ONLY when auth is disabled` |
| fail-closed production behavior | `isDevFallback: true,` |
| fail-closed production behavior | `isDevFallback: false,` |

## File: `orderking-partners/src/lib/auth/verify.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** Dev fallback user id, used only when auth is disabled (VITE_AUTH_ENABLED=false). */` |

## File: `orderking-partners/src/lib/db-cloud.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `import.meta.env.VITE_SUPABASE_ANON_KEY \|\| "dummy"` |

## File: `orderking-partners/src/lib/db.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// "unset" — otherwise production would silently run on the PGLite fallback.` |
| actual fake production functionality | `// Rebuild with $1, $2, … placeholders so values stay parameterized.` |
| fail-closed production behavior | `* otherwise the local PGLite fallback. Memoized — safe to call per request.` |
| fail-closed production behavior | `throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");` |

## File: `orderking-partners/src/lib/dispatch/queue-contract.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `isSimulatedDispatchLabel,` |
| legitimate automated-test fixture | `dataLabel: "SIMULATED",` |
| legitimate automated-test fixture | `assert.equal(row.dataLabel, "SIMULATED");` |
| legitimate automated-test fixture | `assert.equal(isSimulatedDispatchLabel(row.dataLabel), true);` |
| legitimate automated-test fixture | `it("marks real labels as not simulated", () => {` |
| legitimate automated-test fixture | `assert.equal(isSimulatedDispatchLabel("REAL"), false);` |

## File: `orderking-partners/src/lib/dispatch/queue-contract.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `* Rider Window 3 SimulatedDispatch consumes this shape in SIMULATED mode.` |
| development-only fixture | `export function isSimulatedDispatchLabel(label: string): boolean {` |
| development-only fixture | `return label === "SIMULATED";` |

## File: `orderking-partners/src/lib/i18n/bn.ts`

| Category | Match |
| -------- | ----- |
| documentation example | `simulated: "সিমুলেটেড",` |
| documentation example | `simulatedHint: "ডেমো রেস্তোরাঁ। এটি কোনো লাইভ কিচেন নয়।",` |
| documentation example | `settlements: { title: "হিসাব", payable: "এখন পাওনা", pending: "বকেয়া হিসাব", completed: "সম্পন্ন", exportCsv: "CSV নামান", exportJson: "JSON নামান", food: "খাবারের মূল্য", restDisc: "রেস্তোরাঁর ছাড়", commission: "কমিশন", packing: "প্যাকেজিং", platformDisc: "প্ল্যাটফর্মের ছাড়", refund: "রিফান্ড সমন্বয়", payableLine: "রেস্তোরাঁর পাওনা", other: "অন্য অনুমোদিত কর্তন", empty: "এখনো কোনো হিসাব নেই।", simulatedNote: "সিমুলেটেড অঙ্ক। আসল পেমেন্ট নয়।", formula: "কত পাবেন — হিসাব", formulaHint: "খাবার + প্যাকিং − নিজের ছাড় − কমিশন − অনুমোদিত অন্য কাটা + প্ল্যাটফর্মের অফার ± রিফান্ড = রেস্তোরাঁর প্রাপ্য।" },` |
| documentation example | `analytics: { title: "বিশ্লেষণ", sales: "বিক্রি", orders: "অর্ডার", items: "আইটেম", time: "সময়", customers: "গ্রাহক", promos: "অফার", real: "আসল তথ্য", simulated: "সিমুলেটেড তথ্য", estimated: "আনুমানিক তথ্য", best: "সবচেয়ে চলা", low: "কম চলা", peak: "ব্যস্ত সময়", avgPrep: "গড় প্রস্তুতি" },` |
| documentation example | `assistant: { title: "কিচেন সহায়ক", placeholder: "আজকের বিক্রি, কম চলা আইটেম বা হিসাব নিয়ে জিজ্ঞাসা করুন…", send: "জিজ্ঞাসা", disclaimer: "উত্তর শুধু এই রেস্তোরাঁর অনুমোদিত সংখ্যা থেকে। সহায়ক আর্থিক অঙ্ক তৈরি করবে না।", unavailable: "এই পরিবেশে AI সংযুক্ত নয়।", examples: "আজকের সেরা বিক্রি কোনগুলো?\|কোন সময় সবচেয়ে ব্যস্ত?\|আমার হিসাব বুঝিয়ে দিন।\|কোন আইটেম প্রায়ই থাকে না?" },` |
| documentation example | `onboarding: { title: "আপনার রান্নাঘরের কথা বলুন", demoCta: "সিমুলেটেড কিচেন দেখুন", demoHint: "অনুশীলনের জন্য DEMO তথ্য লোড হয়। এটি লাইভ রেস্তোরাঁ নয়।", realCta: "আমার রেস্তোরাঁ নিবন্ধন", status: "যাচাইয়ের অবস্থা", notVerified: "যাচাই হয়নি। অ্যাডমিন যাচাই না করা পর্যন্ত গ্রাহক এটি দেখবেন না।", name: "রেস্তোরাঁর নাম", displayName: "দেখানো নাম", owner: "মালিকের নাম", phone: "ফোন", email: "ইমেইল", address: "ঠিকানা", landmark: "ল্যান্ডমার্ক", cuisine: "রান্নার ধরন", vegStatus: "খাবারের ধরন", description: "বিবরণ", gst: "GSTIN", fssai: "FSSAI নম্বর", pan: "PAN", bank: "ব্যাংক অ্যাকাউন্ট", ifsc: "IFSC", submit: "রিভিউয়ের জন্য পাঠান", saveDraft: "খসড়া সেভ", submitted: "পাঠানো হয়েছে। প্ল্যাটফর্ম অ্যাডমিন নথি দেখবেন।", documents: "নথি", storageHint: "ফাইল স্টোরেজ সংযুক্ত নয়। ফাইল স্থানীয়ভাবে PENDING যাচাই অবস্থায় রাখা হয়।" },` |

## File: `orderking-partners/src/lib/i18n/en.ts`

| Category | Match |
| -------- | ----- |
| documentation example | `simulated: "SIMULATED",` |
| documentation example | `simulatedHint: "DEMO RESTAURANT. Not a live kitchen.",` |
| documentation example | `orders: { incoming: "Incoming", live: "Live orders", history: "History", accept: "Accept", reject: "Reject", preparing: "Start preparing", ready: "Mark ready", rejectTitle: "Why are you rejecting?", rejectHint: "A reason is required. Silent rejection is not allowed.", special: "Special instructions", payment: "Payment", cod: "Cash on delivery", paid: "Paid online", total: "Total", discount: "Discount", platformPromo: "Platform-funded offer", restaurantPromo: "Restaurant-funded offer", empty: "No orders right now.", received: "Received", items: "Items", prepTime: "Prep time", simulateRider: "Advance rider (simulated)", simulateRiderHint: "Only for simulated kitchens. Real rider assignment comes from the rider system." },` |
| documentation example | `settlements: { title: "Settlement", payable: "Current payable", pending: "Pending settlement", completed: "Completed", exportCsv: "Download CSV", exportJson: "Download JSON", food: "Food value", restDisc: "Restaurant discount", commission: "Commission", packing: "Packaging", platformDisc: "Platform-funded discount", refund: "Refund adjustment", payableLine: "Restaurant payable", other: "Other authorised deduction", empty: "No settlement lines yet.", simulatedNote: "Simulated figures. Not a real payout.", formula: "How payable is calculated", formulaHint: "Food + packing − restaurant discount − commission − other authorised deduction + platform-funded offer ± refund = restaurant payable." },` |
| documentation example | `analytics: { title: "Analytics", sales: "Sales", orders: "Orders", items: "Items", time: "Time", customers: "Customers", promos: "Offers", real: "REAL DATA", simulated: "SIMULATED DATA", estimated: "ESTIMATED DATA", best: "Best sellers", low: "Low performers", peak: "Peak hours", avgPrep: "Average preparation" },` |
| documentation example | `assistant: { title: "Kitchen assistant", placeholder: "Ask about today’s sales, slow items, or your settlement…", send: "Ask", disclaimer: "Answers use only this restaurant’s authorised numbers. The assistant will not invent financial figures.", unavailable: "AI is not connected in this environment.", examples: "What were my best-selling items today?\|Which hours were busiest?\|Explain my settlement.\|Which items are often unavailable?" },` |
| documentation example | `onboarding: { title: "Tell us about your kitchen", demoCta: "Explore a simulated kitchen", demoHint: "Loads labelled DEMO data so you can practise orders. It is not a live restaurant.", realCta: "Register my restaurant", status: "Verification status", notVerified: "Not verified. Customers will not see this kitchen until a platform admin verifies it.", name: "Restaurant name", displayName: "Display name", owner: "Owner name", phone: "Phone", email: "Email", address: "Address", landmark: "Landmark", cuisine: "Cuisine", vegStatus: "Food type", description: "Description", gst: "GSTIN", fssai: "FSSAI number", pan: "PAN", bank: "Bank account", ifsc: "IFSC", submit: "Submit for review", saveDraft: "Save draft", submitted: "Submitted. A platform admin will review your documents.", documents: "Documents", storageHint: "File storage is NOT CONNECTED. The file is recorded locally with PENDING verification." },` |

## File: `orderking-partners/src/lib/orders/state-machine.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `SIMULATED_RIDER_NEXT,` |
| legitimate automated-test fixture | `it("simulated rider completes after READY", () => {` |
| legitimate automated-test fixture | `const next = SIMULATED_RIDER_NEXT[state as keyof typeof SIMULATED_RIDER_NEXT];` |
| legitimate automated-test fixture | `assertTransition(state as "READY", next, "simulated_rider");` |

## File: `orderking-partners/src/lib/orders/state-machine.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `\| "simulated_rider";` |
| development-only fixture | `RIDER_ASSIGNED: ["rider", "admin", "system", "simulated_rider"],` |
| development-only fixture | `PICKED_UP: ["rider", "admin", "system", "simulated_rider"],` |
| development-only fixture | `ON_THE_WAY: ["rider", "admin", "system", "simulated_rider"],` |
| development-only fixture | `DELIVERED: ["rider", "admin", "system", "simulated_rider"],` |
| development-only fixture | `export const SIMULATED_RIDER_NEXT: Partial<Record<OrderState, OrderState>> = {` |

## File: `orderking-partners/src/lib/platform-config.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `dataLabels: ["SIMULATED", "REAL", "VERIFIED"] as const,` |

## File: `orderking-partners/src/lib/server/api-bootstrap.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `if (ctx.dataLabel === "SIMULATED") {` |
| development-only fixture | `throw new Error("A simulated kitchen cannot be submitted for verification.");` |

## File: `orderking-partners/src/lib/server/api-finance.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `dataKind: ctx.dataLabel === "SIMULATED" ? "SIMULATED DATA" : "REAL DATA",` |

## File: `orderking-partners/src/lib/server/api-menu.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `note: "Only verified real kitchens. Simulated kitchens are excluded.",` |

## File: `orderking-partners/src/lib/server/api-more.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `const res = await fetch("https://api.x.ai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "grok-4.5", max_tokens: 500, messages: [{ role: "system", content: "You are the Order King Partner kitchen assistant. You may only use the JSON snapshot of THIS restaurant. Never invent financial figures. If a number is missing, say it is not in the authorised data. Never mention other restaurants or private customer names. Amounts are integer paise. Speak plainly for a small restaurant owner in Assam. Label simulated data as simulated." }, { role: "user", content: `Authorised snapshot:\n${JSON.stringify(authorized)}\n\nQuestion: ${question}` }] }) });` |

## File: `orderking-partners/src/lib/server/api-orders.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `import { assertTransition, isOrderState, SIMULATED_RIDER_NEXT, type OrderState } from "@/lib/orders/state-machine";` |
| development-only fixture | `export const advanceSimulatedRider = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d: { restaurantId?: string; orderId: string; idempotencyKey: string }) => d).handler(async ({ context, data }) => {` |
| development-only fixture | `if (ctx.dataLabel !== "SIMULATED") throw new Error("Rider simulation is only available on labelled SIMULATED kitchens.");` |
| development-only fixture | `const next = SIMULATED_RIDER_NEXT[order.state];` |
| development-only fixture | `if (!next) throw new Error("No simulated rider step from this state");` |
| development-only fixture | `assertTransition(previous, next, "simulated_rider");` |
| development-only fixture | `await sql`insert into order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason) values (${newId("evt")}, ${order.id}, ${ctx.restaurantId}, ${previous}, ${next}, 'simulated_rider', ${context.userId}, 'SIMULATED')`;` |
| development-only fixture | `const result = { ok: true as const, state: next, simulated: true as const };` |

## File: `orderking-partners/src/lib/server/isolation.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `dataLabel: "SIMULATED" \| "REAL" \| "VERIFIED";` |

## File: `orderking-partners/src/lib/server/menu-invariants.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `it("excludes simulated kitchens from the customer catalog", () => {` |

## File: `orderking-partners/src/lib/server/storage.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `* Supports AWS S3, Cloudflare R2, Supabase Storage, and local data-URI fallback.` |
| actual fake production functionality | `throw new Error("Storage credentials not configured. Refusing to generate mock upload.");` |

## File: `orderking-partners/src/lib/utils.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `export function asInt(value: unknown, fallback = 0): number {` |
| fail-closed production behavior | `return fallback;` |

## File: `orderking-partners/src/routes/analytics.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `{q.data?.dataKind ?? t("analytics.simulated")}` |

## File: `orderking-partners/src/routes/assistant.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder={t("assistant.placeholder")}` |

## File: `orderking-partners/src/routes/dashboard.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `<Link to="/onboarding">{t("onboarding.demoCta")}</Link>` |

## File: `orderking-partners/src/routes/menu.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder={t("menu.addCategory")}` |
| documentation example | `<Input placeholder={t("menu.addAddon")} value={addonName} onChange={(e) => setAddonName(e.target.value)} />` |
| documentation example | `placeholder={t("menu.price")}` |
| documentation example | `placeholder={t("menu.price")}` |

## File: `orderking-partners/src/routes/onboarding.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `<Button disabled={busy \|\| vendor.dataLabel === "SIMULATED"} onClick={() => void submit()}>` |

## File: `orderking-partners/src/routes/promotions.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder="e.g. 20% Off Weekend Specials"` |

## File: `orderking-partners/src/routes/settlements.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `{q.data?.dataLabel === "SIMULATED" ? (` |
| development-only fixture | `<p className="text-sm text-warn">{t("settlements.simulatedNote")}</p>` |

## File: `orderking-partners/vite.config.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// TanStack Start / the SPA HTML fallback. A model-authored` |

## File: `orderking-riders/src/components/error-boundary.tsx`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `type Props = { children: ReactNode; fallback?: ReactNode };` |
| fail-closed production behavior | `return this.props.fallback ?? (` |

## File: `orderking-riders/src/components/rider/app-shell.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `{t("simulatedBanner")}` |
| development-only fixture | `<Badge tone="sim">{t("simulated")}</Badge>` |

## File: `orderking-riders/src/components/rider/delivery-actions.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `simulatedOtp,` |
| development-only fixture | `simulatedOtp: string \| null;` |
| development-only fixture | `<Badge tone="sim">{t("simulated")}</Badge>` |
| development-only fixture | `{simulatedOtp ? (` |
| development-only fixture | `{t("simOtpHint")} <span className="font-mono tabular-nums">{simulatedOtp}</span>` |

## File: `orderking-riders/src/components/rider/home-view.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `simulatedOtp={home.simulatedOtp}` |
| documentation example | `<Input className="mt-2" placeholder="Or type a reason..." value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />` |
| development-only fixture | `<Badge tone="sim">{t("simulated")}</Badge>` |

## File: `orderking-riders/src/components/ui/input.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `"flex h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-fg placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",` |

## File: `orderking-riders/src/lib/app-data/app-data.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `import { describe, it, mock } from "node:test";` |
| legitimate automated-test fixture | `function fakeJwt(claims: Record<string, unknown>): string {` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-1", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-2", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-2", iat: 1001, exp: 2001 }),` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-3", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `mock.timers.enable({ apis: ["Date"], now: 1_000_000 });` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-5", iat: 1000, exp: 2000 }),` |
| legitimate automated-test fixture | `mock.timers.setTime(1_000_000 + 5_001);` |
| legitimate automated-test fixture | `mock.timers.reset();` |
| legitimate automated-test fixture | `token: fakeJwt({ sub: "memo-user-4", iat: 1000, exp: 2000 }),` |

## File: `orderking-riders/src/lib/auth/client.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// Fallback when the user dismisses the popup. Grace period lets the` |

## File: `orderking-riders/src/lib/auth/preview.ts`

| Category | Match |
| -------- | ----- |
| actual fake production functionality | `* the live preview do REAL sign-in — no demo/mock users — with no platform` |

## File: `orderking-riders/src/lib/auth/server.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `*     origin from the request, so real sign-in works (no demo users). Sessions` |
| fail-closed production behavior | `fallback: "http://localhost:8080",` |

## File: `orderking-riders/src/lib/auth/use-current-user.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** True when this is the sandbox/dev fallback (auth not configured). */` |
| fail-closed production behavior | `isDevFallback: boolean;` |
| fail-closed production behavior | `* Stable fallback user, used ONLY when auth is disabled` |
| fail-closed production behavior | `isDevFallback: true,` |
| fail-closed production behavior | `isDevFallback: false,` |

## File: `orderking-riders/src/lib/auth/verify.server.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `/** Dev fallback user id, used only when auth is disabled (VITE_AUTH_ENABLED=false). */` |

## File: `orderking-riders/src/lib/client/errors.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `export function errorMessage(e: unknown, fallback: string): string {` |
| fail-closed production behavior | `if (e.message === "Unauthorized") return fallback;` |
| fail-closed production behavior | `return fallback;` |

## File: `orderking-riders/src/lib/db.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// "unset" — otherwise production would silently run on the PGLite fallback.` |
| actual fake production functionality | `// Rebuild with $1, $2, … placeholders so values stay parameterized.` |
| fail-closed production behavior | `* otherwise the local PGLite fallback. Memoized — safe to call per request.` |
| fail-closed production behavior | `throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");` |

## File: `orderking-riders/src/lib/rider/catalog.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `export function simulatedRestaurant(): RestaurantSlice {` |
| development-only fixture | `export function simulatedCustomer(): { slice: CustomerSlice; location: GeoPoint } {` |

## File: `orderking-riders/src/lib/rider/contracts.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `* speak SIMULATED data that matches the same schemas.` |

## File: `orderking-riders/src/lib/rider/dispatch.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `* Simulated adapter: restaurant READY → in-memory queue → one eligible` |
| development-only fixture | `* Live Window 5 must replace SimulatedDispatch with a shared-core adapter` |
| development-only fixture | `// Simulated IoT Telemetry: Battery & Network Drops` |
| development-only fixture | `const simulatedBattery = Math.random() * 100;` |
| development-only fixture | `const telemetryPenalty = simulatedBattery < 15 ? -50 : 0;` |
| development-only fixture | `simulated: "Window 3 SimulatedDispatch — labelled SIMULATED",` |

## File: `orderking-riders/src/lib/rider/engine.test.ts`

| Category | Match |
| -------- | ----- |
| legitimate automated-test fixture | `const otp = (await store.getOtp(d.id))!.simulatedPlain!;` |
| legitimate automated-test fixture | `const otp = (await store.getOtp(d.id))?.simulatedPlain;` |
| legitimate automated-test fixture | `describe("e2e simulated delivery", () => {` |
| legitimate automated-test fixture | `const otp = (await store.getOtp(d.id))!.simulatedPlain!;` |
| legitimate automated-test fixture | `assert.ok(home.offer, "expected simulated offer");` |

## File: `orderking-riders/src/lib/rider/engine.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `import { simulatedCustomer, simulatedRestaurant } from "./catalog.ts";` |
| development-only fixture | `if (cfg.dataMode !== "SIMULATED") return;` |
| development-only fixture | `const restaurant = simulatedRestaurant();` |
| development-only fixture | `const customer = simulatedCustomer();` |
| development-only fixture | `// 1000x Realism: Dynamic Environment Simulation` |
| development-only fixture | `return; // AI Dispatch rejected this rider for this simulated payload` |
| development-only fixture | `dataMode: "SIMULATED",` |
| development-only fixture | `// Store simulated AI metrics on the offer context for rendering` |
| fail-closed production behavior | `} // Fallback simulated UI injection` |
| development-only fixture | `dataMode: "SIMULATED",` |
| development-only fixture | `simulatedPlain: otp,` |
| development-only fixture | `const simulatedOtp = await this.otpForSimulation(userId, deliveryId);` |
| development-only fixture | `return { delivery, simulatedOtp, cash };` |
| development-only fixture | `dataMode: "SIMULATED",` |
| development-only fixture | `dataMode: "SIMULATED",` |
| development-only fixture | `dataMode: "SIMULATED",` |
| development-only fixture | `dataMode: "SIMULATED",` |
| development-only fixture | `dataMode: "SIMULATED" as const,` |
| fail-closed production behavior | `if (err instanceof RiderError && err.code === "FAKE_GPS") {` |
| actual fake production functionality | `kind: "FAKE_GPS",` |
| development-only fixture | `simulatedOtp: otp?.simulatedPlain ?? null,` |
| development-only fixture | `dataMode: "SIMULATED" as const,` |
| development-only fixture | `dataMode: "SIMULATED" as const,` |
| development-only fixture | `async otpForSimulation(userId: string, deliveryId: string) {` |
| development-only fixture | `if (cfg.dataMode !== "SIMULATED") return null;` |
| development-only fixture | `return rec?.simulatedPlain ?? null;` |
| development-only fixture | `dataMode: "SIMULATED" as const,` |

## File: `orderking-riders/src/lib/rider/gps.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `throw new RiderError("FAKE_GPS", "Location is not a valid coordinate", 400);` |
| fail-closed production behavior | `throw new RiderError("FAKE_GPS", "Location timestamp is invalid", 400);` |
| fail-closed production behavior | `throw new RiderError("FAKE_GPS", "Location jump is not physically possible", 400);` |
| fail-closed production behavior | `throw new RiderError("FAKE_GPS", "Location jump is not physically possible", 400);` |

## File: `orderking-riders/src/lib/rider/i18n.ts`

| Category | Match |
| -------- | ----- |
| documentation example | `simulated: "SIMULATED",` |
| documentation example | `simulatedBanner:` |
| documentation example | `"Simulated operations — not live dispatch, GPS, payouts, or real customers.",` |
| documentation example | `practiceMode: "Practice / simulation is available while verification is in progress.",` |
| documentation example | `kycHint: "Unverified partners cannot take live orders. Simulation is labelled.",` |
| documentation example | `simOtpHint: "SIMULATION — the customer would tell you this code.",` |
| documentation example | `simulated: "সিমুলেটেড",` |
| documentation example | `simulatedBanner:` |
| documentation example | `const FALLBACK: Record<LocaleCode, "en" \| "bn"> = {` |
| documentation example | `const pack = STRINGS[FALLBACK[locale]];` |

## File: `orderking-riders/src/lib/rider/pg-store.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `function json<T>(v: unknown, fallback: T): T {` |
| fail-closed production behavior | `if (v == null) return fallback;` |
| fail-closed production behavior | `return fallback;` |
| fail-closed production behavior | `return fallback;` |
| development-only fixture | `dataMode: (row.data_mode as RiderProfile["dataMode"]) ?? "SIMULATED",` |
| development-only fixture | `simulatedPlain: r.simulated_plain ? String(r.simulated_plain) : null,` |
| development-only fixture | ``insert into delivery_otps (delivery_id, user_id, hash, salt, attempts, verified_at, simulated_plain)` |
| development-only fixture | `[rec.deliveryId, userId, rec.hash, rec.salt, rec.attempts, rec.verifiedAt, rec.simulatedPlain],` |
| development-only fixture | `dataMode: (r.data_mode as ProofOfDelivery["dataMode"]) ?? "SIMULATED",` |
| development-only fixture | `dataMode: (r.data_mode as EarningLine["dataMode"]) ?? "SIMULATED",` |
| development-only fixture | `dataMode: (r.data_mode as Settlement["dataMode"]) ?? "SIMULATED",` |
| development-only fixture | `dataMode: (row.data_mode as DispatchOffer["dataMode"]) ?? "SIMULATED",` |
| development-only fixture | `dataMode: (row.data_mode as Delivery["dataMode"]) ?? "SIMULATED",` |

## File: `orderking-riders/src/lib/rider/types.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `export type DataMode = "SIMULATED" \| "LIVE";` |
| development-only fixture | `simulatedPlain: string \| null;` |

## File: `orderking-riders/src/lib/server/assistant.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `const POLICY = `You are the Order King Rider assistant. You may ONLY use the authorized snapshot JSON provided. Never invent earnings, payouts, addresses, OTPs, customer names, or order states. If a number is missing, say you do not have it. Never encourage speeding, phone use while riding, ignoring traffic law, or skipping safety steps. If the rider is BUSY or on an active delivery, keep answers short. Data is SIMULATED unless dataMode is LIVE. Answer in the rider's language if obvious, else English.`;` |
| development-only fixture | `const prefix = s.dataMode === "SIMULATED" ? "SIMULATED data. " : "";` |

## File: `orderking-riders/src/lib/server/rider-fns.ts`

| Category | Match |
| -------- | ----- |
| development-only fixture | `const simulatedOtp = await e.otpForSimulation(context.userId, data.deliveryId);` |
| development-only fixture | `return { delivery, simulatedOtp };` |

## File: `orderking-riders/src/routes/assistant.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder={t("askAssistant")}` |

## File: `orderking-riders/src/routes/delivery.$id.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `simulatedOtp={pack.simulatedOtp}` |

## File: `orderking-riders/src/routes/earnings.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `<Badge tone="sim">{t("simulated")}</Badge>` |
| development-only fixture | `<CardMeta className="mt-3">{t("simulatedBanner")}</CardMeta>` |

## File: `orderking-riders/src/routes/login.tsx`

| Category | Match |
| -------- | ----- |
| development-only fixture | `<Badge tone="sim">{t("simulated")}</Badge>` |
| development-only fixture | `<p className="mt-2 text-xs text-muted-foreground">{t("simulatedBanner")}</p>` |

## File: `orderking-riders/src/routes/safety.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `<Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("message")} />` |

## File: `orderking-riders/src/routes/support.tsx`

| Category | Match |
| -------- | ----- |
| documentation example | `placeholder={t("message")}` |

## File: `orderking-riders/vite.config.ts`

| Category | Match |
| -------- | ----- |
| fail-closed production behavior | `// TanStack Start / the SPA HTML fallback. A model-authored` |

