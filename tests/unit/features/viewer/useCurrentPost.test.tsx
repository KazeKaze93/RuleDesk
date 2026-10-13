// @vitest-environment happy-dom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { Post } from "@shared/types/db";
import { useCurrentPost } from "@/features/viewer/hooks/useCurrentPost";
import { buildViewerOriginQueryKey } from "@/features/viewer/buildViewerOriginQueryKey";
import { makePost } from "../../components/PostCard/makePost";

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

afterEach(() => {
  cleanup();
});

describe("useCurrentPost", () => {
  it("updates when gallery infinite cache gains tags without remounting viewer", async () => {
    const queryClient = createQueryClient();
    const origin = {
      kind: "artist" as const,
      artistId: 7,
      aiFilter: "all" as const,
      mediaType: "all" as const,
      source: "all" as const,
      sortOrder: "desc" as const,
    };
    const queryKey = buildViewerOriginQueryKey(origin);
    expect(queryKey).not.toBeNull();

    const thinPost = makePost({ id: 42, postId: 1001, tags: "" });
    const richPost = makePost({
      id: 42,
      postId: 1001,
      tags: "wlop 2b general_tag",
    });

    queryClient.setQueryData<InfiniteData<Post[]>>(queryKey!, {
      pages: [[thinPost]],
      pageParams: [0],
    });

    const { result } = renderHook(
      () => useCurrentPost(42, origin),
      { wrapper: wrapperFor(queryClient) }
    );

    expect(result.current?.tags).toBe("");

    act(() => {
      queryClient.setQueryData<InfiniteData<Post[]>>(queryKey!, {
        pages: [[richPost]],
        pageParams: [0],
      });
    });

    await waitFor(() => {
      expect(result.current?.tags).toBe("wlop 2b general_tag");
    });
  });
});
