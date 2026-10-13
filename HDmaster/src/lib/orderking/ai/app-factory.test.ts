import { describe, it, expect } from "vitest";
import {
  AppFactoryEngine,
  appFactoryEngine,
  validateBracketBalance,
  validateTypeScriptAST,
  validateJsonCode,
  computeSha256,
  computeProjectIntegrityHash,
  buildZipArchive,
  inspectZipEntries,
} from "./app-factory-engine";

describe("UMAR OS App Factory Engine & Code Synthesis Suite", () => {
  // --------------------------------------------------------------------------
  // 1. Project Scaffolding Structure
  // --------------------------------------------------------------------------
  describe("Project Scaffolding Archetypes", () => {
    it("scaffolds a complete React/Vite project with required components and tests", () => {
      const project = appFactoryEngine.scaffoldReactVite("orderking-dashboard", {
        description: "OrderKing Merchant Operations Portal",
        port: 5173,
      });

      expect(project.archetype).toBe("react-vite");
      expect(project.manifest.name).toBe("orderking-dashboard");
      expect(project.files.length).toBeGreaterThanOrEqual(14);

      // 1. package.json validation
      const packageJsonFile = project.getFile("package.json");
      expect(packageJsonFile).toBeDefined();
      const pkg = JSON.parse(packageJsonFile!.content);
      expect(pkg.name).toBe("orderking-dashboard");
      expect(pkg.dependencies).toHaveProperty("react");
      expect(pkg.dependencies).toHaveProperty("react-dom");
      expect(pkg.devDependencies).toHaveProperty("vite");
      expect(pkg.scripts).toHaveProperty("dev");
      expect(pkg.scripts).toHaveProperty("build");
      expect(pkg.scripts).toHaveProperty("test");

      // 2. Main components
      expect(project.getFile("src/main.tsx")).toBeDefined();
      expect(project.getFile("src/App.tsx")).toBeDefined();
      expect(project.getFile("src/components/Header.tsx")).toBeDefined();
      expect(project.getFile("src/components/MetricCard.tsx")).toBeDefined();

      // 3. API Routes / Layer
      expect(project.getFile("src/api/client.ts")).toBeDefined();
      expect(project.getFile("src/api/orders.ts")).toBeDefined();

      // 4. Test Suites
      expect(project.getFile("src/App.test.tsx")).toBeDefined();
      expect(project.getFile("src/api/orders.test.ts")).toBeDefined();

      // 5. Build and config files
      expect(project.getFile("vite.config.ts")).toBeDefined();
      expect(project.getFile("tsconfig.json")).toBeDefined();
      expect(project.getFile("index.html")).toBeDefined();
      expect(project.getFile("README.md")).toBeDefined();

      // Syntax report
      expect(project.validation.valid).toBe(true);
      expect(project.validation.bracketIntegrityScore).toBe(100);
      expect(project.validation.astSyntaxScore).toBe(100);
    });

    it("scaffolds a complete Next.js App Router project with endpoints and tests", () => {
      const project = appFactoryEngine.scaffoldNextJs("orderking-edge-portal", {
        port: 3000,
      });

      expect(project.archetype).toBe("nextjs");
      expect(project.manifest.name).toBe("orderking-edge-portal");

      // 1. package.json
      const packageJsonFile = project.getFile("package.json");
      expect(packageJsonFile).toBeDefined();
      const pkg = JSON.parse(packageJsonFile!.content);
      expect(pkg.dependencies).toHaveProperty("next");
      expect(pkg.dependencies).toHaveProperty("react");

      // 2. Main Layout & Page Components
      expect(project.getFile("app/layout.tsx")).toBeDefined();
      expect(project.getFile("app/page.tsx")).toBeDefined();
      expect(project.getFile("app/components/Nav.tsx")).toBeDefined();
      expect(project.getFile("app/components/StatPanel.tsx")).toBeDefined();
      expect(project.getFile("app/globals.css")).toBeDefined();

      // 3. API Routes
      expect(project.getFile("app/api/health/route.ts")).toBeDefined();
      expect(project.getFile("app/api/orders/route.ts")).toBeDefined();

      // 4. Test Suites
      expect(project.getFile("__tests__/page.test.tsx")).toBeDefined();
      expect(project.getFile("__tests__/api/health.test.ts")).toBeDefined();

      // 5. Config files
      expect(project.getFile("next.config.mjs")).toBeDefined();
      expect(project.getFile("tsconfig.json")).toBeDefined();

      expect(project.validation.valid).toBe(true);
      expect(project.validation.bracketIntegrityScore).toBe(100);
    });

    it("scaffolds a complete Node.js Fastify microservice with schemas and routes", () => {
      const project = appFactoryEngine.scaffoldNodeFastify("orderking-dispatch-service", {
        port: 8080,
      });

      expect(project.archetype).toBe("node-fastify");
      expect(project.manifest.name).toBe("orderking-dispatch-service");

      // 1. package.json
      const packageJsonFile = project.getFile("package.json");
      expect(packageJsonFile).toBeDefined();
      const pkg = JSON.parse(packageJsonFile!.content);
      expect(pkg.dependencies).toHaveProperty("fastify");
      expect(pkg.dependencies).toHaveProperty("@fastify/cors");
      expect(pkg.dependencies).toHaveProperty("zod");

      // 2. Main Server and App factory
      expect(project.getFile("src/server.ts")).toBeDefined();
      expect(project.getFile("src/app.ts")).toBeDefined();
      expect(project.getFile("src/config.ts")).toBeDefined();
      expect(project.getFile("src/plugins/sensible.ts")).toBeDefined();
      expect(project.getFile("src/plugins/cors.ts")).toBeDefined();

      // 3. API Routes
      expect(project.getFile("src/routes/health.ts")).toBeDefined();
      expect(project.getFile("src/routes/orders.ts")).toBeDefined();
      expect(project.getFile("src/routes/metrics.ts")).toBeDefined();

      // 4. Test Suites
      expect(project.getFile("test/server.test.ts")).toBeDefined();
      expect(project.getFile("test/routes/orders.test.ts")).toBeDefined();

      // 5. Configs
      expect(project.getFile("tsconfig.json")).toBeDefined();

      expect(project.validation.valid).toBe(true);
      expect(project.validation.bracketIntegrityScore).toBe(100);
    });

    it("supports custom files injection and overrides", () => {
      const project = appFactoryEngine.scaffoldApp({
        name: "custom-worker",
        archetype: "node-fastify",
        customFiles: {
          "src/routes/custom.ts": `export const customRoute = () => ({ status: "custom" });`,
          "README.md": `# Custom Injected Documentation`,
        },
      });

      const customFile = project.getFile("src/routes/custom.ts");
      expect(customFile).toBeDefined();
      expect(customFile!.content).toContain("customRoute");

      const readme = project.getFile("README.md");
      expect(readme!.content).toBe("# Custom Injected Documentation");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Syntax Validation (Balanced Brackets, Comments, Literals & AST)
  // --------------------------------------------------------------------------
  describe("Syntax & Bracket Validation Engine", () => {
    it("verifies perfectly balanced brackets with complex nested structures", () => {
      const code = `
        export function computeMatrix<T>(input: T[]): { data: T[]; total: number } {
          const map = new Map<string, number>();
          if (input.length > 0) {
            const result = [ { id: 1, val: (10 + 20) * [1, 2][0] } ];
            return { data: input, total: result[0].val };
          }
          return { data: [], total: 0 };
        }
      `;

      const issues = validateBracketBalance(code, "test.ts");
      expect(issues.length).toBe(0);
    });

    it("ignores brackets inside single quotes, double quotes, and comments", () => {
      const code = `
        // Line comment with { unbalanced brace and ( parenthesis
        /* Block comment with [ unbalanced brackets and } */
        const str1 = "{ unclosed brace in string";
        const str2 = 'mismatched ( in single quote';
        const template = \`literal with [ and ( inside\`;
        export const obj = { ok: true };
      `;

      const issues = validateBracketBalance(code, "literals.ts");
      expect(issues.length).toBe(0);
    });

    it("correctly handles template literal interpolations", () => {
      const code = `
        const name = "OrderKing";
        const msg = \`Hello \${name.toUpperCase()}, status is: \${{ active: true }.active ? "YES" : "NO"}\`;
        export default msg;
      `;

      const issues = validateBracketBalance(code, "template.ts");
      expect(issues.length).toBe(0);
    });

    it("detects unclosed opening brackets and reports line and column", () => {
      const unclosedCode = `
        function broken() {
          const arr = [1, 2, 3;
      `;

      const issues = validateBracketBalance(unclosedCode, "broken.ts");
      expect(issues.length).toBeGreaterThan(0);
      const unclosedBracket = issues.find((i) => i.message.includes("Unclosed '['"));
      expect(unclosedBracket).toBeDefined();
      expect(unclosedBracket?.line).toBe(3);
    });

    it("detects mismatched closing brackets", () => {
      const mismatchedCode = `
        const data = (10 + 20];
      `;

      const issues = validateBracketBalance(mismatchedCode, "mismatched.ts");
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].message).toContain("Mismatched closing ']'");
    });

    it("detects unexpected closing brackets with no matching opener", () => {
      const unexpectedClose = `
        const x = 10;
        }
      `;

      const issues = validateBracketBalance(unexpectedClose, "extra-close.ts");
      expect(issues.length).toBe(1);
      expect(issues[0].message).toContain("Unexpected closing '}'");
    });

    it("detects unterminated string and template literals", () => {
      const unclosedString = `const str = "unclosed string;`;
      const issues = validateBracketBalance(unclosedString, "unclosed.ts");
      expect(issues.some((i) => i.rule === "unclosed-literal")).toBe(true);
    });

    it("validates TypeScript AST and detects syntax errors", () => {
      const invalidTs = `
        const broken: number = ;
        function () {}
      `;

      const issues = validateTypeScriptAST(invalidTs, "invalid.ts");
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].rule).toBe("ts-syntax");
    });

    it("validates valid and invalid JSON structures", () => {
      const validJson = `{"name": "test", "version": "1.0.0", "dependencies": {}}`;
      expect(validateJsonCode(validJson)).toEqual([]);

      const invalidJson = `{"name": "test", trailingComma: }`;
      const issues = validateJsonCode(invalidJson, "test.json");
      expect(issues.length).toBe(1);
      expect(issues[0].rule).toBe("json-syntax");
    });

    it("standalone validateCode reports integrity scores accurately", () => {
      const perfectReport = appFactoryEngine.validateCode(
        `export const health = () => ({ status: "ok" });`
      );
      expect(perfectReport.valid).toBe(true);
      expect(perfectReport.bracketIntegrityScore).toBe(100);
      expect(perfectReport.astSyntaxScore).toBe(100);

      const brokenReport = appFactoryEngine.validateCode(
        `export const broken = () => { missingBrace:`
      );
      expect(brokenReport.valid).toBe(false);
      expect(brokenReport.bracketIntegrityScore).toBeLessThan(100);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Cryptographic Integrity & Export Packaging
  // --------------------------------------------------------------------------
  describe("Integrity Hashing & Export Packaging", () => {
    it("computes deterministic SHA-256 hashes for files and project root", () => {
      const hash1 = computeSha256("console.log('hello');");
      const hash2 = computeSha256("console.log('hello');");
      const hash3 = computeSha256("console.log('world');");

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);

      const rootHashA = computeProjectIntegrityHash([
        { path: "b.ts", sha256: hash2 },
        { path: "a.ts", sha256: hash1 },
      ]);
      const rootHashB = computeProjectIntegrityHash([
        { path: "a.ts", sha256: hash1 },
        { path: "b.ts", sha256: hash2 },
      ]);
      // Order independence
      expect(rootHashA).toBe(rootHashB);
    });

    it("verifies project tamper resistance via verifyIntegrity()", () => {
      const project = appFactoryEngine.scaffoldReactVite("tamper-test");
      expect(project.verifyIntegrity()).toBe(true);

      const initialRootHash = project.manifest.rootHash;
      expect(project.verifyIntegrity(initialRootHash)).toBe(true);

      // Simulating tampering with a file
      const appFile = project.getFile("src/App.tsx");
      expect(appFile).toBeDefined();
      appFile!.content += "\n// Injected malicious payload";
      appFile!.sha256 = computeSha256(appFile!.content);

      // Should now fail against original root hash
      expect(project.verifyIntegrity(initialRootHash)).toBe(false);
    });

    it("generates exportable JSON manifest with full metadata", () => {
      const project = appFactoryEngine.scaffoldNodeFastify("manifest-test");
      const jsonManifest = project.exportJsonManifest(true);

      expect(typeof jsonManifest).toBe("string");
      const parsed = JSON.parse(jsonManifest);
      expect(parsed.name).toBe("manifest-test");
      expect(parsed.archetype).toBe("node-fastify");
      expect(parsed.totalFiles).toBe(project.files.length);
      expect(parsed.rootHash).toBe(project.manifest.rootHash);
      expect(parsed.files.length).toBe(project.files.length);
      expect(parsed.packageJson.dependencies).toHaveProperty("fastify");
    });

    it("builds a valid standard ZIP archive buffer with PK signatures and inspectable entries", () => {
      const files = [
        { path: "package.json", content: '{"name":"zip-test"}' },
        { path: "src/index.ts", content: 'console.log("ZIP OK");' },
        { path: "README.md", content: "# Hello ZIP" },
      ];

      const zipBuf = buildZipArchive(files);
      expect(Buffer.isBuffer(zipBuf)).toBe(true);
      expect(zipBuf.length).toBeGreaterThan(0);

      // ZIP local file header signature: PK\x03\x04
      expect(zipBuf[0]).toBe(0x50);
      expect(zipBuf[1]).toBe(0x4b);
      expect(zipBuf[2]).toBe(0x03);
      expect(zipBuf[3]).toBe(0x04);

      // Inspect entries extracted from the archive
      const entries = inspectZipEntries(zipBuf);
      expect(entries.length).toBe(3);
      expect(entries.map((e) => e.path)).toEqual([
        "package.json",
        "src/index.ts",
        "README.md",
      ]);
      expect(entries[0].uncompressedSize).toBe(Buffer.byteLength(files[0].content));
    });

    it("exports base64 zip bundle from scaffolded project", () => {
      const project = appFactoryEngine.scaffoldReactVite("zip-export-app");
      const zipBuffer = project.getZipBuffer();
      const zipBase64 = project.getZipBase64();

      expect(zipBuffer.length).toBeGreaterThan(100);
      expect(zipBase64.length).toBeGreaterThan(100);

      // Ensure base64 round-trip matches zip buffer
      const decodedBuf = Buffer.from(zipBase64, "base64");
      expect(decodedBuf.equals(zipBuffer)).toBe(true);

      // Check that all scaffolded files are present inside the zip archive
      const entries = inspectZipEntries(zipBuffer);
      expect(entries.length).toBe(project.files.length);
      const pathsInZip = new Set(entries.map((e) => e.path));
      for (const file of project.files) {
        expect(pathsInZip.has(file.path)).toBe(true);
      }
    });
  });
});
