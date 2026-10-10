import { describe, expect, it } from "vitest";
import { BATCH_DOWNLOAD_LIST_MAX_FILES } from "../../../src/shared/constants";
import { DownloadAllRequestSchema } from "../../../src/shared/schemas/download";
import {
  buildListOverLimitResult,
  isListOverLimit,
} from "../../../src/shared/utils/download-list-limit";

function makeItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://example.com/${i}.jpg`,
    filename: `1_${i}.jpg`,
  }));
}

describe("list download over-limit", () => {
  it("Zod accepts 5001 items (no throw); controller helper returns typed result", () => {
    const items = makeItems(BATCH_DOWNLOAD_LIST_MAX_FILES + 1);
    const parsed = DownloadAllRequestSchema.safeParse({
      kind: "list",
      items,
    });
    expect(parsed.success).toBe(true);
    expect(isListOverLimit(items.length)).toBe(true);

    const result = buildListOverLimitResult(items.length);
    expect(result.success).toBe(false);
    expect(result.failed).toEqual([]);
    expect(result.truncatedFrom).toBe(items.length);
    expect(result.error).toContain(String(BATCH_DOWNLOAD_LIST_MAX_FILES));
    expect(result.error).toContain(String(items.length));
  });

  it("allows exactly the safety cap through Zod", () => {
    const items = makeItems(BATCH_DOWNLOAD_LIST_MAX_FILES);
    const parsed = DownloadAllRequestSchema.safeParse({
      kind: "list",
      items,
    });
    expect(parsed.success).toBe(true);
    expect(isListOverLimit(items.length)).toBe(false);
  });
});
