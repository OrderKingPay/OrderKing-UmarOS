import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Lock,
  ShieldAlert,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ApprovalRequest {
  id: string;
  action: string;
  why: string;
  expectedResult: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "IRREVERSIBLE";
  cost: string; // e.g. "₹0 (Client pays 50% advance)" or "$0.04 LLM tokens"
  target: string; // e.g. "Royal Darbar Cloud Kitchens" or "Production Database"
  preview: string; // code diff, WhatsApp message text, or invoice payload
  timestamp: string;
}

interface FounderApprovalModalProps {
  request: ApprovalRequest | null;
  onApprove: (request: ApprovalRequest) => void;
  onReject: (request: ApprovalRequest) => void;
  onClose: () => void;
}

export function FounderApprovalModal({
  request,
  onApprove,
  onReject,
  onClose,
}: FounderApprovalModalProps) {
  if (!request) return null;

  const getRiskBadge = (risk: ApprovalRequest["risk"]) => {
    switch (risk) {
      case "LOW":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">LOW RISK</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">MEDIUM RISK</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40">HIGH RISK</Badge>;
      case "IRREVERSIBLE":
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40">IRREVERSIBLE</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-[#0B1D16] via-[#06140F] to-black shadow-[0_0_60px_rgba(245,158,11,0.25)] p-6 space-y-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide">
                Founder Authorization Checkpoint
              </h3>
              <p className="text-xs text-muted">
                Section 14 Sovereign Guard: High-impact action requires explicit founder signature.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:text-white hover:bg-surface-2 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Structured Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* ACTION */}
          <div className="rounded-xl bg-surface-2/80 p-3 border border-border/60">
            <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">
              Action
            </span>
            <span className="text-sm font-black text-white font-mono mt-0.5 block">
              {request.action}
            </span>
          </div>

          {/* TARGET */}
          <div className="rounded-xl bg-surface-2/80 p-3 border border-border/60">
            <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">
              Target
            </span>
            <span className="text-sm font-black text-amber-300 mt-0.5 block truncate">
              {request.target}
            </span>
          </div>

          {/* RISK & COST */}
          <div className="rounded-xl bg-surface-2/80 p-3 border border-border/60 flex items-center justify-between">
            <div>
              <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">
                Risk Level
              </span>
              <div className="mt-1">{getRiskBadge(request.risk)}</div>
            </div>
            <div>
              <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">
                Financial Cost
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono mt-1 block">
                {request.cost}
              </span>
            </div>
          </div>

          {/* EXPECTED RESULT */}
          <div className="rounded-xl bg-surface-2/80 p-3 border border-border/60">
            <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">
              Expected Result
            </span>
            <span className="text-xs font-medium text-slate-200 mt-0.5 block leading-relaxed">
              {request.expectedResult}
            </span>
          </div>
        </div>

        {/* WHY (STRATEGIC RATIONALE) */}
        <div className="rounded-xl bg-surface-2/60 p-3.5 border border-border/60 space-y-1 text-xs">
          <span className="text-amber-400 font-bold block text-[10px] uppercase tracking-wider">
            Strategic Rationale (Why):
          </span>
          <p className="text-slate-300 leading-relaxed">{request.why}</p>
        </div>

        {/* PREVIEW */}
        <div className="space-y-1.5 text-xs">
          <span className="text-muted font-bold block text-[10px] uppercase tracking-wider">
            Payload / Draft Preview:
          </span>
          <div className="rounded-xl bg-black/90 p-3 font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto border border-border/70 whitespace-pre-wrap leading-relaxed">
            {request.preview}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/70">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(request)}
            className="text-xs font-bold text-rose-400 border-rose-500/40 hover:bg-rose-500/10"
          >
            Reject Action
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => onApprove(request)}
            className="text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg"
          >
            <CheckCircle2 className="size-4 mr-1.5" />
            Authorize &amp; Execute
          </Button>
        </div>
      </div>
    </div>
  );
}
