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
  "General Science (Classes 1-8)",
  "Environmental Studies / EVS",
  "Computer Science & Informatics",
  "English Language & Literature",
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

export interface AcademicSolutionCardProps {
  solutionText: string;
  billingStatus?: {
    billed?: boolean;
    amountPaise?: number;
    remainingBalancePaise?: number;
    note?: string;
  };
}

export function AcademicSolutionCard({
  solutionText,
  billingStatus,
}: AcademicSolutionCardProps) {
  const parsed = parseStructuredAcademicSolution(solutionText);

  if (parsed.formula || parsed.derivation || parsed.finalAnswer) {
    return (
      <div className="space-y-3.5 my-2 w-full text-left font-sans">
        {parsed.formula && (
          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-sky-400 font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-md bg-sky-500/20 text-sky-300 text-[11px] font-black">
                  1
                </span>
                <span>Given Formula / Concept</span>
              </div>
              <span className="text-[10px] text-sky-400/70 font-semibold lowercase tracking-normal">
                curriculum baseline
              </span>
            </div>
            <div className="text-xs sm:text-[13px] text-slate-200 whitespace-pre-wrap leading-relaxed pl-7 font-sans">
              {parsed.formula}
            </div>
          </div>
        )}

        {parsed.derivation && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-purple-300 font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-md bg-purple-500/20 text-purple-300 text-[11px] font-black">
                  2
                </span>
                <span>Step-by-Step Derivation &amp; Solution</span>
              </div>
              <span className="text-[10px] text-purple-300/70 font-semibold lowercase tracking-normal">
                board marking benchmark
              </span>
            </div>
            <div className="text-xs sm:text-[13px] text-slate-200 whitespace-pre-wrap leading-relaxed pl-7 font-sans">
              {parsed.derivation}
            </div>
          </div>
        )}

        {parsed.finalAnswer && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-black">
                  3
                </span>
                <span>Final Answer</span>
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono lowercase tracking-normal font-bold">
                SI units verified
              </span>
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-emerald-200 whitespace-pre-wrap leading-relaxed pl-7 font-sans">
              {parsed.finalAnswer}
            </div>
          </div>
        )}

        {billingStatus && (
          <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-400 px-1 border-t border-zinc-800/60">
            <div className="flex items-center gap-1.5">
              {billingStatus.billed ? (
                <>
                  <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-emerald-400">
                    ⚡ KingPay Micro-Transaction Settled (₹{(billingStatus.amountPaise ?? 100) / 100})
                  </span>
                  {typeof billingStatus.remainingBalancePaise === "number" && (
                    <span className="text-zinc-500 font-mono">
                      · Balance: ₹{(billingStatus.remainingBalancePaise / 100).toFixed(2)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-block size-1.5 rounded-full bg-amber-400" />
                  <span className="text-zinc-300">
                    {billingStatus.note || "Complimentary Session"}
                  </span>
                </>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
              Instant AI Tutor
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-xs sm:text-[13px] text-zinc-200 whitespace-pre-wrap leading-relaxed w-full font-sans text-left">
      {solutionText}
      {billingStatus && (
        <div className="mt-3 pt-2 flex items-center gap-1.5 text-[11px] text-zinc-400 border-t border-zinc-800">
          <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
          <span className="font-medium text-zinc-300">
            {billingStatus.note || (billingStatus.billed ? "KingPay Settled" : "Complimentary Session")}
          </span>
        </div>
      )}
    </div>
  );
}
