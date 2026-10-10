import { afterEach, describe, expect, it } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "@/main/db/schema";
import {
  createRandomSeed,
  resolveRandomSeed,
  seededOrderBy,
} from "@/main/db/seeded-ordering";
import { MAX_RANDOM_SEED } from "@/shared/schemas/ipc";

const TOTAL_POSTS = 1000;
const PAGE_SIZE = 50;
const PAGE_COUNT = TOTAL_POSTS / PAGE_SIZE;
const SEED_A = 42;
const SEED_B = 99;

describe("seeded-ordering", () => {
  let sqlite: ReturnType<typeof createMockDb>["sqlite"] | null = null;

  afterEach(() => {
    sqlite?.close();
    sqlite = null;
  });

  it("resolveRandomSeed uses provided seed and mints within bounds when omitted", () => {
    expect(resolveRandomSeed(SEED_A)).toBe(SEED_A);
    const minted = resolveRandomSeed(undefined);
    expect(minted).toBeGreaterThanOrEqual(0);
    expect(minted).toBeLessThanOrEqual(MAX_RANDOM_SEED);
    expect(createRandomSeed()).toBeLessThanOrEqual(MAX_RANDOM_SEED);
  });

  it("paginates 1000 posts without dupes/gaps; same seed stable; different seeds differ", () => {
    const mock = createMockDb();
    sqlite = mock.sqlite;
    const { db } = mock;

    const artist = db
      .insert(artists)
      .values({
        name: "seeded-order-artist",
        tag: "seeded_order_artist",
        type: "tag",
        provider: "rule34",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .returning()
      .get();

    const now = new Date();
    for (let i = 1; i <= TOTAL_POSTS; i += 1) {
      db.insert(posts)
        .values({
          postId: 10_000 + i,
          artistId: artist.id,
          provider: "rule34",
          fileUrl: `https://example.com/${i}.jpg`,
          previewUrl: `https://example.com/${i}_p.jpg`,
          sampleUrl: "",
          tags: `tag_${i}`,
          rating: "s",
          mediaType: "image",
          publishedAt: now,
          createdAt: now,
        })
        .run();
    }

    const fetchAllPages = (seed: number): number[] => {
      const ids: number[] = [];
      for (let page = 1; page <= PAGE_COUNT; page += 1) {
        const offset = (page - 1) * PAGE_SIZE;
        const rows = db
          .select({ id: posts.id })
          .from(posts)
          .orderBy(...seededOrderBy(posts.id, seed))
          .limit(PAGE_SIZE)
          .offset(offset)
          .all();
        expect(rows).toHaveLength(PAGE_SIZE);
        for (const row of rows) {
          ids.push(row.id);
        }
      }
      return ids;
    };

    const orderA1 = fetchAllPages(SEED_A);
    const orderA2 = fetchAllPages(SEED_A);
    const orderB = fetchAllPages(SEED_B);

    expect(orderA1).toHaveLength(TOTAL_POSTS);
    expect(new Set(orderA1).size).toBe(TOTAL_POSTS);
    expect(orderA1).toEqual(orderA2);
    expect(orderA1).not.toEqual(orderB);
    expect(new Set(orderB).size).toBe(TOTAL_POSTS);
  });
});
