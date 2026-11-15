import { afterEach, describe, expect, it, vi } from "vitest";

import {
  canDownload,
  downloadFileName,
  downloadOriginal,
  fetchOriginalUrl,
  readOriginalUrl,
} from "../../src/site/download";

const ORIGINAL = "https://wimg.rule34.xxx//images/1/a.png?5";

function page(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("download", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("names the file by post id and the extension of the address", () => {
    expect(
      downloadFileName("https://wimg.rule34.xxx//images/12/abc.PNG?19349998", "19349998"),
    ).toBe("rule34-19349998.png");
    expect(
      downloadFileName("https://ws-cdn-video.rule34.xxx//images/12/abc.mp4?1", "7"),
    ).toBe("rule34-7.mp4");
    expect(downloadFileName("https://example.test/file", "7")).toBe("rule34-7.jpg");
  });

  it("knows when the script manager has no download function", () => {
    expect(canDownload()).toBe(false);
    vi.stubGlobal("GM_download", vi.fn());
    expect(canDownload()).toBe(true);
  });

  it("asks the manager for one file and settles with its answer", async () => {
    const calls: { url: string; name: string }[] = [];
    vi.stubGlobal(
      "GM_download",
      (details: { url: string; name: string; onload: () => void }) => {
        calls.push({ url: details.url, name: details.name });
        details.onload();
      },
    );
    await downloadOriginal("https://wimg.rule34.xxx//images/1/a.jpg?5", "5");
    expect(calls).toEqual([
      { url: "https://wimg.rule34.xxx//images/1/a.jpg?5", name: "rule34-5.jpg" },
    ]);

    vi.stubGlobal(
      "GM_download",
      (details: { onerror: (event: { error: string }) => void }) => {
        details.onerror({ error: "not_whitelisted" });
      },
    );
    await expect(
      downloadOriginal("https://wimg.rule34.xxx//images/1/a.jpg?5", "5"),
    ).rejects.toThrow("not_whitelisted");
  });

  it("finds the original on a post page: the link, else the video, else the image", () => {
    expect(
      readOriginalUrl(
        page(
          `<div class="link-list"><ul><li><a href="#">Edit</a></li><li><a href="${ORIGINAL}">Original image</a></li></ul></div><img id="image" src="https://wimg.rule34.xxx//samples/1/sample_a.jpg?5">`,
        ),
      ),
    ).toBe(ORIGINAL);
    expect(
      readOriginalUrl(
        page(
          '<video id="gelcomVideoPlayer"><source src="https://ws-cdn-video.rule34.xxx//images/1/a.mp4?5"></video>',
        ),
      ),
    ).toBe("https://ws-cdn-video.rule34.xxx//images/1/a.mp4?5");
    expect(
      readOriginalUrl(page('<img id="image" src="https://wimg.rule34.xxx//images/1/a.jpg?5">')),
    ).toBe("https://wimg.rule34.xxx//images/1/a.jpg?5");
    expect(readOriginalUrl(page("<p>nothing</p>"))).toBeNull();
  });

  it("reads one post page for a post that is not open", async () => {
    const fetchMock = vi.fn((_url: string) =>
      Promise.resolve(
        new Response(
          `<div class="link-list"><a href="${ORIGINAL}">Original image</a></div>`,
          { status: 200 },
        ),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchOriginalUrl(5)).resolves.toBe(ORIGINAL);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/index.php?page=post&s=view&id=5");

    vi.stubGlobal("fetch", () => Promise.resolve(new Response("", { status: 429 })));
    await expect(fetchOriginalUrl(5)).rejects.toThrow("HTTP 429");
  });
});
