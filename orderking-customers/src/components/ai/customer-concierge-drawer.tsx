import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Crown, Loader2, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { askReadOnlyConcierge, type ConciergeArea } from "@/lib/server/read-only-concierge";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function CustomerConciergeDrawer({
  open, onClose, area = "food", embedded = false,
}: {
  open: boolean;
  onClose: () => void;
  area?: ConciergeArea;
  embedded?: boolean;
}) {
  const { user, isPending } = useCurrentUserState();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  async function send() {
    if (!question.trim() || sending || !user) return;
    const entry: ChatMessage = { role: "user", content: question.trim().slice(0, 1200) };
    const history = messages.slice(-6);
    setMessages((old) => [...old, entry]);
    setQuestion("");
    setSending(true);
    try {
      const answer = await askReadOnlyConcierge({ data: {
        message: entry.content, area, history,
      } });
      setMessages((old) => [...old, { role: "assistant", content: answer.reply }]);
    } catch {
      setMessages((old) => [...old, { role: "assistant", content:
        "Support is unavailable right now. No account action was taken." }]);
    } finally { setSending(false); }
  }

  return (
    <div className={embedded ? "relative w-full" : "fixed inset-0 z-[90] flex justify-end bg-slate-950/60 backdrop-blur-sm"} role="presentation" onMouseDown={(e) => {
      if (!embedded && e.target === e.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal={!embedded}
        aria-label="OrderKing AI Concierge"
        className={embedded
          ? "flex h-[min(72dvh,640px)] w-full flex-col overflow-hidden rounded-3xl border border-amber-300/30 bg-slate-950 text-white shadow-xl"
          : "flex h-full w-full max-w-md flex-col bg-slate-950 text-white shadow-2xl sm:rounded-l-3xl"}
      >
        <div className="flex items-center justify-between gap-3 border-b border-amber-400/20 bg-gradient-to-r from-emerald-950 to-slate-950 px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-amber-200"><Crown className="size-5" /> King Assist</p>
            <h2 className="mt-1 text-lg font-bold">OrderKing AI Concierge</h2>
            <p className="text-xs text-slate-300">Read-only assistance · No payments or settings changes</p>
          </div>
          {!embedded && (
            <button type="button" aria-label="Close concierge" onClick={onClose} className="rounded-xl p-2 text-slate-300 hover:bg-white/10">
              <X className="size-5" />
            </button>
          )}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-relaxed text-slate-100">
            <Sparkles className="mb-2 size-5 text-amber-300" />
            Ask about food delivery, King Pay, travel, refunds, or general questions.
            This assistant can explain and guide, but cannot verify or perform account transactions.
          </div>
          {!isPending && !user && (
            <div className="rounded-2xl border border-slate-600 p-4 text-sm">
              Sign in to start private AI chat.
              <Link to="/login" className="mt-2 block font-semibold text-amber-300 underline">Sign in to OrderKing</Link>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={"max-w-[94%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed " +
              (m.role === "user" ? "ml-auto bg-emerald-700 text-white" : "mr-auto border border-slate-700 bg-slate-900 text-slate-100")}>
              {m.content}
            </div>
          ))}
          {sending && <p className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="size-4 animate-spin" /> Answering...</p>}
          <div ref={bottom} />
        </div>
        <div className="border-t border-slate-700 p-4">
          <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex gap-2">
            <input type="text" aria-label="Ask King Assist" value={question} disabled={!user || sending}
              onChange={(e) => setQuestion(e.target.value)} maxLength={1200}
              placeholder={user ? "Ask a question..." : "Sign in to chat"}
              className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400" />
            <button type="submit" disabled={!user || !question.trim() || sending}
              className="rounded-xl bg-amber-400 p-3 text-slate-950 disabled:opacity-40" aria-label="Send question">
              <Send className="size-5" />
            </button>
          </form>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="size-3" /> Order status and refunds require verified records. <Link to="/support" className="text-amber-300 underline">Support</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
