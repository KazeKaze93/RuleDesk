import { describe, expect, it } from "vitest";
import { AddArtistSchema } from "../../../src/shared/schemas/artist";
import { SaveSettingsSchema } from "../../../src/shared/schemas/settings";
import { SmartPlaylistQuerySchema } from "../../../src/shared/schemas/playlist";
import { ShadowInsertRequestSchema } from "../../../src/shared/schemas/shadow-insert";
import { parseSmartQuery } from "../../../src/shared/schemas/smart-playlist-query";
import { PostDataSchema } from "../../../src/shared/schemas/post";

const postActionPostDataBase = {
  postId: 42,
  artistId: 0,
  fileUrl: "https://api-cdn.rule34.xxx/images/42.jpg",
  previewUrl: "https://api-cdn.rule34.xxx/thumbnails/42.jpg",
} as const;

describe("provider input schemas (Rule34-only)", () => {
  it("rejects gelbooru on AddArtistSchema", () => {
    const result = AddArtistSchema.safeParse({
      name: "x",
      tag: "x",
      provider: "gelbooru",
      type: "tag",
    });
    expect(result.success).toBe(false);
  });

  it("rejects provider field on SaveSettingsSchema", () => {
    const result = SaveSettingsSchema.safeParse({
      userId: "123",
      apiKey: "abcdefghij",
      provider: "gelbooru",
    });
    // Field removed: Zod strips unknown by default on object without .strict()
    // Ensure supported path still works and provider is not required.
    expect(SaveSettingsSchema.safeParse({ userId: "123", apiKey: "abcdefghij" }).success).toBe(
      true
    );
    // If provider sneaks in via passthrough, it must not be in output as a writable field.
    if (result.success) {
      expect("provider" in result.data).toBe(false);
    }
  });

  it("rejects gelbooru on SmartPlaylistQuerySchema create input", () => {
    const result = SmartPlaylistQuerySchema.safeParse({
      tags: [{ tag: "solo", type: "include" }],
      provider: "gelbooru",
    });
    expect(result.success).toBe(false);
  });

  it("rejects gelbooru on ShadowInsertRequestSchema", () => {
    const result = ShadowInsertRequestSchema.safeParse({
      postId: 1,
      provider: "gelbooru",
    });
    expect(result.success).toBe(false);
  });

  it("parses stored smart query with gelbooru without crash", () => {
    const parsed = parseSmartQuery(
      JSON.stringify({
        tags: [{ tag: "solo", type: "include" }],
        provider: "gelbooru",
      }),
      1
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.provider).toBe("gelbooru");
  });

  it("PostDataSchema (PostActionArgs) accepts rule34 and gelbooru", () => {
    expect(
      PostDataSchema.safeParse({
        ...postActionPostDataBase,
        provider: "rule34",
      }).success
    ).toBe(true);
    expect(
      PostDataSchema.safeParse({
        ...postActionPostDataBase,
        provider: "gelbooru",
        fileUrl: "https://img4.gelbooru.com/images/42.jpg",
        previewUrl: "https://img4.gelbooru.com/thumbnails/42.jpg",
      }).success
    ).toBe(true);
  });

  it("PostDataSchema (PostActionArgs) rejects unknown and empty provider", () => {
    expect(
      PostDataSchema.safeParse({
        ...postActionPostDataBase,
        provider: "foo",
      }).success
    ).toBe(false);
    expect(
      PostDataSchema.safeParse({
        ...postActionPostDataBase,
        provider: "",
      }).success
    ).toBe(false);
  });
});
