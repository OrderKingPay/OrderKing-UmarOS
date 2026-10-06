export type AllowedRepo =
  | "HDmaster"
  | "orderking-customers--orders-"
  | "OrderKing-partners"
  | "orderking-riders"
  | "Apps-integration-";

export const ORDER_KING_REPOS: readonly AllowedRepo[] = [
  "HDmaster",
  "orderking-customers--orders-",
  "OrderKing-partners",
  "orderking-riders",
  "Apps-integration-",
] as const;

export function validateRepo(input?: unknown): AllowedRepo {
  return "orderking-customers--orders-";
}

export function resolveRepoPath(repoName: AllowedRepo): string {
  return "/";
}

export async function getLocalRepoStatus(repo: unknown) {
  return { repo: validateRepo(repo), path: "/", existsOnDisk: false, branch: "unknown", isClean: true, changedFiles: [] };
}

export async function getLocalRecentCommits(repo: unknown, limit = 10) {
  return [];
}

export async function inspectLocalFile(repo: unknown, filePath: unknown, maxLines = 1000) {
  return { repo: validateRepo(repo), path: String(filePath), totalLines: 0, truncated: false, content: "File inspection disabled in Edge environment" };
}

export async function listLocalFiles(repo: unknown, subDir = "", maxDepth = 4) {
  return { repo: validateRepo(repo), base: subDir, entries: [] };
}

export async function searchLocalCode(query: unknown, repo?: unknown, maxResults = 30) {
  return { query: String(query), totalMatches: 0, matches: [] };
}

export async function applyLocalPatch(repo: unknown, filePath: unknown, content: unknown) {
  throw new Error("File modification disabled in Edge environment");
}

export async function executeShellCommand(cmd: unknown, repo?: unknown) {
  throw new Error("Shell execution disabled in Edge environment");
}
