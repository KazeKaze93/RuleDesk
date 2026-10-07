import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { z } from "zod";
import { BaseController } from "@/main/core/ipc/BaseController";
import { ErrorCode } from "@/main/types/ipc";

vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
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

  it("throws a real Error with message and code (not a plain object)", async () => {
    controller.register("test:fail", z.tuple([]), async () => {
      throw new Error("credentials missing");
    });

    const handler = getHandler("test:fail");
    let caught: unknown;
    try {
      await handler({} as IpcMainInvokeEvent);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    const err = caught as Error & { code?: string };
    expect(err.message).toBe("credentials missing");
    expect(err.code).toBe(ErrorCode.AUTH_ERROR);
    // Renderer must not see String(plainObject) === "[object Object]"
    expect(String(err)).not.toContain("[object Object]");
  });

  it("validation failures also throw Error instances with VALIDATION_ERROR code", async () => {
    controller.register(
      "test:validate",
      z.tuple([z.object({ id: z.number() })]),
      async () => true
    );

    const handler = getHandler("test:validate");
    let caught: unknown;
    try {
      await handler({} as IpcMainInvokeEvent, { id: "nope" });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    const err = caught as Error & { code?: string };
    expect(typeof err.message).toBe("string");
    expect(err.message.length).toBeGreaterThan(0);
    expect(err.message).not.toBe("[object Object]");
    expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
});
