import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  renameTmpFileAtomic,
  renameTmpFileOnce,
  resetAtomicWriteStateForTests,
  waitForAtomicWriteIdle,
  writeFileAtomic,
  writeFileAtomicOnce,
  type AtomicWriteFs,
} from "../../../src/main/lib/atomic-write";
import { ATOMIC_WRITE_RETRY_MAX_ATTEMPTS } from "../../../src/main/config/constants";

describe("writeFileAtomic", () => {
  let dir: string;
  let filePath: string;

  beforeEach(() => {
    resetAtomicWriteStateForTests();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "rd-atomic-write-"));
    filePath = path.join(dir, "download-queue.json");
  });

  afterEach(() => {
    resetAtomicWriteStateForTests();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("N parallel persists → one valid JSON file, last state wins", async () => {
    const payloads = Array.from({ length: 20 }, (_, i) =>
      JSON.stringify({
        version: 3,
        kind: "list",
        seq: i,
        completedIds: [`f${i}.jpg`],
      })
    );

    await Promise.all(payloads.map((body) => writeFileAtomic(filePath, body)));

    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    expect(parsed).toEqual(JSON.parse(payloads[payloads.length - 1]!));

    const leftovers = fs
      .readdirSync(dir)
      .filter((name) => name.includes(".tmp."));
    expect(leftovers).toEqual([]);
  });

  it("rename fails EPERM twice then succeeds", async () => {
    let renameCalls = 0;
    const realRename = fs.promises.rename.bind(fs.promises);
    const fsImpl: AtomicWriteFs = {
      writeFile: fs.promises.writeFile.bind(fs.promises),
      unlink: fs.promises.unlink.bind(fs.promises),
      rename: async (from, to) => {
        renameCalls += 1;
        if (renameCalls <= 2) {
          const err = new Error("simulated EPERM") as NodeJS.ErrnoException;
          err.code = "EPERM";
          throw err;
        }
        return realRename(from, to);
      },
    };

    await writeFileAtomicOnce(filePath, JSON.stringify({ ok: true }), fsImpl);

    expect(renameCalls).toBe(3);
    expect(JSON.parse(fs.readFileSync(filePath, "utf-8"))).toEqual({
      ok: true,
    });
    expect(fs.readdirSync(dir).filter((n) => n.includes(".tmp."))).toEqual([]);
  });

  it("rename always fails → error with reason, no leftover tmp", async () => {
    const fsImpl: AtomicWriteFs = {
      writeFile: fs.promises.writeFile.bind(fs.promises),
      unlink: fs.promises.unlink.bind(fs.promises),
      rename: async () => {
        const err = new Error(
          "simulated EPERM sticky"
        ) as NodeJS.ErrnoException;
        err.code = "EPERM";
        throw err;
      },
    };

    await expect(
      writeFileAtomicOnce(filePath, JSON.stringify({ ok: false }), fsImpl)
    ).rejects.toMatchObject({
      code: "EPERM",
      message: "simulated EPERM sticky",
    });

    expect(fs.existsSync(filePath)).toBe(false);
    expect(fs.readdirSync(dir).filter((n) => n.includes(".tmp."))).toEqual([]);
  });

  it("coalesces while a write is in flight (not N full writes)", async () => {
    let renameCount = 0;
    let releaseFirst!: () => void;
    const firstRenameGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const realRename = fs.promises.rename.bind(fs.promises);
    const fsImpl: AtomicWriteFs = {
      writeFile: fs.promises.writeFile.bind(fs.promises),
      unlink: fs.promises.unlink.bind(fs.promises),
      rename: async (from, to) => {
        renameCount += 1;
        if (renameCount === 1) {
          await firstRenameGate;
        }
        return realRename(from, to);
      },
    };

    const p1 = writeFileAtomic(filePath, JSON.stringify({ seq: 1 }), fsImpl);
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (renameCount >= 1) {
          resolve();
          return;
        }
        setTimeout(tick, 5);
      };
      tick();
    });

    const p2 = writeFileAtomic(filePath, JSON.stringify({ seq: 2 }), fsImpl);
    const p3 = writeFileAtomic(filePath, JSON.stringify({ seq: 3 }), fsImpl);

    releaseFirst();
    await Promise.all([p1, p2, p3]);

    expect(JSON.parse(fs.readFileSync(filePath, "utf-8"))).toEqual({ seq: 3 });
    // First write + one coalesced follow-up (not one rename per caller).
    expect(renameCount).toBeLessThanOrEqual(2);
    expect(fs.readdirSync(dir).filter((n) => n.includes(".tmp."))).toEqual([]);
  });

  it("waitForAtomicWriteIdle resolves after in-flight write", async () => {
    let releaseRename!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseRename = resolve;
    });
    const realRename = fs.promises.rename.bind(fs.promises);
    const fsImpl: AtomicWriteFs = {
      writeFile: fs.promises.writeFile.bind(fs.promises),
      unlink: fs.promises.unlink.bind(fs.promises),
      rename: async (from, to) => {
        await gate;
        return realRename(from, to);
      },
    };

    const writePromise = writeFileAtomic(
      filePath,
      JSON.stringify({ flushed: true }),
      fsImpl
    );
    const idlePromise = waitForAtomicWriteIdle(filePath);
    let idleDone = false;
    void idlePromise.then(() => {
      idleDone = true;
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(idleDone).toBe(false);

    releaseRename();
    await writePromise;
    await idlePromise;
    expect(idleDone).toBe(true);
  });

  it("exhausts retry budget constant", async () => {
    let renameCalls = 0;
    const fsImpl: AtomicWriteFs = {
      writeFile: fs.promises.writeFile.bind(fs.promises),
      unlink: fs.promises.unlink.bind(fs.promises),
      rename: async () => {
        renameCalls += 1;
        const err = new Error("busy") as NodeJS.ErrnoException;
        err.code = "EBUSY";
        throw err;
      },
    };

    await expect(writeFileAtomicOnce(filePath, "{}", fsImpl)).rejects.toMatchObject({
      code: "EBUSY",
    });
    expect(renameCalls).toBe(ATOMIC_WRITE_RETRY_MAX_ATTEMPTS);
  });
});

describe("renameTmpFileAtomic", () => {
  let dir: string;
  let filePath: string;

  beforeEach(() => {
    resetAtomicWriteStateForTests();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "rd-atomic-rename-"));
    filePath = path.join(dir, "cache.bin");
  });

  afterEach(() => {
    resetAtomicWriteStateForTests();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("renames a pre-written tmp over the target", async () => {
    const tmpPath = path.join(dir, "cache.bin.tmp-uuid");
    fs.writeFileSync(tmpPath, Buffer.from([1, 2, 3, 4]));

    await renameTmpFileAtomic(filePath, tmpPath);

    expect(fs.readFileSync(filePath)).toEqual(Buffer.from([1, 2, 3, 4]));
    expect(fs.existsSync(tmpPath)).toBe(false);
  });

  it("retries EPERM on rename then succeeds", async () => {
    const tmpPath = path.join(dir, "cache.bin.tmp-retry");
    fs.writeFileSync(tmpPath, "payload");
    let renameCalls = 0;
    const realRename = fs.promises.rename.bind(fs.promises);
    const fsImpl: AtomicWriteFs = {
      writeFile: fs.promises.writeFile.bind(fs.promises),
      unlink: fs.promises.unlink.bind(fs.promises),
      rename: async (from, to) => {
        renameCalls += 1;
        if (renameCalls <= 2) {
          const err = new Error("simulated EPERM") as NodeJS.ErrnoException;
          err.code = "EPERM";
          throw err;
        }
        return realRename(from, to);
      },
    };

    await renameTmpFileOnce(filePath, tmpPath, fsImpl);

    expect(renameCalls).toBe(3);
    expect(fs.readFileSync(filePath, "utf-8")).toBe("payload");
  });

  it("coalesces parallel renames — last tmp wins, losers unlinked", async () => {
    const tmpA = path.join(dir, "a.tmp");
    const tmpB = path.join(dir, "b.tmp");
    const tmpC = path.join(dir, "c.tmp");
    fs.writeFileSync(tmpA, "A");
    fs.writeFileSync(tmpB, "B");
    fs.writeFileSync(tmpC, "C");

    let renameCount = 0;
    let releaseFirst!: () => void;
    const firstRenameGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const realRename = fs.promises.rename.bind(fs.promises);
    const fsImpl: AtomicWriteFs = {
      writeFile: fs.promises.writeFile.bind(fs.promises),
      unlink: fs.promises.unlink.bind(fs.promises),
      rename: async (from, to) => {
        renameCount += 1;
        if (renameCount === 1) {
          await firstRenameGate;
        }
        return realRename(from, to);
      },
    };

    const p1 = renameTmpFileAtomic(filePath, tmpA, fsImpl);
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (renameCount >= 1) {
          resolve();
          return;
        }
        setTimeout(tick, 5);
      };
      tick();
    });

    const p2 = renameTmpFileAtomic(filePath, tmpB, fsImpl);
    const p3 = renameTmpFileAtomic(filePath, tmpC, fsImpl);
    releaseFirst();
    await Promise.all([p1, p2, p3]);

    expect(fs.readFileSync(filePath, "utf-8")).toBe("C");
    expect(renameCount).toBeLessThanOrEqual(2);
    expect(fs.existsSync(tmpA)).toBe(false);
    expect(fs.existsSync(tmpB)).toBe(false);
    expect(fs.existsSync(tmpC)).toBe(false);
  });
});
