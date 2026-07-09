import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const asar = require("@electron/asar");

const ROOT_DIR = process.cwd();
const RELEASE_DIR = path.join(ROOT_DIR, "release");

const FORBIDDEN_RELATIVE_PATH = /(?:^|[\\/])(?:tests|playwright-report|test-results|\.ai)(?:[\\/]|$)|\.cursorrules$|\.env(?:\.|$)|\.map$/i;

const FORBIDDEN_APP_CONTENT = [
  { label: "test fixture API key", pattern: /test-api-key-12345/ },
  { label: "CI secret name", pattern: /\bTEST_API_KEY\b/ },
  { label: "GitHub token prefix", pattern: /\bghp_[A-Za-z0-9]{20,}\b/ },
  { label: "example leaked api_key query", pattern: /api_key=secret\b/i },
  { label: "example credential from unit tests", pattern: /mysecretkey12/ },
];

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".html",
  ".css",
  ".txt",
  ".sql",
]);

function fail(message) {
  console.error(`Release artifact audit failed: ${message}`);
  process.exit(1);
}

function findUnpackedDirs() {
  if (!statSync(RELEASE_DIR, { throwIfNoEntry: false })) {
    fail(`release directory not found at ${RELEASE_DIR}. Run electron-builder first.`);
  }

  return readdirSync(RELEASE_DIR)
    .filter((entry) => entry.endsWith("-unpacked"))
    .map((entry) => path.join(RELEASE_DIR, entry));
}

function findAppAsar(unpackedDir) {
  const asarPath = path.join(unpackedDir, "resources", "app.asar");
  if (!statSync(asarPath, { throwIfNoEntry: false })) {
    fail(`app.asar not found under ${unpackedDir}`);
  }
  return asarPath;
}

function extractAsar(asarPath) {
  const extractDir = mkdtempSync(path.join(tmpdir(), "ruledesk-release-audit-"));
  asar.extractAll(asarPath, extractDir);
  return extractDir;
}

function walkFiles(rootDir) {
  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function isAppOwnedPath(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  return normalized.startsWith("out/");
}

function auditExtractedApp(extractDir) {
  const files = walkFiles(extractDir);
  const violations = [];

  for (const filePath of files) {
    const relativePath = path.relative(extractDir, filePath);
    const posixPath = relativePath.split(path.sep).join("/");

    if (FORBIDDEN_RELATIVE_PATH.test(posixPath)) {
      violations.push(`forbidden path: ${posixPath}`);
      continue;
    }

    if (posixPath.endsWith(".map")) {
      violations.push(`source map packaged: ${posixPath}`);
      continue;
    }

    if (!isAppOwnedPath(relativePath)) {
      continue;
    }

    const extension = path.extname(filePath).toLowerCase();
    if (!TEXT_EXTENSIONS.has(extension)) {
      continue;
    }

    let content = "";
    try {
      content = readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    if (content.includes("sourceMappingURL=")) {
      violations.push(`source map reference in app bundle: ${posixPath}`);
    }

    for (const rule of FORBIDDEN_APP_CONTENT) {
      if (rule.pattern.test(content)) {
        violations.push(`${rule.label} in ${posixPath}`);
      }
    }
  }

  return violations;
}

function main() {
  const unpackedDirs = findUnpackedDirs();
  if (unpackedDirs.length === 0) {
    fail("no *-unpacked directories found under release/");
  }

  const allViolations = [];

  for (const unpackedDir of unpackedDirs) {
    const asarPath = findAppAsar(unpackedDir);
    const extractDir = extractAsar(asarPath);
    try {
      const violations = auditExtractedApp(extractDir);
      for (const violation of violations) {
        allViolations.push(`${path.basename(unpackedDir)}: ${violation}`);
      }
    } finally {
      rmSync(extractDir, { recursive: true, force: true });
    }
  }

  if (allViolations.length > 0) {
    console.error("Release artifact audit violations:");
    for (const violation of allViolations) {
      console.error(`  - ${violation}`);
    }
    process.exit(1);
  }

  console.log(
    `Release artifact audit passed for ${unpackedDirs.length} unpacked build(s).`
  );
}

main();
