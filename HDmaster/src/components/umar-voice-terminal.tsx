import { useState, useRef, useEffect } from "react";
import { Mic, Terminal, Send, CheckCircle, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";

export function UmarVoiceTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([
    { role: "system", text: "UMAR VOICE ONLINE. Sovereign Control Access Granted. Awaiting instruction." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pendingApproval]);

  const sendCommand = async (text: string, executeToolCall?: any) => {
    if (!text.trim() && !executeToolCall) return;
    
    if (text) {
      setMessages(prev => [...prev, { role: "user", text }]);
      setInput("");
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/umar-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          pendingToolCall: executeToolCall ? { action: 'execute_tool', ...executeToolCall } : undefined
        })
      });
      
      const data = await res.json();
      
      if (data.requiresApproval) {
        setPendingApproval(data.toolCall);
        setMessages(prev => [...prev, { role: "system", text: data.text }]);
      } else if (data.text) {
        setPendingApproval(null);
        setMessages(prev => [...prev, { role: "system", text: data.text }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "error", text: "CONNECTION FAULT. Cannot reach core." }]);
    } finally {
      setLoading(false);
    }
  };

  const approveAction = () => {
    if (pendingApproval) {
      setMessages(prev => [...prev, { role: "system", text: `Executing authorization for: ${pendingApproval.name}...` }]);
      sendCommand("", pendingApproval);
    }
  };

  const rejectAction = () => {
    setPendingApproval(null);
    setMessages(prev => [...prev, { role: "system", text: "Action aborted by Founder." }]);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] z-50 transition-all hover:scale-105"
      >
        <Mic className="h-6 w-6 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden font-mono">
      <div className="h-12 bg-emerald-950/50 border-b border-emerald-500/30 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
          <Terminal className="h-4 w-4" /> UMAR VOICE
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
          <XCircle className="h-5 w-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-black/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className={`text-[10px] uppercase font-bold mb-1 ${m.role === 'user' ? 'text-indigo-400' : m.role === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
              {m.role === 'user' ? 'Founder' : m.role === 'error' ? 'Fault' : 'System'}
            </span>
            <div className={`p-3 rounded-lg max-w-[90%] ${m.role === 'user' ? 'bg-indigo-900/40 border border-indigo-500/30 text-indigo-100' : m.role === 'error' ? 'bg-rose-950/40 border border-rose-500/30 text-rose-200' : 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-100'}`}>
              {m.text}
            </div>
          </div>
        ))}

        {pendingApproval && (
          <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-lg mt-4 animate-pulse">
            <h4 className="text-amber-500 font-bold flex items-center gap-2 mb-2 text-xs">
              <AlertTriangle className="h-4 w-4" /> AUTHORIZATION REQUIRED
            </h4>
            <div className="text-amber-200/80 text-xs mb-3 font-mono bg-black/40 p-2 rounded">
              Action: {pendingApproval.name}<br/>
              Parameters: {JSON.stringify(pendingApproval.args)}
            </div>
            <div className="flex gap-2">
              <button onClick={approveAction} className="flex-1 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors">
                <ShieldCheck className="h-4 w-4" /> Approve
              </button>
              <button onClick={rejectAction} className="flex-1 bg-rose-900/50 hover:bg-rose-800 text-rose-200 font-bold py-2 rounded transition-colors">
                Reject
              </button>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex gap-1 items-center text-emerald-500 p-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '100ms'}}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-900 border-t border-white/5 shrink-0">
        <form onSubmit={e => { e.preventDefault(); sendCommand(input); }} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading || !!pendingApproval}
            placeholder="Issue command..." 
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-3 pr-10 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
          />
          <button type="submit" disabled={!input.trim() || loading || !!pendingApproval} className="absolute right-2 top-2 h-8 w-8 bg-emerald-600 rounded flex items-center justify-center disabled:opacity-50 text-white">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
