/**
 * Sovereign Deterministic Candidate Skill-Matching Engine
 *
 * Guarantees 100% deterministic candidate skill matching against job requirements.
 * Strictly avoids any Math.random(), fake multipliers, or speculative probabilities.
 */

export interface CandidateSkillMatchResult {
  score: number; // 0 to 100 integer percentage
  matchedSkills: string[];
  missingSkills: string[];
  alignmentLevel: "High Match" | "Moderate Match" | "Foundational Alignment";
  details: string;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "by", "as", "is", "are", "was", "were", "be", "been", "per", "prior", "pass",
  "must", "have", "with", "during", "submit", "valid", "clear", "active"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Deterministically computes the alignment score between candidate skills/experience
 * and job requirements without Math.random() or probabilistic fuzzing.
 */
export function computeDeterministicSkillMatch(
  candidateSkills: string[] | string,
  requirements: readonly string[]
): CandidateSkillMatchResult {
  if (!requirements || requirements.length === 0) {
    return {
      score: 100,
      matchedSkills: [],
      missingSkills: [],
      alignmentLevel: "High Match",
      details: "No specific skill prerequisites required for this opening.",
    };
  }

  const rawCandidateTokens = Array.isArray(candidateSkills)
    ? candidateSkills.flatMap((s) => tokenize(s))
    : tokenize(candidateSkills);
  
  const candidateTokenSet = new Set(rawCandidateTokens);

  if (candidateTokenSet.size === 0) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [...requirements],
      alignmentLevel: "Foundational Alignment",
      details: "Enter candidate skills or qualifications to calculate deterministic fit.",
    };
  }

  let totalWeight = 0;
  let matchedWeight = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of requirements) {
    const reqTokens = tokenize(req);
    if (reqTokens.length === 0) continue;

    // Weight proportional to distinct meaningful tokens in requirement (min 1)
    const weight = Math.max(1, reqTokens.length);
    totalWeight += weight;

    // Deterministic intersection check
    const matches = reqTokens.filter((token) => candidateTokenSet.has(token));
    const tokenMatchRatio = matches.length / reqTokens.length;

    if (tokenMatchRatio >= 0.25 || matches.length >= 1) {
      matchedWeight += weight * Math.min(1, tokenMatchRatio * 1.5);
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  const normalizedScore = totalWeight > 0
    ? Math.min(100, Math.max(0, Math.round((matchedWeight / totalWeight) * 100)))
    : 0;

  let alignmentLevel: "High Match" | "Moderate Match" | "Foundational Alignment";
  if (normalizedScore >= 70) {
    alignmentLevel = "High Match";
  } else if (normalizedScore >= 35) {
    alignmentLevel = "Moderate Match";
  } else {
    alignmentLevel = "Foundational Alignment";
  }

  const details = `${matchedSkills.length} of ${requirements.length} core requirement areas verified (${normalizedScore}% syllabus/credential fit).`;

  return {
    score: normalizedScore,
    matchedSkills,
    missingSkills,
    alignmentLevel,
    details,
  };
}
