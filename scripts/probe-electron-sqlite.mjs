/**
 * Exit 0 if Electron can load better-sqlite3 (correct ABI), else non-zero.
 * Invoked via: ELECTRON_RUN_AS_NODE=1 electron scripts/probe-electron-sqlite.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

try {
  require("better-sqlite3");
  process.stdout.write("ok\n");
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
