import { useState } from "react";
import { Gift, Sparkles, Check, Copy, Heart, Send, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface GiftCardTheme {
  id: string;
  title: string;
  bgGradient: string;
  emoji: string;
}

export const GIFT_THEMES: GiftCardTheme[] = [
  { id: "birthday", title: "Happy Birthday! 🎂", bgGradient: "from-pink-500 to-purple-600", emoji: "🎉" },
  { id: "foodie", title: "Treat for a Foodie 🍕", bgGradient: "from-amber-500 to-rose-600", emoji: "🍔" },
  { id: "thankyou", title: "Heartfelt Thanks 🙏", bgGradient: "from-emerald-500 to-teal-700", emoji: "🌟" },
  { id: "celebration", title: "Festive Vibes 🪔", bgGradient: "from-indigo-600 to-amber-600", emoji: "✨" },
];

export interface GiftCardVoucherStudioProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function GiftCardVoucherStudio({
  isOpen = false,
  onClose,
}: GiftCardVoucherStudioProps) {
  const [open, setOpen] = useState(isOpen);
  const [selectedTheme, setSelectedTheme] = useState<GiftCardTheme>(GIFT_THEMES[0]);
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMsg, setPersonalMsg] = useState("Wishing you mouthwatering meals from OrderKing!");
  const [redeemCode, setRedeemCode] = useState("");

  const AMOUNTS = [250, 500, 1000, 2000, 5000];

  const handleBuyCard = () => {
    if (!recipientEmail.trim()) {
      toast.error("Please provide recipient email or phone");
      return;
    }
    toast.success(`₹${amount} Gift Card generated and dispatched to ${recipientEmail}!`);
    setOpen(false);
    onClose?.();
  };

  const handleRedeem = () => {
    if (!redeemCode.trim()) {
      toast.error("Please enter valid 16-character voucher code");
      return;
    }
    toast.success("Voucher redeemed successfully! ₹500 credited to KingPay wallet.");
    setRedeemCode("");
  };

  if (!open && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-xl">
              🎁
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-fg">OrderKing Gift Cards</h3>
              <p className="text-xs text-muted">Gift delicious feasts to your loved ones</p>
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

        {/* Studio Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs no-scrollbar">
          {/* Visual Digital Card Preview */}
          <div
            className={`relative rounded-2xl bg-gradient-to-br ${selectedTheme.bgGradient} p-5 text-white shadow-lg overflow-hidden`}
          >
            <div className="absolute top-2 right-2 text-3xl opacity-30 select-none">
              {selectedTheme.emoji}
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">OrderKing Voucher</p>
                <h4 className="font-display text-lg font-black mt-0.5">{selectedTheme.title}</h4>
              </div>
              <p className="font-display text-xl font-black">₹{amount}</p>
            </div>
            <p className="mt-4 text-xs text-white/90 italic font-medium line-clamp-2">
              "{personalMsg || "Enjoy your favorite dishes!"}"
            </p>
            <div className="mt-4 flex items-center justify-between text-[10px] text-white/80 border-t border-white/20 pt-2">
              <span>Valid across all 50,000+ restaurants</span>
              <span>1 Year Validity</span>
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="text-xs font-bold text-fg mb-1.5 block">Select Card Design</label>
            <div className="grid grid-cols-2 gap-2">
              {GIFT_THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setSelectedTheme(th)}
                  className={`rounded-xl p-2.5 text-left border text-xs transition ${
                    selectedTheme.id === th.id
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border bg-surface-2 text-fg hover:border-primary/40"
                  }`}
                >
                  <span className="mr-1">{th.emoji}</span> {th.title}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Amounts */}
          <div>
            <label className="text-xs font-bold text-fg mb-1.5 block">Gift Amount</label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setAmount(val);
                    setCustomAmount("");
                  }}
                  className={`size-11 shrink-0 rounded-xl font-bold text-xs transition ${
                    amount === val && !customAmount
                      ? "bg-primary text-primary-fg shadow-xs scale-105"
                      : "border border-border bg-surface-2 text-fg hover:border-primary/50"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Details */}
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-muted block mb-1">Recipient Email or WhatsApp Number</label>
              <input
                type="text"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="friend@example.com or +91 9876543210"
                className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs focus:border-primary focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted block mb-1">Personalized Message</label>
              <input
                type="text"
                value={personalMsg}
                onChange={(e) => setPersonalMsg(e.target.value)}
                placeholder="Write a sweet foodie note..."
                className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          {/* Redeem Voucher Accordion */}
          <div className="rounded-xl border border-border bg-surface-2/60 p-3.5 space-y-2">
            <span className="font-bold text-fg block text-xs">Have a Gift Voucher to Redeem?</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="ENTER-16-DIGIT-VOUCHER"
                className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono uppercase"
              />
              <Button size="sm" variant="outline" onClick={handleRedeem}>
                Redeem
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-surface px-5 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted">Instant delivery</p>
            <p className="font-display text-sm font-bold text-fg">Total: ₹{amount}</p>
          </div>
          <Button onClick={handleBuyCard} className="gap-1.5">
            <CreditCard className="size-4" /> Send Gift Card
          </Button>
        </div>
      </div>
    </div>
  );
}
