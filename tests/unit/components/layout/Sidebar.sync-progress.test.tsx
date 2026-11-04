// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/layout/Sidebar";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

type Listener<T extends unknown[] = []> = (...args: T) => void;

type SyncApiHarness = {
  emitStart: () => void;
  emitProgress: (message: string) => void;
  emitEnd: () => void;
};

function installSyncApi(): SyncApiHarness {
  let start: Listener | null = null;
  let progress: Listener<[string]> | null = null;
  let end: Listener | null = null;

  window.api = {
    syncAll: vi.fn(async () => true),
    getUpdatesUnreadCount: vi.fn(async () => 0),
    getUpdatesLastSyncAt: vi.fn(async () => null),
    onSyncStart: (callback: Listener) => {
      start = callback;
      return vi.fn();
    },
    onSyncProgress: (callback: Listener<[string]>) => {
      progress = callback;
      return vi.fn();
    },
    onSyncEnd: (callback: Listener) => {
      end = callback;
      return vi.fn();
    },
  } as unknown as Window["api"];

  return {
    emitStart: () => start?.(),
    emitProgress: (message) => progress?.(message),
    emitEnd: () => end?.(),
  };
}

function renderSidebar(): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Sidebar sync progress label", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows Syncing <artist>... on PROGRESS and Sync now after END", () => {
    const api = installSyncApi();
    renderSidebar();

    expect(screen.getByRole("button", { name: /Sync now/i })).toBeTruthy();

    act(() => api.emitStart());
    expect(screen.getByRole("button", { name: /Syncing\.\.\./i })).toBeTruthy();

    act(() => api.emitProgress("Checking a..."));
    const progressButton = screen.getByRole("button", {
      name: /Syncing a\.\.\./i,
    });
    expect(progressButton).toBeTruthy();
    expect(progressButton.className).toMatch(/\bopacity-70\b/);
    const label = progressButton.querySelector("span");
    expect(label?.className).toMatch(/\bflex-1\b/);
    expect(label?.className).toMatch(/\btruncate\b/);

    act(() => api.emitEnd());
    expect(screen.getByRole("button", { name: /Sync now/i })).toBeTruthy();
  });
});
