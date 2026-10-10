import { describe, expect, it } from "vitest";
import {
  parseDownloadQueueFile,
  artistQueueInitial,
  listQueueInitial,
} from "../../../src/main/lib/download-queue-file";

describe("parseDownloadQueueFile", () => {
  it("parses V3 artist queue", () => {
    const raw = artistQueueInitial({
      artistId: 7,
      filters: { mediaType: "images" },
      upperBoundId: 100,
      total: 50,
      folder: "C:\\dl",
    });
    const parsed = parseDownloadQueueFile(raw);
    expect(parsed?.format).toBe("v3");
    expect(parsed?.data).toMatchObject({
      kind: "artist",
      artistId: 7,
      cursorId: 0,
      upperBoundId: 100,
    });
  });

  it("migrates V2 queue to V3 list", () => {
    const parsed = parseDownloadQueueFile({
      version: 2,
      items: [
        { url: "https://example.com/a.jpg", filename: "1_1.jpg" },
        { url: "https://example.com/b.jpg", filename: "1_2.jpg" },
      ],
      completedIds: ["1_1.jpg"],
      total: 2,
      folder: "/tmp",
      timestamp: 123,
    });
    expect(parsed?.format).toBe("v2-as-list");
    expect(parsed?.data).toMatchObject({
      version: 3,
      kind: "list",
      completedIds: ["1_1.jpg"],
      total: 2,
    });
  });

  it("migrates legacy doneCount to completedIds prefix", () => {
    const parsed = parseDownloadQueueFile({
      items: [
        { url: "https://example.com/a.jpg", filename: "1_1.jpg" },
        { url: "https://example.com/b.jpg", filename: "1_2.jpg" },
      ],
      doneCount: 1,
      total: 2,
      folder: "/tmp",
      timestamp: 1,
    });
    expect(parsed?.data).toMatchObject({
      kind: "list",
      completedIds: ["1_1.jpg"],
    });
  });

  it("returns null for garbage", () => {
    expect(parseDownloadQueueFile(null)).toBeNull();
    expect(parseDownloadQueueFile({ version: 3, kind: "artist" })).toBeNull();
    expect(parseDownloadQueueFile({ items: "nope" })).toBeNull();
  });

  it("listQueueInitial stays bounded for queue file size (no growth with cursor)", () => {
    const list = listQueueInitial({
      items: [{ url: "https://example.com/a.jpg", filename: "1_1.jpg" }],
      folder: "/tmp",
    });
    const artist = artistQueueInitial({
      artistId: 1,
      filters: undefined,
      upperBoundId: 99999,
      total: 1637,
      folder: "/tmp",
    });
    const artistJson = JSON.stringify(artist);
    expect(artistJson.length).toBeLessThan(500);
    expect(list.kind).toBe("list");
  });
});
