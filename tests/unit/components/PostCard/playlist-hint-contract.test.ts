import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { POST_CARD_PLAYLIST_RIGHT_CLICK_HINT } from "@/features/artists/components/PostCard";

const POST_CARD_SOURCE = readFileSync(
  resolve(
    process.cwd(),
    "src/renderer/features/artists/components/PostCard.tsx"
  ),
  "utf8"
);

describe("PostCard playlist hover hint contract", () => {
  it("exposes right-click playlist discoverability copy", () => {
    expect(POST_CARD_PLAYLIST_RIGHT_CLICK_HINT).toBe(
      "Right-click a post to add it to a playlist"
    );
  });

  it("wires Tooltip on the playlist control only, keeps aria, drops title", () => {
    expect(POST_CARD_SOURCE).toContain("POST_CARD_PLAYLIST_RIGHT_CLICK_HINT");
    expect(POST_CARD_SOURCE).toContain("QuickAddToPlaylistMenu");
    expect(POST_CARD_SOURCE).toContain('aria-label="Add to playlist"');
    expect(POST_CARD_SOURCE).toContain("TooltipTrigger");
    expect(POST_CARD_SOURCE).toContain("TooltipContent");
    expect(POST_CARD_SOURCE).toContain('className="pointer-events-none"');
    expect(POST_CARD_SOURCE).not.toContain('title="Add to playlist"');
  });
});
