// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GlobalDownloadIndicator } from "@/components/downloads/GlobalDownloadIndicator";
import { useDownloadStore } from "@/store/downloadStore";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("GlobalDownloadIndicator", () => {
  beforeEach(() => {
    useDownloadStore.getState().resetDownload();
    window.api = {
      pauseDownloadAll: vi.fn(async () => undefined),
      resumeDownloadAll: vi.fn(async () => undefined),
      cancelDownloadAll: vi.fn(async () => undefined),
    } as unknown as Window["api"];
  });

  afterEach(() => {
    cleanup();
  });

  it("is hidden when idle and appears with counter while downloading", () => {
    const { rerender } = render(<GlobalDownloadIndicator />);
    expect(screen.queryByTestId("global-download-indicator")).toBeNull();

    act(() => {
      useDownloadStore.getState().startDownload({ done: 2, total: 8 });
    });
    rerender(<GlobalDownloadIndicator />);

    expect(screen.getByTestId("global-download-indicator")).toBeTruthy();
    expect(screen.getByText("2/8")).toBeTruthy();
    expect(screen.getByText("Downloading")).toBeTruthy();
  });

  it("updates the counter from the store and disappears on reset", () => {
    act(() => {
      useDownloadStore.getState().startDownload({ done: 1, total: 5 });
    });
    const { rerender } = render(<GlobalDownloadIndicator />);
    expect(screen.getByText("1/5")).toBeTruthy();

    act(() => {
      useDownloadStore.getState().setProgress(4, 5);
    });
    rerender(<GlobalDownloadIndicator />);
    expect(screen.getByText("4/5")).toBeTruthy();

    act(() => {
      useDownloadStore.getState().resetDownload();
    });
    rerender(<GlobalDownloadIndicator />);
    expect(screen.queryByTestId("global-download-indicator")).toBeNull();
  });

  it("pause, resume, and cancel call the matching window.api methods", () => {
    act(() => {
      useDownloadStore.getState().startDownload({ done: 0, total: 3 });
    });
    render(<GlobalDownloadIndicator />);

    fireEvent.click(screen.getByRole("button", { name: "Pause download" }));
    expect(window.api.pauseDownloadAll).toHaveBeenCalledTimes(1);
    expect(useDownloadStore.getState().isPaused).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Resume download" }));
    expect(window.api.resumeDownloadAll).toHaveBeenCalledTimes(1);
    expect(useDownloadStore.getState().isPaused).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Cancel download" }));
    expect(window.api.cancelDownloadAll).toHaveBeenCalledTimes(1);
  });
});
