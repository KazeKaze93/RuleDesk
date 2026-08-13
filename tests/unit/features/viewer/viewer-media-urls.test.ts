import { describe, expect, it } from "vitest";
import { buildViewerFullImageChain } from "@/renderer/features/viewer/viewer-media-urls";

describe("buildViewerFullImageChain", () => {
  it("rewrites api-cdn-mp4.rule34.xxx fileUrl to image CDN mirrors", () => {
    const original = "https://api-cdn-mp4.rule34.xxx/images/1.jpg";
    const chain = buildViewerFullImageChain({ fileUrl: original });

    expect(chain[0]).toBe(original);
    expect(chain).toContain("https://wimg.rule34.xxx/images/1.jpg");
    expect(chain).toContain("https://img.rule34.xxx/images/1.jpg");
    expect(chain).toContain("https://us.rule34.xxx/images/1.jpg");
    expect(chain).toContain("https://api-cdn.rule34.xxx/images/1.jpg");
    expect(chain.filter((url) => url.includes("api-cdn-mp4")).length).toBe(1);
  });

  it("does not rewrite a known image CDN onto the MP4 host", () => {
    const chain = buildViewerFullImageChain({
      fileUrl: "https://img.rule34.xxx/images/1.jpg",
    });

    expect(chain[0]).toBe("https://img.rule34.xxx/images/1.jpg");
    expect(chain).toContain("https://wimg.rule34.xxx/images/1.jpg");
    expect(chain.some((url) => url.includes("api-cdn-mp4"))).toBe(false);
    expect(chain.length).toBeGreaterThan(1);
  });
});
