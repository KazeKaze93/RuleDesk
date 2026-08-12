import { describe, expect, it } from "vitest";
import { markBackupsExceedingSizeCap } from "@/main/lib/backup-retention-size-cap";

const MB = 1024 * 1024;

function file(name: string, sizeMb: number) {
  return {
    name,
    fullPath: `/backups/${name}`,
    size: sizeMb * MB,
  };
}

describe("markBackupsExceedingSizeCap", () => {
  it("keeps newest+oldest when middle overflows but A+C fit under cap (audit counter-example)", () => {
    // Newest-first: A=90, B=50, C=1; cap=100. Buggy runningTotal deleted C too.
    const files = [
      file("A-newest.db", 90),
      file("B-middle.db", 50),
      file("C-oldest.db", 1),
    ];
    const toDelete = new Set<string>();

    markBackupsExceedingSizeCap(files, 100 * MB, toDelete);

    expect(toDelete.has(files[0].fullPath)).toBe(false);
    expect(toDelete.has(files[1].fullPath)).toBe(true);
    expect(toDelete.has(files[2].fullPath)).toBe(false);
  });

  it("does not delete the only newest file when it alone exceeds the cap", () => {
    const files = [file("only.db", 150)];
    const toDelete = new Set<string>();

    markBackupsExceedingSizeCap(files, 100 * MB, toDelete);

    expect(toDelete.size).toBe(0);
  });

  it("keeps oversized newest and still prunes older files", () => {
    const files = [
      file("A-newest.db", 150),
      file("B-older.db", 40),
      file("C-oldest.db", 10),
    ];
    const toDelete = new Set<string>();

    markBackupsExceedingSizeCap(files, 100 * MB, toDelete);

    expect(toDelete.has(files[0].fullPath)).toBe(false);
    expect(toDelete.has(files[1].fullPath)).toBe(true);
    expect(toDelete.has(files[2].fullPath)).toBe(true);
  });

  it("respects prior count-based toDelete marks and only sizes retained candidates", () => {
    const files = [
      file("A-newest.db", 40),
      file("B-middle.db", 40),
      file("C-oldest.db", 40),
    ];
    const toDelete = new Set<string>([files[2].fullPath]);

    markBackupsExceedingSizeCap(files, 100 * MB, toDelete);

    expect(toDelete.has(files[0].fullPath)).toBe(false);
    expect(toDelete.has(files[1].fullPath)).toBe(false);
    expect(toDelete.has(files[2].fullPath)).toBe(true);
  });

  it("is a no-op when maxTotalBytes is zero or negative", () => {
    const files = [file("A.db", 90), file("B.db", 90)];
    const toDelete = new Set<string>();

    markBackupsExceedingSizeCap(files, 0, toDelete);
    markBackupsExceedingSizeCap(files, -1, toDelete);

    expect(toDelete.size).toBe(0);
  });

  it("prunes oldest when cumulative retained size would exceed the cap", () => {
    const files = [
      file("A-newest.db", 40),
      file("B-middle.db", 40),
      file("C-oldest.db", 40),
    ];
    const toDelete = new Set<string>();

    markBackupsExceedingSizeCap(files, 100 * MB, toDelete);

    expect(toDelete.has(files[0].fullPath)).toBe(false);
    expect(toDelete.has(files[1].fullPath)).toBe(false);
    expect(toDelete.has(files[2].fullPath)).toBe(true);
  });
});
