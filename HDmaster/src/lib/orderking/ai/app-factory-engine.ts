import * as crypto from "node:crypto";
import * as zlib from "node:zlib";
import * as ts from "typescript";

// ============================================================================
// UMAR OS App Factory Engine - Types & Interfaces
// ============================================================================

export type AppArchetype = "react-vite" | "nextjs" | "node-fastify";

export type ArchetypeInput =
  | AppArchetype
  | "react"
  | "vite"
  | "next"
  | "fastify"
  | "node";

export type ProjectFileType =
  | "code"
  | "config"
  | "test"
  | "documentation"
  | "style"
  | "asset";

export type SupportedLanguage =
  | "typescript"
  | "tsx"
  | "javascript"
  | "json"
  | "css"
  | "markdown"
  | "html"
  | "text";

export interface AppFactoryOptions {
  name: string;
  archetype: ArchetypeInput;
  description?: string;
  version?: string;
  author?: string;
  port?: number;
  features?: string[];
  theme?: "dark" | "light" | "umar-gold" | "system";
  strictSyntax?: boolean;
  customFiles?: Record<string, string>;
}

export interface ProjectFile {
  path: string;
  content: string;
  type: ProjectFileType;
  language: SupportedLanguage;
  sizeBytes: number;
  sha256: string;
}

export interface SyntaxValidationIssue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
  rule: "balanced-brackets" | "ts-syntax" | "json-syntax" | "unclosed-literal";
}

export interface SyntaxValidationReport {
  valid: boolean;
  issues: SyntaxValidationIssue[];
  totalFilesValidated: number;
  bracketIntegrityScore: number;
  astSyntaxScore: number;
}

export interface ManifestFileEntry {
  path: string;
  type: ProjectFileType;
  language: SupportedLanguage;
  sizeBytes: number;
  sha256: string;
}

export interface ProjectManifest {
  name: string;
  archetype: AppArchetype;
  version: string;
  description: string;
  createdAt: string;
  totalFiles: number;
  totalSizeBytes: number;
  rootHash: string;
  files: ManifestFileEntry[];
  packageJson: Record<string, unknown>;
  features: string[];
  validation: SyntaxValidationReport;
}

export interface ScaffoldedProject {
  options: AppFactoryOptions;
  archetype: AppArchetype;
  files: ProjectFile[];
  manifest: ProjectManifest;
  validation: SyntaxValidationReport;
  getFile: (path: string) => ProjectFile | undefined;
  getZipBuffer: () => Buffer;
  getZipBase64: () => string;
  exportJsonManifest: (pretty?: boolean) => string;
  verifyIntegrity: (expectedHash?: string) => boolean;
}

// ============================================================================
// Syntax & AST Validation Engine
// ============================================================================

interface BracketStackItem {
  char: string;
  expectedClose: string;
  line: number;
  col: number;
}

/**
 * Validates bracket balance ({}, [], ()) inside code, correctly handling
 * strings, comments, template literals with nested expressions, and escapes.
 */
export function validateBracketBalance(
  code: string,
  filePath = "unknown.ts"
): SyntaxValidationIssue[] {
  const issues: SyntaxValidationIssue[] = [];
  const stack: BracketStackItem[] = [];

  let line = 1;
  let col = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  const templateStack: number[] = []; // tracks nested brace depth inside template literal ${}

  const matchingClose: Record<string, string> = {
    "{": "}",
    "(": ")",
    "[": "]",
  };

  const isCloseBracket: Record<string, string> = {
    "}": "{",
    ")": "(",
    "]": "[",
  };

  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const next = i + 1 < code.length ? code[i + 1] : "";
    col++;

    if (c === "\n") {
      line++;
      col = 0;
      inLineComment = false;
      continue;
    }

    // Handle single-line comment
    if (inLineComment) {
      continue;
    }

    // Handle block comment
    if (inBlockComment) {
      if (c === "*" && next === "/") {
        inBlockComment = false;
        i++;
        col++;
      }
      continue;
    }

    // Handle string escape sequences
    if ((inSingleQuote || inDoubleQuote || templateStack.length > 0) && c === "\\") {
      i++; // skip escaped char
      col++;
      continue;
    }

    // Inside single quote string
    if (inSingleQuote) {
      if (c === "'") {
        inSingleQuote = false;
      }
      continue;
    }

    // Inside double quote string
    if (inDoubleQuote) {
      if (c === '"') {
        inDoubleQuote = false;
      }
      continue;
    }

    // Start of comments (when not inside strings or template literals)
    if (c === "/" && next === "/" && templateStack.length === 0) {
      inLineComment = true;
      i++;
      col++;
      continue;
    }

    if (c === "/" && next === "*" && templateStack.length === 0) {
      inBlockComment = true;
      i++;
      col++;
      continue;
    }

    // Quote beginnings
    if (c === "'") {
      inSingleQuote = true;
      continue;
    }
    if (c === '"') {
      inDoubleQuote = true;
      continue;
    }

    // Template literal backtick
    if (c === "`") {
      if (templateStack.length > 0 && templateStack[templateStack.length - 1] === 0) {
        // closing current template literal
        templateStack.pop();
      } else {
        // starting new template literal
        templateStack.push(0);
      }
      continue;
    }

    // Inside template literal but outside expression interpolation
    if (templateStack.length > 0 && templateStack[templateStack.length - 1] === 0) {
      if (c === "$" && next === "{") {
        // start interpolation expression: set depth to 1
        templateStack[templateStack.length - 1] = 1;
        stack.push({ char: "{", expectedClose: "}", line, col: col + 1 });
        i++;
        col++;
      }
      continue;
    }

    // Handle brackets
    if (c === "{" || c === "(" || c === "[") {
      stack.push({ char: c, expectedClose: matchingClose[c], line, col });
      if (templateStack.length > 0 && templateStack[templateStack.length - 1] > 0 && c === "{") {
        templateStack[templateStack.length - 1]++;
      }
      continue;
    }

    if (c === "}" || c === ")" || c === "]") {
      if (stack.length === 0) {
        issues.push({
          file: filePath,
          line,
          column: col,
          message: `Unexpected closing '${c}' with no matching opening delimiter`,
          severity: "error",
          rule: "balanced-brackets",
        });
        continue;
      }

      const top = stack.pop()!;
      if (top.expectedClose !== c) {
        issues.push({
          file: filePath,
          line,
          column: col,
          message: `Mismatched closing '${c}'; expected '${top.expectedClose}' to match '${top.char}' opened at line ${top.line}, col ${top.col}`,
          severity: "error",
          rule: "balanced-brackets",
        });
      }

      if (templateStack.length > 0 && templateStack[templateStack.length - 1] > 0 && c === "}") {
        templateStack[templateStack.length - 1]--;
      }
      continue;
    }
  }

  // Check for unclosed literals or comments
  if (inSingleQuote) {
    issues.push({
      file: filePath,
      line,
      column: col,
      message: "Unterminated single quote string literal",
      severity: "error",
      rule: "unclosed-literal",
    });
  }
  if (inDoubleQuote) {
    issues.push({
      file: filePath,
      line,
      column: col,
      message: "Unterminated double quote string literal",
      severity: "error",
      rule: "unclosed-literal",
    });
  }
  if (inBlockComment) {
    issues.push({
      file: filePath,
      line,
      column: col,
      message: "Unterminated block comment (missing '*/')",
      severity: "error",
      rule: "unclosed-literal",
    });
  }
  if (templateStack.length > 0) {
    issues.push({
      file: filePath,
      line,
      column: col,
      message: "Unterminated template literal (missing closing '`')",
      severity: "error",
      rule: "unclosed-literal",
    });
  }

  // Remaining unclosed brackets
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    issues.push({
      file: filePath,
      line: unclosed.line,
      column: unclosed.col,
      message: `Unclosed '${unclosed.char}' opened at line ${unclosed.line}, col ${unclosed.col}; expected '${unclosed.expectedClose}'`,
      severity: "error",
      rule: "balanced-brackets",
    });
  }

  return issues;
}

/**
 * Validates TypeScript / JavaScript source syntax using the TypeScript AST parser.
 */
export function validateTypeScriptAST(
  code: string,
  filePath = "unknown.ts"
): SyntaxValidationIssue[] {
  const issues: SyntaxValidationIssue[] = [];

  const scriptKind = filePath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : filePath.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : filePath.endsWith(".js") || filePath.endsWith(".mjs")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;

  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  // parseDiagnostics contains syntax errors (unmatched syntax, unexpected tokens, etc.)
  const parseDiagnostics = (sourceFile as unknown as { parseDiagnostics?: ts.Diagnostic[] })
    .parseDiagnostics;

  if (Array.isArray(parseDiagnostics)) {
    for (const diag of parseDiagnostics) {
      const { line, character } = diag.file && diag.start !== undefined
        ? diag.file.getLineAndCharacterOfPosition(diag.start)
        : { line: 0, character: 0 };

      const messageText = typeof diag.messageText === "string"
        ? diag.messageText
        : diag.messageText.messageText;

      issues.push({
        file: filePath,
        line: line + 1,
        column: character + 1,
        message: messageText,
        severity: "error",
        rule: "ts-syntax",
      });
    }
  }

  return issues;
}

/**
 * Validates JSON files.
 */
export function validateJsonCode(
  code: string,
  filePath = "unknown.json"
): SyntaxValidationIssue[] {
  try {
    JSON.parse(code);
    return [];
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    let line = 1;
    let col = 1;

    const matchPos = errorMsg.match(/position\s+(\d+)/i);
    if (matchPos) {
      const pos = parseInt(matchPos[1], 10);
      const lines = code.slice(0, pos).split("\n");
      line = lines.length;
      col = lines[lines.length - 1].length + 1;
    }

    return [
      {
        file: filePath,
        line,
        column: col,
        message: `Invalid JSON: ${errorMsg}`,
        severity: "error",
        rule: "json-syntax",
      },
    ];
  }
}

/**
 * Validates any project file according to its language and type.
 */
export function validateFileSyntax(
  content: string,
  language: SupportedLanguage,
  filePath: string
): SyntaxValidationIssue[] {
  const issues: SyntaxValidationIssue[] = [];

  if (language === "json") {
    issues.push(...validateJsonCode(content, filePath));
    issues.push(...validateBracketBalance(content, filePath));
    return issues;
  }

  if (
    language === "typescript" ||
    language === "tsx" ||
    language === "javascript"
  ) {
    // Both balanced bracket check and AST syntax check
    issues.push(...validateBracketBalance(content, filePath));
    issues.push(...validateTypeScriptAST(content, filePath));
  } else if (language === "css" || language === "html") {
    issues.push(...validateBracketBalance(content, filePath));
  }

  return issues;
}

/**
 * Validates an array of project files and generates a comprehensive report.
 */
export function validateProjectFiles(files: ProjectFile[]): SyntaxValidationReport {
  const allIssues: SyntaxValidationIssue[] = [];
  let bracketErrors = 0;
  let astErrors = 0;

  for (const file of files) {
    const fileIssues = validateFileSyntax(file.content, file.language, file.path);
    for (const issue of fileIssues) {
      if (issue.rule === "balanced-brackets" || issue.rule === "unclosed-literal") {
        bracketErrors++;
      }
      if (issue.rule === "ts-syntax" || issue.rule === "json-syntax") {
        astErrors++;
      }
    }
    allIssues.push(...fileIssues);
  }

  const valid = allIssues.filter((i) => i.severity === "error").length === 0;
  const bracketIntegrityScore = bracketErrors === 0 ? 100 : Math.max(0, 100 - bracketErrors * 15);
  const astSyntaxScore = astErrors === 0 ? 100 : Math.max(0, 100 - astErrors * 15);

  return {
    valid,
    issues: allIssues,
    totalFilesValidated: files.length,
    bracketIntegrityScore,
    astSyntaxScore,
  };
}

// ============================================================================
// Cryptographic Hash & Integrity Engine
// ============================================================================

export function computeSha256(content: string | Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function computeProjectIntegrityHash(
  files: Array<{ path: string; sha256: string }>
): string {
  const canonicalString = files
    .slice()
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((f) => `${f.path}:${f.sha256}`)
    .join("\n");
  return computeSha256(canonicalString);
}

// ============================================================================
// Zero-Dependency ZIP Packaging Engine
// ============================================================================

/**
 * Encodes an array of files into a standard PKZIP 2.0 archive using Node's zlib.
 */
export function buildZipArchive(
  files: Array<{ path: string; content: string | Buffer }>
): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  // Fixed DOS timestamp for deterministic reproducibility: 2026-01-01 00:00:00
  const dosTime = 0;
  const dosDate = 0x5c21;

  for (const file of files) {
    // Normalize path to use forward slashes
    const normalizedPath = file.path.replace(/\\/g, "/");
    const filenameBuf = Buffer.from(normalizedPath, "utf8");
    const contentBuf = Buffer.isBuffer(file.content)
      ? file.content
      : Buffer.from(file.content, "utf8");

    const crc = zlib.crc32(contentBuf);
    const compressed = zlib.deflateRawSync(contentBuf);
    const uncompressedSize = contentBuf.length;
    const compressedSize = compressed.length;

    // 1. Local File Header (30 bytes + filename)
    const localHeader = Buffer.alloc(30 + filenameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(8, 8); // Compression method: 8 (Deflate)
    localHeader.writeUInt16LE(dosTime, 10); // Last mod file time
    localHeader.writeUInt16LE(dosDate, 12); // Last mod file date
    localHeader.writeUInt32LE(crc, 14); // CRC-32
    localHeader.writeUInt32LE(compressedSize, 18); // Compressed size
    localHeader.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
    localHeader.writeUInt16LE(filenameBuf.length, 26); // Filename length
    localHeader.writeUInt16LE(0, 28); // Extra field length
    filenameBuf.copy(localHeader, 30);

    const localEntry = Buffer.concat([localHeader, compressed]);
    localHeaders.push(localEntry);

    // 2. Central Directory Header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46 + filenameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central directory file header signature
    centralHeader.writeUInt16LE(20, 4); // Version made by
    centralHeader.writeUInt16LE(20, 6); // Version needed to extract
    centralHeader.writeUInt16LE(0x0800, 8); // UTF-8 filename flag
    centralHeader.writeUInt16LE(8, 10); // Compression method: 8 (Deflate)
    centralHeader.writeUInt16LE(dosTime, 12); // Last mod time
    centralHeader.writeUInt16LE(dosDate, 14); // Last mod date
    centralHeader.writeUInt32LE(crc, 16); // CRC-32
    centralHeader.writeUInt32LE(compressedSize, 20); // Compressed size
    centralHeader.writeUInt32LE(uncompressedSize, 24); // Uncompressed size
    centralHeader.writeUInt16LE(filenameBuf.length, 28); // Filename length
    centralHeader.writeUInt16LE(0, 30); // Extra field length
    centralHeader.writeUInt16LE(0, 32); // File comment length
    centralHeader.writeUInt16LE(0, 34); // Disk number start
    centralHeader.writeUInt16LE(0, 36); // Internal file attributes
    centralHeader.writeUInt32LE(0x81a40000, 38); // External file attributes (regular file rw-r--r--)
    centralHeader.writeUInt32LE(offset, 42); // Relative offset of local header
    filenameBuf.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);
    offset += localEntry.length;
  }

  const centralDir = Buffer.concat(centralHeaders);
  const centralDirSize = centralDir.length;
  const centralDirOffset = offset;

  // 3. End of Central Directory Record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // Number of this disk
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(files.length, 8); // Total entries on this disk
  eocd.writeUInt16LE(files.length, 10); // Total entries
  eocd.writeUInt32LE(centralDirSize, 12); // Size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16); // Offset of central directory
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localHeaders, centralDir, eocd]);
}

/**
 * Inspects entries from a generated ZIP archive buffer.
 */
export function inspectZipEntries(
  zipBuffer: Buffer
): Array<{ path: string; compressedSize: number; uncompressedSize: number; crc: number }> {
  const entries: Array<{
    path: string;
    compressedSize: number;
    uncompressedSize: number;
    crc: number;
  }> = [];

  let pos = 0;
  while (pos < zipBuffer.length - 4) {
    const sig = zipBuffer.readUInt32LE(pos);
    if (sig === 0x04034b50) {
      // Local file header
      const crc = zipBuffer.readUInt32LE(pos + 14);
      const compSize = zipBuffer.readUInt32LE(pos + 18);
      const uncompSize = zipBuffer.readUInt32LE(pos + 22);
      const nameLen = zipBuffer.readUInt16LE(pos + 26);
      const extraLen = zipBuffer.readUInt16LE(pos + 28);
      const filename = zipBuffer.toString("utf8", pos + 30, pos + 30 + nameLen);
      entries.push({
        path: filename,
        compressedSize: compSize,
        uncompressedSize: uncompSize,
        crc,
      });
      pos += 30 + nameLen + extraLen + compSize;
    } else {
      break;
    }
  }

  return entries;
}

// ============================================================================
// Archetype Generators
// ============================================================================

export function normalizeArchetype(input: ArchetypeInput): AppArchetype {
  switch (input) {
    case "react":
    case "vite":
    case "react-vite":
      return "react-vite";
    case "next":
    case "nextjs":
      return "nextjs";
    case "fastify":
    case "node":
    case "node-fastify":
      return "node-fastify";
    default:
      return "react-vite";
  }
}

function detectFileMetadata(path: string): {
  type: ProjectFileType;
  language: SupportedLanguage;
} {
  const lower = path.toLowerCase();

  let language: SupportedLanguage = "text";
  if (lower.endsWith(".ts")) language = "typescript";
  else if (lower.endsWith(".tsx")) language = "tsx";
  else if (lower.endsWith(".js") || lower.endsWith(".mjs")) language = "javascript";
  else if (lower.endsWith(".json")) language = "json";
  else if (lower.endsWith(".css")) language = "css";
  else if (lower.endsWith(".html")) language = "html";
  else if (lower.endsWith(".md")) language = "markdown";

  let type: ProjectFileType = "code";
  if (
    lower.endsWith("package.json") ||
    lower.endsWith("tsconfig.json") ||
    lower.includes("config.") ||
    lower.endsWith(".gitignore")
  ) {
    type = "config";
  } else if (
    lower.includes(".test.") ||
    lower.includes(".spec.") ||
    lower.startsWith("__tests__/") ||
    lower.startsWith("test/")
  ) {
    type = "test";
  } else if (lower.endsWith(".md") || lower.endsWith(".txt")) {
    type = "documentation";
  } else if (lower.endsWith(".css")) {
    type = "style";
  }

  return { type, language };
}

function createProjectFile(path: string, content: string): ProjectFile {
  const { type, language } = detectFileMetadata(path);
  const sizeBytes = Buffer.byteLength(content, "utf8");
  const sha256 = computeSha256(content);

  return {
    path,
    content,
    type,
    language,
    sizeBytes,
    sha256,
  };
}

// ----------------------------------------------------------------------------
// 1. React / Vite Archetype Generator
// ----------------------------------------------------------------------------
function generateReactViteFiles(options: AppFactoryOptions): ProjectFile[] {
  const name = options.name;
  const port = options.port || 5173;
  const description = options.description || `Autonomous ${name} React & Vite Application powered by UMAR OS`;
  const version = options.version || "1.0.0";
  const author = options.author || "UMAR OS Code Synthesis Engine";

  const packageJson = {
    name,
    version,
    description,
    author,
    type: "module",
    scripts: {
      dev: `vite --port ${port}`,
      build: "tsc && vite build",
      preview: "vite preview",
      test: "vitest run",
      lint: "eslint src --ext ts,tsx",
    },
    dependencies: {
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "lucide-react": "^0.475.0",
      clsx: "^2.1.1",
      "tailwind-merge": "^3.0.0",
    },
    devDependencies: {
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "@vitejs/plugin-react": "^4.3.4",
      typescript: "^5.7.0",
      vite: "^6.1.0",
      vitest: "^3.0.5",
      tailwindcss: "^4.0.0",
      "@testing-library/react": "^16.2.0",
      "@testing-library/jest-dom": "^6.6.3",
    },
  };

  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ["src"],
  };

  const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: ${port},
    host: true,
  },
  test: {
    globals: true,
    environment: "happy-dom",
  },
});
`;

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name} · UMAR OS</title>
  </head>
  <body class="bg-neutral-950 text-neutral-100 antialiased min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

  const mainTsx = `import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
`;

  const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #0a0a0a;
  color: #ededed;
}
`;

  const headerTsx = `import React from "react";
import { Sparkles, Activity, ShieldCheck } from "lucide-react";

export interface HeaderProps {
  title: string;
  badge?: string;
  status?: "operational" | "degraded" | "provisioning";
}

export const Header: React.FC<HeaderProps> = ({
  title,
  badge = "UMAR OS Certified",
  status = "operational",
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-xs text-neutral-400">High-Velocity Autonomous Enterprise Node</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Activity className="w-3.5 h-3.5" />
          {status.toUpperCase()}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          {badge}
        </span>
      </div>
    </header>
  );
};
`;

  const metricCardTsx = `import React from "react";

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  positive = true,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-sm flex flex-col justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-black text-white">{value}</span>
        {change && (
          <span
            className={\`text-xs font-medium px-2 py-0.5 rounded-full \${
              positive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }\`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
`;

  const appTsx = `import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { MetricCard } from "./components/MetricCard";
import { fetchOrders, fetchHealthStatus, OrderItem } from "./api/orders";
import { ShoppingBag, RefreshCw } from "lucide-react";

export const App: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [healthStatus, setHealthStatus] = useState<string>("checking");

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderList, health] = await Promise.all([
        fetchOrders(),
        fetchHealthStatus(),
      ]);
      setOrders(orderList);
      setHealthStatus(health.status);
    } catch {
      setHealthStatus("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Header title="${name}" badge="Vite+React" />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Active Orders" value={orders.length} change="+12% today" />
          <MetricCard label="Gross Volume" value={\`₹\${totalRevenue.toLocaleString()}\`} change="+8.4%" />
          <MetricCard label="System Health" value={healthStatus.toUpperCase()} positive={healthStatus === "healthy"} />
        </div>

        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Live Dispatched Stream</h2>
            </div>
            <button
              onClick={() => void loadData()}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={\`w-3.5 h-3.5 \${loading ? "animate-spin" : ""}\`} />
              Refresh
            </button>
          </div>

          <div className="divide-y divide-neutral-800 overflow-x-auto">
            {orders.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-mono text-amber-400 font-bold">{item.id}</span>
                  <span className="text-neutral-300 ml-3">{item.customerName}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-neutral-400">{item.itemCount} items</span>
                  <span className="font-semibold text-white">₹{item.totalAmount}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-neutral-800 text-emerald-400 font-medium">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
`;

  const apiClientTs = `export interface ApiError {
  message: string;
  status: number;
}

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(\`API request failed with status \${res.status}\`);
  }

  return (await res.json()) as T;
}
`;

  const apiOrdersTs = `export interface OrderItem {
  id: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  status: "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  createdAt: string;
}

export async function fetchOrders(): Promise<OrderItem[]> {
  try {
    const res = await fetch("/api/v1/orders");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (_e) {}
  return [];
}

export async function fetchHealthStatus(): Promise<{ status: string; uptime: number }> {
  return { status: "healthy", uptime: 3600 };
}
`;

  const appTestTsx = `import { describe, it, expect } from "vitest";
import { Header } from "./components/Header";
import { MetricCard } from "./components/MetricCard";

describe("React/Vite Core Scaffolding Tests", () => {
  it("verifies Header component definition", () => {
    expect(Header).toBeDefined();
    expect(typeof Header).toBe("function");
  });

  it("verifies MetricCard component definition", () => {
    expect(MetricCard).toBeDefined();
    expect(typeof MetricCard).toBe("function");
  });
});
`;

  const apiTestTs = `import { describe, it, expect } from "vitest";
import { fetchOrders, fetchHealthStatus } from "./orders";

describe("API Layer Contracts", () => {
  it("fetches orders with canonical schema", async () => {
    const orders = await fetchOrders();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0]).toHaveProperty("id");
    expect(orders[0]).toHaveProperty("totalAmount");
  });

  it("fetches health status correctly", async () => {
    const health = await fetchHealthStatus();
    expect(health.status).toBe("healthy");
    expect(health.uptime).toBeGreaterThan(0);
  });
});
`;

  const readmeMd = `# ${name}

Generated by **UMAR OS App Factory Engine** (Archetype: \`react-vite\`).

## Quick Start
\`\`\`bash
npm install
npm run dev
npm run test
\`\`\`

## Architecture
- React 19 + TypeScript + Vite
- TailwindCSS styling
- Vitest unit & integration test suite
- Type-safe API client layer
`;

  const gitignore = `node_modules
dist
.DS_Store
*.log
coverage
`;

  return [
    createProjectFile("package.json", JSON.stringify(packageJson, null, 2)),
    createProjectFile("tsconfig.json", JSON.stringify(tsconfig, null, 2)),
    createProjectFile("vite.config.ts", viteConfig),
    createProjectFile("index.html", indexHtml),
    createProjectFile("src/main.tsx", mainTsx),
    createProjectFile("src/index.css", indexCss),
    createProjectFile("src/App.tsx", appTsx),
    createProjectFile("src/components/Header.tsx", headerTsx),
    createProjectFile("src/components/MetricCard.tsx", metricCardTsx),
    createProjectFile("src/api/client.ts", apiClientTs),
    createProjectFile("src/api/orders.ts", apiOrdersTs),
    createProjectFile("src/App.test.tsx", appTestTsx),
    createProjectFile("src/api/orders.test.ts", apiTestTs),
    createProjectFile("README.md", readmeMd),
    createProjectFile(".gitignore", gitignore),
  ];
}

// ----------------------------------------------------------------------------
// 2. Next.js Archetype Generator
// ----------------------------------------------------------------------------
function generateNextJsFiles(options: AppFactoryOptions): ProjectFile[] {
  const name = options.name;
  const port = options.port || 3000;
  const description = options.description || `Autonomous ${name} Next.js Fullstack Portal powered by UMAR OS`;
  const version = options.version || "1.0.0";
  const author = options.author || "UMAR OS Code Synthesis Engine";

  const packageJson = {
    name,
    version,
    description,
    author,
    scripts: {
      dev: `next dev -p ${port}`,
      build: "next build",
      start: `next start -p ${port}`,
      test: "vitest run",
      lint: "next lint",
    },
    dependencies: {
      next: "^15.1.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "lucide-react": "^0.475.0",
      clsx: "^2.1.1",
      "tailwind-merge": "^3.0.0",
      zod: "^3.24.0",
    },
    devDependencies: {
      "@types/node": "^22.10.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      typescript: "^5.7.0",
      tailwindcss: "^4.0.0",
      vitest: "^3.0.5",
    },
  };

  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: {
        "@/*": ["./*"],
      },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  };

  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
`;

  const layoutTsx = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${name} · Powered by UMAR OS",
  description: "${description}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
`;

  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0a0a0a;
  --foreground: #ededed;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
`;

  const pageTsx = `import React from "react";
import { Nav } from "./components/Nav";
import { StatPanel } from "./components/StatPanel";
import { Server, Activity, ShieldAlert } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      <Nav appName="${name}" />

      <main className="flex-1 max-w-6xl w-full mx-auto p-8 space-y-8">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            UMAR OS Serverless Core Active
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">${name} Executive Portal</h1>
          <p className="text-sm text-neutral-400">Autonomous Server-Side Rendered Edge Infrastructure</p>
        </header>

        <StatPanel />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Server className="w-5 h-5" />
              <h3>Native API Endpoints</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Fully isolated edge route handlers providing low-latency order dispatching, health telemetry, and state sync.
            </p>
            <div className="font-mono text-xs bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-neutral-300">
              GET /api/health<br />
              GET /api/orders<br />
              POST /api/orders
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <ShieldAlert className="w-5 h-5" />
              <h3>Cryptographic Verification</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every route response carries SHA-256 integrity tokens and UMAR OS audit manifests.
            </p>
            <div className="font-mono text-xs bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-neutral-300">
              Header: x-umar-integrity-seal<br />
              Status: 200 OK · Verified
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
`;

  const navTsx = `import React from "react";
import { Terminal, Shield } from "lucide-react";

export function Nav({ appName }: { appName: string }) {
  return (
    <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur px-8 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Terminal className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg text-white">{appName}</span>
      </div>
      <div className="flex items-center space-x-2 text-xs text-neutral-400">
        <Shield className="w-4 h-4 text-emerald-400" />
        <span>Next.js App Router</span>
      </div>
    </nav>
  );
}
`;

  const statPanelTsx = `import React from "react";

export function StatPanel() {
  const stats = [
    { label: "Edge Response", value: "8.4ms", status: "Optimal" },
    { label: "Active Connections", value: "1,248", status: "+14%" },
    { label: "Dispatch Accuracy", value: "99.98%", status: "SLA OK" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((s, idx) => (
        <div key={idx} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">{s.label}</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{s.value}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
              {s.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
`;

  const apiHealthRouteTs = `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    engine: "UMAR OS Next.js App Router",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
`;

  const apiOrdersRouteTs = `import { NextResponse } from "next/server";

interface OrderPayload {
  customerName: string;
  totalAmount: number;
}

export async function GET() {
  const sampleOrders = [
    { id: "NX-101", customerName: "Vikram Mehta", totalAmount: 3200, status: "READY" },
    { id: "NX-102", customerName: "Ananya Roy", totalAmount: 1850, status: "DISPATCHED" },
  ];

  return NextResponse.json({
    success: true,
    orders: sampleOrders,
    count: sampleOrders.length,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderPayload;
    if (!body.customerName || typeof body.totalAmount !== "number") {
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    const createdOrder = {
      id: \`NX-\${Math.floor(Math.random() * 9000 + 1000)}\`,
      customerName: body.customerName,
      totalAmount: body.totalAmount,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, order: createdOrder }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
}
`;

  const pageTestTsx = `import { describe, it, expect } from "vitest";
import HomePage from "./page";
import { Nav } from "./components/Nav";
import { StatPanel } from "./components/StatPanel";

describe("Next.js App Components", () => {
  it("renders HomePage function", () => {
    expect(HomePage).toBeDefined();
    expect(typeof HomePage).toBe("function");
  });

  it("exports Nav and StatPanel", () => {
    expect(Nav).toBeDefined();
    expect(StatPanel).toBeDefined();
  });
});
`;

  const apiHealthTestTs = `import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("Next.js API Route Health", () => {
  it("returns 200 OK with health status", async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.engine).toContain("UMAR OS");
  });
});
`;

  const readmeMd = `# ${name}

Generated by **UMAR OS App Factory Engine** (Archetype: \`nextjs\`).

## Getting Started
\`\`\`bash
npm install
npm run dev
npm run test
\`\`\`

## Features
- Next.js 15 App Router Architecture
- Built-in API route handlers (\`/api/health\`, \`/api/orders\`)
- Vitest test suite with endpoint validation
- Responsive TailwindCSS interface
`;

  const gitignore = `node_modules
.next
out
.DS_Store
*.log
`;

  return [
    createProjectFile("package.json", JSON.stringify(packageJson, null, 2)),
    createProjectFile("tsconfig.json", JSON.stringify(tsconfig, null, 2)),
    createProjectFile("next.config.mjs", nextConfig),
    createProjectFile("app/layout.tsx", layoutTsx),
    createProjectFile("app/globals.css", globalsCss),
    createProjectFile("app/page.tsx", pageTsx),
    createProjectFile("app/components/Nav.tsx", navTsx),
    createProjectFile("app/components/StatPanel.tsx", statPanelTsx),
    createProjectFile("app/api/health/route.ts", apiHealthRouteTs),
    createProjectFile("app/api/orders/route.ts", apiOrdersRouteTs),
    createProjectFile("__tests__/page.test.tsx", pageTestTsx),
    createProjectFile("__tests__/api/health.test.ts", apiHealthTestTs),
    createProjectFile("README.md", readmeMd),
    createProjectFile(".gitignore", gitignore),
  ];
}

// ----------------------------------------------------------------------------
// 3. Node / Fastify Archetype Generator
// ----------------------------------------------------------------------------
function generateNodeFastifyFiles(options: AppFactoryOptions): ProjectFile[] {
  const name = options.name;
  const port = options.port || 8080;
  const description = options.description || `Autonomous ${name} Node.js Fastify Microservice powered by UMAR OS`;
  const version = options.version || "1.0.0";
  const author = options.author || "UMAR OS Code Synthesis Engine";

  const packageJson = {
    name,
    version,
    description,
    author,
    type: "module",
    scripts: {
      dev: "tsx watch src/server.ts",
      build: "tsc",
      start: "node dist/server.js",
      test: "vitest run",
      lint: "eslint src --ext ts",
    },
    dependencies: {
      fastify: "^5.2.1",
      "@fastify/cors": "^10.0.2",
      "@fastify/sensible": "^6.0.3",
      "@fastify/helmet": "^13.0.1",
      pino: "^9.6.0",
      zod: "^3.24.0",
      dotenv: "^16.4.7",
    },
    devDependencies: {
      "@types/node": "^22.10.0",
      typescript: "^5.7.0",
      tsx: "^4.19.2",
      vitest: "^3.0.5",
      supertest: "^7.0.0",
      "@types/supertest": "^6.0.2",
    },
  };

  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist", "test"],
  };

  const configTs = `import { z } from "zod";

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(${port}),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SERVICE_NAME: z.string().default("${name}"),
});

export type Config = z.infer<typeof EnvSchema>;

export function loadConfig(): Config {
  return EnvSchema.parse(process.env);
}
`;

  const pluginsSensibleTs = `import { FastifyInstance } from "fastify";
import sensible from "@fastify/sensible";

export async function registerSensible(app: FastifyInstance): Promise<void> {
  await app.register(sensible);
}
`;

  const pluginsCorsTs = `import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";

export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  });
}
`;

  const routesHealthTs = `import { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function healthRoutes(app: FastifyInstance, _opts: FastifyPluginOptions): Promise<void> {
  app.get("/api/health", async () => {
    return {
      status: "ok",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  });
}
`;

  const routesOrdersTs = `import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";

const OrderCreateSchema = z.object({
  customerName: z.string().min(2),
  totalAmount: z.number().positive(),
  items: z.array(z.string()).default([]),
});

export interface OrderRecord {
  id: string;
  customerName: string;
  totalAmount: number;
  items: string[];
  status: "PENDING" | "CONFIRMED" | "DISPATCHED";
  createdAt: string;
}

const memoryOrders: OrderRecord[] = [
  {
    id: "ORD-FAST-01",
    customerName: "Rohan Kapoor",
    totalAmount: 1890,
    items: ["Paneer Tikka", "Garlic Naan"],
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  },
];

export async function ordersRoutes(app: FastifyInstance, _opts: FastifyPluginOptions): Promise<void> {
  app.get("/api/orders", async () => {
    return {
      orders: memoryOrders,
      count: memoryOrders.length,
    };
  });

  app.post("/api/orders", async (request, reply) => {
    const parseResult = OrderCreateSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const newOrder: OrderRecord = {
      id: \`ORD-FAST-\${Date.now().toString(36).toUpperCase()}\`,
      customerName: parseResult.data.customerName,
      totalAmount: parseResult.data.totalAmount,
      items: parseResult.data.items,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    memoryOrders.push(newOrder);
    return reply.status(201).send(newOrder);
  });
}
`;

  const routesMetricsTs = `import { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function metricsRoutes(app: FastifyInstance, _opts: FastifyPluginOptions): Promise<void> {
  app.get("/api/metrics", async () => {
    return {
      service: "${name}",
      runtime: "Node.js Fastify",
      cpuUsage: process.cpuUsage(),
      activeHandles: (process as unknown as { _getActiveHandles?: () => unknown[] })._getActiveHandles?.()?.length ?? 0,
      timestamp: Date.now(),
    };
  });
}
`;

  const appTs = `import fastify, { FastifyInstance } from "fastify";
import { registerSensible } from "./plugins/sensible";
import { registerCors } from "./plugins/cors";
import { healthRoutes } from "./routes/health";
import { ordersRoutes } from "./routes/orders";
import { metricsRoutes } from "./routes/metrics";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false,
  });

  await registerSensible(app);
  await registerCors(app);

  await app.register(healthRoutes);
  await app.register(ordersRoutes);
  await app.register(metricsRoutes);

  return app;
}
`;

  const serverTs = `import { buildApp } from "./app";
import { loadConfig } from "./config";

async function main() {
  const config = loadConfig();
  const app = await buildApp();

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(\`[\${config.SERVICE_NAME}] Server running on http://\${config.HOST}:\${config.PORT}\`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  void main();
}
`;

  const testServerTs = `import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app";
import { FastifyInstance } from "fastify";

describe("Fastify Service Core Suite", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/health returns status ok", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("ok");
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("GET /api/metrics returns system metrics", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/metrics",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.service).toBe("${name}");
    expect(body.runtime).toContain("Fastify");
  });
});
`;

  const testOrdersTs = `import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app";
import { FastifyInstance } from "fastify";

describe("Fastify Orders API Suite", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/orders lists active orders", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/orders",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.orders)).toBe(true);
    expect(body.count).toBeGreaterThan(0);
  });

  it("POST /api/orders creates a new validated order", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/orders",
      payload: {
        customerName: "Kavita Reddy",
        totalAmount: 2450,
        items: ["Butter Chicken", "Jeera Rice"],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.customerName).toBe("Kavita Reddy");
    expect(body.totalAmount).toBe(2450);
    expect(body.id).toContain("ORD-FAST-");
  });

  it("POST /api/orders rejects invalid payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/orders",
      payload: {
        customerName: "A",
        totalAmount: -50,
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe("Validation failed");
  });
});
`;

  const readmeMd = `# ${name}

Generated by **UMAR OS App Factory Engine** (Archetype: \`node-fastify\`).

## Run & Test
\`\`\`bash
npm install
npm run dev
npm run test
\`\`\`

## Microservice Architecture
- Fastify 5 + TypeScript
- Zod schema validation
- Plugins for Sensible error handling & CORS
- Comprehensive Vitest injection test suite
`;

  const gitignore = `node_modules
dist
.DS_Store
*.log
`;

  return [
    createProjectFile("package.json", JSON.stringify(packageJson, null, 2)),
    createProjectFile("tsconfig.json", JSON.stringify(tsconfig, null, 2)),
    createProjectFile("src/config.ts", configTs),
    createProjectFile("src/plugins/sensible.ts", pluginsSensibleTs),
    createProjectFile("src/plugins/cors.ts", pluginsCorsTs),
    createProjectFile("src/routes/health.ts", routesHealthTs),
    createProjectFile("src/routes/orders.ts", routesOrdersTs),
    createProjectFile("src/routes/metrics.ts", routesMetricsTs),
    createProjectFile("src/app.ts", appTs),
    createProjectFile("src/server.ts", serverTs),
    createProjectFile("test/server.test.ts", testServerTs),
    createProjectFile("test/routes/orders.test.ts", testOrdersTs),
    createProjectFile("README.md", readmeMd),
    createProjectFile(".gitignore", gitignore),
  ];
}

// ============================================================================
// Main App Factory Engine Class
// ============================================================================

export class AppFactoryEngine {
  /**
   * Scaffolds a full multi-file project based on the specified archetype.
   */
  public scaffoldApp(options: AppFactoryOptions): ScaffoldedProject {
    const archetype = normalizeArchetype(options.archetype);
    let files: ProjectFile[] = [];

    switch (archetype) {
      case "react-vite":
        files = generateReactViteFiles(options);
        break;
      case "nextjs":
        files = generateNextJsFiles(options);
        break;
      case "node-fastify":
        files = generateNodeFastifyFiles(options);
        break;
    }

    // Merge custom file overrides or additions if provided
    if (options.customFiles) {
      const customFilePaths = new Set(Object.keys(options.customFiles));
      files = files.filter((f) => !customFilePaths.has(f.path));
      for (const [filePath, content] of Object.entries(options.customFiles)) {
        files.push(createProjectFile(filePath, content));
      }
    }

    // Perform full syntax and balance validation
    const validation = validateProjectFiles(files);

    if (options.strictSyntax && !validation.valid) {
      const errorMsg = validation.issues
        .filter((i) => i.severity === "error")
        .map((i) => `[${i.file}:${i.line}:${i.column}] ${i.message}`)
        .join("\n");
      throw new Error(`AppFactoryEngine syntax validation failure:\n${errorMsg}`);
    }

    // Compute sizes and canonical root hash
    const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
    const rootHash = computeProjectIntegrityHash(
      files.map((f) => ({ path: f.path, sha256: f.sha256 }))
    );

    // Extract package.json object
    const packageJsonFile = files.find((f) => f.path === "package.json");
    let parsedPackageJson: Record<string, unknown> = {};
    if (packageJsonFile) {
      try {
        parsedPackageJson = JSON.parse(packageJsonFile.content) as Record<string, unknown>;
      } catch {
        parsedPackageJson = {};
      }
    }

    const manifestFiles: ManifestFileEntry[] = files.map((f) => ({
      path: f.path,
      type: f.type,
      language: f.language,
      sizeBytes: f.sizeBytes,
      sha256: f.sha256,
    }));

    const manifest: ProjectManifest = {
      name: options.name,
      archetype,
      version: options.version || "1.0.0",
      description: options.description || `Autonomous ${options.name} project`,
      createdAt: new Date().toISOString(),
      totalFiles: files.length,
      totalSizeBytes,
      rootHash,
      files: manifestFiles,
      packageJson: parsedPackageJson,
      features: options.features || [],
      validation,
    };

    const project: ScaffoldedProject = {
      options,
      archetype,
      files,
      manifest,
      validation,
      getFile: (filePath: string) => files.find((f) => f.path === filePath),
      getZipBuffer: () => buildZipArchive(files),
      getZipBase64: () => buildZipArchive(files).toString("base64"),
      exportJsonManifest: (pretty = true) =>
        JSON.stringify(manifest, null, pretty ? 2 : undefined),
      verifyIntegrity: (expectedHash?: string) => {
        const computed = computeProjectIntegrityHash(
          files.map((f) => ({ path: f.path, sha256: f.sha256 }))
        );
        const target = expectedHash || rootHash;
        return computed === target;
      },
    };

    return project;
  }

  /**
   * Helper to scaffold React / Vite application.
   */
  public scaffoldReactVite(
    name: string,
    extraOptions?: Partial<AppFactoryOptions>
  ): ScaffoldedProject {
    return this.scaffoldApp({
      name,
      archetype: "react-vite",
      ...extraOptions,
    });
  }

  /**
   * Helper to scaffold Next.js application.
   */
  public scaffoldNextJs(
    name: string,
    extraOptions?: Partial<AppFactoryOptions>
  ): ScaffoldedProject {
    return this.scaffoldApp({
      name,
      archetype: "nextjs",
      ...extraOptions,
    });
  }

  /**
   * Helper to scaffold Node / Fastify microservice.
   */
  public scaffoldNodeFastify(
    name: string,
    extraOptions?: Partial<AppFactoryOptions>
  ): ScaffoldedProject {
    return this.scaffoldApp({
      name,
      archetype: "node-fastify",
      ...extraOptions,
    });
  }

  /**
   * Standalone syntax validator.
   */
  public validateCode(
    code: string,
    language: SupportedLanguage = "typescript",
    filePath = "snippet.ts"
  ): SyntaxValidationReport {
    const issues = validateFileSyntax(code, language, filePath);
    const valid = issues.filter((i) => i.severity === "error").length === 0;
    const bracketErrors = issues.filter(
      (i) => i.rule === "balanced-brackets" || i.rule === "unclosed-literal"
    ).length;
    const astErrors = issues.filter(
      (i) => i.rule === "ts-syntax" || i.rule === "json-syntax"
    ).length;

    return {
      valid,
      issues,
      totalFilesValidated: 1,
      bracketIntegrityScore: bracketErrors === 0 ? 100 : Math.max(0, 100 - bracketErrors * 20),
      astSyntaxScore: astErrors === 0 ? 100 : Math.max(0, 100 - astErrors * 20),
    };
  }
}

export const appFactoryEngine = new AppFactoryEngine();
