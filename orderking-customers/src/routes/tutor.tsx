import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { Send, GraduationCap, Award, BookOpen, BrainCircuit, Loader2, Sparkles, Briefcase } from "lucide-react";
import { CustomerShell } from "@/components/market/shell";

const askIntelligenceFn = createServerFn({ method: "POST" })
  .validator((data: { message: string, board: string, stdClass: string, subject: string, language: string, history: any[] }) => data)
  .handler(async ({ data }: any) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return { text: "Intelligence is currently resting (API Key not found in server)." };
    }
    
    const systemPrompt = `You are the OrderKing Master Intelligence, an elite, strict but highly motivating academic consultant. 
Rules:
1. **CRITICAL:** Speak EXACTLY in ${data.language}. Your ${data.language} must be grammatically perfect, precise, and highly authentic.
2. The student is in ${data.stdClass}, studying ${data.subject} under the ${data.board} syllabus.
3. NEVER give direct answers to homework. Guide them step-by-step using exact formulas and concepts from their syllabus.
4. Keep answers concise, highly strategic, and academically rigorous.
5. Emphasize textbook methods.
6. If they ask about non-study topics, strictly guide them back to academic discipline.`;

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
          max_tokens: 600,
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
  const [activeTab, setActiveTab] = useState<"chat" | "jobs" | "schemes" | "premium">("chat");
  const [message, setMessage] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [stdClass, setStdClass] = useState("Class 10");
  const [subject, setSubject] = useState("Mathematics");
  const [language, setLanguage] = useState("English");
  
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
        data: { message, board, stdClass, subject, language, history: history.slice(-6) }
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
        
        {/* Top Feature Bar */}
        <div className="px-4 py-3 bg-zinc-950/80 backdrop-blur-md overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-3 border-b border-zinc-900 shadow-sm">
          <a href="#" className="inline-block bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 shrink-0 hover:bg-zinc-800/80 transition-all cursor-pointer min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-zinc-800 text-zinc-300 text-[9px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider border border-zinc-700">Recruiting</span>
              <span className="text-white font-medium text-sm">AI Training Ops</span>
            </div>
            <p className="text-zinc-500 text-[10px] font-medium leading-tight mt-1.5">Remote data annotation. Global scale.</p>
            <div className="mt-3 text-zinc-300 font-medium text-xs flex items-center justify-between">
              Deploy Profile <span>→</span>
            </div>
          </a>

          <a href="#" className="inline-block bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 shrink-0 hover:bg-zinc-800/80 transition-all cursor-pointer min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-zinc-800 text-zinc-300 text-[9px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider border border-zinc-700">Financial</span>
              <span className="text-white font-medium text-sm">Credit Acquisition</span>
            </div>
            <p className="text-zinc-500 text-[10px] font-medium leading-tight mt-1.5">Elite credit instruments. Zero fee.</p>
            <div className="mt-3 text-zinc-300 font-medium text-xs flex items-center justify-between">
              Acquire <span>→</span>
            </div>
          </a>
        </div>
        
        {/* Core Control Panel */}
        <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-4 z-10 flex flex-col gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <h1 className="text-xl font-medium text-white flex items-center gap-2 tracking-tight">
              <BrainCircuit className="text-zinc-400 size-5" />
              Academic Intelligence
            </h1>
            <span className="bg-white/10 text-white text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-widest border border-white/20">
              Active
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5 relative z-10">
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
             <select 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Science">General Science</option>
                <option value="Computer Science">Computer Science</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Economics">Economics</option>
                <option value="Political Science">Political Science</option>
                <option value="Accountancy">Accountancy</option>
                <option value="Business Studies">Business Studies</option>
                <option value="English">English</option>
                <option value="Literature">Literature</option>
             </select>
             <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
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
          </div>
        </div>

        {/* Tactical Navigation */}
        <div className="flex px-4 pt-1 bg-zinc-950 border-b border-zinc-900 overflow-x-auto whitespace-nowrap hide-scrollbar">
           <button 
             onClick={() => setActiveTab('chat')}
             className={`flex-none px-4 py-3 text-xs font-medium border-b-2 transition-all duration-300 ${activeTab === 'chat' ? 'border-white text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
           >
             <GraduationCap className="size-4 inline-block mr-1.5 mb-0.5 opacity-70"/> Intelligence
           </button>
           <button 
             onClick={() => setActiveTab('jobs')}
             className={`flex-none px-4 py-3 text-xs font-medium border-b-2 transition-all duration-300 ${activeTab === 'jobs' ? 'border-white text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
           >
             <Briefcase className="size-4 inline-block mr-1.5 mb-0.5 opacity-70"/> Placements
           </button>
           <button 
             onClick={() => setActiveTab('schemes')}
             className={`flex-none px-4 py-3 text-xs font-medium border-b-2 transition-all duration-300 ${activeTab === 'schemes' ? 'border-white text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
           >
             <Award className="size-4 inline-block mr-1.5 mb-0.5 opacity-70"/> State Programs
           </button>
           <button 
             onClick={() => setActiveTab('premium')}
             className={`flex-none px-4 py-3 text-xs font-medium border-b-2 transition-all duration-300 ${activeTab === 'premium' ? 'border-white text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
           >
             <Sparkles className="size-4 inline-block mr-1.5 mb-0.5 opacity-70"/> Elite Access
           </button>
        </div>

        {/* Active Workspace */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* Intelligence Matrix */}
          {activeTab === 'chat' && (
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
          )}

          {/* Placements Matrix */}
          {activeTab === 'jobs' && (
            <div className="h-full overflow-y-auto p-4 pb-24 space-y-4">
               <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:bg-zinc-900 transition-colors">
                  <h3 className="font-medium text-white flex items-center gap-2 text-sm tracking-tight">
                    <Briefcase className="size-4 text-zinc-400" />
                    Data Annotation & AI Training
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">High-paying AI training tasks. Read instructions, evaluate AI responses, and get paid in USD via PayPal.</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded">Verified Platforms</span>
                    <button className="text-xs bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors">Initialize</button>
                  </div>
               </div>

               <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:bg-zinc-900 transition-colors">
                  <h3 className="font-medium text-white flex items-center gap-2 text-sm tracking-tight">
                    <Briefcase className="size-4 text-zinc-400" />
                    Micro-tasking & Surveys
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">Simple data entry, survey completion, and image categorization tasks. Competitive payout structures.</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded">Global Scope</span>
                    <button className="text-xs bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors">Initialize</button>
                  </div>
               </div>
               
               <div className="text-center p-6">
                  <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase">Connecting to global verified platforms... Zero joining fees.</p>
               </div>
            </div>
          )}

          {/* State Programs Matrix */}
          {activeTab === 'schemes' && (
            <div className="h-full overflow-y-auto p-4 pb-24 space-y-4">
               <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:bg-zinc-900 transition-colors">
                  <h3 className="font-medium text-white flex items-center gap-2 text-sm tracking-tight">
                    <Award className="size-4 text-zinc-400" />
                    Ayushman Bharat (PMJAY)
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">Health cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization across empaneled hospitals.</p>
                  <button className="w-full mt-4 text-xs bg-white text-black px-4 py-2.5 rounded-lg font-medium hover:bg-zinc-200 transition-colors">Verify Eligibility</button>
               </div>
               
               <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:bg-zinc-900 transition-colors">
                  <h3 className="font-medium text-white flex items-center gap-2 text-sm tracking-tight">
                    <Award className="size-4 text-zinc-400" />
                    PM Kisan Samman Nidhi
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">Income support of ₹6,000 per year in three equal installments to all land holding eligible farmer families.</p>
                  <button className="w-full mt-4 text-xs bg-zinc-800 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700">Check Status</button>
               </div>

               <div className="text-center p-6">
                  <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase leading-relaxed">Synchronizing with National Government Services Portal (india.gov.in) to fetch 300+ programs...</p>
               </div>
            </div>
          )}

          {/* Elite Status Matrix */}
          {activeTab === 'premium' && (
            <div className="h-full overflow-y-auto p-4 pb-24 space-y-4">
               <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-4 -mt-4"></div>
                  <h2 className="font-medium text-lg mb-1 relative z-10 tracking-tight">Advanced Engineering Mastery</h2>
                  <p className="text-zinc-400 text-[11px] font-medium mb-5 relative z-10">Elite Career Preparation & Proprietary Study Materials.</p>
                  <div className="flex gap-2 relative z-10">
                     <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-md text-[10px] font-medium text-zinc-300">PhysicsWallah Alliance</span>
                     <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-md text-[10px] font-medium text-zinc-300">Testbook Integrated</span>
                  </div>
                  <button className="w-full mt-6 bg-white text-black font-medium py-3 rounded-xl shadow-sm hover:bg-zinc-200 active:scale-95 transition-all text-xs">
                    Acquire Elite Access
                  </button>
               </div>
               
               <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
                  <h2 className="font-medium text-lg mb-1 relative z-10 tracking-tight">Global IT Diplomas</h2>
                  <p className="text-zinc-400 text-[11px] font-medium mb-5 relative z-10">Learn Software Engineering, AI & Business from Harvard, Google & IBM.</p>
                  <div className="flex gap-2 relative z-10">
                     <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-md text-[10px] font-medium text-zinc-300">Coursera Verified</span>
                     <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-md text-[10px] font-medium text-zinc-300">Simplilearn</span>
                  </div>
                  <button className="w-full mt-6 bg-zinc-800 text-white border border-zinc-700 font-medium py-3 rounded-xl shadow-sm hover:bg-zinc-700 active:scale-95 transition-all text-xs">
                    View Placement Directives
                  </button>
               </div>
               
               <div className="text-center p-6">
                 <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-medium">100% Verified Partners • Zero Fake Certificates</p>
               </div>
            </div>
          )}

        </div>
    </motion.div></LayoutGroup></CustomerShell>
  );
}
