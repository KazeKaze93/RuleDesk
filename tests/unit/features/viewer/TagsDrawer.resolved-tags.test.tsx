// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "@shared/types/db";
import { EXTERNAL_ARTIST_ID } from "@/shared/constants";
import { TagsDrawer } from "@/renderer/features/viewer/TagsDrawer";
import { makePost } from "../../components/PostCard/makePost";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

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

function installResolveApi(overrides?: {
  resolveTags?: () => Promise<string[]>;
  resolveCharacterTags?: () => Promise<string[]>;
  resolveCopyrightTags?: () => Promise<string[]>;
  getTrackedArtists?: () => Promise<never[]>;
}): {
  resolveTags: ReturnType<typeof vi.fn>;
  resolveCharacterTags: ReturnType<typeof vi.fn>;
  resolveCopyrightTags: ReturnType<typeof vi.fn>;
  getTrackedArtists: ReturnType<typeof vi.fn>;
} {
  const api = {
    getTrackedArtists: vi.fn(overrides?.getTrackedArtists ?? (async () => [])),
    resolveTags: vi.fn(overrides?.resolveTags ?? (async () => [])),
    resolveCharacterTags: vi.fn(
      overrides?.resolveCharacterTags ?? (async () => [])
    ),
    resolveCopyrightTags: vi.fn(
      overrides?.resolveCopyrightTags ?? (async () => [])
    ),
  };
  window.api = api as Window["api"];
  return api;
}

function renderDrawer(post: Post, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TagsDrawer
          post={post}
          isOpen
          onOpenChange={vi.fn()}
          queue={null}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function untrackedPost(tags: string): Post {
  return makePost({
    artistId: EXTERNAL_ARTIST_ID,
    tags,
  });
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
});

describe("TagsDrawer artist/character resolve states", () => {
  it("shows a loading status while resolve is in-flight, not confirmed-absent copy", async () => {
    const artist = createDeferred<string[]>();
    const character = createDeferred<string[]>();
    installResolveApi({
      resolveTags: () => artist.promise,
      resolveCharacterTags: () => character.promise,
      resolveCopyrightTags: async () => [],
    });
    const queryClient = createQueryClient();
    renderDrawer(untrackedPost("wlop 2b general_tag"), queryClient);

    expect(
      await screen.findByRole("status", { name: "Resolving artist" })
    ).toBeTruthy();
    expect(
      screen.getByRole("status", { name: "Resolving character" })
    ).toBeTruthy();
    expect(screen.queryByText("No artist detected")).toBeNull();
    expect(screen.queryByText("No character detected")).toBeNull();
  });

  it("shows resolved artist and character tags without user interaction", async () => {
    const artist = createDeferred<string[]>();
    const character = createDeferred<string[]>();
    installResolveApi({
      resolveTags: () => artist.promise,
      resolveCharacterTags: () => character.promise,
      resolveCopyrightTags: async () => [],
    });
    const queryClient = createQueryClient();
    renderDrawer(untrackedPost("wlop 2b general_tag"), queryClient);

    await screen.findByRole("status", { name: "Resolving artist" });
    artist.resolve(["wlop"]);
    character.resolve(["2b"]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "wlop" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "2b" })).toBeTruthy();
    });
    expect(screen.queryByRole("status", { name: "Resolving artist" })).toBeNull();
    expect(
      screen.queryByRole("status", { name: "Resolving character" })
    ).toBeNull();
    expect(screen.queryByText("No artist detected")).toBeNull();
    expect(screen.queryByText("No character detected")).toBeNull();
  });

  it("shows confirmed-absent copy after resolve returns empty, without a loading status", async () => {
    const artist = createDeferred<string[]>();
    const character = createDeferred<string[]>();
    installResolveApi({
      resolveTags: () => artist.promise,
      resolveCharacterTags: () => character.promise,
      resolveCopyrightTags: async () => [],
    });
    const queryClient = createQueryClient();
    renderDrawer(untrackedPost("solo highres"), queryClient);

    await screen.findByRole("status", { name: "Resolving artist" });
    artist.resolve([]);
    character.resolve([]);

    await waitFor(() => {
      expect(screen.getByText("No artist detected")).toBeTruthy();
      expect(screen.getByText("No character detected")).toBeTruthy();
    });
    expect(screen.queryByRole("status", { name: "Resolving artist" })).toBeNull();
    expect(
      screen.queryByRole("status", { name: "Resolving character" })
    ).toBeNull();
  });

  it("renders cached found tags on the first paint without a loading status", () => {
    installResolveApi();
    const tagsString = "wlop 2b general_tag";
    const queryClient = createQueryClient();
    queryClient.setQueryData(["artists"], []);
    queryClient.setQueryData(["resolve-tags-ipc", tagsString], ["wlop"]);
    queryClient.setQueryData(
      ["resolve-character-tags-ipc", tagsString],
      ["2b"]
    );
    queryClient.setQueryData(["resolve-copyright-tags-ipc", tagsString], []);

    renderDrawer(untrackedPost(tagsString), queryClient);

    expect(screen.getByRole("button", { name: "wlop" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2b" })).toBeTruthy();
    expect(screen.queryByRole("status", { name: "Resolving artist" })).toBeNull();
    expect(
      screen.queryByRole("status", { name: "Resolving character" })
    ).toBeNull();
    expect(screen.queryByText("No artist detected")).toBeNull();
    expect(screen.queryByText("No character detected")).toBeNull();
  });

  it("does not keep the previous post's loading status when switching posts", async () => {
    const postATags = "alpha_tag";
    const postBTags = "wlop general_tag";
    const artistA = createDeferred<string[]>();
    installResolveApi({
      resolveTags: () => artistA.promise,
      resolveCharacterTags: async () => [],
      resolveCopyrightTags: async () => [],
    });
    const queryClient = createQueryClient();
    queryClient.setQueryData(["artists"], []);
    queryClient.setQueryData(["resolve-tags-ipc", postBTags], ["wlop"]);
    queryClient.setQueryData(["resolve-character-tags-ipc", postBTags], []);
    queryClient.setQueryData(["resolve-copyright-tags-ipc", postBTags], []);

    const view = renderDrawer(untrackedPost(postATags), queryClient);
    await screen.findByRole("status", { name: "Resolving artist" });

    view.rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TagsDrawer
            post={untrackedPost(postBTags)}
            isOpen
            onOpenChange={vi.fn()}
            queue={null}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole("button", { name: "wlop" })).toBeTruthy();
    expect(screen.queryByRole("status", { name: "Resolving artist" })).toBeNull();
    expect(screen.queryByText("No artist detected")).toBeNull();
  });
});
