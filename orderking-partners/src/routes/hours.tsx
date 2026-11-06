// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/hours")({
  component: PartnerHoursPage,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function PartnerHoursPage() {
  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({ day, open: "10:00", close: "23:00", active: true }))
  );
  const [saved, setSaved] = useState(false);

  return (
    <VendorShell title="Operating Hours">
      <div className="mx-auto max-w-3xl py-4 space-y-4 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="size-5 text-emerald-400" />
              <span>Outlet Operating Hours</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Set daily opening and closing timings for automatic online/offline scheduling.</p>
          </div>
          <Button
            type="button"
            onClick={() => setSaved(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-10 px-5 rounded-xl"
          >
            Save Timings
          </Button>
        </div>

        {saved && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span>Operating hours saved and synced.</span>
          </div>
        )}

        <div className="space-y-2.5">
          {schedule.map((row, idx) => (
            <div key={row.day} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={(e) =>
                    setSchedule((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, active: e.target.checked } : item))
                    )
                  }
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500"
                />
                <span className="text-sm font-bold text-white w-28">{row.day}</span>
              </div>
              {row.active ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={row.open}
                    onChange={(e) =>
                      setSchedule((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, open: e.target.value } : item))
                      )
                    }
                    className="h-9 w-32 bg-slate-950 border-slate-800 text-white text-xs"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <Input
                    type="time"
                    value={row.close}
                    onChange={(e) =>
                      setSchedule((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, close: e.target.value } : item))
                      )
                    }
                    className="h-9 w-32 bg-slate-950 border-slate-800 text-white text-xs"
                  />
                </div>
              ) : (
                <span className="text-xs font-semibold text-rose-400">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </VendorShell>
  );
}
