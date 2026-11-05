import { describe, expect, it } from "vitest";
import {
  DOWNLOAD_PROGRESS_COMPLETE_PERCENT,
  shouldPostDownloadProgress,
} from "../../../src/main/workers/downloadWorker";

describe("downloadWorker progress dedup", () => {
  it("posts one message per unique percent and includes 100", () => {
    const progressEvents = [
      0, 0, 0, 12, 12, 12, 45, 45, 99, 99, DOWNLOAD_PROGRESS_COMPLETE_PERCENT,
    ];
    const posted: number[] = [];
    let lastSentPercent: number | undefined;

    for (const percent of progressEvents) {
      if (!shouldPostDownloadProgress(percent, lastSentPercent)) {
        continue;
      }
      posted.push(percent);
      lastSentPercent = percent;
    }

    expect(posted).toEqual([
      0,
      12,
      45,
      99,
      DOWNLOAD_PROGRESS_COMPLETE_PERCENT,
    ]);
    expect(posted).toContain(DOWNLOAD_PROGRESS_COMPLETE_PERCENT);
    expect(new Set(posted).size).toBe(posted.length);
  });

  it("always allows a first completion percent even after a prior send", () => {
    expect(
      shouldPostDownloadProgress(DOWNLOAD_PROGRESS_COMPLETE_PERCENT, 99)
    ).toBe(true);
  });
});
