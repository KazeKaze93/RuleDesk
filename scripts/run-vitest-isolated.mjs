/**
 * Run the isolated Vitest suite (jsdom + video-proxy) with forks, explicit
 * timeouts, and a hard wall-clock. On wall-clock expiry, dump verbose diagnostics
 * (logHeapUsage + why-is-node-running) so the leaking file can be identified —
 * do not silently exclude it.
 */
import { spawn, spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_ISOLATED_TESTS } from "./vitest-min-counts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/** Hard wall-clock for the entire isolated run (ms). */
const WALL_CLOCK_MS = 180_000;

const COUNT_FILE = path.join(ROOT, ".vitest-isolated-passed");

function parsePassed(text) {
  const match = text.match(/Tests\s+(\d+)\s+passed/);
  return match ? Number(match[1]) : 0;
}

function runWithWallClock() {
  const logDir = mkdtempSync(path.join(tmpdir(), "ruledesk-isolated-"));
  const logPath = path.join(logDir, "vitest.log");
  const logStream = createWriteStream(logPath);

  const args = [
    "vitest",
    "run",
    "--config",
    "vitest.isolated.config.ts",
    "--pool=forks",
    "--testTimeout=15000",
    "--hookTimeout=15000",
    "--teardownTimeout=5000",
    "--reporter=verbose",
    "--logHeapUsage",
    "--reporter=./tests/vitest-force-exit-reporter.ts",
  ];

  return new Promise((resolve) => {
    const child = spawn("npx", args, {
      cwd: ROOT,
      shell: true,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let out = "";
    const onChunk = (buf) => {
      const s = buf.toString();
      out += s;
      process.stdout.write(s);
      logStream.write(s);
    };
    child.stdout.on("data", onChunk);
    child.stderr.on("data", onChunk);

    const timer = setTimeout(() => {
      process.stderr.write(
        `\nFAIL: test:isolated exceeded wall-clock ${WALL_CLOCK_MS}ms — diagnosing open handles…\n`,
      );
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!child.killed) child.kill("SIGKILL");
      }, 5_000);

      // Best-effort: re-run with why-is-node-running preload if available.
      const whyPath = path.join(
        ROOT,
        "node_modules",
        "why-is-node-running",
        "include.js",
      );
      const diagnoseArgs = [
        "vitest",
        "run",
        "--config",
        "vitest.isolated.config.ts",
        "--pool=forks",
        "--testTimeout=15000",
        "--hookTimeout=15000",
        "--teardownTimeout=5000",
        "--reporter=verbose",
        "--logHeapUsage",
        "--no-file-parallelism",
        "--maxWorkers=1",
      ];
      const diagnoseEnv = { ...process.env };
      try {
        readFileSync(whyPath);
        diagnoseEnv.NODE_OPTIONS = [
          diagnoseEnv.NODE_OPTIONS,
          `--require=${whyPath}`,
        ]
          .filter(Boolean)
          .join(" ");
        process.stderr.write(
          `Diagnose: re-running with why-is-node-running (${whyPath})\n`,
        );
      } catch {
        process.stderr.write(
          "Diagnose: why-is-node-running not installed — install as devDependency to attribute leaks.\n" +
            "Last verbose log (tail):\n",
        );
        process.stderr.write(out.slice(-8_000));
      }

      const diag = spawnSync("npx", diagnoseArgs, {
        cwd: ROOT,
        shell: true,
        encoding: "utf8",
        env: diagnoseEnv,
        timeout: 60_000,
      });
      if (diag.stdout) process.stderr.write(diag.stdout);
      if (diag.stderr) process.stderr.write(diag.stderr);
      process.stderr.write(
        `\nIsolated suite hung. Inspect the last file in the verbose log above (log: ${logPath}).\n`,
      );
      resolve({ status: 1, passed: parsePassed(out), hung: true });
    }, WALL_CLOCK_MS);

    child.on("close", (code) => {
      clearTimeout(timer);
      logStream.end();
      try {
        rmSync(logDir, { recursive: true, force: true });
      } catch {
        /* keep log on failure paths above */
      }
      resolve({ status: code ?? 1, passed: parsePassed(out), hung: false });
    });
  });
}

const result = await runWithWallClock();
writeFileSync(COUNT_FILE, String(result.passed), "utf8");

if (result.hung) {
  process.exit(1);
}
if (result.status !== 0) {
  process.exit(result.status);
}
if (result.passed < MIN_ISOLATED_TESTS) {
  console.error(
    `FAIL: isolated Vitest passed ${result.passed}; pinned minimum is ${MIN_ISOLATED_TESTS}.`,
  );
  process.exit(1);
}
process.exit(0);
