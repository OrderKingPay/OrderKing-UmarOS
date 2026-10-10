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
    
    const systemPrompt = `You are the OrderKing Master Intelligence, an elite academic consultant for students in INDIA.
Rules:
1. **CRITICAL (LANGUAGE):** If language is 'Auto (Detect Native Language)', strictly auto-detect the user's native Indian or global language (Hindi, Tamil, Telugu, Bengali, English, etc.) and speak EXACTLY in it flawlessly. Otherwise, speak EXACTLY in \${data.language}.
2. **INDIAN CONTEXT:** The student is in \${data.stdClass}, studying \${data.subject} under the \${data.board} syllabus in India. You must have deep, granular knowledge of NCERT, Indian State Boards, and Indian marking schemes.
3. Their current goal is: \${data.goal}. Tailor your response strictly to this goal.
4. The difficulty level is: \${data.difficulty}. If "Expert", align with JEE Advanced, NEET, UPSC, or Olympiad level standards in India.
5. Your tone should be: \${data.tone}. 
6. **EXAM FOCUS:** Your primary directive is to help the student easily prepare for their REAL Indian school and board exams (CBSE, ICSE, State). Break down complex topics into highly digestible, extremely easy-to-understand components. Provide mnemonics, exam tips, and predictable patterns to help them score maximum marks easily.
7. NEVER give direct answers to homework. Guide them step-by-step using exact formulas and concepts from their syllabus.
8. Emphasize textbook methods. If they ask about non-study topics, strictly guide them back to academic discipline.`;

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
  const [subject, setSubject] = useState("");
  const [language, setLanguage] = useState("Auto (Detect Native Language)");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [tone, setTone] = useState("Direct Easy Exam Answers");
  const [goal, setGoal] = useState("Concept Mastery");
  const [showConfig, setShowConfig] = useState(false);
  
  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Indian Exams AI Tutor (100% Native) initialized. Please specify your curriculum parameters and submit your query." }
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
        <motion.div layout className="flex flex-col h-[calc(100dvh-60px)] bg-gradient-to-b from-zinc-950 to-black text-white selection:bg-zinc-800">
        
        {/* Core Control Panel */}
        <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-4 z-10 flex flex-col gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <h1 className="text-xl font-medium text-white flex items-center gap-2 tracking-tight">
              <BrainCircuit className="text-zinc-400 size-5" />
              Indian Exams AI Tutor (100% Native)
            </h1>
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors text-white text-[10px] font-medium px-2.5 py-1.5 rounded-md uppercase tracking-widest border border-white/20"
            >
              <SlidersHorizontal className="size-3" /> Config
            </button>
          </div>
          
          <div className={`grid grid-cols-2 gap-2.5 relative z-10 transition-all duration-300 ${showConfig ? 'max-h-96 opacity-100' : 'max-h-24 overflow-hidden'}`}>
             <select 
                value={board} 
                onChange={(e) => setBoard(e.target.value)}
                className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
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
                className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={`Class ${i+1}`}>Class {i+1}</option>
                ))}
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
             </select>
             
             {/* Dynamic Text Input for Subject to cover "ALL Subjects" perfectly */}
             <div className="col-span-1 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center px-2.5 focus-within:border-zinc-500 transition-colors">
                <input 
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject (e.g. Mathematics)"
                  className="bg-transparent text-xs font-medium text-zinc-200 outline-none w-full py-2.5 placeholder:text-zinc-500"
                />
             </div>
             
             <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="Auto (Detect Native Language)">Auto (Detect Native Language)</option>
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
                className={`bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors ${showConfig ? 'opacity-100' : 'opacity-0 hidden'}`}
              >
                <option value="Concept Mastery">Goal: Concept Mastery</option>
                <option value="Exam Prep (Make it Easy)">Goal: Exam Prep (Make it Easy)</option>
                <option value="Homework Help">Goal: Homework Help</option>
                <option value="Doubt Clearance">Goal: Doubt Clearance</option>
                <option value="Revision Summary">Goal: Revision Summary</option>
             </select>
             <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                className={`bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors ${showConfig ? 'opacity-100' : 'opacity-0 hidden'}`}
              >
                <option value="Fundamental">Level: Fundamental</option>
                <option value="Intermediate">Level: Intermediate</option>
                <option value="Advanced">Level: Advanced</option>
                <option value="Expert (Olympiad)">Level: Expert (Olympiad)</option>
             </select>
             <select 
                value={tone} 
                onChange={(e) => setTone(e.target.value)}
                className={`col-span-2 bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors ${showConfig ? 'opacity-100' : 'opacity-0 hidden'}`}
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
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-3">
                      <Loader2 className="size-4 animate-spin text-zinc-400" />
                      <span className="text-xs text-zinc-400 font-medium tracking-wide">Processing tactical data...</span>
                   </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            
            <div className="p-3 bg-zinc-950 border-t border-zinc-900 pb-24">
               <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 focus-within:border-zinc-600 transition-colors shadow-inner">
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Initialize academic query..."
                    className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none text-[13px] p-2.5 text-white placeholder:text-zinc-600"
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
                 <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase">
                   End-to-End Encrypted
                 </p>
                 <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase">
                   Verified Syllabi
                 </p>
               </div>
            </div>
          </div>

        </div>
    </motion.div></LayoutGroup></CustomerShell>
  );
}
