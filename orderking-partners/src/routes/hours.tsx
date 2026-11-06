import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { getOperatingSnapshot, saveHours } from "@/lib/server/api-orders";
import { hmToMinutes, minutesToHm } from "@/lib/hours";
import { CalendarOff, CheckCircle2, Clock3, Copy, Flame, Plus, Sparkles, Trash2 } from "lucide-react";

export const Route = createFileRoute("/hours")({ component: HoursPage });

const DAYS = [
  "hours.day0",
  "hours.day1",
  "hours.day2",
  "hours.day3",
  "hours.day4",
  "hours.day5",
  "hours.day6",
] as const;

function HoursPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["hours", vendor.restaurantId],
    queryFn: () => getOperatingSnapshot({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const [emergency, setEmergency] = useState(false);
  const [vacation, setVacation] = useState(false);
  const [prep, setPrep] = useState("20");
  const [peak, setPeak] = useState("35");
  const [weeklyHolidays, setWeeklyHolidays] = useState<number[]>([]);
  const [shifts, setShifts] = useState<{ weekday: number; open: string; close: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!q.data) return;
    setEmergency(Boolean(q.data.restaurant?.emergency_closed));
    setVacation(Boolean(q.data.restaurant?.vacation_mode));
    setPrep(String(q.data.restaurant?.prep_minutes ?? 20));
    setPeak(String(q.data.restaurant?.peak_prep_minutes ?? 35));
    const parsedHolidays = String(q.data.restaurant?.weekly_holidays ?? "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
    setWeeklyHolidays(parsedHolidays);
    setShifts(
      q.data.hours.map((h) => ({
        weekday: h.weekday,
        open: minutesToHm(h.open_minutes),
        close: minutesToHm(h.close_minutes),
      })),
    );
  }, [q.data]);

  function applyTemplate(kind: "ALL_DAY" | "SPLIT" | "LATE_NIGHT" | "COPY_MON") {
    setStatusMsg(null);
    if (kind === "ALL_DAY") {
      const next: { weekday: number; open: string; close: string }[] = [];
      for (let d = 0; d <= 6; d++) {
        if (!weeklyHolidays.includes(d)) {
          next.push({ weekday: d, open: "09:00", close: "23:00" });
        }
      }
      setShifts(next);
      setStatusMsg("Applied All-Day Dining template (09:00–23:00). Click Save Hours to publish.");
    } else if (kind === "SPLIT") {
      const next: { weekday: number; open: string; close: string }[] = [];
      for (let d = 0; d <= 6; d++) {
        if (!weeklyHolidays.includes(d)) {
          next.push({ weekday: d, open: "11:00", close: "15:30" });
          next.push({ weekday: d, open: "18:30", close: "23:00" });
        }
      }
      setShifts(next);
      setStatusMsg("Applied Lunch & Dinner Split Shift template (11:00–15:30 & 18:30–23:00). Click Save Hours to publish.");
    } else if (kind === "LATE_NIGHT") {
      const next: { weekday: number; open: string; close: string }[] = [];
      for (let d = 0; d <= 6; d++) {
        if (!weeklyHolidays.includes(d)) {
          next.push({ weekday: d, open: "11:00", close: "23:59" });
        }
      }
      setShifts(next);
      setStatusMsg("Applied Extended Cloud Kitchen schedule (11:00–23:59). Click Save Hours to publish.");
    } else if (kind === "COPY_MON") {
      const monShifts = shifts.filter((s) => s.weekday === 1);
      const base = monShifts.length > 0 ? monShifts : [{ weekday: 1, open: "11:00", close: "22:30" }];
      const next: { weekday: number; open: string; close: string }[] = [];
      for (let d = 0; d <= 6; d++) {
        if (!weeklyHolidays.includes(d)) {
          for (const b of base) {
            next.push({ weekday: d, open: b.open, close: b.close });
          }
        }
      }
      setShifts(next);
      setStatusMsg("Copied Monday's operating hours to all open days. Click Save Hours to publish.");
    }
  }

  function toggleHoliday(dayIndex: number) {
    setWeeklyHolidays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort(),
    );
  }

  async function handleSave() {
    setSaving(true);
    setStatusMsg(null);
    try {
      await saveHours({
        data: {
          restaurantId: vendor.restaurantId,
          emergencyClosed: emergency,
          vacationMode: vacation,
          weeklyHolidays: weeklyHolidays.join(","),
          prepMinutes: Number(prep) || 20,
          peakPrepMinutes: Number(peak) || 35,
          shifts: shifts.map((s) => ({
            weekday: s.weekday,
            openMinutes: hmToMinutes(s.open),
            closeMinutes: hmToMinutes(s.close),
          })),
        },
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["hours"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setStatusMsg("Operating hours, weekly holidays, and preparation SLAs saved and live.");
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Could not save operating hours");
    } finally {
      setSaving(false);
    }
  }

  return (
    <VendorShell
      title={t("nav.hours")}
      dataLabel={q.data?.dataLabel ?? vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-4">
        {/* Emergency Closure & Vacation Mode Controls */}
        <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock3 className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  Outlet Availability, Prep Time SLAs &amp; Holiday Controls
                </h2>
                <p className="text-xs text-slate-400">
                  Manage your weekly shifts, planned holidays, and rush-hour kitchen preparation buffers self-service.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              disabled={saving}
              onClick={() => void handleSave()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs shrink-0"
            >
              {saving ? "Saving Schedule..." : t("hours.save")}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={emergency}
                onChange={(e) => setEmergency(e.target.checked)}
                className="mt-1 rounded border-slate-700 bg-slate-900 text-rose-500"
              />
              <div>
                <div className="text-xs font-semibold text-white">{t("hours.emergency")}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Immediately halts new customer orders if your kitchen faces an unexpected equipment or utility issue.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={vacation}
                onChange={(e) => setVacation(e.target.checked)}
                className="mt-1 rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              <div>
                <div className="text-xs font-semibold text-white">{t("hours.vacation")}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Marks your storefront as temporarily on festival or multi-day leave without deleting your shift schedule.
                </p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <Label className="text-xs text-slate-300 flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-emerald-400" />
                {t("menu.prep")} (Standard Kitchen SLA)
              </Label>
              <Input
                type="number"
                min={5}
                max={90}
                value={prep}
                onChange={(e) => setPrep(e.target.value)}
                className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used during normal hours to dispatch riders so they arrive right as food is packed.
              </p>
            </div>
            <div>
              <Label className="text-xs text-slate-300 flex items-center gap-1.5">
                <Flame className="size-3.5 text-amber-400" />
                {t("hours.peak")} (Peak Rush SLA Buffer)
              </Label>
              <Input
                type="number"
                min={10}
                max={120}
                value={peak}
                onChange={(e) => setPeak(e.target.value)}
                className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Applied when Peak Rush Mode is active so customers see realistic delivery ETAs.
              </p>
            </div>
          </div>

          {statusMsg ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          ) : null}
        </Card>

        {/* 1-Tap Schedule Templates & Weekly Holiday Toggles */}
        <Card className="border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-400" />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                1-Tap Smart Schedule Templates
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applyTemplate("ALL_DAY")}
                className="text-xs"
              >
                All-Day Dining (09:00–23:00)
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applyTemplate("SPLIT")}
                className="text-xs"
              >
                Lunch &amp; Dinner Split (11:00–15:30 &amp; 18:30–23:00)
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applyTemplate("LATE_NIGHT")}
                className="text-xs"
              >
                Extended Cloud Kitchen (11:00–23:59)
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applyTemplate("COPY_MON")}
                className="text-xs"
              >
                <Copy className="mr-1.5 size-3.5 text-emerald-400" />
                Copy Monday Schedule to All Days
              </Button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <CalendarOff className="size-4 text-amber-400" />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Weekly Scheduled Day-Off / Holiday Toggles
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Select any weekday your kitchen remains closed every week:
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, idx) => {
                const isOff = weeklyHolidays.includes(idx);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleHoliday(idx)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      isOff
                        ? "border border-rose-500/40 bg-rose-500/15 text-rose-300"
                        : "border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {t(d)}: {isOff ? "Weekly Holiday (Closed)" : "Open"}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Day-by-Day Shift Matrix */}
        <Card className="border-slate-800 bg-slate-900/70 p-5 space-y-3">
          {DAYS.map((d, i) => {
            const isWeeklyHoliday = weeklyHolidays.includes(i);
            const dayShifts = shifts.filter((s) => s.weekday === i);
            return (
              <div
                key={d}
                className="grid gap-2 border-b border-slate-800/80 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[140px_1fr]"
              >
                <div className="flex items-center justify-between md:block">
                  <div className="font-semibold text-sm text-white">{t(d)}</div>
                  {isWeeklyHoliday ? (
                    <span className="text-[10px] font-mono text-rose-400">WEEKLY OFF</span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400">
                      {dayShifts.length} {dayShifts.length === 1 ? "SHIFT" : "SHIFTS"}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {isWeeklyHoliday ? (
                    <div className="text-xs text-rose-300 py-1">
                      Marked as a Weekly Holiday above. Toggle off to accept orders on {t(d)}.
                    </div>
                  ) : dayShifts.length === 0 ? (
                    <div className="text-xs text-slate-400 py-1">{t("hours.closed")}</div>
                  ) : null}

                  {!isWeeklyHoliday &&
                    dayShifts.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={s.open}
                          onChange={(e) => {
                            const next = shifts.map((x) => (x === s ? { ...x, open: e.target.value } : x));
                            setShifts(next);
                          }}
                          className="h-9 text-xs bg-slate-950 border-slate-800 max-w-[140px]"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <Input
                          type="time"
                          value={s.close}
                          onChange={(e) => {
                            const next = shifts.map((x) => (x === s ? { ...x, close: e.target.value } : x));
                            setShifts(next);
                          }}
                          className="h-9 text-xs bg-slate-950 border-slate-800 max-w-[140px]"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShifts(shifts.filter((x) => x !== s))}
                          className="text-xs text-rose-400 hover:text-rose-300 h-9 px-2"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}

                  {!isWeeklyHoliday && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShifts([...shifts, { weekday: i, open: "11:00", close: "22:30" }])}
                      className="text-xs text-emerald-400 hover:text-emerald-300 h-8 px-2"
                    >
                      <Plus className="mr-1 size-3.5" />
                      {t("hours.split")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <Button
              disabled={saving}
              onClick={() => void handleSave()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              {saving ? "Saving Hours..." : t("hours.save")}
            </Button>
          </div>
        </Card>
      </div>
    </VendorShell>
  );
}
