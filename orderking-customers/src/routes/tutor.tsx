import { createFileRoute, useRouterState } from "@tanstack/react-router";
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
  Coins,
  TrendingUp,
  Award,
  BookOpen,
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

export type TutorPrimaryCategory =
  | "School & Board Exams"
  | "Coding & AI Skills"
  | "Spoken English & Communication"
  | "Competitive Exams";

export interface TutorCategoryConfig {
  id: TutorPrimaryCategory;
  subCategories: readonly string[];
  recommendedTopics: readonly {
    subCategory: string;
    subject: string;
    prompt: string;
    goal: string;
    difficulty: string;
  }[];
}

export const TUTOR_CATEGORY_MATRIX: readonly TutorCategoryConfig[] = [
  {
    id: "School & Board Exams",
    subCategories: [
      "CBSE & NCERT Core",
      "ICSE & ISC Council",
      "Indian State Boards",
      "Advanced Mathematics & Science",
    ],
    recommendedTopics: [
      {
        subCategory: "CBSE & NCERT Core",
        subject: "Mathematics — Differential Calculus",
        prompt: "Explain Rolle's and Lagrange's Mean Value Theorems with step-by-step NCERT board marking scheme steps.",
        goal: "Exam Prep (Make it Easy)",
        difficulty: "Intermediate",
      },
      {
        subCategory: "ICSE & ISC Council",
        subject: "Physics & Chemistry Numericals",
        prompt: "Show me the step-by-step method to solve current electricity circuit numericals for board exams.",
        goal: "Concept Mastery",
        difficulty: "Intermediate",
      },
      {
        subCategory: "Indian State Boards",
        subject: "Trigonometry & Coordinate Geometry",
        prompt: "Provide standard textbook formulas and board exam tips for straight lines and conic sections.",
        goal: "Revision Summary",
        difficulty: "Intermediate",
      },
      {
        subCategory: "Advanced Mathematics & Science",
        subject: "Integral Calculus & Differential Equations",
        prompt: "Walk through integration by parts and definite integral properties with step-by-step proofs.",
        goal: "Concept Mastery",
        difficulty: "Advanced",
      },
    ],
  },
  {
    id: "Coding & AI Skills",
    subCategories: [
      "Python & Data Science",
      "Full-Stack TypeScript & React",
      "AI Engineering & Prompting",
      "DSA & Technical Interviews",
    ],
    recommendedTopics: [
      {
        subCategory: "Python & Data Science",
        subject: "Python Programming & Algorithms",
        prompt: "Explain Python list comprehensions, dictionaries, and time complexity with clean examples.",
        goal: "Concept Mastery",
        difficulty: "Intermediate",
      },
      {
        subCategory: "Full-Stack TypeScript & React",
        subject: "TypeScript & Web Architecture",
        prompt: "Explain strict TypeScript generics, async/await error handling, and state management best practices.",
        goal: "Concept Mastery",
        difficulty: "Advanced",
      },
      {
        subCategory: "AI Engineering & Prompting",
        subject: "Applied AI & Large Language Models",
        prompt: "How do embeddings, retrieval-augmented generation (RAG), and structured outputs work in modern AI systems?",
        goal: "Concept Mastery",
        difficulty: "Advanced",
      },
      {
        subCategory: "DSA & Technical Interviews",
        subject: "Data Structures & Algorithms",
        prompt: "Teach me how to recognize sliding window, two-pointer, and dynamic programming patterns in coding interviews.",
        goal: "Exam Prep (Make it Easy)",
        difficulty: "Expert",
      },
    ],
  },
  {
    id: "Spoken English & Communication",
    subCategories: [
      "Fluent Spoken English",
      "Business & Email Writing",
      "Interview Confidence & GD",
      "Regional-to-English Grammar Bridge",
    ],
    recommendedTopics: [
      {
        subCategory: "Fluent Spoken English",
        subject: "Spoken English & Daily Fluency",
        prompt: "Help me practice natural daily English conversation and correct common Indian English tense mistakes.",
        goal: "Concept Mastery",
        difficulty: "Fundamental",
      },
      {
        subCategory: "Business & Email Writing",
        subject: "Professional Business Communication",
        prompt: "Show me templates and rules for writing crisp professional emails and project updates.",
        goal: "Concept Mastery",
        difficulty: "Intermediate",
      },
      {
        subCategory: "Interview Confidence & GD",
        subject: "Job Interview & Group Discussion Prep",
        prompt: "How do I structure a strong 'Tell me about yourself' and STAR-method behavioural answer for campus placements?",
        goal: "Exam Prep (Make it Easy)",
        difficulty: "Intermediate",
      },
      {
        subCategory: "Regional-to-English Grammar Bridge",
        subject: "English Grammar from Native Language",
        prompt: "Explain active/passive voice, prepositions, and conditional sentences clearly with bilingual examples.",
        goal: "Doubt Clearance",
        difficulty: "Fundamental",
      },
    ],
  },
  {
    id: "Competitive Exams",
    subCategories: [
      "JEE Main & Advanced",
      "NEET UG Medical",
      "UPSC & State PSC Foundation",
      "CUET & Banking Aptitude",
    ],
    recommendedTopics: [
      {
        subCategory: "JEE Main & Advanced",
        subject: "JEE Advanced — Vectors, 3D & Calculus",
        prompt: "Break down shortest distance between skew lines in 3D geometry and key JEE Advanced problem-solving shortcuts.",
        goal: "Exam Prep (Make it Easy)",
        difficulty: "Expert",
      },
      {
        subCategory: "NEET UG Medical",
        subject: "NEET NCERT Biology & Organic Chemistry",
        prompt: "Summarize high-yield NCERT reaction mechanisms and genetics mendelian ratios for NEET UG.",
        goal: "Revision Summary",
        difficulty: "Expert",
      },
      {
        subCategory: "UPSC & State PSC Foundation",
        subject: "Indian Polity, Economy & CSAT",
        prompt: "Explain Constitutional Fundamental Rights, Directive Principles, and Fiscal Policy for UPSC Prelims & Mains.",
        goal: "Concept Mastery",
        difficulty: "Expert",
      },
      {
        subCategory: "CUET & Banking Aptitude",
        subject: "Quantitative Aptitude & Logical Reasoning",
        prompt: "Teach me fast calculation techniques for data interpretation, percentages, and probability in banking/CUET exams.",
        goal: "Exam Prep (Make it Easy)",
        difficulty: "Advanced",
      },
    ],
  },
] as const;

export type JobPrimaryCategory =
  | "Delivery & Logistics"
  | "Restaurant & Culinary"
  | "Retail & Operations"
  | "Digital & Remote";

export interface JobOpeningItem {
  id: string;
  title: string;
  category: JobPrimaryCategory;
  subCategory: string;
  location: string;
  employmentType: string;
  compensationBand: string;
  badge: string;
  description: string;
  requirements: readonly string[];
}

export const JOB_CATEGORY_SUBCATEGORIES: Record<JobPrimaryCategory, readonly string[]> = {
  "Delivery & Logistics": [
    "EV & 2-Wheeler Fleet",
    "Hyperlocal Grocery Dispatch",
    "Hub & Warehouse Sorting",
  ],
  "Restaurant & Culinary": [
    "Cloud Kitchen Commis & Chef",
    "Restaurant Store Manager",
    "FSSAI Hygiene & Packaging Lead",
  ],
  "Retail & Operations": [
    "Merchant Onboarding Executive",
    "City Operations Coordinator",
    "Inventory & Catalog Auditor",
  ],
  "Digital & Remote": [
    "Regional Language Translation",
    "Menu & Catalog QA",
    "Academic Content Reviewer",
  ],
};

export const VERIFIED_JOB_OPENINGS: readonly JobOpeningItem[] = [
  {
    id: "job-del-ev-fleet",
    title: "OrderKing EV & 2-Wheeler Delivery Partner",
    category: "Delivery & Logistics",
    subCategory: "EV & 2-Wheeler Fleet",
    location: "All Major Cities · Flexible Zone Shift",
    employmentType: "Independent Gig Partner",
    compensationBand: "Per-Order Payout + Distance & Weather Incentives",
    badge: "Active Onboarding",
    description:
      "Partner with the OrderKing hyperlocal delivery network using your electric scooter, motorcycle, or cycle. Weekly bank settlements with accidental cover under Code on Social Security 2020 norms.",
    requirements: [
      "Valid Driving Licence & RC (for motorized 2-wheelers) or Aadhaar ID (for EV/Cycle).",
      "Android smartphone with active GPS and bank account linked for NEFT/UPI settlement.",
      "Adherence to tamper-evident food safety seal handling protocols.",
    ],
  },
  {
    id: "job-del-hub-sort",
    title: "Dark Store & Dispatch Hub Sorting Associate",
    category: "Delivery & Logistics",
    subCategory: "Hyperlocal Grocery Dispatch",
    location: "Metro Hubs · 8-Hour Rotational Shift",
    employmentType: "Full-Time On-Site",
    compensationBand: "₹18,000 – ₹24,000 / month (Bank Payroll)",
    badge: "Shift Role",
    description:
      "Manage fast-moving grocery & FMCG order picking, cold-chain crate staging, and rider handoff inside local dispatch hubs.",
    requirements: [
      "Ability to scan barcode SKUs accurately and verify expiry/MRP labels.",
      "Familiarity with cold-storage and ambient zone separation.",
      "10th / 12th pass with basic smartphone scanner proficiency.",
    ],
  },
  {
    id: "job-cul-commis",
    title: "Cloud Kitchen Commis Chef & Prep Specialist",
    category: "Restaurant & Culinary",
    subCategory: "Cloud Kitchen Commis & Chef",
    location: "Partner Restaurants · City Kitchens",
    employmentType: "Full-Time Hospitality",
    compensationBand: "₹20,000 – ₹32,000 / month",
    badge: "Culinary",
    description:
      "Work with verified OrderKing partner restaurants and cloud kitchens on high-volume North Indian, South Indian, or Continental station prep.",
    requirements: [
      "Prior kitchen station experience or culinary diploma preferred.",
      "Strict compliance with FSSAI Schedule IV personal hygiene and temperature logs.",
      "Consistent portioning and KDS ticket preparation discipline.",
    ],
  },
  {
    id: "job-cul-hygiene",
    title: "FSSAI Packaging & Kitchen Hygiene Lead",
    category: "Restaurant & Culinary",
    subCategory: "FSSAI Hygiene & Packaging Lead",
    location: "Multi-Brand Cloud Kitchens",
    employmentType: "Full-Time On-Site",
    compensationBand: "₹22,000 – ₹30,000 / month",
    badge: "FSSAI Standard",
    description:
      "Supervise food-grade container sealing, allergen labeling, and dispatch counter sanitation across high-volume restaurant partner outlets.",
    requirements: [
      "FoSTaC (Food Safety Training & Certification) awareness or hospitality background.",
      "Audit tamper-evident seals and hot/cold bag segregation before rider handoff.",
      "Maintain daily kitchen sanitation and pest-control checklists.",
    ],
  },
  {
    id: "job-ops-merchant",
    title: "Merchant Onboarding & Field Growth Executive",
    category: "Retail & Operations",
    subCategory: "Merchant Onboarding Executive",
    location: "Field Role · Tier-1 & Tier-2 Cities",
    employmentType: "Full-Time / Contract",
    compensationBand: "₹24,000 – ₹36,000 / month + Verified Store Milestones",
    badge: "Field Growth",
    description:
      "Onboard licensed local restaurants, bakeries, and sweet shops onto the OrderKing platform, assisting owners with FSSAI/GSTIN verification and menu digitization.",
    requirements: [
      "Strong fluency in local regional language and English/Hindi.",
      "Understanding of FSSAI 14-digit licence, GSTIN, and restaurant POS onboarding.",
      "Two-wheeler for local merchant visits within assigned city pin codes.",
    ],
  },
  {
    id: "job-ops-catalog",
    title: "City Menu & Inventory Catalog Auditor",
    category: "Retail & Operations",
    subCategory: "Inventory & Catalog Auditor",
    location: "Hybrid · Regional Operations Desk",
    employmentType: "Contract / Full-Time",
    compensationBand: "₹18,000 – ₹25,000 / month",
    badge: "Operations",
    description:
      "Audit merchant menu pricing, veg/non-veg classification badges, and GST slab mappings against physical restaurant tariff cards.",
    requirements: [
      "High attention to detail in verifying item prices and portion descriptions.",
      "Familiarity with Indian food categories and dietary classification norms.",
      "Proficiency with spreadsheets and catalog management tools.",
    ],
  },
  {
    id: "job-rem-translation",
    title: "Regional Culinary & App Localization Specialist",
    category: "Digital & Remote",
    subCategory: "Regional Language Translation",
    location: "Remote · Pan-India",
    employmentType: "Verified Freelance Contract",
    compensationBand: "Contract Rate per Verified Batch (Bank/UPI Settlement)",
    badge: "Remote",
    description:
      "Translate dish names, ingredient notes, and partner onboarding guides accurately across Hindi, Bengali, Tamil, Telugu, Marathi, Kannada, and Gujarati.",
    requirements: [
      "Native-level reading and writing proficiency in at least one Indian regional language.",
      "Ability to preserve authentic culinary terminology without literal mistranslation.",
      "Pass sample localization quality review by editorial team.",
    ],
  },
  {
    id: "job-rem-academic",
    title: "NCERT / State Board Academic Solution Reviewer",
    category: "Digital & Remote",
    subCategory: "Academic Content Reviewer",
    location: "Remote · Flexible Hours",
    employmentType: "Subject Matter Expert Contract",
    compensationBand: "Contract Rate per Reviewed Module",
    badge: "Academic SME",
    description:
      "Review and fact-check step-by-step Mathematics, Physics, and Chemistry solutions for alignment with CBSE, ICSE, and Indian State Board marking schemes.",
    requirements: [
      "B.Sc / M.Sc / B.Tech or teaching experience in Senior Secondary Mathematics or Science.",
      "Deep familiarity with NCERT textbooks and step-wise board exam marking criteria.",
      "Submit clear mathematical corrections during credential review.",
    ],
  },
] as const;

interface SubmittedJobApplication {
  jobId: string;
  jobTitle: string;
  category: JobPrimaryCategory;
  subCategory: string;
  applicantName: string;
  applicantContact: string;
  applicantNote: string;
  status: "Application Submitted for Employer Review";
  submittedAt: string;
}

const JOB_APPLICATIONS_STORAGE_KEY = "orderking_job_applications_v1";

export const Route = createFileRoute('/tutor')({
  component: IntelligencePage,
});

function IntelligencePage() {
  const [message, setMessage] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [stdClass, setStdClass] = useState("Class 10");
  const [subject, setSubject] = useState("");
  const [topicQuery, setTopicQuery] = useState("");
  const [language, setLanguage] = useState("Auto (Detect Native Language)");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [tone, setTone] = useState("Direct Easy Exam Answers");
  const [goal, setGoal] = useState("Concept Mastery");
  const [showConfig, setShowConfig] = useState(false);
  const [mode, setMode] = useState<"tutor" | "jobs">("tutor");

  // Academic Tutor Category & Sub-Category state
  const [tutorCategory, setTutorCategory] = useState<TutorPrimaryCategory>("School & Board Exams");
  const [tutorSubCategory, setTutorSubCategory] = useState<string>("All");

  // Verified Jobs & Career Board Category & Sub-Category state
  const [jobCategory, setJobCategory] = useState<"ALL" | JobPrimaryCategory>("ALL");
  const [jobSubCategory, setJobSubCategory] = useState<string>("ALL");
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [submittedApplications, setSubmittedApplications] = useState<SubmittedJobApplication[]>([]);
  const [activeJobModal, setActiveJobModal] = useState<JobOpeningItem | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantContact, setApplicantContact] = useState("");
  const [applicantNote, setApplicantNote] = useState("");

  const sectionHash = useRouterState({ select: (s) => s.location.hash });
  useEffect(() => {
    const cleanHash = sectionHash.replace(/^#/, "").toLowerCase();
    if (cleanHash === "jobs") setMode("jobs");
    else if (cleanHash === "tutor") setMode("tutor");
  }, [sectionHash]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(JOB_APPLICATIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSubmittedApplications(parsed);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Indian Exams & Skills AI Tutor initialized. Choose an Academic or Skill Category above, configure your board/class parameters, and submit your query." }
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

  const handleSubmitJobApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobModal) return;
    if (submittedApplications.some((a) => a.jobId === activeJobModal.id)) {
      toast.info("Application Submitted for Employer Review — your application for this role is already on file.");
      setActiveJobModal(null);
      return;
    }
    if (!applicantName.trim() || !applicantContact.trim()) {
      toast.error("Please enter your full name and phone number or email for employer contact.");
      return;
    }
    const record: SubmittedJobApplication = {
      jobId: activeJobModal.id,
      jobTitle: activeJobModal.title,
      category: activeJobModal.category,
      subCategory: activeJobModal.subCategory,
      applicantName: applicantName.trim(),
      applicantContact: applicantContact.trim(),
      applicantNote: applicantNote.trim() || "Credentials ready for verification.",
      status: "Application Submitted for Employer Review",
      submittedAt: new Date().toLocaleDateString("en-IN"),
    };
    const nextList = [record, ...submittedApplications];
    setSubmittedApplications(nextList);
    try {
      window.localStorage.setItem(JOB_APPLICATIONS_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // Ignore storage quota errors
    }
    setActiveJobModal(null);
    setApplicantNote("");
    toast.success("Application Submitted for Employer Review. The hiring team will contact you after credential verification.");
  };

  const currentTutorCatConfig =
    TUTOR_CATEGORY_MATRIX.find((c) => c.id === tutorCategory) ?? TUTOR_CATEGORY_MATRIX[0];

  const filteredTutorPrompts = currentTutorCatConfig.recommendedTopics.filter(
    (item) => tutorSubCategory === "All" || item.subCategory === tutorSubCategory
  );

  const availableJobSubCategories: readonly string[] =
    jobCategory === "ALL"
      ? Object.values(JOB_CATEGORY_SUBCATEGORIES).flat()
      : JOB_CATEGORY_SUBCATEGORIES[jobCategory];

  const filteredJobs = VERIFIED_JOB_OPENINGS.filter((job) => {
    if (jobCategory !== "ALL" && job.category !== jobCategory) return false;
    if (jobSubCategory !== "ALL" && job.subCategory !== jobSubCategory) return false;
    if (jobSearchQuery.trim()) {
      const q = jobSearchQuery.trim().toLowerCase();
      const hay = `${job.title} ${job.category} ${job.subCategory} ${job.location} ${job.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <CustomerShell>
      <LayoutGroup>
        <motion.div layout className="flex flex-col min-h-[calc(100dvh-60px)] bg-gradient-to-b from-zinc-950 to-black text-white selection:bg-zinc-800">
        
        {/* ULTRA-LUXURIOUS AMETHYST PURPLE TO INDIGO HERO */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1B0B2E] via-[#2A134E] to-[#120E38] border-b border-purple-500/30 px-4 sm:px-6 py-6 sm:py-8 shadow-2xl text-white">
          {/* Ambient Amethyst & Indigo Glow Orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mb-20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-400/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-400/15 border border-purple-400/40 px-3 py-1 text-xs font-black text-purple-300 shadow-xs">
                  <span>🔮</span>
                  <span>OrderKing Academy &amp; Sovereign Careers</span>
                </span>
                <span className="rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 px-2.5 py-0.5 text-[10px] font-extrabold">
                  23 Indian Languages · NCERT &amp; 28 State Boards
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold">
                  100% Employer Credential Review
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                LearnKing &amp; JobKing
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
                Step-by-step NCERT &amp; Indian state board exam solutions, high-yield software &amp; AI courses, and verified hyperlocal logistics, culinary, operations, and remote freelance jobs across India.
              </p>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center bg-black/40 border border-purple-400/30 p-1.5 rounded-2xl shrink-0 backdrop-blur-xl shadow-xl self-start md:self-auto">
              <button
                type="button"
                onClick={() => setMode("tutor")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === "tutor"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-md shadow-purple-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <GraduationCap className="size-4" />
                <span>LearnKing AI</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("jobs")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === "jobs"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Briefcase className="size-4" />
                <span>JobKing Verified</span>
                <span className="rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] px-1.5 py-0.2 font-extrabold">
                  {VERIFIED_JOB_OPENINGS.length} Roles
                </span>
              </button>
            </div>
          </div>

          {/* =====================================================================
              THE 4 PRIMARY CATEGORIES:
              1. Tutoring (Amethyst / Royal Purple)
              2. Freelance Jobs (Electric Cyan / Teal)
              3. Skill Courses (Sunset Amber / Gold)
              4. Earn Money (Emerald Green / Jade)
              Each category with its own gradient card & earning potential display!
             ===================================================================== */}
          <div className="mt-6 pt-5 border-t border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-purple-400" />
                Featured Career &amp; Learning Pathways
              </span>
              <span className="text-[10px] text-purple-300/70 font-bold hidden sm:inline">
                Click any pathway to activate tools
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. TUTORING */}
              <button
                type="button"
                onClick={() => {
                  setMode("tutor");
                  setTutorCategory("School & Board Exams");
                  setTutorSubCategory("All");
                }}
                className={`rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer backdrop-blur-xl border ${
                  mode === "tutor" && tutorCategory === "School & Board Exams"
                    ? "bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-indigo-950/70 border-purple-400 shadow-[0_0_25px_rgba(192,132,252,0.25)] ring-1 ring-purple-400/60"
                    : "bg-white/[0.04] border-purple-500/20 hover:border-purple-400/50 hover:bg-purple-950/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    <GraduationCap className="size-6" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider rounded-full bg-purple-400/20 text-purple-300 border border-purple-400/30 px-2 py-0.5">
                    CBSE &amp; State
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-purple-300 transition-colors">
                  Academic Tutoring
                </h3>
                <p className="text-[11px] text-purple-200/80 mt-0.5 leading-snug">
                  CBSE, ICSE, 28 State Boards &amp; Higher Mathematics. Step-by-step marking schemes.
                </p>

                {/* Earning Potential Display */}
                <div className="mt-3 rounded-xl bg-purple-500/15 border border-purple-400/30 p-2.5 text-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-300 block">
                    Tutor Earning Potential
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-purple-200 block mt-0.5">
                    ₹25,000 – ₹60,000 / mo
                  </span>
                  <span className="text-[9px] text-purple-300/80 block">
                    as verified SME or Online Academic Coach
                  </span>
                </div>
              </button>

              {/* 2. FREELANCE JOBS */}
              <button
                type="button"
                onClick={() => {
                  setMode("jobs");
                  setJobCategory("Digital & Remote");
                  setJobSubCategory("ALL");
                }}
                className={`rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer backdrop-blur-xl border ${
                  mode === "jobs" && jobCategory === "Digital & Remote"
                    ? "bg-gradient-to-br from-cyan-950/40 via-teal-900/20 to-slate-950/70 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/60"
                    : "bg-white/[0.04] border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-950/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                    <Briefcase className="size-6" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5">
                    Remote Pan-India
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                  Freelance Jobs
                </h3>
                <p className="text-[11px] text-cyan-200/80 mt-0.5 leading-snug">
                  23-language app localization, catalog QA &amp; academic solution auditing.
                </p>

                {/* Earning Potential Display */}
                <div className="mt-3 rounded-xl bg-cyan-500/15 border border-cyan-400/30 p-2.5 text-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-300 block">
                    Freelance Earning Potential
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-cyan-200 block mt-0.5">
                    ₹15,000 – ₹45,000 / mo
                  </span>
                  <span className="text-[9px] text-cyan-300/80 block">
                    on verified batches &amp; contract settlement
                  </span>
                </div>
              </button>

              {/* 3. SKILL COURSES */}
              <button
                type="button"
                onClick={() => {
                  setMode("tutor");
                  setTutorCategory("Coding & AI Skills");
                  setTutorSubCategory("All");
                }}
                className={`rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer backdrop-blur-xl border ${
                  mode === "tutor" && tutorCategory === "Coding & AI Skills"
                    ? "bg-gradient-to-br from-amber-950/40 via-orange-900/20 to-indigo-950/70 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/60"
                    : "bg-white/[0.04] border-amber-500/20 hover:border-amber-400/50 hover:bg-amber-950/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                    <BrainCircuit className="size-6" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5">
                    Tech &amp; AI
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-amber-300 transition-colors">
                  Skill Courses
                </h3>
                <p className="text-[11px] text-amber-200/80 mt-0.5 leading-snug">
                  Full-Stack TypeScript, Python, Prompt Engineering, DSA &amp; Spoken English.
                </p>

                {/* Earning Potential Display */}
                <div className="mt-3 rounded-xl bg-amber-500/15 border border-amber-400/30 p-2.5 text-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-300 block">
                    Career Uplift Potential
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-amber-200 block mt-0.5">
                    ₹4.5L – ₹18L / year
                  </span>
                  <span className="text-[9px] text-amber-300/80 block">
                    entry-to-senior tech &amp; engineering salaries
                  </span>
                </div>
              </button>

              {/* 4. EARN MONEY */}
              <button
                type="button"
                onClick={() => {
                  setMode("jobs");
                  setJobCategory("ALL");
                  setJobSubCategory("ALL");
                }}
                className={`rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer backdrop-blur-xl border ${
                  mode === "jobs" && jobCategory === "ALL"
                    ? "bg-gradient-to-br from-emerald-950/40 via-teal-900/20 to-slate-950/70 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.25)] ring-1 ring-emerald-400/60"
                    : "bg-white/[0.04] border-emerald-500/20 hover:border-emerald-400/50 hover:bg-emerald-950/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="size-6" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5">
                    Fleet &amp; Hubs
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                  Earn Money
                </h3>
                <p className="text-[11px] text-emerald-200/80 mt-0.5 leading-snug">
                  EV &amp; 2-Wheeler delivery partners, hub sorters, commis chefs &amp; field leads.
                </p>

                {/* Earning Potential Display */}
                <div className="mt-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 p-2.5 text-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                    Partner Earning Potential
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-200 block mt-0.5">
                    ₹18,000 – ₹36,000 / mo
                  </span>
                  <span className="text-[9px] text-emerald-300/80 block">
                    weekly bank settlements + incentives &amp; insurance
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Controls Sub-Panel (Curriculum or Jobs Filters) */}
        <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-3.5 z-10 flex flex-col gap-3 shadow-sm relative overflow-hidden">
          
          {mode === "tutor" && (
            <>
              {/* Academic & Skill Tutoring Primary Categories */}
              <div className="space-y-2 pt-1 relative z-10">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 mr-1">
                    Tutor Category:
                  </span>
                  {TUTOR_CATEGORY_MATRIX.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setTutorCategory(cat.id);
                        setTutorSubCategory("All");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        tutorCategory === cat.id
                          ? "bg-amber-500 text-black border-amber-400 font-black"
                          : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {cat.id}
                    </button>
                  ))}
                </div>

                {/* Sub-Category Filter Pills for Selected Tutor Category */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mr-1">
                    Sub-Category:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTutorSubCategory("All")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      tutorSubCategory === "All"
                        ? "bg-white text-black"
                        : "bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    All {tutorCategory}
                  </button>
                  {currentTutorCatConfig.subCategories.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setTutorSubCategory(sub)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        tutorSubCategory === sub
                          ? "bg-white text-black"
                          : "bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                {/* Quick Study Prompts for Active Tutor Category / Sub-Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {filteredTutorPrompts.map((item) => (
                    <button
                      key={item.subCategory + item.subject}
                      type="button"
                      onClick={() => {
                        setSubject(item.subject);
                        setGoal(item.goal);
                        setDifficulty(item.difficulty);
                        setMessage(item.prompt);
                      }}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/70 hover:border-amber-500/50 p-2.5 text-left transition flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                          {item.subCategory} · {item.subject}
                        </span>
                        <p className="text-xs text-zinc-200 line-clamp-1 mt-0.5">
                          {item.prompt}
                        </p>
                      </div>
                      <ArrowRight className="size-3.5 text-zinc-500 shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 relative z-10">
                <label htmlFor="tutor-topic-search" className="text-[11px] font-semibold text-zinc-300">
                  Search study topics &amp; mathematics modules
                </label>
                <input
                  id="tutor-topic-search"
                  type="search"
                  autoComplete="off"
                  value={topicQuery}
                  onChange={(e) => setTopicQuery(e.target.value)}
                  placeholder="Search mathematics, calculus, algebra, coding, spoken English..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 outline-none"
                />
                {topicQuery.trim() && (
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1">
                    {ADVANCED_MATHEMATICS_MODULES.filter((module) =>
                      (module.name + " " + module.category + " " + module.subtopics.join(" "))
                        .toLocaleLowerCase()
                        .includes(topicQuery.trim().toLocaleLowerCase())
                    ).slice(0, 6).map((module) => (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => { setSubject(module.name); setTopicQuery(""); }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                      >
                        {module.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                   NCERT / State Board &amp; Skill Verified
                 </p>
               </div>
            </div>
          </div>
        ) : (
          /* VERIFIED JOBS & CAREER BOARD WORKSPACE */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-28">
            {/* Institutional Career & Application Status Banner */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-black p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck className="size-4" /> OrderKing Verified Jobs &amp; Career Board
                  </span>
                  <h2 className="mt-1 text-xl sm:text-2xl font-black text-white">
                    Direct Role Applications &amp; Employer Credential Review
                  </h2>
                  <p className="text-xs text-zinc-300 mt-1 max-w-2xl">
                    Apply across Delivery &amp; Logistics, Restaurant &amp; Culinary, Retail &amp; Operations, and Digital &amp; Remote contracts. All applications undergo employer credential verification before onboarding and payroll/contract settlement.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Submitted Applications
                  </span>
                  <span className="font-mono text-2xl font-black text-emerald-400">
                    {submittedApplications.length}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    Under Employer Review
                  </span>
                </div>
              </div>

              {/* Category & Sub-Category Filtering Controls */}
              <div className="mt-5 pt-4 border-t border-zinc-800/80 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mr-1">
                    Job Category:
                  </span>
                  {(
                    [
                      "ALL",
                      "Delivery & Logistics",
                      "Restaurant & Culinary",
                      "Retail & Operations",
                      "Digital & Remote",
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setJobCategory(cat);
                        setJobSubCategory("ALL");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        jobCategory === cat
                          ? "bg-emerald-500 text-black border-emerald-400 font-black"
                          : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {cat === "ALL" ? "All Categories" : cat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
                    Sub-Category:
                  </span>
                  <button
                    type="button"
                    onClick={() => setJobSubCategory("ALL")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      jobSubCategory === "ALL"
                        ? "bg-white text-black"
                        : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    All Sub-Categories
                  </button>
                  {availableJobSubCategories.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setJobSubCategory(sub)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        jobSubCategory === sub
                          ? "bg-white text-black"
                          : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                <div>
                  <input
                    type="search"
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                    placeholder="Filter roles by title, skill, city, or sub-category..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Submitted Applications Tracker (if any) */}
            {submittedApplications.length > 0 && (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <CheckCircle className="size-4 text-emerald-400" />
                  Your Submitted Applications
                </h3>
                <div className="space-y-2">
                  {submittedApplications.map((app) => (
                    <div
                      key={app.jobId}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          {app.category} · {app.subCategory}
                        </span>
                        <h4 className="text-xs font-bold text-white">{app.jobTitle}</h4>
                        <p className="text-[11px] text-zinc-400">
                          Applicant: {app.applicantName} ({app.applicantContact}) · Submitted {app.submittedAt}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 px-3 py-1 text-[11px] font-black text-amber-300 self-start sm:self-auto">
                        <Clock className="size-3" />
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filtered Job Openings List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-400" />
                  Verified Openings ({filteredJobs.length})
                </h2>
                <span className="text-xs text-zinc-400">
                  {jobCategory === "ALL" ? "Showing all 4 career categories" : jobCategory}
                </span>
              </div>

              <div className="space-y-3">
                {filteredJobs.map((job) => {
                  const existingApp = submittedApplications.find((a) => a.jobId === job.id);
                  return (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 hover:border-zinc-700 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                              {job.category}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400">
                              • {job.subCategory}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[9px] font-black">
                              {job.badge}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-white mt-1">
                            {job.title}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            📍 {job.location} · {job.employmentType}
                          </p>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span className="text-xs font-black font-mono text-emerald-300 block">
                            {job.compensationBand}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            Subject to Employer Onboarding &amp; KYC
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300">
                        {job.description}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
                        <span className="text-[11px] text-zinc-400">
                          Eligibility: {job.requirements[0]}
                        </span>

                        {existingApp ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                            <CheckCircle className="size-3.5 text-emerald-400" />
                            Application Submitted for Employer Review
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveJobModal(job)}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black transition active:scale-95 self-start sm:self-auto"
                          >
                            Apply for Role ➔
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Role Application Modal */}
        {activeJobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <form
              onSubmit={handleSubmitJobApplication}
              className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white space-y-4 shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-zinc-800 pb-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {activeJobModal.category} · {activeJobModal.subCategory}
                  </span>
                  <h3 className="text-base font-black text-white mt-0.5">{activeJobModal.title}</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{activeJobModal.compensationBand}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-300">
                <p className="font-semibold text-white">Role Requirements &amp; Verification:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {activeJobModal.requirements.map((req: string, idx: number) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Enter your full name as per ID"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Phone Number or Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantContact}
                    onChange={(e) => setApplicantContact(e.target.value)}
                    placeholder="e.g. +91 98765 43210 or name@example.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Experience / City &amp; Shift Availability
                  </label>
                  <input
                    type="text"
                    value={applicantNote}
                    onChange={(e) => setApplicantNote(e.target.value)}
                    placeholder="Brief summary of relevant experience and preferred city"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5">
                Submitting records your application as <strong>Application Submitted for Employer Review</strong>. No instant unverified payout is issued prior to employer onboarding and work verification.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveJobModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition shadow-md shadow-emerald-500/20"
                >
                  Submit Application ➔
                </button>
              </div>
            </form>
          </div>
        )}

        </motion.div>
      </LayoutGroup>
    </CustomerShell>
  );
}
