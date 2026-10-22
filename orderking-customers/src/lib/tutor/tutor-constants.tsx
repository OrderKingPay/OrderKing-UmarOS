import React from "react";

export interface AdvancedMathModule {
  id: string;
  name: string;
  category: string;
  subtopics: readonly string[];
}

export const ALL_INDIAN_BOARDS = [
  // Central Boards
  "CBSE (Central Board)",
  "ICSE / ISC (CISCE)",
  "NIOS (National Institute of Open Schooling)",
  // Key State Boards
  "SEBA (Assam Class 10)",
  "AHSEC (Assam Class 12)",
  "UP Board (UPMSP)",
  "Bihar Board (BSEB)",
  "Maharashtra State Board (MSBSHSE)",
  "West Bengal (WBBSE/WBCHSE)",
  // All 28 States & UTs
  "Andhra Pradesh Board (BIEAP/BSEAP)",
  "Arunachal Pradesh Board",
  "Chhattisgarh Board (CGBSE)",
  "Goa Board (GBSHSE)",
  "Gujarat Board (GSEB)",
  "Haryana Board (BSEH)",
  "Himachal Pradesh Board (HPBOSE)",
  "Jharkhand Academic Council (JAC)",
  "Karnataka Board (KSEAB)",
  "Kerala Board (DHSE/KBPE)",
  "Madhya Pradesh Board (MPBSE)",
  "Manipur Board (BOSEM/COHSEM)",
  "Meghalaya Board (MBOSE)",
  "Mizoram Board (MBSE)",
  "Nagaland Board (NBSE)",
  "Odisha Board (BSE/CHSE)",
  "Punjab Board (PSEB)",
  "Rajasthan Board (RBSE)",
  "Sikkim Board",
  "Tamil Nadu State Board (TNDGE)",
  "Telangana Board (TSBIE/BSE)",
  "Tripura Board (TBSE)",
  "Uttarakhand Board (UBSE)",
  "Jammu & Kashmir Board (JKBOSE)",
  "Other State Boards",
] as const;

export const STATE_BOARDS = ALL_INDIAN_BOARDS;

export const CORE_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Accountancy",
  "Economics",
  "Business Studies",
  "Political Science",
  "History",
] as const;

export const CLASS_LEVELS = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "NEET UG (Medical Entrance)",
  "JEE Main & Advanced (Engineering)",
  "Degree STEM",
] as const;

export function parseStructuredAcademicSolution(rawText: string) {
  const formulaMatch = rawText.match(/(?:###?\s*(?:1\.?\s*)?Given Formula \/ Concept|\*\*1\.?\s*Given Formula \/ Concept\*\*|Given Formula \/ Concept:?)([\s\S]*?)(?=(?:###?\s*(?:2\.?\s*)?Step-by-Step Derivation & Solution|\*\*2\.?\s*Step-by-Step Derivation & Solution\*\*|Step-by-Step Derivation & Solution:?)|$)/i);
  const derivationMatch = rawText.match(/(?:###?\s*(?:2\.?\s*)?Step-by-Step Derivation & Solution|\*\*2\.?\s*Step-by-Step Derivation & Solution\*\*|Step-by-Step Derivation & Solution:?)([\s\S]*?)(?=(?:###?\s*(?:3\.?\s*)?Final Answer|\*\*3\.?\s*Final Answer\*\*|Final Answer:?)|$)/i);
  const finalAnswerMatch = rawText.match(/(?:###?\s*(?:3\.?\s*)?Final Answer|\*\*3\.?\s*Final Answer\*\*|Final Answer:?)([\s\S]*$)/i);

  if (formulaMatch || derivationMatch || finalAnswerMatch) {
    return {
      formula: formulaMatch ? formulaMatch[1].trim() : null,
      derivation: derivationMatch ? derivationMatch[1].trim() : null,
      finalAnswer: finalAnswerMatch ? finalAnswerMatch[1].trim() : null,
      raw: rawText,
    };
  }
  return {
    formula: null,
    derivation: null,
    finalAnswer: null,
    raw: rawText,
  };
}

export function AcademicSolutionCard({ solutionText }: { solutionText: string }) {
  const parsed = parseStructuredAcademicSolution(solutionText);

  if (parsed.formula || parsed.derivation || parsed.finalAnswer) {
    return (
      <div className="space-y-3.5 my-2 w-full text-left">
        {parsed.formula && (
          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <span className="flex size-5 items-center justify-center rounded-md bg-sky-500/20 text-sky-300 text-[11px] font-black">
                1
              </span>
              <span>Given Formula / Concept</span>
            </div>
            <div className="text-xs sm:text-[13px] text-slate-200 whitespace-pre-wrap leading-relaxed pl-7 font-sans">
              {parsed.formula}
            </div>
          </div>
        )}

        {parsed.derivation && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
              <span className="flex size-5 items-center justify-center rounded-md bg-purple-500/20 text-purple-300 text-[11px] font-black">
                2
              </span>
              <span>Step-by-Step Derivation &amp; Solution</span>
            </div>
            <div className="text-xs sm:text-[13px] text-slate-200 whitespace-pre-wrap leading-relaxed pl-7 font-sans">
              {parsed.derivation}
            </div>
          </div>
        )}

        {parsed.finalAnswer && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-black">
                3
              </span>
              <span>Final Answer with SI Units</span>
            </div>
            <div className="text-xs sm:text-[13px] text-emerald-200 whitespace-pre-wrap leading-relaxed pl-7 font-mono font-medium">
              {parsed.finalAnswer}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2 text-left my-2 shadow-sm">
      <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">Academic Solution</div>
      <div className="text-xs sm:text-[13px] text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
        {solutionText}
      </div>
    </div>
  );
}
