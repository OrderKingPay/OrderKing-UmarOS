import * as fs from "node:fs/promises";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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
  const name = typeof input === "string" ? input.trim() : "orderking-customers--orders-";
  if (!ORDER_KING_REPOS.includes(name as AllowedRepo)) {
    throw new Error(`Repository '${name}' is not in the Order King ecosystem allowlist`);
  }
  return name as AllowedRepo;
}

export function resolveRepoPath(repoName: AllowedRepo): string {
  const currentDir = process.cwd();
  const parentSideBySide = path.resolve(currentDir, "..", repoName);
  const childSubdir = path.resolve(currentDir, repoName);
  const standardWorkspace = path.resolve("C:\\Users\\hasan\\OrderKing", repoName);

  if (path.basename(currentDir).toLowerCase() === repoName.toLowerCase()) {
    return currentDir;
  }
  
  return parentSideBySide;
}

function safeRelativePath(rawPath: string): string {
  const normalized = rawPath.replace(/\\/g, "/").trim().replace(/^\/+/, "");
  if (normalized.includes("..")) {
    throw new Error("Path traversal with '..' is not allowed");
  }
  return normalized;
}

export async function getLocalRepoStatus(repo: unknown) {
  const validRepo = validateRepo(repo);
  const repoDir = resolveRepoPath(validRepo);

  let branch = "unknown";
  let clean = true;
  let changedFiles: string[] = [];
  let exists = false;

  try {
    const stat = await fs.stat(repoDir);
    exists = stat.isDirectory();
  } catch {
    exists = false;
  }

  if (exists) {
    try {
      const { stdout: branchOut } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
        cwd: repoDir,
      });
      branch = branchOut.trim();

      const { stdout: statusOut } = await execFileAsync("git", ["status", "--porcelain"], {
        cwd: repoDir,
      });
      const lines = statusOut.split("\n").map((l) => l.trim()).filter(Boolean);
      clean = lines.length === 0;
      changedFiles = lines.slice(0, 50);
    } catch {
      // Git command may fail if git is unavailable in environment
    }
  }

  return {
    repo: validRepo,
    path: repoDir,
    existsOnDisk: exists,
    branch,
    isClean: clean,
    changedFiles,
  };
}

export async function getLocalRecentCommits(repo: unknown, limit = 10) {
  const validRepo = validateRepo(repo);
  const repoDir = resolveRepoPath(validRepo);
  const boundedLimit = Math.min(50, Math.max(1, limit));

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", `-${boundedLimit}`, "--pretty=format:%H%x09%an%x09%ad%x09%s", "--date=short"],
      { cwd: repoDir }
    );

    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sha, author, date, message] = line.split("\t");
        return { sha, author, date, message, repo: validRepo };
      });
  } catch {
    return [];
  }
}

export async function inspectLocalFile(repo: unknown, filePath: unknown, maxLines = 1000) {
  const validRepo = validateRepo(repo);
  if (typeof filePath !== "string" || !filePath.trim()) {
    throw new Error("File path is required for file inspection");
  }
  const cleanPath = safeRelativePath(filePath);
  const repoDir = resolveRepoPath(validRepo);
  const fullPath = path.resolve(repoDir, cleanPath);

  if (!fullPath.startsWith(path.resolve(repoDir))) {
    throw new Error("Access denied: path is outside repository root");
  }

  const content = await fs.readFile(fullPath, "utf-8");
  const lines = content.split("\n");
  const truncated = lines.length > maxLines;
  const sliced = lines.slice(0, maxLines).join("\n");

  return {
    repo: validRepo,
    path: cleanPath,
    totalLines: lines.length,
    truncated,
    content: sliced,
  };
}

export async function listLocalFiles(repo: unknown, subDir = "", maxDepth = 4) {
  const validRepo = validateRepo(repo);
  const repoDir = resolveRepoPath(validRepo);
  const startDir = path.resolve(repoDir, safeRelativePath(subDir));

  const ignoreSet = new Set([
    "node_modules",
    ".git",
    ".grok",
    ".vercel",
    ".next",
    "dist",
    "build",
    "artifacts",
    "coverage",
  ]);

  const results: Array<{ path: string; isDir: boolean; sizeBytes?: number }> = [];

  async function walk(dir: string, currentDepth: number) {
    if (currentDepth > maxDepth || results.length >= 200) return;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (ignoreSet.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        const rel = path.relative(repoDir, full).replace(/\\/g, "/");
        if (entry.isDirectory()) {
          results.push({ path: rel, isDir: true });
          await walk(full, currentDepth + 1);
        } else if (entry.isFile()) {
          let size: number | undefined;
          try {
            const st = await fs.stat(full);
            size = st.size;
          } catch {
            // ignore stat failure
          }
          results.push({ path: rel, isDir: false, sizeBytes: size });
        }
      }
    } catch {
      // ignore unreadable dirs
    }
  }

  await walk(startDir, 1);
  return { repo: validRepo, base: subDir, entries: results };
}

export async function searchLocalCode(query: unknown, repo?: unknown, maxResults = 30) {
  if (typeof query !== "string" || !query.trim()) {
    throw new Error("Search query is required");
  }
  const searchQuery = query.trim();
  const targetRepos: AllowedRepo[] = repo ? [validateRepo(repo)] : [...ORDER_KING_REPOS];
  const matches: Array<{ repo: AllowedRepo; file: string; line: number; text: string }> = [];

  for (const r of targetRepos) {
    const repoDir = resolveRepoPath(r);
    try {
      const filesInfo = await listLocalFiles(r, "", 4);
      const codeFiles = filesInfo.entries.filter(
        (e) => !e.isDir && /\.(ts|tsx|js|mjs|json|sql|md)$/.test(e.path)
      );

      for (const file of codeFiles) {
        if (matches.length >= maxResults) break;
        const full = path.resolve(repoDir, file.path);
        try {
          const content = await fs.readFile(full, "utf-8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(searchQuery.toLowerCase())) {
              matches.push({
                repo: r,
                file: file.path,
                line: i + 1,
                text: lines[i].trim().slice(0, 200),
              });
              if (matches.length >= maxResults) break;
            }
          }
        } catch {
          // skip file on read error
        }
      }
    } catch {
      // skip repo on walk error
    }
  }

  return { query: searchQuery, totalMatches: matches.length, matches };
}
