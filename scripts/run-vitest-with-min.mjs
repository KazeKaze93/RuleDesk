/**
 * Run the main Vitest suite and fail if passed count is below the pinned minimum.
 * Isolated suites (happy-dom / video-proxy) run via `npm run test:isolated`.
 * Combined floor is enforced by `scripts/assert-vitest-min-total.mjs`.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_MAIN_TESTS } from "./vitest-min-counts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const COUNT_FILE = path.join(ROOT, ".vitest-main-passed");
const JSON_FILE = path.join(ROOT, ".vitest-main-result.json");

const args = [
  "vitest",
  "run",
  "--reporter=default",
  "--reporter=json",
  `--outputFile=${JSON_FILE}`,
  "--reporter=./tests/vitest-force-exit-reporter.ts",
  ...process.argv.slice(2),
];

const result = spawnSync("npx", args, {
  encoding: "utf8",
  shell: true,
  env: process.env,
  cwd: ROOT,
  maxBuffer: 64 * 1024 * 1024,
});

const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

function passedFromJson() {
  try {
    const raw = readFileSync(JSON_FILE, "utf8");
    const data = JSON.parse(raw);
    if (typeof data.numPassedTests === "number") {
      return data.numPassedTests;
    }
  } catch {
    /* fall through */
  }
  return null;
}

function passedFromText(text) {
  const matches = [
    ...stripAnsi(text).matchAll(/Tests\s+(\d+)\s+passed/g),
  ];
  if (matches.length === 0) {
    return null;
  }
  return Number(matches[matches.length - 1][1]);
}

const passed = passedFromJson() ?? passedFromText(out) ?? 0;
writeFileSync(COUNT_FILE, String(passed), "utf8");
try {
  unlinkSync(JSON_FILE);
} catch {
  /* optional artifact */
}

if (result.status !== 0 && result.status !== null) {
  process.exit(result.status);
}

if (passed < MIN_MAIN_TESTS) {
  console.error(
    `FAIL: main Vitest passed ${passed} tests; pinned minimum is ${MIN_MAIN_TESTS}.`,
  );
  process.exit(1);
}

process.exit(0);
