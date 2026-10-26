/**
 * Deterministic skill matching calculation.
 * Compares candidate input skills against required job skills.
 */
export interface SkillMatchResult {
  score: number;
  matchedCount: number;
  totalRequirements: number;
  details: string;
  alignmentLevel: "High Match" | "Moderate Match" | "Low Match";
}

export function computeDeterministicSkillMatch(
  candidateSkillsInput: string,
  requirements: string[] | string | readonly string[]
): SkillMatchResult {
  const reqList: readonly string[] = Array.isArray(requirements)
    ? requirements
    : typeof requirements === "string"
      ? requirements.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
      : [];

  if (reqList.length === 0) {
    return {
      score: 100,
      matchedCount: 0,
      totalRequirements: 0,
      details: "No specific skill prerequisites required for this position.",
      alignmentLevel: "High Match",
    };
  }

  const candidateTokens = candidateSkillsInput
    .toLowerCase()
    .split(/[,;\n\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  if (candidateTokens.length === 0) {
    return {
      score: 0,
      matchedCount: 0,
      totalRequirements: reqList.length,
      details: "Enter your skills or experience to evaluate requirement alignment.",
      alignmentLevel: "Low Match",
    };
  }

  let matched = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of reqList) {
    const reqClean = req.toLowerCase().trim();
    const isMatched = candidateTokens.some(
      (token) => reqClean.includes(token) || token.includes(reqClean)
    );
    if (isMatched) {
      matched++;
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  const score = Math.round((matched / reqList.length) * 100);
  const alignmentLevel =
    score >= 75 ? "High Match" : score >= 40 ? "Moderate Match" : "Low Match";

  let details = "";
  if (matched === reqList.length) {
    details = `100% matched: All ${matched} key requirements verified.`;
  } else if (matched > 0) {
    details = `Matched ${matched} of ${reqList.length} requirements (${matchedSkills.slice(0, 3).join(", ")}). Missing: ${missingSkills.slice(0, 2).join(", ")}.`;
  } else {
    details = `0 of ${reqList.length} requirements matched directly. Consider updating your skills profile.`;
  }

  return {
    score,
    matchedCount: matched,
    totalRequirements: reqList.length,
    details,
    alignmentLevel,
  };
}
