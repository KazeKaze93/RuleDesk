// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostCard } from "@/renderer/features/artists/components/PostCard";
import { useSearchStore } from "@/renderer/store/searchStore";
import { makePost } from "./makePost";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/renderer/lib/hooks/useVideoProxyUrl", () => ({
  useVideoProxyUrl: () => null,
}));

vi.mock("@/renderer/components/playlists/QuickAddToPlaylistMenu", () => ({
  QuickAddToPlaylistMenu: ({ trigger }: { trigger?: ReactNode }) =>
    trigger ?? null,
}));

const originalIntersectionObserver = globalThis.IntersectionObserver;

afterEach(() => {
  cleanup();
  globalThis.IntersectionObserver = originalIntersectionObserver;
});

beforeEach(() => {
  useSearchStore.setState({ viewType: "grid" });
  globalThis.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    observe(): void {}
    disconnect(): void {}
    unobserve(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };
});

describe("PostCard viewType styling", () => {
  describe("grid", () => {
    it("applies aspect-[2/3] on the card", () => {
      render(<PostCard post={makePost()} onClick={vi.fn()} />);
      const card = screen.getByRole("button", { name: /view post 1/i });
      expect(card.className).toContain("aspect-[2/3]");
    });

    it("applies h-full object-contain on the preview image", () => {
      render(<PostCard post={makePost()} onClick={vi.fn()} />);
      const image = screen.getByAltText("Post 1");
      expect(image.className).toContain("h-full");
      expect(image.className).toContain("object-contain");
    });

    it("applies h-full on the media container", () => {
      const { container } = render(
        <PostCard post={makePost()} onClick={vi.fn()} />
      );
      const media = container.querySelector(".bg-muted");
      expect(media?.className).toContain("h-full");
    });
  });

  describe("masonry", () => {
    beforeEach(() => {
      useSearchStore.setState({ viewType: "masonry" });
    });

    it("does not apply an aspect-ratio class", () => {
      render(<PostCard post={makePost()} onClick={vi.fn()} />);
      const card = screen.getByRole("button", { name: /view post 1/i });
      expect(card.className).not.toContain("aspect-[2/3]");
      expect(card.className).not.toContain("aspect-[3/4]");
    });

    it("applies h-auto on the preview image", () => {
      render(<PostCard post={makePost()} onClick={vi.fn()} />);
      const image = screen.getByAltText("Post 1");
      expect(image.className).toContain("h-auto");
      expect(image.className).not.toContain("object-contain");
    });

    it("does not apply h-full on the media container", () => {
      const { container } = render(
        <PostCard post={makePost()} onClick={vi.fn()} />
      );
      const media = container.querySelector(".bg-muted");
      expect(media?.className).not.toContain("h-full");
    });

    it("applies min-h-[200px] on the no-preview fallback", () => {
      render(
        <PostCard
          post={makePost({ previewUrl: "" })}
          onClick={vi.fn()}
        />
      );
      const fallback = screen.getByText("No Preview");
      expect(fallback.className).toContain("min-h-[200px]");
      expect(fallback.className).not.toContain("h-full");
    });
  });

  describe("viewType switching", () => {
    it("drops aspect-[2/3] when switching from grid to masonry", () => {
      const { rerender } = render(
        <PostCard post={makePost()} onClick={vi.fn()} />
      );
      expect(
        screen.getByRole("button", { name: /view post 1/i }).className
      ).toContain("aspect-[2/3]");

      act(() => {
        useSearchStore.setState({ viewType: "masonry" });
      });
      rerender(<PostCard post={makePost()} onClick={vi.fn()} />);

      expect(
        screen.getByRole("button", { name: /view post 1/i }).className
      ).not.toContain("aspect-[2/3]");
    });

    it("applies aspect-[2/3] when switching from masonry to grid", () => {
      useSearchStore.setState({ viewType: "masonry" });
      const { rerender } = render(
        <PostCard post={makePost()} onClick={vi.fn()} />
      );
      expect(
        screen.getByRole("button", { name: /view post 1/i }).className
      ).not.toContain("aspect-[2/3]");

      act(() => {
        useSearchStore.setState({ viewType: "grid" });
      });
      rerender(<PostCard post={makePost()} onClick={vi.fn()} />);

      expect(
        screen.getByRole("button", { name: /view post 1/i }).className
      ).toContain("aspect-[2/3]");
    });

    it("honors preserveAspect over the store viewType", () => {
      useSearchStore.setState({ viewType: "masonry" });
      render(
        <PostCard
          post={makePost()}
          onClick={vi.fn()}
          preserveAspect={true}
        />
      );
      expect(
        screen.getByRole("button", { name: /view post 1/i }).className
      ).toContain("aspect-[2/3]");
    });
  });
});
