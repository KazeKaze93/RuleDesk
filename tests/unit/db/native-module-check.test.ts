import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorCode } from "../../../src/shared/types/error-codes";
import { getErrorCode } from "../../../src/shared/utils/type-guards";
import type { SqliteProbeConstructor } from "../../../src/main/db/native-module-check";

const mockApp = vi.hoisted(() => ({
  isPackaged: false,
  getPath: () => "/tmp",
}));

vi.mock("electron", () => ({
  app: mockApp,
}));

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    transports: {
      main: { level: false },
      renderer: { level: false },
      console: { level: false, format: "" },
      file: { level: "info", resolvePathFn: vi.fn() },
      ipc: {},
    },
    errorHandler: { startCatching: vi.fn() },
  },
}));

import { assertNativeSqliteLoadable } from "../../../src/main/db/native-module-check";

const ABI_MISMATCH_MESSAGE =
  "The module 'better_sqlite3.node' was compiled against a different Node.js version using NODE_MODULE_VERSION 115. This version of Node.js requires NODE_MODULE_VERSION 128.";

function throwingCtor(message: string): SqliteProbeConstructor {
  return class ThrowingSqliteProbe {
    constructor(_filename: string) {
      throw new Error(message);
    }
    close(): void {
      // unreachable — constructor throws
    }
  };
}

describe("assertNativeSqliteLoadable", () => {
  beforeEach(() => {
    mockApp.isPackaged = false;
  });

  it("throws SQLITE_NATIVE_LOAD_FAILED with original message and rebuild hint when constructor throws (dev)", () => {
    expect(() =>
      assertNativeSqliteLoadable(throwingCtor(ABI_MISMATCH_MESSAGE))
    ).toThrowError(/NODE_MODULE_VERSION/);

    try {
      assertNativeSqliteLoadable(throwingCtor(ABI_MISMATCH_MESSAGE));
      expect.fail("expected throw");
    } catch (error) {
      expect(getErrorCode(error)).toBe(ErrorCode.SQLITE_NATIVE_LOAD_FAILED);
      expect(error).toMatchObject({
        name: "SqliteNativeLoadError",
        causeMessage: ABI_MISMATCH_MESSAGE,
      });
      expect(error instanceof Error ? error.message : "").toContain(
        "run npm run db:rebuild"
      );
    }
  });

  it("throws a neutral packaged message without rebuild hint", () => {
    mockApp.isPackaged = true;

    try {
      assertNativeSqliteLoadable(throwingCtor(ABI_MISMATCH_MESSAGE));
      expect.fail("expected throw");
    } catch (error) {
      expect(getErrorCode(error)).toBe(ErrorCode.SQLITE_NATIVE_LOAD_FAILED);
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toContain("npm run db:rebuild");
      expect(message).not.toContain("NODE_MODULE_VERSION");
      expect(message).toMatch(/database engine failed to start/i);
    }
  });

  it("returns when injected constructor opens and closes successfully", () => {
    let closed = false;
    const OkCtor: SqliteProbeConstructor = class OkSqliteProbe {
      constructor(_filename: string) {
        // probe open succeeds
      }
      close(): void {
        closed = true;
      }
    };

    expect(() => assertNativeSqliteLoadable(OkCtor)).not.toThrow();
    expect(closed).toBe(true);
  });
});
