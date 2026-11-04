// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TagsDrawer } from "@/features/viewer/TagsDrawer";
import {
  VIEWER_UPDATED_DATE_LABEL,
  VIEWER_UPDATED_DATE_TOOLTIP,
} from "@/features/viewer/viewer-date-labels";
import { makePost } from "../../components/PostCard/makePost";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

function installResolveApi(): void {
  const api = {
    getTrackedArtists: vi.fn(async () => []),
    resolveTags: vi.fn(async () => []),
    resolveCharacterTags: vi.fn(async () => []),
    resolveCopyrightTags: vi.fn(async () => []),
  };
  // Partial Window.api stub for drawer resolve queries only.
  // @ts-expect-error test harness supplies only the IPC methods this suite exercises
  window.api = api;
}

const originalResizeObserver = globalThis.ResizeObserver;

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = originalResizeObserver;
});

beforeEach(() => {
  window.localStorage.setItem("hasSeenTagHint", "true");
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
  installResolveApi();
});

describe("TagsDrawer updated date label", () => {
  it("shows Updated heading with Rule34 change-time tooltip copy", () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TagsDrawer
            post={makePost({
              publishedAt: new Date("2024-06-15T12:30:00.000Z"),
            })}
            isOpen
            onOpenChange={vi.fn()}
            queue={null}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(VIEWER_UPDATED_DATE_LABEL).toBe("Updated");
    expect(VIEWER_UPDATED_DATE_TOOLTIP).toBe(
      "Rule34 reports the last change time, not the upload time"
    );

    const heading = screen.getByRole("heading", {
      name: VIEWER_UPDATED_DATE_LABEL,
    });
    expect(heading.textContent).toBe(VIEWER_UPDATED_DATE_LABEL);
    expect(heading.getAttribute("title")).toBe(VIEWER_UPDATED_DATE_TOOLTIP);
    expect(heading.getAttribute("tabindex")).toBe("0");
    expect(screen.queryByText("Published")).toBeNull();
  });
});
