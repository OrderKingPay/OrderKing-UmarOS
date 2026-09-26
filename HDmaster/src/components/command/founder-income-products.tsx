import { useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  Briefcase,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Layers,
  Link as LinkIcon,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type PaidProduct = {
  id: string;
  title: string;
  priceInr: number;
  category: "software" | "consulting" | "digital_asset" | "license" | "website";
  salesCount: number;
  totalEarnedInr: number;
  checkoutLink: string;
  status: "ACTIVE" | "PAUSED";
};

export function FounderIncomeProducts() {
  const [products] = useState<PaidProduct[]>([]);



  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState<PaidProduct["category"]>("software");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalGrossIncome = products.reduce((acc, p) => acc + p.totalEarnedInr, 0);
  const netFounderTakehome = 0;
  const gstAllocated = 0;

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) {
      toast.error("Please provide title and price");
      return;
    }

    toast.error("Live Stripe/Razorpay product creation is not connected. No local-only product or payment link was created.");
  };

  const copyLink = (link: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(link);
      toast.success("Checkout payment link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      {/* FOUNDER LEGAL INCOME SUMMARY BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-black p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Verified Gross Product Revenue</span>
            <DollarSign className="size-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">
            ₹{totalGrossIncome.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-emerald-400 font-bold">● Verified ledger only</span>
        </div>

        <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900 to-black p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Verified Founder Payouts</span>
            <Wallet className="size-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono">
            ₹{netFounderTakehome.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-400">Requires verified settlement ledger</span>
        </div>

        <div className="rounded-2xl border border-white/15 bg-slate-900 p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Verified Tax Reserve</span>
            <ShieldCheck className="size-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400 font-mono">
            ₹{gstAllocated.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-muted">Requires verified accounting source</span>
        </div>
      </div>

      {/* CREATE NEW PAID PRODUCT / PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/15 bg-slate-900">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>👑 Paid Products, Pages &amp; Systems Studio</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              Active Monetization
            </Badge>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Sell software licenses, turnkey websites, digital downloads &amp; consulting with zero aggregator cut.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs gap-1.5 shadow-md"
        >
          <Plus className="size-4" />
          <span>Create Paid Product / Page</span>
        </Button>
      </div>

      {/* PRODUCTS DIRECTORY */}
      <div className="rounded-2xl border border-white/15 bg-black/60 p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/15 p-6 text-center text-xs text-slate-400">
              No verified live products are loaded.
            </div>
          ) : (
            products.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-white/10 bg-slate-950/80 p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-amber-400/40 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Badge className="bg-white/10 text-slate-300 border-white/20 text-[10px] uppercase font-mono">
                    {p.category}
                  </Badge>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    ₹{p.priceInr.toLocaleString("en-IN")}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{p.title}</h4>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>Sales: <b className="text-white font-mono">{p.salesCount}</b></span>
                  <span>•</span>
                  <span>Revenue: <b className="text-amber-300 font-mono">₹{p.totalEarnedInr.toLocaleString("en-IN")}</b></span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                  <LinkIcon className="size-3 shrink-0 text-amber-400" />
                  <span className="truncate font-mono text-[11px]">{p.checkoutLink}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyLink(p.checkoutLink)}
                  className="text-[11px] font-bold shrink-0 gap-1 border-white/20 hover:bg-white/10"
                >
                  <Copy className="size-3" />
                  Copy Link
                </Button>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* CREATE PRODUCT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-slate-900 p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">Create New Paid Product / Page</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Product Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Turnkey Food Delivery Platform License"
                  className="bg-black/50 border-white/20 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Price (INR)</label>
                  <Input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="25000"
                    className="bg-black/50 border-white/20 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-md border border-white/20 bg-black/50 p-2 text-white text-xs"
                  >
                    <option value="software">Software / SaaS</option>
                    <option value="website">Turnkey Website</option>
                    <option value="digital_asset">Digital Asset / Code</option>
                    <option value="consulting">Consulting / Service</option>
                    <option value="license">Commercial License</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black">
                  Create &amp; Generate Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
