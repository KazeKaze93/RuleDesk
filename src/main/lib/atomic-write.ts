/**
 * Single-writer atomic file replace: unique tmp beside target, then rename.
 * Coalesces concurrent writes per path (last payload wins) so callers do not
 * queue N full serial writes of superseded state.
 */
import { rename, unlink, writeFile } from "node:fs/promises";
import log from "electron-log";
import {
  ATOMIC_WRITE_RETRY_BASE_DELAY_MS,
  ATOMIC_WRITE_RETRY_MAX_ATTEMPTS,
} from "../config/constants";

const RETRYABLE_ERRNO = new Set(["EPERM", "EBUSY", "EACCES"]);

export type AtomicWriteFs = {
  writeFile: typeof writeFile;
  rename: typeof rename;
  unlink: typeof unlink;
};

const defaultFs: AtomicWriteFs = {
  writeFile,
  rename,
  unlink,
};

type PathSlot = {
  draining: boolean;
  pending: string | null;
  waiters: Array<{
    resolve: () => void;
    reject: (error: unknown) => void;
  }>;
  /** Resolvers waiting only for idle (quit flush) — not tied to a payload. */
  idleWaiters: Array<() => void>;
};

const slots = new Map<string, PathSlot>();
let tmpCounter = 0;

function getSlot(filePath: string): PathSlot {
  let slot = slots.get(filePath);
  if (!slot) {
    slot = {
      draining: false,
      pending: null,
      waiters: [],
      idleWaiters: [],
    };
    slots.set(filePath, slot);
  }
  return slot;
}

function notifyIdle(slot: PathSlot, filePath: string): void {
  if (slot.draining || slot.pending !== null) {
    return;
  }
  const idle = slot.idleWaiters;
  slot.idleWaiters = [];
  for (const resolve of idle) {
    resolve();
  }
  if (slot.waiters.length === 0 && slot.idleWaiters.length === 0) {
    slots.delete(filePath);
  }
}

function isErrnoCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function isRetryableErrno(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }
  const code = error.code;
  return typeof code === "string" && RETRYABLE_ERRNO.has(code);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function nextTmpPath(filePath: string): string {
  tmpCounter += 1;
  return `${filePath}.tmp.${process.pid}.${tmpCounter}`;
}

async function unlinkQuiet(
  fsImpl: AtomicWriteFs,
  tmpPath: string
): Promise<void> {
  try {
    await fsImpl.unlink(tmpPath);
  } catch (error: unknown) {
    if (!isErrnoCode(error, "ENOENT")) {
      log.warn("[atomic-write] tmp cleanup failed", { tmpPath, error });
    }
  }
}

/**
 * One attempt: write unique tmp, rename over target. Deletes tmp on any failure.
 * Retries on EPERM/EBUSY/EACCES with short exponential backoff.
 */
export async function writeFileAtomicOnce(
  filePath: string,
  contents: string,
  fsImpl: AtomicWriteFs = defaultFs
): Promise<void> {
  let lastError: unknown;
  for (
    let attempt = 0;
    attempt < ATOMIC_WRITE_RETRY_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const tmpPath = nextTmpPath(filePath);
    try {
      await fsImpl.writeFile(tmpPath, contents, "utf-8");
      try {
        await fsImpl.rename(tmpPath, filePath);
        return;
      } catch (renameError: unknown) {
        if (isErrnoCode(renameError, "ENOENT")) {
          log.error(
            "[atomic-write] rename ENOENT — tmp missing (single-writer defect)",
            { filePath, tmpPath, renameError }
          );
        }
        await unlinkQuiet(fsImpl, tmpPath);
        if (
          isRetryableErrno(renameError) &&
          attempt + 1 < ATOMIC_WRITE_RETRY_MAX_ATTEMPTS
        ) {
          lastError = renameError;
          await delay(ATOMIC_WRITE_RETRY_BASE_DELAY_MS * 2 ** attempt);
          continue;
        }
        throw renameError;
      }
    } catch (error: unknown) {
      await unlinkQuiet(fsImpl, tmpPath);
      if (
        isRetryableErrno(error) &&
        attempt + 1 < ATOMIC_WRITE_RETRY_MAX_ATTEMPTS
      ) {
        lastError = error;
        await delay(ATOMIC_WRITE_RETRY_BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
      throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("atomic write retries exhausted");
}

async function drainSlot(
  filePath: string,
  slot: PathSlot,
  fsImpl: AtomicWriteFs
): Promise<void> {
  if (slot.draining) {
    return;
  }
  slot.draining = true;
  try {
    while (slot.pending !== null) {
      const contents = slot.pending;
      const waiters = slot.waiters;
      slot.pending = null;
      slot.waiters = [];
      try {
        await writeFileAtomicOnce(filePath, contents, fsImpl);
        for (const waiter of waiters) {
          waiter.resolve();
        }
      } catch (error: unknown) {
        for (const waiter of waiters) {
          waiter.reject(error);
        }
      }
    }
  } finally {
    slot.draining = false;
    if (slot.pending !== null) {
      await drainSlot(filePath, slot, fsImpl);
    } else {
      notifyIdle(slot, filePath);
    }
  }
}

/**
 * Atomically replace `filePath` with `contents`. Concurrent callers for the
 * same path share one in-flight write; newer payloads coalesce (last wins).
 */
export async function writeFileAtomic(
  filePath: string,
  contents: string,
  fsImpl: AtomicWriteFs = defaultFs
): Promise<void> {
  const slot = getSlot(filePath);
  return new Promise<void>((resolve, reject) => {
    slot.pending = contents;
    slot.waiters.push({ resolve, reject });
    void drainSlot(filePath, slot, fsImpl).catch((error: unknown) => {
      log.error("[atomic-write] drain crashed", { filePath, error });
    });
  });
}

/**
 * Wait until in-flight + coalesced writes for `filePath` finish.
 * Used on quit/cancel so before-quit does not race a rename.
 */
export function waitForAtomicWriteIdle(filePath: string): Promise<void> {
  const slot = slots.get(filePath);
  if (!slot || (!slot.draining && slot.pending === null)) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    slot.idleWaiters.push(resolve);
    if (!slot.draining && slot.pending === null) {
      notifyIdle(slot, filePath);
    }
  });
}

/** Test helper: reset process-local writer state between cases. */
export function resetAtomicWriteStateForTests(): void {
  slots.clear();
  tmpCounter = 0;
}
