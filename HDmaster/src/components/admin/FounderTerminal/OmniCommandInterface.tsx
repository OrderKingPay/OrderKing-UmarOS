import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Terminal, Send, Bot, User, Loader2 } from 'lucide-react';
import { executeOmniCommand } from './omni-action';

export function OmniCommandInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user'|'assistant', text: string, data?: any }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await executeOmniCommand({ data: { command: userText } });
      
      let replyText = '';
      if (res.status === 'SUCCESS') {
        replyText = `Executed: ${res.intent}\nResult: ${JSON.stringify(res.result, null, 2)}`;
      } else {
        replyText = `Error: ${res.message}`;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', text: replyText, data: res }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `System Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-950 border border-emerald-900/50 rounded-xl shadow-2xl overflow-hidden font-mono text-sm">
      <div className="flex items-center justify-between p-3 border-b border-emerald-900/50 bg-black/80">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <Terminal size={18} />
          <span>OmniCommand Interface // FOUNDER TERMINAL</span>
        </div>
        <div className="text-[10px] text-emerald-600 animate-pulse">LIVE INFRASTRUCTURE CONNECTED</div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-emerald-700 text-center mt-10">
            System ready. Awaiting founder commands.
            <br />
            (e.g., "Enable the Razorpay Plugin" or "Find the slowest API")
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase ${msg.role === 'user' ? 'text-blue-400' : 'text-emerald-400'}`}>
              {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
              <span>{msg.role}</span>
            </div>
            <div className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-950/20 border border-blue-900/30 text-blue-100' : 'bg-emerald-950/20 border border-emerald-900/30 text-emerald-50'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-emerald-500">
            <Loader2 size={14} className="animate-spin" />
            <span className="animate-pulse text-xs">Parsing intent & connecting to UniversalPluginEngine...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-emerald-900/50 bg-black/80 flex gap-2">
        <Input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder="Command UniversalPluginEngine..."
          className="bg-emerald-950/10 border-emerald-900/50 text-emerald-100 focus-visible:ring-emerald-500 font-mono placeholder:text-emerald-800"
        />
        <Button type="submit" disabled={loading || !input.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wider">
          <Send size={16} className="mr-2" /> EXECUTE
        </Button>
      </form>
    </div>
  );
}
