import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Droplets,
  HardHat,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/academy")({
  beforeLoad: ({ context }) => {
    if (!context.sessionUser) throw redirect({ to: "/login" });
  },
  component: RiderAcademyPage,
});

type AcademyModule = {
  id: string;
  title: string;
  duration: string;
  icon: typeof Package;
  category: string;
  points: string[];
  keyRules: string[];
};

const ACADEMY_MODULES: ReadonlyArray<AcademyModule> = [
  {
    id: "food-hygiene",
    title: "Food Hygiene & Spillage Prevention",
    duration: "1 min read",
    icon: Package,
    category: "Food Handling",
    points: [
      "Keep hot and cold food containers separated inside the thermal delivery bag.",
      "Always keep beverage cups upright and pack liquid curries flat on the base.",
      "Zip the bag completely closed during transport to maintain temperature and seal.",
    ],
    keyRules: [
      "Never open merchant food containers or customer tamper-evident seals.",
      "Wipe delivery bag interior daily with sanitizing cloth.",
    ],
  },
  {
    id: "handover-etiquette",
    title: "Customer Handover Etiquette",
    duration: "1 min read",
    icon: Users,
    category: "Customer Service",
    points: [
      "Greet customer politely and confirm order short-code before handover.",
      "Request 4-digit delivery OTP before handing over food parcels.",
      "For COD orders, collect exact cash amount shown on screen before OTP verification.",
    ],
    keyRules: [
      "Never mark an order delivered before entering the customer's 4-digit OTP.",
      "Respect customer privacy: never store customer personal contact numbers.",
    ],
  },
  {
    id: "monsoon-night-safety",
    title: "Safe Monsoon & Night Driving",
    duration: "1 min read",
    icon: HardHat,
    category: "Road Safety",
    points: [
      "Wear ISI-certified helmet and high-visibility reflective jacket at night.",
      "Reduce speed by 15-20 km/h on wet roads and increase braking distance.",
      "Use waterproof phone pouch during heavy monsoon rainfall.",
    ],
    keyRules: [
      "Emergency SOS button is active 24/7 on every active trip screen.",
      "If weather conditions become hazardous, report via Support desk immediately.",
    ],
  },
  {
    id: "cod-safety",
    title: "Cash on Delivery (COD) Safety",
    duration: "1 min read",
    icon: Wallet,
    category: "Finance & Deposits",
    points: [
      "Count and verify currency notes in the customer's presence.",
      "Floating cash limit is capped at ₹2,500 for safety and zero liability.",
      "Deposit collected cash immediately via 1-tap UPI to orderking@ybl.",
    ],
    keyRules: [
      "Always deposit COD collections on the same day before the cutoff.",
      "Maintain personal float of ₹100-200 in small change for customers.",
    ],
  },
];

function RiderAcademyPage() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({
    "food-hygiene": true,
  });
  const [activeModule, setActiveModule] = useState<string>("food-hygiene");

  const selected = ACADEMY_MODULES.find((m) => m.id === activeModule) || ACADEMY_MODULES[0];
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / ACADEMY_MODULES.length) * 100);

  function toggleComplete(id: string) {
    setCompleted((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!prev[id]) {
        toast.success(`Completed "${ACADEMY_MODULES.find((m) => m.id === id)?.title}"!`);
      }
      return next;
    });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="size-6 text-primary" />
              <span>Rider Academy</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Short 1-minute training modules for high service quality and safety.
            </p>
          </div>
          <Badge className="bg-[#E5A93C]/20 text-primary border-primary/40 text-xs px-3 py-1">
            {completedCount}/{ACADEMY_MODULES.length} Completed
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Training Progress</span>
            <span className="text-primary font-mono">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-card overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Module Selector */}
        <div className="grid grid-cols-2 gap-2.5">
          {ACADEMY_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isSelected = activeModule === mod.id;
            const isDone = Boolean(completed[mod.id]);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModule(mod.id)}
                className={`rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-muted text-white shadow-lg shadow-amber-500/10"
                    : "border-border bg-card text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-[#E5A93C]/20 text-primary" : "bg-slate-800 text-slate-400"}`}>
                    <Icon className="size-4" />
                  </div>
                  {isDone ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="size-3" />
                      {mod.duration}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold line-clamp-1">{mod.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{mod.category}</div>
              </button>
            );
          })}
        </div>

        {/* Active Module Details */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
                {selected.category} · {selected.duration}
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">{selected.title}</h2>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => toggleComplete(selected.id)}
              className={`rounded-xl text-xs font-bold ${
                completed[selected.id]
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-[#E5A93C] hover:bg-amber-400 text-black"
              }`}
            >
              {completed[selected.id] ? "Completed ✓" : "Mark as Read"}
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Key Guidelines
            </h3>
            <ul className="space-y-2">
              {selected.points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary" />
              <span>Safety &amp; Compliance Rule</span>
            </h4>
            <ul className="space-y-1.5">
              {selected.keyRules.map((rule, idx) => (
                <li key={idx} className="text-xs text-slate-300 pl-5 relative before:absolute before:left-1.5 before:top-2 before:size-1.5 before:rounded-full before:bg-amber-400">
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
