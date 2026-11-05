// @vitest-environment happy-dom
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSubscribeDownloadAllProgress } from "@/hooks/useSubscribeDownloadAllProgress";
import { useDownloadStore } from "@/store/downloadStore";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

type ProgressPayload = { id: string; percent: number; done: number; total: number };

function Harness() {
  useSubscribeDownloadAllProgress();
  return null;
}

describe("useSubscribeDownloadAllProgress", () => {
  let container: HTMLDivElement;
  let root: Root;
  let progressListener: ((data: ProgressPayload) => void) | null;
  let unsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useDownloadStore.getState().resetDownload();
    progressListener = null;
    unsubscribe = vi.fn();
    window.api = {
      onDownloadAllProgress: vi.fn((callback: (data: ProgressPayload) => void) => {
        progressListener = callback;
        return unsubscribe;
      }),
    } as unknown as Window["api"];

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("subscribes once on mount and writes progress into the store", () => {
    useDownloadStore.getState().startDownload({ total: 10 });

    act(() => {
      root.render(createElement(Harness));
    });

    expect(window.api.onDownloadAllProgress).toHaveBeenCalledTimes(1);
    expect(progressListener).not.toBeNull();

    act(() => {
      progressListener?.({ id: "batch", percent: 40, done: 4, total: 10 });
    });

    expect(useDownloadStore.getState().progress).toEqual({ done: 4, total: 10 });
  });

  it("unsubscribes on unmount", () => {
    act(() => {
      root.render(createElement(Harness));
    });

    act(() => {
      root.unmount();
    });

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
