import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists } from "@/main/db/schema";
import { MAX_TRACKED_ARTISTS } from "@/shared/constants";
import { getTrackedArtistsWithStats } from "@/main/db/queries/artists";
import log from "electron-log";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("getTrackedArtistsWithStats limit", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockDb();
  });

  afterEach(() => {
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch {
        // ignore
      }
    }
  });

  it("truncates result to MAX_TRACKED_ARTISTS when DB has more", () => {
    const totalArtists = MAX_TRACKED_ARTISTS + 1;
    const batchSize = 500;

    mockDb.db.transaction((tx) => {
      for (let offset = 0; offset < totalArtists; offset += batchSize) {
        const batch = Array.from(
          { length: Math.min(batchSize, totalArtists - offset) },
          (_, index) => {
            const n = offset + index;
            return {
              name: `Artist ${n}`,
              tag: `artist_tag_${n}`,
              provider: "rule34" as const,
              type: "tag" as const,
              apiEndpoint: "https://api.rule34.xxx/index.php",
            };
          }
        );
        tx.insert(artists).values(batch).run();
      }
    });

    const logWarnSpy = vi.spyOn(log, "warn");
    const result = getTrackedArtistsWithStats(mockDb.db);

    expect(result).toHaveLength(MAX_TRACKED_ARTISTS);
    expect(logWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(String(MAX_TRACKED_ARTISTS))
    );
  });
});
