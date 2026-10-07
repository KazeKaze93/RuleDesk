/**
 * Run Vitest and fail if passed test count is below the pinned minimum.
 * Uses the force-exit reporter so open handles cannot hang the process.
 * Suite exclusions live in vitest.config.ts.
 */
import { spawnSync } from "node:child_process";

/** Pinned floor — raise when the suite grows; never lower without an intentional cull. */
const MIN_TESTS = 331;

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
});

const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

const match = out.match(/Tests\s+(\d+)\s+passed/);
const passed = match ? Number(match[1]) : 0;

if (result.status !== 0 && result.status !== null) {
  process.exit(result.status);
}

if (passed < MIN_TESTS) {
  console.error(
    `FAIL: Vitest passed ${passed} tests; pinned minimum is ${MIN_TESTS}.`
  );
  process.exit(1);
}

process.exit(0);
