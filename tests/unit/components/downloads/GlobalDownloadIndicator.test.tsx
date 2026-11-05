// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("puts aria-live on status, not the per-file counter, and mirrors done/total on progress", () => {
    act(() => {
      useDownloadStore.getState().startDownload({ done: 2, total: 8 });
    });
    render(<GlobalDownloadIndicator />);

    const status = screen.getByText("Downloading");
    expect(status.getAttribute("aria-live")).toBe("polite");

    const counter = screen.getByText("2/8");
    expect(counter.getAttribute("aria-live")).toBeNull();
    expect(counter.getAttribute("aria-hidden")).toBe("true");

    const bar = document.querySelector("progress");
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute("value")).toBe("2");
    expect(bar?.getAttribute("max")).toBe("8");
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
    const bar = document.querySelector("progress");
    expect(bar?.getAttribute("value")).toBe("4");
    expect(bar?.getAttribute("max")).toBe("5");

    act(() => {
      useDownloadStore.getState().resetDownload();
    });
    rerender(<GlobalDownloadIndicator />);
    expect(screen.queryByTestId("global-download-indicator")).toBeNull();
  });

  it("pause and resume update store only after IPC succeeds", async () => {
    act(() => {
      useDownloadStore.getState().startDownload({ done: 0, total: 3 });
    });
    render(<GlobalDownloadIndicator />);

    const pauseButton = screen.getByRole("button", { name: "Pause download" });
    expect(pauseButton.getAttribute("title")).toBe("Pause");
    fireEvent.click(pauseButton);
    expect(window.api.pauseDownloadAll).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(useDownloadStore.getState().isPaused).toBe(true);
    });

    const resumeButton = screen.getByRole("button", { name: "Resume download" });
    expect(resumeButton.getAttribute("title")).toBe("Resume");
    fireEvent.click(resumeButton);
    expect(window.api.resumeDownloadAll).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(useDownloadStore.getState().isPaused).toBe(false);
    });

    const cancelButton = screen.getByRole("button", { name: "Cancel download" });
    expect(cancelButton.getAttribute("title")).toBe("Cancel");
    fireEvent.click(cancelButton);
    expect(window.api.cancelDownloadAll).toHaveBeenCalledTimes(1);
  });

  it("does not mark paused when pauseDownloadAll rejects", async () => {
    window.api.pauseDownloadAll = vi.fn(async () => {
      throw new Error("pause failed");
    });

    act(() => {
      useDownloadStore.getState().startDownload({ done: 0, total: 3 });
    });
    render(<GlobalDownloadIndicator />);

    fireEvent.click(screen.getByRole("button", { name: "Pause download" }));
    await waitFor(() => {
      expect(window.api.pauseDownloadAll).toHaveBeenCalledTimes(1);
    });
    expect(useDownloadStore.getState().isPaused).toBe(false);
    expect(screen.getByText("Downloading")).toBeTruthy();
  });
});
