import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROBE_SCRIPT = path.join(ROOT, "scripts", "probe-electron-sqlite.mjs");
const isWin = process.platform === "win32";

/**
 * @returns {boolean}
 */
function electronCanLoadSqlite() {
  const result = spawnSync(
    "npx",
    [
      "cross-env",
      "ELECTRON_RUN_AS_NODE=1",
      "electron",
      PROBE_SCRIPT,
    ],
    {
      cwd: ROOT,
      shell: true,
      encoding: "utf8",
      env: process.env,
    },
  );
  return result.status === 0 && (result.stdout ?? "").includes("ok");
}

/**
 * @returns {number}
 */
function rebuildForElectron() {
  process.stderr.write(
    "[dev] better-sqlite3 ABI mismatch — restoring Electron build (npm run db:rebuild)…\n",
  );
  const result = spawnSync("npm", ["run", "db:rebuild"], {
    cwd: ROOT,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  return result.status ?? 1;
}

function ensureElectronSqlite() {
  if (electronCanLoadSqlite()) {
    return true;
  }
  const status = rebuildForElectron();
  if (status !== 0) {
    process.stderr.write(
      "[dev] Failed to rebuild better-sqlite3 for Electron. Run: npm run db:rebuild\n",
    );
    return false;
  }
  if (!electronCanLoadSqlite()) {
    process.stderr.write(
      "[dev] better-sqlite3 still fails under Electron after rebuild.\n",
    );
    return false;
  }
  return true;
}

if (isWin) {
  // Ensure UTF-8 console so electron-vite / Electron logs render correctly on Windows.
  spawn("chcp", ["65001"], { stdio: "ignore", shell: true }).on("close", () => {
    startDev();
  });
} else {
  startDev();
}

function startDev() {
  if (!ensureElectronSqlite()) {
    process.exit(1);
  }
  runDev();
}

function runDev() {
  const child = spawn(
    "npx",
    ["cross-env", "NODE_ENV=development", "electron-vite", "dev"],
    {
      stdio: "inherit",
      shell: true,
      env: process.env,
      cwd: ROOT,
    },
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}
