import { useState } from "react";
import { Users, Share2, Copy, Check, QrCode, X, Sparkles, UserPlus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface GroupOrderingMember {
  id: string;
  name: string;
  isHost: boolean;
  itemCount: number;
  totalPaise: number;
}

export interface GroupOrderingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  restaurantName?: string;
  groupSessionId?: string;
}

export function GroupOrderingModal({
  isOpen = false,
  onClose,
  restaurantName = "Royal Biryani House",
  groupSessionId = "GRP-88412",
}: GroupOrderingModalProps) {
  const [open, setOpen] = useState(isOpen);
  const [copied, setCopied] = useState(false);
  const [spendLimit, setSpendLimit] = useState<number | null>(null);
  const [members, setMembers] = useState<GroupOrderingMember[]>([
    { id: "m-1", name: "You (Host)", isHost: true, itemCount: 2, totalPaise: 48000 },
    { id: "m-2", name: "Priya K.", isHost: false, itemCount: 1, totalPaise: 24000 },
    { id: "m-3", name: "Vikram S.", isHost: false, itemCount: 3, totalPaise: 59000 },
  ]);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/group-order/${groupSessionId}`
    : `https://orderking.in/group-order/${groupSessionId}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    toast.success("Group order invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: `Order food together with me from ${restaurantName}!`,
        text: `Add your favorite items to our OrderKing group cart:`,
        url: shareUrl,
      }).catch(() => undefined);
    } else {
      handleCopyLink();
    }
  };

  if (!open && !isOpen) return null;

  const totalCartPaise = members.reduce((sum, m) => sum + m.totalPaise, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-xl">
              👥
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-base font-bold text-fg">Group Order Session</h3>
                <Badge tone="primary">Live Sync</Badge>
              </div>
              <p className="text-xs text-muted">{restaurantName} · #{groupSessionId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onClose?.();
            }}
            className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-fg transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs no-scrollbar">
          {/* Share Invitation Banner */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-fg flex items-center gap-1.5">
                <Share2 className="size-4 text-primary" /> Invite Friends to Order
              </span>
              <span className="text-[10px] text-muted font-mono">{groupSessionId}</span>
            </div>
            <p className="text-[11px] text-muted">
              Everyone adds their favorite dishes to one shared basket. The host pays or splits the bill.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-[11px] font-mono text-muted select-all"
              />
              <Button size="sm" variant="outline" onClick={handleCopyLink} className="gap-1 shrink-0">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" onClick={handleShareNative} className="gap-1 shrink-0">
                <Share2 className="size-3.5" /> Share
              </Button>
            </div>
          </div>

          {/* Active Members & Baskets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-fg flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" /> Joined Patrons ({members.length})
              </h4>
              <span className="text-muted">Total: ₹{(totalCartPaise / 100).toFixed(0)}</span>
            </div>

            <div className="space-y-2">
              {members.map((mem) => (
                <div
                  key={mem.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-2/60 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {mem.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-fg flex items-center gap-1.5">
                        {mem.name}
                        {mem.isHost && (
                          <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                            HOST
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted">{mem.itemCount} items in basket</p>
                    </div>
                  </div>
                  <span className="font-bold text-fg">₹{(mem.totalPaise / 100).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spending Limit Setting (Host Only) */}
          <div className="rounded-xl border border-border bg-surface-2 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-fg">Spending Limit per Member</span>
              <span className="text-[11px] font-bold text-primary">
                {spendLimit ? `₹${spendLimit}` : "No Limit"}
              </span>
            </div>
            <div className="flex gap-2">
              {[null, 200, 350, 500].map((lim) => (
                <button
                  key={lim === null ? "none" : lim}
                  type="button"
                  onClick={() => setSpendLimit(lim)}
                  className={`rounded-lg py-1.5 px-2.5 text-[11px] border transition ${
                    spendLimit === lim
                      ? "border-primary bg-primary text-primary-fg font-bold"
                      : "border-border bg-surface text-muted hover:text-fg"
                  }`}
                >
                  {lim === null ? "No Cap" : `₹${lim}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-surface px-5 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted">Host Checkout</p>
            <p className="font-display text-sm font-bold text-fg">
              ₹{(totalCartPaise / 100).toFixed(0)} ({members.reduce((s, m) => s + m.itemCount, 0)} items)
            </p>
          </div>
          <Button
            onClick={() => {
              toast.success("Proceeding to group checkout with all items combined!");
              setOpen(false);
              onClose?.();
            }}
            className="gap-1.5"
          >
            <ShoppingBag className="size-4" /> Proceed to Pay
          </Button>
        </div>
      </div>
    </div>
  );
}
