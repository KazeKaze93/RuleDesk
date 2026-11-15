import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { downloadsAvailable } from "../../src/features/downloads/available";
import {
  cancelDownload,
  DOWNLOADS_JOB_KEY,
  DOWNLOADS_POSITION_KEY,
  FILE_INTERVAL_MS,
  getDownloadState,
  pauseDownload,
  resetDownloadsState,
  restoreDownloads,
  resumeDownload,
  RETRY_DELAY_MS,
  startDownload,
} from "../../src/features/downloads/queue";
import {
  API_CREDENTIALS_KEY,
  clearApiCredentials,
  getApiCredentials,
  setApiCredentials,
} from "../../src/storage/api-credentials";
import {
  getDownloadBaseFolder,
  setDownloadBaseFolder,
} from "../../src/storage/download-settings";
import { clearStorageCache } from "../../src/storage/store";

const memory = new Map<string, unknown>();
const LONG_MS = 60_000;

function installGm(): void {
  memory.clear();
  clearStorageCache();
  vi.stubGlobal("GM_getValue", (key: string, fallback?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : fallback,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function stubApi(ids: number[]): void {
  const answers = [
    JSON.stringify(
      ids.map((id) => ({ id, file_url: `https://wimg.rule34.xxx//images/1/${String(id)}.png` })),
    ),
    "",
  ];
  vi.stubGlobal("fetch", () =>
    Promise.resolve(new Response(answers.shift() ?? "", { status: 200 })),
  );
}

/** Records saved names; ids in `broken` fail every time. */
function stubDownload(broken: number[] = []): string[] {
  const names: string[] = [];
  vi.stubGlobal(
    "GM_download",
    (details: {
      name: string;
      onload: () => void;
      onerror: (event: { error: string }) => void;
    }) => {
      if (broken.some((id) => details.name.includes(`rule34-${String(id)}.`))) {
        details.onerror({ error: "not_succeeded" });
        return;
      }
      names.push(details.name);
      details.onload();
    },
  );
  return names;
}

describe("download manager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installGm();
    resetDownloadsState();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    resetDownloadsState();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps the API key apart from the main data and needs both parts", () => {
    expect(setApiCredentials(" 42 ", "  ")).toBe(false);
    expect(getApiCredentials()).toBeNull();
    expect(setApiCredentials(" 42 ", " key ")).toBe(true);
    expect(getApiCredentials()).toEqual({ userId: "42", apiKey: "key" });
    expect(memory.has(API_CREDENTIALS_KEY)).toBe(true);
    expect(memory.has("ruledesk-web.storage")).toBe(false);
    clearApiCredentials();
    expect(getApiCredentials()).toBeNull();
  });

  it("offers no downloads without a key, and does nothing when started without one", async () => {
    stubDownload();
    stubApi([1]);
    expect(downloadsAvailable()).toBe(false);
    await startDownload("Pics", { kind: "query", tags: "cat" });
    expect(getDownloadState().phase).toBe("idle");

    setApiCredentials("42", "key");
    expect(downloadsAvailable()).toBe(true);
  });

  it("finds the files through the API and saves them one by one into a folder", async () => {
    setApiCredentials("42", "key");
    stubApi([3, 2, 1]);
    const names = stubDownload();

    const run = startDownload("My pics", { kind: "query", tags: "cat" });
    await vi.advanceTimersByTimeAsync(LONG_MS);
    await run;

    expect(names).toEqual([
      "My pics/rule34-3.png",
      "My pics/rule34-2.png",
      "My pics/rule34-1.png",
    ]);
    expect(getDownloadState()).toMatchObject({
      phase: "done",
      label: "My pics",
      total: 3,
      done: 3,
      failed: 0,
    });
    expect(memory.get(DOWNLOADS_JOB_KEY)).toBeNull();
  });

  it("saves under the folder chosen in settings and remembers the choice", async () => {
    setApiCredentials("42", "key");
    expect(setDownloadBaseFolder(" art//rule34/ ")).toBe("art/rule34");
    expect(getDownloadBaseFolder()).toBe("art/rule34");
    stubApi([3]);
    const names = stubDownload();

    const run = startDownload("My pics", { kind: "query", tags: "cat" });
    await vi.advanceTimersByTimeAsync(LONG_MS);
    await run;

    expect(names).toEqual(["art/rule34/My pics/rule34-3.png"]);
  });

  it("retries a failed file once, counts it as failed and goes on", async () => {
    setApiCredentials("42", "key");
    stubApi([3, 2, 1]);
    const names = stubDownload([2]);

    const run = startDownload("Pics", { kind: "query", tags: "cat" });
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS + LONG_MS);
    await run;

    expect(names).toEqual(["Pics/rule34-3.png", "Pics/rule34-1.png"]);
    expect(getDownloadState()).toMatchObject({ phase: "done", done: 2, failed: 1 });
  });

  it("pauses after the file in flight, keeps the job, and resumes from there", async () => {
    setApiCredentials("42", "key");
    stubApi([3, 2, 1]);
    const names = stubDownload();

    void startDownload("Pics", { kind: "query", tags: "cat" });
    // The API walk makes two requests one second apart; then the first file.
    await vi.advanceTimersByTimeAsync(1100);
    expect(names).toHaveLength(1);
    pauseDownload();
    await vi.advanceTimersByTimeAsync(LONG_MS);

    expect(getDownloadState().phase).toBe("paused");
    expect(names).toHaveLength(1);
    expect(memory.get(DOWNLOADS_POSITION_KEY)).toEqual({ next: 1, failed: [] });

    resumeDownload();
    await vi.advanceTimersByTimeAsync(LONG_MS);
    expect(names).toHaveLength(3);
    expect(getDownloadState().phase).toBe("done");
  });

  it("shows a stored job paused in another tab and continues it in the tab that ran it", async () => {
    setApiCredentials("42", "key");
    const names = stubDownload();
    const job = {
      label: "Pics",
      folder: "Pics",
      files: [
        { postId: 3, url: "https://wimg.rule34.xxx//images/1/3.png" },
        { postId: 2, url: "https://wimg.rule34.xxx//images/1/2.png" },
      ],
    };
    memory.set(DOWNLOADS_JOB_KEY, job);
    memory.set(DOWNLOADS_POSITION_KEY, { next: 1, failed: [] });

    restoreDownloads();
    expect(getDownloadState()).toMatchObject({ phase: "paused", total: 2, done: 1 });
    expect(names).toEqual([]);

    resetDownloadsState();
    window.sessionStorage.setItem("ruledesk-web.downloads.running", "1");
    restoreDownloads();
    await vi.advanceTimersByTimeAsync(FILE_INTERVAL_MS + LONG_MS);
    expect(names).toEqual(["Pics/rule34-2.png"]);
    expect(getDownloadState().phase).toBe("done");
  });

  it("says so when the API finds no files, instead of finishing with nothing", async () => {
    setApiCredentials("42", "key");
    stubDownload();
    stubApi([]);
    const run = startDownload("Pics", { kind: "ids", ids: [1] });
    await vi.advanceTimersByTimeAsync(LONG_MS);
    await run;
    expect(getDownloadState()).toMatchObject({ phase: "error" });
    expect(getDownloadState().message).toContain("no files");
    expect(memory.has(DOWNLOADS_JOB_KEY)).toBe(false);
  });

  it("reports an API refusal instead of starting, and Cancel clears it", async () => {
    setApiCredentials("42", "wrong");
    stubDownload();
    vi.stubGlobal("fetch", () =>
      Promise.resolve(new Response('"Missing authentication."', { status: 200 })),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await startDownload("Pics", { kind: "query", tags: "cat" });

    expect(getDownloadState()).toMatchObject({
      phase: "error",
      message: "API: Missing authentication.",
    });
    cancelDownload();
    expect(getDownloadState().phase).toBe("idle");
    vi.restoreAllMocks();
  });
});
