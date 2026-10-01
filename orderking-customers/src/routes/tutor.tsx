
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { Send, GraduationCap, Award, BookOpen, BrainCircuit, Loader2, Sparkles } from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { authMiddleware } from "@/lib/auth/middleware";

const askTutorFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { message: string; board: string; stdClass: string; language: string; history: any[] }) => {
    if (!data.message?.trim()) throw new Error("Tutor question is required.");
    if (data.message.length > 4000) throw new Error("Tutor question is too long.");
    if (!Array.isArray(data.history) || data.history.length > 8) throw new Error("Tutor history limit exceeded.");
    return data;
  })
  .handler(async ({ data }: any) => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error("TUTOR_AI_NOT_CONFIGURED");

    const systemPrompt = `You are the OrderKing Master Tutor.
Speak exactly in ${data.language}.
Student level: ${data.stdClass}; board: ${data.board}.
Teach step-by-step, favor textbook methods, and adapt difficulty.
Do not pretend to have official syllabus documents unless they were provided or retrieved from a trusted source.
Do not claim exam scores, rank, placement, certification, or official eligibility.
For homework, guide the student and explain the method rather than simply claiming completion.`;

    const history = data.history.slice(-8).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? ""),
    }));

    const candidates = Array.from(new Set([
      process.env.OPENAI_TUTOR_MODEL?.trim() || process.env.OPENAI_MODEL?.trim(),
      "gpt-5.6-sol",
      "gpt-5.6-sol",
      "gpt-5.6-luna",
    ].filter(Boolean)));

    let lastError = "TUTOR_AI_REQUEST_FAILED";
    for (const model of candidates) {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions: systemPrompt,
          input: [...history, { role: "user", content: data.message }],
          reasoning: { effort: model === "gpt-5.6-sol" ? "high" : "medium" },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        return { text: payload.output_text || "I could not produce a tutor response.", model: payload.model || model };
      }

      const message = String(payload?.error?.message || "");
      lastError = message || `OpenAI HTTP ${response.status}`;
      const unavailable =
        [400, 403, 404].includes(response.status) &&
        /model|permission|access|not found|unsupported/i.test(lastError);
      if (!unavailable) break;
    }

    throw new Error(lastError);
  });

export const Route = createFileRoute('/tutor')({
  component: TutorPage,
});

function TutorPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "schemes" | "premium">("chat");
  const [message, setMessage] = useState("");
  const [board, setBoard] = useState("State (Assam SEBA)");
  const [stdClass, setStdClass] = useState("Class 10");
  const [language, setLanguage] = useState("English");
  
  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hello! I am your Free Super-Tutor. Select your Board and Class above, and ask me any syllabus question!" }
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
      const res = await askTutorFn({
        data: { message, board, stdClass, language, history: history.slice(-6) }
      });
      setHistory([...newHistory, { role: 'assistant', content: res.text }]);
    } catch (e) {
      setHistory([...newHistory, { role: 'assistant', content: "Network error..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerShell>
      <div className="flex flex-col h-[calc(100dvh-60px)] bg-slate-50">
        
        {/* Header Options */}
        <div className="bg-white px-4 py-3 shadow-sm z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <BrainCircuit className="text-indigo-600 size-6" />
              AI Super-Tutor
            </h1>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
              100% Free
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
             <select 
                value={board} 
                onChange={(e) => setBoard(e.target.value)}
                className="bg-slate-100 border-none text-xs rounded-md p-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CBSE">CBSE Board</option>
                <option value="ICSE">ICSE Board</option>
                <option value="State (Andhra Pradesh BSEAP)">Andhra Pradesh BSEAP</option>
                <option value="State (Arunachal Pradesh DSEAP)">Arunachal Pradesh DSEAP</option>
                <option value="State (Assam SEBA)">Assam SEBA</option>
                <option value="State (Assam AHSEC)">Assam AHSEC</option>
                <option value="State (Bihar BSEB)">Bihar BSEB</option>
                <option value="State (Chhattisgarh CGBSE)">Chhattisgarh CGBSE</option>
                <option value="State (Goa GBSHSE)">Goa GBSHSE</option>
                <option value="State (Gujarat GSEB)">Gujarat GSEB</option>
                <option value="State (Haryana BSEH)">Haryana BSEH</option>
                <option value="State (Himachal Pradesh HPBOSE)">Himachal Pradesh HPBOSE</option>
                <option value="State (Jharkhand JAC)">Jharkhand JAC</option>
                <option value="State (Karnataka KSEAB)">Karnataka KSEAB</option>
                <option value="State (Kerala KBPE)">Kerala KBPE</option>
                <option value="State (Madhya Pradesh MPBSE)">Madhya Pradesh MPBSE</option>
                <option value="State (Maharashtra MSBSHSE)">Maharashtra MSBSHSE</option>
                <option value="State (Manipur BOSEM)">Manipur BOSEM</option>
                <option value="State (Meghalaya MBOSE)">Meghalaya MBOSE</option>
                <option value="State (Mizoram MBSE)">Mizoram MBSE</option>
                <option value="State (Nagaland NBSE)">Nagaland NBSE</option>
                <option value="State (Odisha BSE)">Odisha BSE</option>
                <option value="State (Punjab PSEB)">Punjab PSEB</option>
                <option value="State (Rajasthan RBSE)">Rajasthan RBSE</option>
                <option value="State (Sikkim SBSE)">Sikkim SBSE</option>
                <option value="State (Tamil Nadu TNBSE)">Tamil Nadu TNBSE</option>
                <option value="State (Telangana BSE)">Telangana BSE</option>
                <option value="State (Tripura TBSE)">Tripura TBSE</option>
                <option value="State (UP Board)">UP Board (UPMSP)</option>
                <option value="State (Uttarakhand UBSE)">Uttarakhand UBSE</option>
                <option value="State (West Bengal WBBSE)">West Bengal WBBSE</option>
             </select>
             <select 
                value={stdClass} 
                onChange={(e) => setStdClass(e.target.value)}
                className="bg-slate-100 border-none text-xs rounded-md p-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={`Class ${i+1}`}>Class {i+1}</option>
                ))}
             </select>
             <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-100 border-none text-xs rounded-md p-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="English">English</option>
                <option value="Hindi">हिंदी (Hindi)</option>
                <option value="Bengali">বাংলা (Bengali)</option>
                <option value="Assamese">অসমীয়া (Assamese)</option>
             </select>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex px-4 pt-2 bg-white border-b border-slate-200">
           <button 
             onClick={() => setActiveTab('chat')}
             className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-colors ${activeTab === 'chat' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}
           >
             <GraduationCap className="size-4 inline-block mr-1 mb-0.5"/> Tutor
           </button>
           <button 
             onClick={() => setActiveTab('schemes')}
             className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-colors ${activeTab === 'schemes' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}
           >
             <Award className="size-4 inline-block mr-1 mb-0.5"/> Govt Schemes
           </button>
           <button 
             onClick={() => setActiveTab('premium')}
             className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-colors ${activeTab === 'premium' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500'}`}
           >
             <Sparkles className="size-4 inline-block mr-1 mb-0.5"/> Premium
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                     <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin text-indigo-600" />
                        <span className="text-xs text-slate-500 font-medium">Teacher is thinking...</span>
                     </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 bg-white border-t border-slate-200 pb-24">
                 <div className="flex items-end gap-2 bg-slate-100 rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your textbook question here..."
                      className="flex-1 max-h-32 min-h-[40px] bg-transparent resize-none outline-none text-[13px] p-2 text-slate-800 placeholder:text-slate-400"
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
                      className="bg-indigo-600 text-white p-2.5 rounded-lg disabled:opacity-50 active:scale-95 transition-transform shrink-0"
                    >
                      <Send className="size-4" />
                    </button>
                 </div>
                 <p className="text-center text-[9px] text-slate-400 mt-2 font-medium">
                   Step 1: Ask Question • Step 2: Learn Formula • Step 3: Score Max Marks
                 </p>
              </div>
            </div>
          )}

          {/* Govt Schemes Tab */}
          {activeTab === 'schemes' && (
            <div className="h-full overflow-y-auto p-4 pb-24 space-y-3">
               <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                    <Award className="size-5" />
                    Ayushman Bharat (PMJAY)
                  </h3>
                  <p className="text-xs text-emerald-700 mt-1">Health cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization across public and private empaneled hospitals.</p>
                  <a href="https://pmjay.gov.in/" target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold">Official PM-JAY Portal</a>
               </div>
               
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    <Award className="size-5" />
                    PM Kisan Samman Nidhi
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">Income support of ₹6,000 per year in three equal installments to all land holding eligible farmer families.</p>
                  <a href="https://pmkisan.gov.in/" target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold">Official PM-Kisan Portal</a>
               </div>

               <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h3 className="font-bold text-orange-800 flex items-center gap-2">
                    <BookOpen className="size-5" />
                    National Means-cum-Merit Scholarship
                  </h3>
                  <p className="text-xs text-orange-700 mt-1">Check the National Scholarship Portal for the current NMMSS eligibility, application window, and verification status.</p>
                  <a href="https://scholarships.gov.in/All-Scholarships" target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold">Official Scholarship Portal</a>
               </div>

               <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <h3 className="font-bold text-purple-800 flex items-center gap-2">
                    <Award className="size-5" />
                    PM Awas Yojana (PMAY)
                  </h3>
                  <p className="text-xs text-purple-700 mt-1">Credit linked subsidy scheme for Housing for All. Beneficiaries receive direct financial assistance to build pucca houses.</p>
                  <a href="https://pmay-urban.gov.in/" target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold">Official PMAY(U) Portal</a>
               </div>

               <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center mt-6">
                  <p className="text-xs text-slate-500">Open the official government portal before relying on any scheme amount, eligibility, deadline, or application status.</p>
               </div>
            </div>
          )}

          {/* Premium Tab */}
          {activeTab === 'premium' && (
            <div className="h-full overflow-y-auto p-4 pb-24 space-y-4">
               <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                     <Sparkles className="size-16" />
                  </div>
                  <h2 className="font-black text-xl mb-1 relative z-10">NEET/JEE Mastery</h2>
                  <p className="text-amber-100 text-xs font-medium mb-4 relative z-10">Exam preparation and learning resources; outcomes depend on your study and the provider.</p>
                  <div className="flex gap-2 relative z-10">
                     <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm">PhysicsWallah</span>
                     <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm">Testbook</span>
                  </div>
                  <button className="w-full mt-4 bg-white text-orange-600 font-bold py-2.5 rounded-xl shadow-sm hover:scale-[1.02] active:scale-95 transition-transform text-sm">
                    Unlock Premium Content
                  </button>
               </div>
               
               <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
                  <h2 className="font-black text-xl mb-1">Global IT Diplomas</h2>
                  <p className="text-indigo-100 text-xs font-medium mb-4">Explore learning programs from education providers; verify current course and certificate details with the provider.</p>
                  <div className="flex gap-2">
                     <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm">Coursera</span>
                     <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm">Simplilearn</span>
                  </div>
                  <button className="w-full mt-4 bg-white text-indigo-700 font-bold py-2.5 rounded-xl shadow-sm hover:scale-[1.02] active:scale-95 transition-transform text-sm">
                    View Placement Programs
                  </button>
               </div>
               
               <div className="text-center p-4">
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">100% Verified Partners • Zero Fake Certificates</p>
               </div>
            </div>
          )}

        </div>
      </div>
    </CustomerShell>
  );
}
