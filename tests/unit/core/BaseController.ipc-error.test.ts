import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { z } from "zod";
import { BaseController } from "@/main/core/ipc/BaseController";
import { ErrorCode } from "@/shared/types/error-codes";
import { createCodedError } from "@/shared/utils/coded-error";
import { invokeIpc } from "@/preload/invoke-ipc";
import {
  isIpcFailureResult,
  unwrapIpcInvokeResult,
} from "@/shared/utils/ipc-result";
import { getErrorCode } from "@/shared/utils/type-guards";

vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
  },
}));

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

class TestController extends BaseController {
  public setup(): void {
    // no-op
  }

  public register(
    channel: string,
    schema: z.ZodTypeAny,
    handler: (
      event: IpcMainInvokeEvent,
      ...args: unknown[]
    ) => Promise<unknown> | unknown
  ): void {
    this.handle(channel, schema, handler);
  }
}

function getHandler(
  channel: string
): (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> {
  const registration = vi
    .mocked(ipcMain.handle)
    .mock.calls.find(([registeredChannel]) => registeredChannel === channel);
  if (!registration) {
    throw new Error(`Handler not registered for channel: ${channel}`);
  }
  return registration[1];
}

describe("BaseController IPC error shape", () => {
  let controller: TestController;

  beforeEach(() => {
    vi.mocked(ipcMain.handle).mockClear();
    controller = new TestController();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a failure envelope with message and code (does not throw)", async () => {
    controller.register("test:fail", z.tuple([]), async () => {
      throw createCodedError("credentials missing", ErrorCode.AUTH_ERROR);
    });

    const handler = getHandler("test:fail");
    const result = await handler({} as IpcMainInvokeEvent);

    expect(isIpcFailureResult(result)).toBe(true);
    if (!isIpcFailureResult(result)) {
      throw new Error("expected failure envelope");
    }
    expect(result.error.message).toBe("credentials missing");
    expect(result.error.code).toBe(ErrorCode.AUTH_ERROR);
  });

  it("does not infer ErrorCode from English message substrings", async () => {
    controller.register("test:no-infer", z.tuple([]), async () => {
      throw new Error("credentials missing / database / rate limit / network");
    });

    const handler = getHandler("test:no-infer");
    const result = await handler({} as IpcMainInvokeEvent);

    expect(isIpcFailureResult(result)).toBe(true);
    if (!isIpcFailureResult(result)) {
      throw new Error("expected failure envelope");
    }
    expect(result.error.code).toBe(ErrorCode.UNKNOWN_ERROR);
  });

  it("validation failures return VALIDATION_ERROR envelope", async () => {
    controller.register(
      "test:validate",
      z.tuple([z.object({ id: z.number() })]),
      async () => true
    );

    const handler = getHandler("test:validate");
    const result = await handler({} as IpcMainInvokeEvent, { id: "nope" });

    expect(isIpcFailureResult(result)).toBe(true);
    if (!isIpcFailureResult(result)) {
      throw new Error("expected failure envelope");
    }
    expect(result.error.message.length).toBeGreaterThan(0);
    expect(result.error.message).not.toBe("[object Object]");
    expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it("preload invokeIpc rethrows Error with code after Structured Clone", async () => {
    controller.register("test:preload", z.tuple([]), async () => {
      throw createCodedError("credentials missing", ErrorCode.AUTH_ERROR);
    });

    const handler = getHandler("test:preload");
    const envelope = await handler({} as IpcMainInvokeEvent);
    // Simulate Electron IPC: resolve path clones the return value
    const cloned = structuredClone(envelope);

    const { ipcRenderer } = await import("electron");
    vi.mocked(ipcRenderer.invoke).mockResolvedValueOnce(cloned);

    let caught: unknown;
    try {
      await invokeIpc("test:preload");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(getErrorCode(caught)).toBe(ErrorCode.AUTH_ERROR);
    if (!(caught instanceof Error)) {
      throw new Error("expected Error");
    }
    expect(caught.message).toBe("credentials missing");
  });

  it("unwrapIpcInvokeResult exposes code on the rethrown Error", () => {
    const envelope = {
      ok: false as const,
      error: {
        message: "rate limited",
        code: ErrorCode.RATE_LIMIT,
        name: "Error",
      },
    };
    const cloned = structuredClone(envelope);
    let caught: unknown;
    try {
      unwrapIpcInvokeResult(cloned);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(getErrorCode(caught)).toBe(ErrorCode.RATE_LIMIT);
  });
});
