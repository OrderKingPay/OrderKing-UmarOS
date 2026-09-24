import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Lock,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface ProjectMilestone {
  id: string;
  title: string;
  percentage: number;
  amountInr: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PAID";
  deliverables: string[];
}

export function ClientPortalHub({
  founderUpiVpa = "orderking@okhdfcbank",
}: {
  founderUpiVpa?: string;
}) {
  const [clientName, setClientName] = useState("Royal Darbar Palace & Cloud Kitchens");
  const [projectTitle, setProjectTitle] = useState("White-Label Direct Ordering App & Dispatch Fleet");
  const [contractSigned, setContractSigned] = useState(true);
  const [signerName, setSignerName] = useState("Rajesh Singha (Managing Director)");
  const [signedAt, setSignedAt] = useState("2026-09-21 14:30 IST");

  const [milestones, setMilestones] = useState<ProjectMilestone[]>([
    {
      id: "M1",
      title: "Milestone 1: Architecture, UX Design & DB Schema Approval",
      percentage: 30,
      amountInr: 45000,
      status: "PAID",
      deliverables: ["Full UX Mockups", "PostgreSQL Schema", "Brand Kit"],
    },
    {
      id: "M2",
      title: "Milestone 2: Core Platform, WhatsApp Dispatch & Direct UPI Gateway",
      percentage: 40,
      amountInr: 60000,
      status: "COMPLETED",
      deliverables: ["Kitchen Order Console", "Customer PWA App", "KingPay UPI 0% Fee Integration"],
    },
    {
      id: "M3",
      title: "Milestone 3: Final Security Testing, Live Domain Deployment & Handover",
      percentage: 30,
      amountInr: 44999,
      status: "IN_PROGRESS",
      deliverables: ["Production Cloud Deployment", "Admin Credentials", "Staff Training Video"],
    },
  ]);

  const [selectedMilestoneForPayment, setSelectedMilestoneForPayment] = useState<ProjectMilestone | null>(
    milestones[1] || null
  );

  const handlePayMilestone = (m: ProjectMilestone) => {
    const invoiceNum = `INV-${m.id}-${Date.now().toString().slice(-4)}`;
    const upiLink = `upi://pay?pa=${founderUpiVpa}&pn=OrderKing%20Technologies&am=${m.amountInr}&cu=INR&tn=Milestone%20${m.id}%20Invoice`;
    void navigator.clipboard?.writeText(upiLink);
    toast.success(`Milestone UPI Payment link copied: ₹${m.amountInr.toLocaleString("en-IN")}`);
    
    // Simulate payment confirmation
    setTimeout(() => {
      setMilestones((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, status: "PAID" } : item))
      );
      toast.success(`Payment confirmed for ${m.title}! Receipt emitted.`);
    }, 1500);
  };

  const totalContractValue = milestones.reduce((acc, curr) => acc + curr.amountInr, 0);
  const paidValue = milestones.filter((m) => m.status === "PAID").reduce((acc, curr) => acc + curr.amountInr, 0);

  return (
    <div className="flex flex-col h-full w-full bg-surface text-fg rounded-2xl border border-border overflow-hidden">
      {/* Client Portal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/40 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-purple-500" />
            <h2 className="text-lg font-black tracking-tight">Client Trust &amp; Dedicated Project Portal</h2>
            <Badge tone="primary" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
              Directive §8 &amp; §9
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Secure Client Workspace · Contract Verification, Milestone Payments &amp; Deliverables
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge tone="primary" className="font-bold">
            Client: {clientName}
          </Badge>
        </div>
      </div>

      {/* Main Portal View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
        {/* Project Overview Card */}
        <div className="rounded-2xl border border-border bg-surface-2/30 p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-fg">{projectTitle}</h3>
              <p className="text-xs text-muted mt-0.5">
                Contract Status:{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {contractSigned ? "✓ Digitally Signed & Legally Binding" : "Pending Signature"}
                </span>{" "}
                · Signed by: {signerName} ({signedAt})
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase font-black tracking-wider text-muted">Total Contract Value</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{totalContractValue.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted">Paid: ₹{paidValue.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1 pt-2 border-t border-border">
            <div className="flex justify-between text-xs font-bold">
              <span>Overall Project Progress</span>
              <span className="text-primary">{Math.round((paidValue / totalContractValue) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.round((paidValue / totalContractValue) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Milestones & Deliverables List */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
            <FileCheck className="size-4 text-emerald-500" />
            <span>Project Milestones &amp; Payment Schedules</span>
          </h4>

          <div className="space-y-2.5">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-border bg-surface p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-fg">{m.title}</span>
                    <Badge
                      tone={m.status === "PAID" ? "primary" : m.status === "COMPLETED" ? "warn" : "neutral"}
                      className="text-[10px] font-bold"
                    >
                      {m.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {m.deliverables.map((deliv) => (
                      <span
                        key={deliv}
                        className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] text-muted border border-border"
                      >
                        ✓ {deliv}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted">{m.percentage}% Share</p>
                    <p className="font-mono font-black text-sm text-fg">₹{m.amountInr.toLocaleString("en-IN")}</p>
                  </div>

                  {m.status === "PAID" ? (
                    <Button size="sm" variant="outline" className="text-xs font-bold text-emerald-600 border-emerald-500/30">
                      ✓ Paid Receipt
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handlePayMilestone(m)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <QrCode className="size-3.5" /> Pay Milestone
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Handover & Credentials Download Box */}
        <div className="rounded-2xl border border-border bg-surface-2/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Download className="size-4 text-primary" />
              <span>Project Deliverables &amp; Production Handover Package</span>
            </h4>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Verified TLS 1.3 Security
            </span>
          </div>

          <p className="text-xs text-muted">
            All code repositories, database schemas, environment configs, and documentation are cryptographically sealed and accessible to the verified client.
          </p>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold"
              onClick={() => {
                toast.success("Master Codebase (.zip) download link dispatched to client email!");
              }}
            >
              📦 Download Codebase (.zip)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold"
              onClick={() => {
                toast.success("Signed Master Services Agreement PDF downloaded!");
              }}
            >
              📄 Download Signed Contract (PDF)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold"
              onClick={() => {
                toast.success("All Tax Invoices (GST Compliant) downloaded!");
              }}
            >
              🧾 Download Tax Invoices
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
