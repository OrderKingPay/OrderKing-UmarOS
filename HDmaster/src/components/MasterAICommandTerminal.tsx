import { useState, useRef, useEffect } from "react";
import { Mic, Terminal, Send, XCircle } from "lucide-react";
import { executeConversationalCommand } from "../routes/api/v1/founder/execute";

export function MasterAICommandTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string, text: string, data?: any }[]>([
    { role: "system", text: "MASTER AI ONLINE. Real-time control active. Awaiting instruction." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendCommand = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    
    try {
      const res = await executeConversationalCommand({ data: { command: text } });
      
      if (res.status === 'SUCCESS') {
        setMessages(prev => [...prev, { 
          role: "system", 
          text: `Executed: ${res.toolExecuted}`,
          data: res.data 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "error", 
          text: res.message || "An error occurred." 
        }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "error", text: "CONNECTION FAULT. " + e.message }]);
    } finally {
      setLoading(false);
    }
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
    <div className="fixed bottom-6 right-6 w-[28rem] h-[36rem] bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden font-mono">
      <div className="h-12 bg-emerald-950/50 border-b border-emerald-500/30 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
          <Terminal className="h-4 w-4" /> MASTER AI COMMAND TERMINAL
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
            <div className={`p-3 rounded-lg max-w-[90%] ${m.role === 'user' ? 'bg-indigo-900/40 border border-indigo-500/30 text-indigo-100' : m.role === 'error' ? 'bg-rose-950/40 border border-rose-500/30 text-rose-200' : 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-100 whitespace-pre-wrap'}`}>
              {m.text}
              {m.data && (
                <pre className="mt-2 text-[10px] bg-black/40 p-2 rounded overflow-x-auto max-w-full text-emerald-300">
                  {JSON.stringify(m.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
        
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
            disabled={loading}
            placeholder="Issue command to live backend..." 
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-3 pr-10 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
          />
          <button type="submit" disabled={!input.trim() || loading} className="absolute right-2 top-2 h-8 w-8 bg-emerald-600 rounded flex items-center justify-center disabled:opacity-50 text-white hover:bg-emerald-500 transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
