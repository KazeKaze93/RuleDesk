import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { z } from "zod";
import log from "electron-log";
import { BaseController } from "@/main/core/ipc/BaseController";

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

type CollapseEntry = {
  promise: Promise<unknown>;
  createdAt: number;
  timeoutId: NodeJS.Timeout;
};

type BaseControllerInternals = {
  throttleMap: Map<string, number>;
  requestCollapseMap: Map<string, CollapseEntry>;
  REQUEST_COLLAPSE_TIMEOUT_MS: number;
  THROTTLE_MS: number;
  callCount: number;
};

function getInternals(): BaseControllerInternals {
  return BaseController as unknown as BaseControllerInternals;
}

function clearControllerState(): void {
  const internals = getInternals();
  for (const entry of internals.requestCollapseMap.values()) {
    clearTimeout(entry.timeoutId);
  }
  internals.requestCollapseMap.clear();
  internals.throttleMap.clear();
  internals.callCount = 0;
}

function getRegisteredHandler(
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

class TestController extends BaseController {
  public setup(): void {
    // no-op — tests register handlers explicitly
  }

  public registerIdempotent(
    channel: string,
    schema: z.ZodTypeAny,
    handler: (
      event: IpcMainInvokeEvent,
      ...args: unknown[]
    ) => Promise<unknown> | unknown
  ): void {
    this.handle(channel, schema, handler, { isIdempotent: true });
  }

  public registerMutating(
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

describe("BaseController request collapsing and throttle", () => {
  let controller: TestController;
  const mockEvent = {} as IpcMainInvokeEvent;

  beforeEach(() => {
    vi.clearAllMocks();
    clearControllerState();
    controller = new TestController();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearControllerState();
  });

  it("collapses concurrent identical args into a single handler call", async () => {
    let resolveHandler!: (value: string) => void;
    const handlerGate = new Promise<string>((resolve) => {
      resolveHandler = resolve;
    });
    const handler = vi.fn(async () => handlerGate);

    controller.registerIdempotent(
      "test:identical",
      z.tuple([z.object({ id: z.number(), filters: z.string() })]),
      handler
    );

    const invoke = getRegisteredHandler("test:identical");
    const args = { id: 1, filters: "A" };

    const first = invoke(mockEvent, args);
    const second = invoke(mockEvent, args);

    expect(handler).toHaveBeenCalledTimes(1);

    resolveHandler("shared-result");
    await expect(Promise.all([first, second])).resolves.toEqual([
      "shared-result",
      "shared-result",
    ]);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not mix results when id matches but other fields differ", async () => {
    const handler = vi.fn(
      async (
        _event: IpcMainInvokeEvent,
        payload: unknown
      ): Promise<string> => {
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("filters" in payload)
        ) {
          throw new Error("Unexpected payload");
        }
        const filters = Reflect.get(payload, "filters");
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 20);
        });
        return `result-${String(filters)}`;
      }
    );

    controller.registerIdempotent(
      "test:same-id-diff-filters",
      z.object({ id: z.number(), filters: z.string() }),
      handler
    );

    const invoke = getRegisteredHandler("test:same-id-diff-filters");

    const [resultA, resultB] = await Promise.all([
      invoke(mockEvent, { id: 1, filters: "A" }),
      invoke(mockEvent, { id: 1, filters: "B" }),
    ]);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(resultA).toBe("result-A");
    expect(resultB).toBe("result-B");
  });

  it("collapses filter objects without id and does not warn about disabled collapsing", async () => {
    const handler = vi.fn(async () => 42);

    controller.registerIdempotent(
      "db:get-posts-count-with-filters",
      z.object({
        artistId: z.number().optional(),
        filters: z.object({ search: z.string() }),
      }),
      handler
    );

    const invoke = getRegisteredHandler("db:get-posts-count-with-filters");
    const payload = { artistId: 7, filters: { search: "tag" } };

    const [a, b] = await Promise.all([
      invoke(mockEvent, payload),
      invoke(mockEvent, payload),
    ]);

    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(log.warn).not.toHaveBeenCalledWith(
      expect.stringContaining("Request Collapsing disabled")
    );
  });

  it("delays rapid mutating calls instead of rejecting with Rate limit exceeded", async () => {
    vi.useFakeTimers();
    const handler = vi.fn(async (_event: IpcMainInvokeEvent, id: unknown) => id);

    controller.registerMutating(
      "db:mark-viewed",
      z.tuple([z.number()]),
      handler
    );

    const invoke = getRegisteredHandler("db:mark-viewed");

    const firstPromise = invoke(mockEvent, 1);
    await firstPromise;

    const secondPromise = invoke(mockEvent, 2);
    // Second call should be waiting on throttle spacing, not rejected
    expect(handler).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(getInternals().THROTTLE_MS);
    await expect(secondPromise).resolves.toBe(2);
    expect(handler).toHaveBeenCalledTimes(2);

    const thrown = await secondPromise.then(
      () => null,
      (error: unknown) => error
    );
    expect(thrown).toBeNull();
  });

  it("removes stuck collapse promises after timeout", async () => {
    vi.useFakeTimers();

    controller.registerIdempotent(
      "test:hang",
      z.tuple([]),
      () => new Promise<never>(() => undefined)
    );

    const invoke = getRegisteredHandler("test:hang");
    void invoke(mockEvent);

    expect(getInternals().requestCollapseMap.size).toBe(1);

    await vi.advanceTimersByTimeAsync(
      getInternals().REQUEST_COLLAPSE_TIMEOUT_MS
    );

    expect(getInternals().requestCollapseMap.size).toBe(0);
    expect(log.warn).toHaveBeenCalledWith(
      expect.stringContaining("Timeout cleanup")
    );
  });

  it("uses the same collapse key regardless of object key insertion order", async () => {
    let resolveHandler!: (value: string) => void;
    const handler = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveHandler = resolve;
        })
    );

    controller.registerIdempotent(
      "test:key-order",
      z.object({ id: z.number(), filters: z.string() }),
      handler
    );

    const invoke = getRegisteredHandler("test:key-order");

    const first: Record<string, unknown> = {};
    first.id = 1;
    first.filters = "A";

    const second: Record<string, unknown> = {};
    second.filters = "A";
    second.id = 1;

    const p1 = invoke(mockEvent, first);
    const p2 = invoke(mockEvent, second);

    expect(handler).toHaveBeenCalledTimes(1);
    resolveHandler("ok");
    await expect(Promise.all([p1, p2])).resolves.toEqual(["ok", "ok"]);
  });
});
