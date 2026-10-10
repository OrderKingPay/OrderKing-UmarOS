import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { Send, BrainCircuit, Loader2, SlidersHorizontal } from "lucide-react";
import { CustomerShell } from "@/components/market/shell";

const askIntelligenceFn = createServerFn({ method: "POST" })
  .validator((data: { 
    message: string, 
    board: string, 
    stdClass: string, 
    subject: string, 
    language: string, 
    difficulty: string,
    tone: string,
    goal: string,
    history: any[] 
  }) => data)
  .handler(async ({ data }: any) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return { text: "Intelligence is currently resting (API Key not found in server)." };
    }
    
    const systemPrompt = `You are the OrderKing Master Intelligence, an elite academic consultant.
Rules:
1. **CRITICAL:** Speak EXACTLY in ${data.language}. Your ${data.language} must be grammatically perfect, precise, and highly authentic.
2. The student is in ${data.stdClass}, studying ${data.subject} under the ${data.board} syllabus.
3. Their current goal is: ${data.goal}. Tailor your response strictly to this goal.
4. The difficulty level is: ${data.difficulty}. Match your explanation depth to this level.
5. Your tone should be: ${data.tone}. 
6. NEVER give direct answers to homework. Guide them step-by-step using exact formulas and concepts from their syllabus.
7. Emphasize textbook methods. If they ask about non-study topics, strictly guide them back to academic discipline.`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...data.history.map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: data.message }
          ],
          temperature: 0.7,
          max_tokens: 800,
        })
      });
      
      const result = await response.json();
      return { text: result.choices?.[0]?.message?.content || "Query processing failed." };
    } catch (e) {
      return { text: "Secure connection interrupted. Please verify your network." };
    }
  });

export const Route = createFileRoute('/tutor')({
  component: IntelligencePage,
});

function IntelligencePage() {
  const [message, setMessage] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [stdClass, setStdClass] = useState("Class 10");
  const [subject, setSubject] = useState("Mathematics");
  const [language, setLanguage] = useState("English");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [tone, setTone] = useState("Socratic (Ask Questions)");
  const [goal, setGoal] = useState("Concept Mastery");
  const [showConfig, setShowConfig] = useState(false);
  
  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Academic Intelligence initialized. Please specify your curriculum parameters and submit your query." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    const newHistory = [...history, { role: 'user' as const, content: message }];
    setHistory(newHistory);
    setMessage("");
    setIsLoading(true);
    
    try {
      const res = await askIntelligenceFn({
        data: { message, board, stdClass, subject, language, difficulty, tone, goal, history: history.slice(-6) }
      });
      setHistory([...newHistory, { role: 'assistant', content: res.text }]);
    } catch (e) {
      setHistory([...newHistory, { role: 'assistant', content: "Network anomaly detected..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerShell>
      <LayoutGroup>
        <motion.div layout className="flex flex-col h-[calc(100dvh-60px)] bg-gradient-to-b from-zinc-950 to-black text-fg selection:bg-surface-2">
        
        {/* Core Control Panel */}
        <div className="bg-black border-b border-gray-700 px-4 py-4 z-10 flex flex-col gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-surface-2/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <h1 className="text-xl font-medium text-fg flex items-center gap-2 tracking-tight">
              <BrainCircuit className="text-muted size-5" />
              Academic Intelligence
            </h1>
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors text-fg text-[10px] font-medium px-2.5 py-1.5 rounded-md uppercase tracking-widest border border-white/20"
            >
              <SlidersHorizontal className="size-3" /> Config
            </button>
          </div>
          
          <div className={`grid grid-cols-2 gap-2.5 relative z-10 transition-all duration-300 ${showConfig ? 'max-h-96 opacity-100' : 'max-h-24 overflow-hidden'}`}>
             <select 
                value={board} 
                onChange={(e) => setBoard(e.target.value)}
                className="bg-surface/80 border border-white/10 text-xs rounded-lg p-2.5 font-medium text-gray-400 outline-none focus:border-gray-700 transition-colors"
              >
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="State (Andhra Pradesh)">State (Andhra Pradesh)</option>
                <option value="State (Assam)">State (Assam)</option>
                <option value="State (Bihar)">State (Bihar)</option>
                <option value="State (Gujarat)">State (Gujarat)</option>
                <option value="State (Karnataka)">State (Karnataka)</option>
                <option value="State (Kerala)">State (Kerala)</option>
                <option value="State (Maharashtra)">State (Maharashtra)</option>
                <option value="State (Tamil Nadu)">State (Tamil Nadu)</option>
                <option value="State (Telangana)">State (Telangana)</option>
                <option value="State (UP)">State (UP)</option>
                <option value="State (West Bengal)">State (West Bengal)</option>
                <option value="Other State Boards">Other State Boards</option>
             </select>
             <select 
                value={stdClass} 
                onChange={(e) => setStdClass(e.target.value)}
                className="bg-surface/80 border border-white/10 text-xs rounded-lg p-2.5 font-medium text-gray-400 outline-none focus:border-gray-700 transition-colors"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={`Class ${i+1}`}>Class {i+1}</option>
                ))}
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
             </select>
             
             {/* Dynamic Text Input for Subject to cover "ALL Subjects" perfectly */}
             <div className="col-span-1 bg-surface/80 border border-white/10 rounded-lg flex items-center px-2.5 focus-within:border-gray-700 transition-colors">
                <input 
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject (e.g. Mathematics)"
                  className="bg-transparent text-xs font-medium text-gray-400 outline-none w-full py-2.5 placeholder:text-subtle"
                />
             </div>
             
             <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-surface/80 border border-white/10 text-xs rounded-lg p-2.5 font-medium text-gray-400 outline-none focus:border-gray-700 transition-colors"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Bengali">Bengali</option>
                <option value="Telugu">Telugu</option>
                <option value="Marathi">Marathi</option>
                <option value="Tamil">Tamil</option>
                <option value="Urdu">Urdu</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Kannada">Kannada</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Assamese">Assamese</option>
             </select>
             
             {/* Advanced Configurations */}
             <select 
                value={goal} 
                onChange={(e) => setGoal(e.target.value)}
                className={`bg-surface/80 border border-white/10 text-xs rounded-lg p-2.5 font-medium text-gray-400 outline-none focus:border-gray-700 transition-colors ${showConfig ? 'opacity-100' : 'opacity-0 hidden'}`}
              >
                <option value="Concept Mastery">Goal: Concept Mastery</option>
                <option value="Exam Prep">Goal: Exam Prep</option>
                <option value="Homework Help">Goal: Homework Help</option>
                <option value="Doubt Clearance">Goal: Doubt Clearance</option>
                <option value="Revision Summary">Goal: Revision Summary</option>
             </select>
             <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                className={`bg-surface/80 border border-white/10 text-xs rounded-lg p-2.5 font-medium text-gray-400 outline-none focus:border-gray-700 transition-colors ${showConfig ? 'opacity-100' : 'opacity-0 hidden'}`}
              >
                <option value="Fundamental">Level: Fundamental</option>
                <option value="Intermediate">Level: Intermediate</option>
                <option value="Advanced">Level: Advanced</option>
                <option value="Expert (Olympiad)">Level: Expert (Olympiad)</option>
             </select>
             <select 
                value={tone} 
                onChange={(e) => setTone(e.target.value)}
                className={`col-span-2 bg-surface/80 border border-white/10 text-xs rounded-lg p-2.5 font-medium text-gray-400 outline-none focus:border-gray-700 transition-colors ${showConfig ? 'opacity-100' : 'opacity-0 hidden'}`}
              >
                <option value="Socratic (Ask Questions)">Tone: Socratic (Guides via questioning)</option>
                <option value="Encouraging & Patient">Tone: Encouraging & Patient</option>
                <option value="Strict & Direct">Tone: Strict & Direct</option>
                <option value="Highly Detailed & Academic">Tone: Highly Detailed & Academic</option>
             </select>
          </div>
        </div>

        {/* Active Workspace */}
        <div className="flex-1 overflow-hidden relative">
          
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {history.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-white text-black rounded-br-sm font-medium' 
                      : 'bg-surface border border-white/10 text-gray-400 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-surface border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-3">
                      <Loader2 className="size-4 animate-spin text-muted" />
                      <span className="text-xs text-muted font-medium tracking-wide">Processing tactical data...</span>
                   </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            
            <div className="p-3 bg-black border-t border-gray-700 pb-24">
               <div className="flex items-end gap-2 bg-surface border border-white/10 rounded-2xl p-1.5 focus-within:border-gray-700 transition-colors shadow-inner">
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Initialize academic query..."
                    className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none text-[13px] p-2.5 text-fg placeholder:text-subtle"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <button 
                    onClick={() => void handleSend()}
                    disabled={!message.trim() || isLoading}
                    className="bg-white text-black p-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform shrink-0 m-0.5"
                  >
                    <Send className="size-4" />
                  </button>
               </div>
               <div className="flex justify-between items-center px-2 mt-3">
                 <p className="text-[10px] text-subtle font-medium tracking-widest uppercase">
                   End-to-End Encrypted
                 </p>
                 <p className="text-[10px] text-subtle font-medium tracking-widest uppercase">
                   Verified Syllabi
                 </p>
               </div>
            </div>
          </div>

        </div>
    </motion.div></LayoutGroup></CustomerShell>
  );
}
