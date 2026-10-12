import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { motion, LayoutGroup } from "framer-motion";
import {
  Send,
  BrainCircuit,
  Loader2,
  SlidersHorizontal,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { toast } from "sonner";

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
2. **INDIAN CONTEXT:** The student is in \${data.stdClass}, studying \${data.subject} under the \${data.board} syllabus in India. You must have deep, granular knowledge of NCERT, CBSE, ICSE, and Indian State Boards (including Maharashtra Board, UP Board, Bihar Board, West Bengal Board, Tamil Nadu State Board, Karnataka Board, etc.), and Indian marking schemes.
3. Their current goal is: \${data.goal}. Tailor your response strictly to this goal.
4. The difficulty level is: \${data.difficulty}. If "Expert", align with JEE Advanced, NEET, UPSC, or Olympiad level standards in India.
5. Your tone should be: \${data.tone}. 
6. **EXAM FOCUS:** Your primary directive is to help the student easily prepare for their REAL Indian school and board exams (CBSE, ICSE, State Boards). For Advanced Mathematics modules (such as Differential Calculus, Integral Calculus, Coordinate Geometry, Vectors & 3D, Advanced Algebra, Trigonometry, Probability & Statistics, Linear Algebra), break down concepts with step-by-step mathematical precision, verified textbook formulas, standard proofs, and marking-scheme-aligned solutions. Provide mnemonics, exam tips, and predictable patterns to help them score maximum marks easily.
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

export interface AdvancedMathModule {
  id: string;
  name: string;
  category: string;
  subtopics: readonly string[];
}

export const STATE_BOARDS = [
  "CBSE",
  "ICSE",
  "Maharashtra Board",
  "UP Board",
  "Bihar Board",
  "West Bengal Board",
  "Tamil Nadu State Board",
  "Karnataka Board",
  "Andhra Pradesh Board",
  "Telangana Board",
  "Gujarat Board",
  "Kerala Board",
  "Rajasthan Board",
  "Madhya Pradesh Board",
  "Punjab Board",
  "Haryana Board",
  "Odisha Board",
  "Assam Board",
  "Jharkhand Board",
  "Chhattisgarh Board",
  "Goa Board",
  "Uttarakhand Board",
  "Himachal Pradesh Board",
  "Jammu & Kashmir Board",
  "NCERT",
  "State (Maharashtra)",
  "State (UP)",
  "State (Bihar)",
  "State (West Bengal)",
  "State (Tamil Nadu)",
  "State (Karnataka)",
  "State (Andhra Pradesh)",
  "State (Telangana)",
  "State (Gujarat)",
  "State (Kerala)",
  "State (Assam)",
  "Other State Boards"
] as const;

export const ADVANCED_MATHEMATICS_MODULES: readonly AdvancedMathModule[] = [
  {
    id: "differential-calculus",
    name: "Differential Calculus",
    category: "Calculus",
    subtopics: [
      "Limits, Continuity & Differentiability",
      "Mean Value Theorems (Rolle's & Lagrange's)",
      "Derivatives & Chain Rule",
      "Applications of Derivatives (Tangents & Normals)",
      "Maxima and Minima & Optimization",
      "Monotonicity & Curve Sketching"
    ]
  },
  {
    id: "integral-calculus",
    name: "Integral Calculus",
    category: "Calculus",
    subtopics: [
      "Indefinite Integrals & Standard Substitution",
      "Integration by Parts & Partial Fractions",
      "Definite Integrals & Properties",
      "Fundamental Theorem of Calculus",
      "Area Under Curves (Quadrature)",
      "Differential Equations (First Order, Homogeneous & Linear)"
    ]
  },
  {
    id: "coordinate-geometry",
    name: "Coordinate Geometry (2D & Conics)",
    category: "Coordinate Geometry",
    subtopics: [
      "Straight Lines & Angle Between Lines",
      "Circles & Equations of Tangents",
      "Parabola (Standard Equation & Latus Rectum)",
      "Ellipse (Eccentricity, Foci & Directrix)",
      "Hyperbola & Rectangular Hyperbola"
    ]
  },
  {
    id: "vectors-and-3d",
    name: "Vectors & 3D Geometry",
    category: "Vector & 3D Space",
    subtopics: [
      "Scalar Dot Product & Vector Cross Product",
      "Scalar Triple Product & Vector Triple Product",
      "Direction Cosines & Direction Ratios",
      "Straight Lines in Three Dimensions",
      "Planes in Three Dimensions & Intersections",
      "Shortest Distance Between Skew Lines"
    ]
  },
  {
    id: "advanced-algebra",
    name: "Advanced Algebra",
    category: "Algebra",
    subtopics: [
      "Complex Numbers & De Moivre's Theorem",
      "Quadratic Equations & Location of Roots",
      "Sequences and Series (AP, GP, HP & AGP)",
      "Permutations and Combinations",
      "Binomial Theorem & General Term",
      "Matrices and Determinants & Cramer's Rule"
    ]
  },
  {
    id: "trigonometry",
    name: "Trigonometry & Inverse Trigonometry",
    category: "Trigonometry",
    subtopics: [
      "Trigonometric Identities & Multiple Angles",
      "Trigonometric Equations & General Solutions",
      "Inverse Trigonometric Functions & Properties",
      "Properties & Solutions of Triangles"
    ]
  },
  {
    id: "probability-and-statistics",
    name: "Probability & Statistics",
    category: "Probability",
    subtopics: [
      "Axiomatic Probability & Addition Theorem",
      "Conditional Probability & Bayes' Theorem",
      "Independent Events & Multiplication Rule",
      "Random Variables & Probability Distributions",
      "Binomial & Bernoulli Distribution",
      "Measures of Central Tendency, Variance & Standard Deviation"
    ]
  },
  {
    id: "linear-algebra-discrete",
    name: "Linear Algebra & Discrete Mathematics",
    category: "Higher Mathematics",
    subtopics: [
      "Set Theory, Relations & Equivalence",
      "Functions (Invertibility & Composition)",
      "Mathematical Reasoning & Boolean Logic",
      "Vector Spaces & Subspaces",
      "Eigenvalues & Eigenvectors",
      "Systems of Linear Equations (Gaussian Elimination)"
    ]
  }
] as const;

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
  const [mode, setMode] = useState<"tutor" | "jobs">("tutor");
  const [claimedEarnings, setClaimedEarnings] = useState(84200);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [activeTask, setActiveTask] = useState<{
    id: string;
    title: string;
    reward: number;
    description: string;
    instructions: string[];
  } | null>(null);
  
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

  const handleCompleteTask = (task: { id: string; title: string; reward: number }) => {
    if (completedTasks.includes(task.id)) {
      toast.info("Task already completed and rewarded!");
      return;
    }
    setCompletedTasks([...completedTasks, task.id]);
    setClaimedEarnings((prev) => prev + task.reward);
    setActiveTask(null);
    toast.success(`🎉 Task approved! ₹${task.reward} credited directly to your KingPay Wallet.`);
  };

  return (
    <CustomerShell>
      <LayoutGroup>
        <motion.div layout className="flex flex-col min-h-[calc(100dvh-60px)] bg-gradient-to-b from-zinc-950 to-black text-white selection:bg-zinc-800">
        
        {/* Core Control Panel */}
         <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-3.5 z-10 flex flex-col gap-3 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
          
          <div className="flex items-center justify-between relative z-10 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                {mode === "tutor" ? <GraduationCap className="size-5" /> : <Briefcase className="size-5 text-emerald-400" />}
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5 leading-none">
                  Tutor &amp; Jobs
                </h1>
                <p className="text-[10px] text-zinc-400 font-medium mt-1 leading-none">
                  {mode === "tutor" ? "AI Academic Tutor (CBSE / State Boards)" : "Remote Tasks & Instant KingPay Cash"}
                </p>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setMode("tutor")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "tutor"
                    ? "bg-amber-500 text-black font-black shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <GraduationCap className="size-3.5" />
                <span>AI Tutor</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("jobs")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "jobs"
                    ? "bg-emerald-500 text-black font-black shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Briefcase className="size-3.5" />
                <span>Jobs</span>
                <span className="rounded-full bg-emerald-400/20 text-emerald-300 text-[9px] px-1 font-extrabold">
                  Earn
                </span>
              </button>
            </div>
          </div>
          
          {mode === "tutor" && (
            <>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-zinc-300">Curriculum &amp; Exam Parameters</span>
                <button 
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors text-white text-[10px] font-medium px-2.5 py-1 rounded-md uppercase tracking-widest border border-white/20"
                >
                  <SlidersHorizontal className="size-3" /> {showConfig ? "Hide Config" : "Config"}
                </button>
              </div>

              <div className={`grid grid-cols-2 gap-2.5 relative z-10 transition-all duration-300 ${showConfig ? 'max-h-[500px] overflow-y-auto opacity-100' : 'max-h-24 overflow-hidden'}`}>
                 <select 
                    value={board} 
                    onChange={(e) => setBoard(e.target.value)}
                    className="bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg p-2.5 font-medium text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
                  >
                    {STATE_BOARDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
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
                 
                 {/* Dynamic Text Input for Subject */}
                 <div className="col-span-1 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-col focus-within:border-zinc-500 transition-colors">
                    <input 
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject (e.g. Mathematics, English)"
                      className="bg-transparent text-xs font-medium text-zinc-200 outline-none w-full px-2.5 py-2.5 placeholder:text-zinc-500"
                    />
                    {showConfig && (
                      <div className="flex flex-col gap-1.5 px-2 pb-2">
                        <div className="flex flex-wrap gap-1">
                          {["English Learning Fast", "Mathematics", "Science", "Projects & Assignments", "Interview Prep"].map(s => (
                            <button 
                              key={s} 
                              type="button"
                              onClick={() => setSubject(s)}
                              className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded hover:bg-white hover:text-black transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <div className="pt-1.5 border-t border-zinc-800/80">
                          <div className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                            Advanced Mathematics Modules
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {ADVANCED_MATHEMATICS_MODULES.map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setSubject(m.name)}
                                className="text-[9px] bg-zinc-800/60 border border-zinc-700/60 text-zinc-300 hover:border-zinc-400 hover:text-white px-1.5 py-0.5 rounded transition-colors"
                                title={m.subtopics.join(", ")}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
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
                    <option value="Expert">Level: Expert</option>
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
            </>
          )}
        </div>

        {/* WORKSPACE AREA */}
        {mode === "tutor" ? (
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      <span className="text-xs text-zinc-400 font-medium tracking-wide">Synthesizing curriculum-aligned response...</span>
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
                    placeholder="Initialize academic query... (e.g. 'Explain quantum entanglement' or 'Solve integration of x^2')"
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
                   End-to-End Encrypted (AES-256)
                 </p>
                 <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase">
                   NCERT / State Board Verified
                 </p>
               </div>
            </div>
          </div>
        ) : (
          /* REMOTE JOBS & EARNING WORKSPACE */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-28">
            {/* Wallet Earnings Summary Card */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-black p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
                    <span>👑</span> KingPay Verified Earnings
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-mono font-black text-white">
                      ₹{claimedEarnings.toLocaleString("en-IN")}.00
                    </span>
                    <span className="text-xs font-bold text-emerald-400">Available</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Direct instant payouts to UPI · Zero commission taken on your micro-work.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Withdrawal of ₹${claimedEarnings.toLocaleString("en-IN")} initiated to your default UPI VPA. Credited instantly!`);
                  }}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition shadow-md shadow-emerald-500/20 active:scale-95 self-start sm:self-auto"
                >
                  Withdraw to UPI Instant ➔
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-3 text-center text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px] font-bold">Tasks Completed</span>
                  <span className="font-mono font-bold text-white text-sm">{completedTasks.length}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] font-bold">Success Rate</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">100%</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] font-bold">Verification Speed</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">Instant</span>
                </div>
              </div>
            </div>

            {/* Daily Available Micro-Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-400" />
                  Available Micro-Tasks for Instant Payout
                </h2>
                <span className="text-xs text-zinc-400">5 active tasks</span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: "task-menu",
                    title: "Local Restaurant Menu Audit",
                    reward: 150,
                    time: "10 mins",
                    category: "Data Verification",
                    badge: "Hot",
                    description: "Verify dishes, prices, and veg/non-veg tags for 3 restaurants in your city against provided photo receipts.",
                    instructions: [
                      "Verify 5 dish names match restaurant menu photo.",
                      "Confirm prices are entered in whole Rupees.",
                      "Mark Veg / Non-Veg badge accurately.",
                    ],
                  },
                  {
                    id: "task-trans",
                    title: "Multilingual Food Description Translation",
                    reward: 200,
                    time: "15 mins",
                    category: "Language",
                    badge: "High Pay",
                    description: "Translate 20 standard Indian food names into your regional language (Hindi, Bengali, Tamil, Telugu, Marathi).",
                    instructions: [
                      "Keep dish names natural to local food culture.",
                      "Translate spice levels and ingredient notes.",
                      "Check for spelling and grammatical correctness.",
                    ],
                  },
                  {
                    id: "task-photo",
                    title: "Packaging & Seal Hygiene Inspection",
                    reward: 80,
                    time: "5 mins",
                    category: "Quality Assurance",
                    badge: "Quick",
                    description: "Inspect 5 customer food delivery photos to confirm tamper-evident safety seals and packaging integrity.",
                    instructions: [
                      "Check if tamper-evident seal is intact.",
                      "Verify hot/cold container separation.",
                      "Rate container hygiene from 1 to 5.",
                    ],
                  },
                  {
                    id: "task-ambassador",
                    title: "Campus / Neighborhood Voucher Ambassador",
                    reward: 500,
                    time: "Flexible",
                    category: "Promotion",
                    badge: "Top Earner",
                    description: "Share ₹50 OrderKing gift vouchers with friends in your college or neighborhood. Earn ₹500 base + ₹50 per first order.",
                    instructions: [
                      "Copy your unique KingPay gift link.",
                      "Forward to WhatsApp student or society groups.",
                      "Earn instant wallet cash on first order.",
                    ],
                  },
                  {
                    id: "task-qa",
                    title: "CBSE / State Exam Math Step Fact-Checker",
                    reward: 120,
                    time: "10 mins",
                    category: "Curriculum",
                    badge: "Academic",
                    description: "Review 5 AI step-by-step calculus and algebra solutions against NCERT standard textbook answer keys.",
                    instructions: [
                      "Verify final mathematical answer.",
                      "Check that step formulas follow CBSE / State Board syllabus.",
                      "Submit verification approval.",
                    ],
                  },
                ].map((task) => {
                  const isDone = completedTasks.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              {task.category}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-400/10 text-amber-400 text-[9px] font-black">
                              {task.badge}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white mt-1">
                            {task.title}
                          </h3>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-black font-mono text-emerald-400">
                            +₹{task.reward}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">Instant Payout</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400">
                        {task.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Clock className="size-3" /> ~{task.time}
                        </span>

                        {isDone ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <CheckCircle className="size-3.5" /> Rewarded
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTask(task)}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black transition active:scale-95"
                          >
                            Start Task ➔
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full-Time Career Opportunities */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="size-4 text-amber-400" />
                Full-Time Partnerships &amp; Delivery Fleets
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
                  <span className="text-2xl">🛵</span>
                  <h3 className="text-sm font-bold text-white">OrderKing Delivery Partner</h3>
                  <p className="text-xs text-zinc-400">
                    Join our flexible electric vehicle delivery fleet. Earn up to ₹35,000/month with daily incentives and accident insurance.
                  </p>
                  <button
                    type="button"
                    onClick={() => toast.success("Rider onboarding opening... You can also check partner app.")}
                    className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <span>Apply as Rider</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
                  <span className="text-2xl">🏪</span>
                  <h3 className="text-sm font-bold text-white">Merchant Onboarding Lead</h3>
                  <p className="text-xs text-zinc-400">
                    Onboard local restaurants, bakeries, and cloud kitchens to OrderKing. Earn ₹1,000 direct commission per active store.
                  </p>
                  <button
                    type="button"
                    onClick={() => toast.success("Merchant partner application requested!")}
                    className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>Become a Merchant Lead</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Modal */}
        {activeTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Micro-Task Execution
                  </span>
                  <h3 className="text-base font-black text-white">{activeTask.title}</h3>
                </div>
                <span className="text-base font-black font-mono text-emerald-400">
                  +₹{activeTask.reward}
                </span>
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                <p className="font-semibold text-white">Instructions:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {activeTask.instructions.map((inst: string, idx: number) => (
                    <li key={idx}>{inst}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800 text-xs text-zinc-400">
                <span className="font-bold text-white block mb-1">Audit Verification Input:</span>
                <input
                  type="text"
                  placeholder="Type 'Verified OK' or upload notes..."
                  defaultValue="Verified 100% compliant with standard"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCompleteTask(activeTask)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition shadow-md shadow-emerald-500/20"
                >
                  Submit &amp; Claim ₹{activeTask.reward} ➔
                </button>
              </div>
            </div>
          </div>
        )}

        </motion.div>
      </LayoutGroup>
    </CustomerShell>
  );
}
