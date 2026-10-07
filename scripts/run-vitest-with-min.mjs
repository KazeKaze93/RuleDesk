/**
 * Run the main Vitest suite and fail if passed count is below the pinned minimum.
 * Isolated suites (happy-dom / video-proxy) run via `npm run test:isolated`.
 * Combined floor is enforced by `scripts/assert-vitest-min-total.mjs`.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_MAIN_TESTS } from "./vitest-min-counts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const COUNT_FILE = path.join(ROOT, ".vitest-main-passed");

const args = [
  "vitest",
  "run",
  "--reporter=default",
  "--reporter=./tests/vitest-force-exit-reporter.ts",
  ...process.argv.slice(2),
];

const result = spawnSync("npx", args, {
  encoding: "utf8",
  shell: true,
  env: process.env,
  cwd: ROOT,
});

const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

const match = out.match(/Tests\s+(\d+)\s+passed/);
const passed = match ? Number(match[1]) : 0;
writeFileSync(COUNT_FILE, String(passed), "utf8");

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
