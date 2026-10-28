/**
 * Universal AI Tutor Solver Engine — Google Gemini 2.5 Flash
 *
 * Implements multilingual, all-board (CBSE, ICSE, and all 28 State Boards),
 * all-level (Classes 1-12, Degree STEM, NEET UG, JEE Main & Advanced)
 * academic problem solving with real derivations, formula proofs, and step marking.
 */

import { GoogleGenAI } from "@google/genai";

export interface AcademicSolveParams {
  message: string;
  board: string;
  stdClass: string;
  subject: string;
  language?: string;
  difficulty?: string;
  tone?: string;
  goal?: string;
  history?: Array<{ role: string; content: string }>;
}

export interface AcademicSolveResult {
  text: string;
  modelUsed: string;
  isFallback: boolean;
  board: string;
  stdClass: string;
  subject: string;
  language: string;
}

/**
 * Constructs a systematically conditioned pedagogical system prompt
 * for Indian central boards (CBSE/NCERT, ICSE/ISC, NIOS), all 28 State Boards,
 * Classes 1-12, Degree STEM, and premier competitive examinations (NEET/JEE).
 */

export interface CurriculumAuthority {
  authority: string;
  textbookStandard: string;
  region: "Central" | "North" | "South" | "East" | "West" | "Central India" | "National Competitive";
}

/**
 * Maps any Indian central, state, or competitive board to its exact
 * statutory governing curriculum authority and canonical textbook production body.
 * Guarantees zero regional bias across North, South, East, West, and Central India.
 */
export function getGoverningCurriculumAuthority(board: string): CurriculumAuthority {
  const b = (board || "").toLowerCase();

  // Central Boards
  if (b.includes("cbse") || b.includes("ncert")) {
    return {
      authority: "National Council of Educational Research and Training (NCERT) & CBSE",
      textbookStandard: "Official NCERT Textbooks & CBSE Marking Schemes",
      region: "Central",
    };
  }
  if (b.includes("icse") || b.includes("isc") || b.includes("cisce")) {
    return {
      authority: "Council for the Indian School Certificate Examinations (CISCE)",
      textbookStandard: "Prescribed CISCE Scope of Syllabus & Selina/Frank/Nootan Benchmarks",
      region: "Central",
    };
  }
  if (b.includes("nios")) {
    return {
      authority: "National Institute of Open Schooling (NIOS)",
      textbookStandard: "Official NIOS Self-Instructional Study Material",
      region: "Central",
    };
  }

  // West India
  if (b.includes("maharashtra") || b.includes("msbshse")) {
    return {
      authority: "Maharashtra State Board of Secondary and Higher Secondary Education (MSBSHSE)",
      textbookStandard: "Balbharati / Maharashtra State Bureau of Textbook Production",
      region: "West",
    };
  }
  if (b.includes("gujarat") || b.includes("gseb")) {
    return {
      authority: "Gujarat Secondary and Higher Secondary Education Board (GSHSEB)",
      textbookStandard: "Gujarat State Board of School Textbooks (GSSTB)",
      region: "West",
    };
  }
  if (b.includes("goa") || b.includes("gbshse")) {
    return {
      authority: "Goa Board of Secondary and Higher Secondary Education (GBSHSE)",
      textbookStandard: "SCERT Goa Curriculum & State Textbooks",
      region: "West",
    };
  }

  // South India
  if (b.includes("tamil nadu") || b.includes("tndge") || b.includes("samacheer")) {
    return {
      authority: "Directorate of Government Examinations Tamil Nadu (TNDGE)",
      textbookStandard: "Tamil Nadu Textbook and Educational Services Corporation (Samacheer Kalvi)",
      region: "South",
    };
  }
  if (b.includes("karnataka") || b.includes("kseab")) {
    return {
      authority: "Karnataka School Examination and Assessment Board (KSEAB)",
      textbookStandard: "Karnataka Textbook Society (KTBS) & DSERT Karnataka",
      region: "South",
    };
  }
  if (b.includes("kerala") || b.includes("dhse") || b.includes("kbpe")) {
    return {
      authority: "Kerala Board of Public Examinations (KBPE) & DHSE Kerala",
      textbookStandard: "State Council of Educational Research and Training (SCERT Kerala)",
      region: "South",
    };
  }
  if (b.includes("andhra") || b.includes("bieap") || b.includes("bseap")) {
    return {
      authority: "Board of Intermediate Education & Directorate of Government Examinations AP",
      textbookStandard: "SCERT Andhra Pradesh & Telugu Akademi Textbooks",
      region: "South",
    };
  }
  if (b.includes("telangana") || b.includes("tsbie")) {
    return {
      authority: "Telangana State Board of Intermediate Education (TSBIE) & BSE Telangana",
      textbookStandard: "SCERT Telangana & Telugu Akademi Curriculum",
      region: "South",
    };
  }

  // North India
  if (b.includes("uttar pradesh") || b.includes("up board") || b.includes("upmsp")) {
    return {
      authority: "Uttar Pradesh Madhyamik Shiksha Parishad (UPMSP)",
      textbookStandard: "SCERT Uttar Pradesh & UPMSP Prescribed Textbooks",
      region: "North",
    };
  }
  if (b.includes("bihar") || b.includes("bseb")) {
    return {
      authority: "Bihar School Examination Board (BSEB)",
      textbookStandard: "Bihar State Textbook Publishing Corporation (BSTBPC)",
      region: "North",
    };
  }
  if (b.includes("rajasthan") || b.includes("rbse")) {
    return {
      authority: "Board of Secondary Education Rajasthan (RBSE)",
      textbookStandard: "Rajasthan State Textbook Board (RSTB) Jaipur",
      region: "North",
    };
  }
  if (b.includes("punjab") || b.includes("pseb")) {
    return {
      authority: "Punjab School Education Board (PSEB)",
      textbookStandard: "PSEB Mohali State Syllabus & Textbooks",
      region: "North",
    };
  }
  if (b.includes("haryana") || b.includes("bseh")) {
    return {
      authority: "Board of School Education Haryana (BSEH)",
      textbookStandard: "SCERT Haryana & Haryana School Education Board",
      region: "North",
    };
  }
  if (b.includes("himachal") || b.includes("hpbose")) {
    return {
      authority: "Himachal Pradesh Board of School Education (HPBOSE)",
      textbookStandard: "HPBOSE Dharamshala Prescribed Syllabi",
      region: "North",
    };
  }
  if (b.includes("jammu") || b.includes("kashmir") || b.includes("jkbose")) {
    return {
      authority: "Jammu and Kashmir Board of School Education (JKBOSE)",
      textbookStandard: "JKBOSE State Curriculum & Textbooks",
      region: "North",
    };
  }
  if (b.includes("uttarakhand") || b.includes("ubse")) {
    return {
      authority: "Uttarakhand Board of School Education (UBSE)",
      textbookStandard: "SCERT Uttarakhand Prescribed Curriculum",
      region: "North",
    };
  }

  // East & Northeast India
  if (b.includes("west bengal") || b.includes("wbbse") || b.includes("wbchse")) {
    return {
      authority: "West Bengal Board of Secondary Education & WBCHSE",
      textbookStandard: "Paschimbanga Uchha Madhyamik Siksha Samsad & WBBSE Curriculum",
      region: "East",
    };
  }
  if (b.includes("assam") || b.includes("seba") || b.includes("ahsec")) {
    return {
      authority: "Board of Secondary Education Assam (SEBA) & AHSEC",
      textbookStandard: "Assam State Textbook Production & Publication Corporation (ASTPPC)",
      region: "East",
    };
  }
  if (b.includes("odisha") || b.includes("bse/chse") || b.includes("chse")) {
    return {
      authority: "Board of Secondary Education Odisha & CHSE Odisha",
      textbookStandard: "Text Book Bureau Odisha (TBW)",
      region: "East",
    };
  }
  if (b.includes("jharkhand") || b.includes("jac")) {
    return {
      authority: "Jharkhand Academic Council (JAC)",
      textbookStandard: "Jharkhand Council of Educational Research and Training (JCERT)",
      region: "East",
    };
  }
  if (b.includes("tripura") || b.includes("tbse")) {
    return {
      authority: "Tripura Board of Secondary Education (TBSE)",
      textbookStandard: "SCERT Tripura & TBSE Curriculum",
      region: "East",
    };
  }
  if (b.includes("meghalaya") || b.includes("mbose")) {
    return {
      authority: "Meghalaya Board of School Education (MBOSE)",
      textbookStandard: "MBOSE Prescribed Curriculum",
      region: "East",
    };
  }
  if (b.includes("manipur") || b.includes("bosem")) {
    return {
      authority: "Board of Secondary Education Manipur (BOSEM & COHSEM)",
      textbookStandard: "SCERT Manipur Prescribed Syllabi",
      region: "East",
    };
  }
  if (b.includes("mizoram") || b.includes("mbse")) {
    return {
      authority: "Mizoram Board of School Education (MBSE)",
      textbookStandard: "MBSE Aizawl Textbooks",
      region: "East",
    };
  }
  if (b.includes("nagaland") || b.includes("nbse")) {
    return {
      authority: "Nagaland Board of School Education (NBSE)",
      textbookStandard: "NBSE Kohima Curriculum",
      region: "East",
    };
  }

  // Central India
  if (b.includes("madhya pradesh") || b.includes("mpbse")) {
    return {
      authority: "Board of Secondary Education Madhya Pradesh (MPBSE)",
      textbookStandard: "MP Rajya Shiksha Kendra & MP Text Book Corporation",
      region: "Central India",
    };
  }
  if (b.includes("chhattisgarh") || b.includes("cgbse")) {
    return {
      authority: "Chhattisgarh Board of Secondary Education (CGBSE)",
      textbookStandard: "Chhattisgarh Rajya Pathyapustak Nigam & SCERT CG",
      region: "Central India",
    };
  }

  // National Competitive
  if (b.includes("neet")) {
    return {
      authority: "National Testing Agency (NTA) - NEET UG Medical Entrance",
      textbookStandard: "NCERT Class 11-12 Biology, Chemistry, and Physics Standard",
      region: "National Competitive",
    };
  }
  if (b.includes("jee")) {
    return {
      authority: "National Testing Agency (NTA) & IIT Joint Admission Board (JEE)",
      textbookStandard: "Advanced Analytical Problem Solving & Theoretical Mathematics/Physics Standards",
      region: "National Competitive",
    };
  }
  if (b.includes("degree") || b.includes("stem")) {
    return {
      authority: "University Grants Commission (UGC) & AICTE Engineering Curriculum",
      textbookStandard: "National Undergraduate STEM Standard Framework",
      region: "National Competitive",
    };
  }

  return {
    authority: "State Council of Educational Research and Training (SCERT) / State Board",
    textbookStandard: "State Prescribed Textbook Curriculum",
    region: "Central",
  };
}

export function buildAcademicSystemPrompt(data: AcademicSolveParams): string {
  const auth = getGoverningCurriculumAuthority(data.board);
  const selectedLang =
    data.language && data.language !== "Auto (Detect Native Language)"
      ? data.language
      : "Auto-detect from student's query (support English, Hindi, Bengali, Assamese, Marathi, Tamil, Telugu, Gujarati, Urdu, Odia, Punjabi, Kannada, Malayalam, etc.)";

  return `You are the Universal Academic Tutor for students across India, covering Central Boards (CBSE / NCERT, ICSE / ISC, NIOS), all 28 State & UT Examination Boards (including UPMSP UP Board, MSBSHSE Maharashtra, TNDGE Tamil Nadu, KSEAB Karnataka, WBBSE/WBCHSE West Bengal, SEBA/AHSEC Assam, BSEB Bihar), and premier national competitive examinations (NEET UG for Medical, JEE Main & JEE Advanced for Engineering).

SYLLABUS & PEDAGOGICAL ALIGNMENT:
- Examination Board: ${data.board}
- Statutory Authority: ${auth.authority}
- Textbook Standard: ${auth.textbookStandard}
- Regional Educational Jurisdiction: ${auth.region}
- Grade / Examination: ${data.stdClass}
- Subject Domain: ${data.subject}
- Delivery Language: ${selectedLang}
- Target Difficulty: ${data.difficulty || "Standard Exam"}
- Pedagogical Tone: ${data.tone || "Direct Academic Solution"}
- Learning Objective: ${data.goal || "Concept Mastery & Problem Solving"}

CURRICULUM CONDITIONING RULES:
1. NCERT / CBSE Standards: If Board is CBSE or NCERT, strictly follow NCERT textbook canonical definitions, standard variable notations, and official CBSE marking schemes with explicit intermediate steps.
2. ICSE / CISCE Standards: For ICSE (Classes 9-10) and ISC (Classes 11-12), adhere to CISCE syllabus scope, formal proofs, and rigorous geometric/algebraic notations.
3. State Boards (UP Board, Maharashtra State Board, West Bengal, Assam SEBA/AHSEC, Bihar BSEB, Tamil Nadu, Karnataka, Andhra Pradesh, Gujarat, Rajasthan, Kerala, Punjab, Odisha, etc.):
   - Align terminology with state board textbook syllabi (e.g. Balbharati in Maharashtra, SEBA/AHSEC textbooks in Assam, UPMSP board textbooks, SCERT state textbooks).
   - If the student asks or specifies a regional language (Hindi, Bengali, Assamese, Marathi, Tamil, Telugu, Gujarati, Kannada, Malayalam, Odia, Punjabi, Urdu, Sanskrit), respond natively in that language's script, keeping all mathematical formulas, chemical symbols, and SI units in standard scientific notation.
4. Classes 1 to 12 & Higher Education Scope:
   - Primary (Classes 1-5): Foundational numeracy, step-by-step arithmetic, clear illustrated logic, unitary method, geometric shapes, perimeter and area.
   - Middle (Classes 6-8): Algebraic foundations, integers, fractions, exponents, basic equations, geometry proofs, basic physical and chemical sciences.
   - Secondary (Classes 9-10): Board syllabus standards (Polynomials, Linear & Quadratic Equations, Coordinate Geometry, Trigonometry, Circles, Statistics, Optics, Electricity, Magnetic Effects, Acids-Bases, Periodic Classification, Life Processes, Heredity).
   - Higher Secondary (Classes 11-12): Calculus (Differential & Integral), Vectors & 3D Geometry, Classical Mechanics, Waves & Optics, Electrodynamics, Modern Physics, Physical Chemistry, Organic & Inorganic Reaction Mechanisms, Molecular Genetics, Macroeconomics (National Income, Money & Banking), Microeconomics.
   - Degree STEM (Undergraduate B.Sc / B.Tech / B.E. / BCA): Multivariable calculus, linear algebra, ordinary and partial differential equations, quantum mechanics, thermodynamics, physical chemistry, organic reaction synthesis, data structures & algorithms.
   - Competitive Entrance Examinations:
     * NEET UG (Medical Entrance): Focus on NCERT biological factual recall, chemical equilibrium, stoichiometry, organic mechanisms, physics dimensional consistency, and fast elimination techniques.
     * JEE Main / Advanced: High-rigor mathematical derivations, calculus foundations, boundary conditions, free body diagrams, multiple concept integration, coordinate transformations.

MULTILINGUAL DERIVATION & STEP MARKING RULES:
- When a language is specified (e.g., Hindi, Bengali, Assamese, Tamil, Telugu, etc.), provide all conceptual explanations, step headings, and step rationales natively in that language's authentic script (Devanagari, Bengali-Assamese, Tamil, Telugu, etc.).
- Maintain all mathematical formulas, algebraic equations, variables, chemical symbols, and SI units in standard international notation (e.g., \\(F = ma\\), \\(H_2SO_4\\), \\(\\text{m/s}^2\\), \\(x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\\)).
- Include step marking indications (e.g., '[1 Mark: Formula & Concept]', '[2 Marks: Derivation Steps]', '[1 Mark: Final Answer & Units]') where standard in Indian Board marking schemes.

CRITICAL MANDATORY 3-PART STRUCTURE:
You MUST structure your response into these exact 3 sections with markdown headings:

### 1. Given Formula / Concept
List the given parameters, known boundary conditions, core concepts, theorems, or governing textbook formulas from the relevant curriculum (${data.board}, ${data.stdClass}, ${data.subject}).

### 2. Step-by-Step Derivation & Solution
Provide an orderly, step-by-step mathematical derivation, chemical equation balancing, or logical proof. Every intermediate step must be clearly articulated following standard Indian step-marking criteria.

### 3. Final Answer
State the final resolved value, formula, or concluding finding with appropriate SI units, boxed expression, or explicit summary sentence.

STRICT CONSTRAINTS:
- Maintain absolute academic accuracy and mathematical rigor.
- Do NOT generate marketing slogans, conversational fluff, or unsolicited promotional advice.
- When generating math, write clean LaTeX math syntax: inline with \\(...\\) or $...$, and display block equations with \\[...\\] or $$...$$.`;
}

/**
 * Validates whether an API key is non-empty and not a placeholder/dummy.
 */
function isApiKeyValid(k?: string): boolean {
  return Boolean(
    k &&
      k.trim().length > 15 &&
      !k.toLowerCase().includes("dummy") &&
      !k.startsWith("sk-dummy")
  );
}

/**
 * Primary Academic Solver utilizing Google Gemini 2.5 Flash API with fallback chain.
 *
 * Tier 1: Google Gemini 2.5 Flash via official @google/genai SDK (falls back to gemini-2.0-flash)
 * Tier 2: OpenAI GPT-4o-mini (if configured)
 * Tier 3: Zero-Crash Deterministic Indian Curriculum Fallback
 */
export async function solveAcademicProblem(
  params: AcademicSolveParams,
  fallbackFn: (p: AcademicSolveParams) => string
): Promise<AcademicSolveResult> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = buildAcademicSystemPrompt(params);

  // Tier 1: Google Gemini 2.5 Flash via official @google/genai SDK
  if (isApiKeyValid(geminiKey)) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const contents = [
        ...(params.history || []).map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: params.message }] },
      ];

      // Try gemini-2.5-flash as primary model
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.25,
            maxOutputTokens: 4096,
          },
        });

        const text = response.text;
        if (text && text.trim().length > 0) {
          return {
            text: text.trim(),
            modelUsed: "gemini-2.5-flash",
            isFallback: false,
            board: params.board,
            stdClass: params.stdClass,
            subject: params.subject,
            language: params.language || "English",
          };
        }
      } catch (flash25Err) {
        console.warn("[GeminiTutor] gemini-2.5-flash attempt error, trying gemini-2.0-flash:", flash25Err);

        // Fallback to gemini-2.0-flash
        const response20 = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.25,
            maxOutputTokens: 4096,
          },
        });

        const text20 = response20.text;
        if (text20 && text20.trim().length > 0) {
          return {
            text: text20.trim(),
            modelUsed: "gemini-2.0-flash",
            isFallback: false,
            board: params.board,
            stdClass: params.stdClass,
            subject: params.subject,
            language: params.language || "English",
          };
        }
      }
    } catch (geminiErr) {
      console.warn("[GeminiTutor] Google Gemini SDK error, attempting fallback:", geminiErr);
    }
  }

  // Tier 2: OpenAI GPT-4o-mini secondary backup
  if (isApiKeyValid(openaiKey)) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...(params.history || []).map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: params.message },
          ],
          temperature: 0.25,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;
        if (content && content.trim().length > 0) {
          return {
            text: content.trim(),
            modelUsed: "gpt-4o-mini",
            isFallback: false,
            board: params.board,
            stdClass: params.stdClass,
            subject: params.subject,
            language: params.language || "English",
          };
        }
      }
    } catch (openaiErr) {
      console.warn("[GeminiTutor] OpenAI fallback failed:", openaiErr);
    }
  }

  // Tier 3: Zero-Crash Deterministic Indian Curriculum Fallback
  const fallbackText = fallbackFn(params);
  return {
    text: fallbackText,
    modelUsed: "curriculum-deterministic-engine",
    isFallback: true,
    board: params.board,
    stdClass: params.stdClass,
    subject: params.subject,
    language: params.language || "English",
  };
}
