/**
 * Guards the electron-vite layout: workers are `out/main/workers/*.cjs`,
 * callers are bundled into `out/main/main.cjs` (same as vacuum/download).
 * Requires `npm run build` so the artifact exists.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { resolveBackupIntegrityWorkerPath } from "../../../src/main/workers/runBackupIntegrityWorker";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const BUILT_WORKER = path.join(
  REPO_ROOT,
  "out/main/workers/backupIntegrityWorker.cjs"
);
const WRONG_BESIDE_MAIN = path.join(
  REPO_ROOT,
  "out/main/backupIntegrityWorker.cjs"
);

describe("resolveBackupIntegrityWorkerPath", () => {
  beforeAll(() => {
    if (!fs.existsSync(BUILT_WORKER)) {
      throw new Error(
        `Missing ${BUILT_WORKER}. Run npm run build before this suite.`
      );
    }
  });

  it("resolves to the built out/main/workers artifact (not beside main.cjs)", () => {
    const resolved = resolveBackupIntegrityWorkerPath();
    expect(fs.existsSync(resolved)).toBe(true);
    expect(path.normalize(resolved)).toBe(path.normalize(BUILT_WORKER));
    expect(fs.existsSync(WRONG_BESIDE_MAIN)).toBe(false);
  });

  it("packaged layout matches vacuum: __dirname/workers/<name>.cjs from out/main", () => {
    const fromMainDir = path.join(
      REPO_ROOT,
      "out/main",
      "workers",
      "backupIntegrityWorker.cjs"
    );
    expect(fs.existsSync(fromMainDir)).toBe(true);
    expect(path.normalize(fromMainDir)).toBe(path.normalize(BUILT_WORKER));
  });
});
