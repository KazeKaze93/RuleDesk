/**
 * Run a command with better-sqlite3 built for Node, then always restore the
 * Electron ABI — even when the command fails or the process is interrupted.
 *
 * Usage: node scripts/with-node-sqlite.mjs <command> [args...]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NPM_RUN = ["run"];
const REBUILD_NODE_SCRIPT = "db:rebuild:node";
const REBUILD_ELECTRON_SCRIPT = "db:rebuild";
const SIGINT_EXIT = 130;
const SIGTERM_EXIT = 143;

/**
 * @param {string} script
 * @param {string} label
 * @returns {number}
 */
function npmRun(script, label) {
  process.stderr.write(`[with-node-sqlite] ${label}\n`);
  const result = spawnSync("npm", [...NPM_RUN, script], {
    cwd: ROOT,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    process.stderr.write(
      `[with-node-sqlite] ${label} failed to start: ${result.error.message}\n`,
    );
    return 1;
  }
  return result.status ?? 1;
}

/**
 * @param {string[]} command
 * @returns {number}
 */
function runCommand(command) {
  const [cmd, ...args] = command;
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    process.stderr.write(
      `[with-node-sqlite] command failed to start: ${result.error.message}\n`,
    );
    return 1;
  }
  if (result.signal) {
    return result.signal === "SIGINT" ? SIGINT_EXIT : SIGTERM_EXIT;
  }
  return result.status ?? 1;
}

const command = process.argv.slice(2);
if (command.length === 0) {
  process.stderr.write(
    "Usage: node scripts/with-node-sqlite.mjs <command> [args...]\n",
  );
  process.exit(1);
}

let exitCode = 0;
let restoreStarted = false;

function restoreElectronAbi() {
  if (restoreStarted) {
    return 0;
  }
  restoreStarted = true;
  return npmRun(
    REBUILD_ELECTRON_SCRIPT,
    "restoring better-sqlite3 for Electron…",
  );
}

function onSignal(signal) {
  const code = signal === "SIGINT" ? SIGINT_EXIT : SIGTERM_EXIT;
  const restoreStatus = restoreElectronAbi();
  process.exit(restoreStatus !== 0 ? restoreStatus : code);
}

process.on("SIGINT", () => onSignal("SIGINT"));
process.on("SIGTERM", () => onSignal("SIGTERM"));

try {
  const nodeStatus = npmRun(
    REBUILD_NODE_SCRIPT,
    "rebuilding better-sqlite3 for Node…",
  );
  if (nodeStatus !== 0) {
    exitCode = nodeStatus;
  } else {
    exitCode = runCommand(command);
  }
} finally {
  const restoreStatus = restoreElectronAbi();
  if (restoreStatus !== 0 && exitCode === 0) {
    exitCode = restoreStatus;
  }
}

process.exit(exitCode);
