import { afterEach, describe, expect, it, vi } from "vitest";

import {
  canDownload,
  cleanBaseFolder,
  downloadFile,
  downloadFileName,
  downloadFolder,
} from "../../src/site/download";

describe("download", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("names the file by post id and the extension of the address", () => {
    expect(
      downloadFileName("https://wimg.rule34.xxx//images/12/abc.PNG?19349998", 19349998),
    ).toBe("rule34-19349998.png");
    expect(downloadFileName("https://ws-cdn-video.rule34.xxx//images/12/abc.mp4?1", 7)).toBe(
      "rule34-7.mp4",
    );
    expect(downloadFileName("https://example.test/file", 7)).toBe("rule34-7.jpg");
  });

  it("puts a job into a folder named after it, with no fixed root", () => {
    expect(downloadFolder("My pics")).toBe("My pics");
    expect(downloadFolder('( a ~ b ) score:>=10 "x" / y')).toBe("( a ~ b ) score =10 x y");
    expect(downloadFolder("  ...  ")).toBe("downloads");
    expect(downloadFolder("x".repeat(200)).length).toBe(60);
  });

  it("puts the job folder under the base folder the user chose", () => {
    expect(downloadFolder("My pics", "art/rule34")).toBe("art/rule34/My pics");
    expect(downloadFolder("My pics", "  ")).toBe("My pics");
    expect(cleanBaseFolder("\\art\\ rule34 //../a:b/")).toBe("art/rule34/a b");
    expect(cleanBaseFolder("C:\\Users\\me")).toBe("C/Users/me");
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
    await downloadFile("https://wimg.rule34.xxx//images/1/a.jpg?5", "RuleDesk/x/rule34-5.jpg");
    expect(calls).toEqual([
      { url: "https://wimg.rule34.xxx//images/1/a.jpg?5", name: "RuleDesk/x/rule34-5.jpg" },
    ]);

    vi.stubGlobal(
      "GM_download",
      (details: { onerror: (event: { error: string }) => void }) => {
        details.onerror({ error: "not_whitelisted" });
      },
    );
    await expect(downloadFile("https://example.test/a.jpg", "a.jpg")).rejects.toThrow(
      "not_whitelisted",
    );
  });
});
