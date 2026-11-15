import * as z from "zod/mini";

import { log } from "../../log";
import {
  collectPostFiles,
  type DownloadSource,
  type PostFile,
} from "../../site/api";
import { downloadFile, downloadFileName, downloadFolder } from "../../site/download";
import { getApiCredentials } from "../../storage/api-credentials";
import { getDownloadBaseFolder } from "../../storage/download-settings";

/**
 * The download queue. One job at a time: first the files of the job are found
 * through the API, then they are saved one after another.
 *
 * The job is stored, so it survives a page change: the site reloads the page
 * on every navigation, and the tab that was downloading picks the job up
 * again by itself. A stored job in another tab, or after the browser was
 * closed, waits paused until Resume is pressed.
 */

export const DOWNLOADS_JOB_KEY = "ruledesk-web.downloads";
export const DOWNLOADS_POSITION_KEY = "ruledesk-web.downloads.position";
/** Set in the tab that runs the queue, so only that tab resumes by itself. */
const RUNNING_TAB_KEY = "ruledesk-web.downloads.running";
const RUNNING_TAB_VALUE = "1";

/** Pause between two files. */
export const FILE_INTERVAL_MS = 400;
/** Wait before the one retry of a failed file. */
export const RETRY_DELAY_MS = 5000;

const NO_FILES_MESSAGE =
  "The API returned no files for this. Deleted posts have none.";

const JobSchema = z.object({
  label: z.string(),
  folder: z.string(),
  files: z.array(z.object({ postId: z.int(), url: z.string() })),
});

const PositionSchema = z.object({
  next: z.int(),
  failed: z.array(z.int()),
});

type Job = z.infer<typeof JobSchema>;

export type DownloadPhase =
  | "idle"
  | "collecting"
  | "running"
  | "paused"
  | "done"
  | "error";

export type DownloadState = {
  readonly phase: DownloadPhase;
  readonly label: string;
  /** Files found so far while collecting; all files of the job afterwards. */
  readonly total: number;
  readonly done: number;
  readonly failed: number;
  /** Why the job stopped, when `phase` is "error". */
  readonly message: string;
};

const IDLE: DownloadState = {
  phase: "idle",
  label: "",
  total: 0,
  done: 0,
  failed: 0,
  message: "",
};

type Listener = (state: DownloadState) => void;

let state: DownloadState = IDLE;
let job: Job | null = null;
let next = 0;
let failed: number[] = [];
/** Bumped on every start, pause and cancel: a loop of an older run stops. */
let runToken = 0;
const listeners = new Set<Listener>();

function emit(nextState: DownloadState): void {
  state = nextState;
  for (const listener of listeners) {
    listener(state);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function markRunningTab(running: boolean): void {
  try {
    if (running) {
      window.sessionStorage.setItem(RUNNING_TAB_KEY, RUNNING_TAB_VALUE);
    } else {
      window.sessionStorage.removeItem(RUNNING_TAB_KEY);
    }
  } catch (error) {
    log.warn("downloads: session storage unavailable", error);
  }
}

function isRunningTab(): boolean {
  try {
    return window.sessionStorage.getItem(RUNNING_TAB_KEY) === RUNNING_TAB_VALUE;
  } catch {
    return false;
  }
}

function savePosition(): void {
  GM_setValue(DOWNLOADS_POSITION_KEY, { next, failed });
}

function clearStored(): void {
  GM_setValue(DOWNLOADS_JOB_KEY, null);
  GM_setValue(DOWNLOADS_POSITION_KEY, null);
  markRunningTab(false);
}

function progress(phase: DownloadPhase, message = ""): DownloadState {
  return {
    phase,
    label: job?.label ?? state.label,
    total: job?.files.length ?? state.total,
    done: next - failed.length,
    failed: failed.length,
    message,
  };
}

async function saveOne(file: PostFile, folder: string): Promise<boolean> {
  const name = `${folder}/${downloadFileName(file.url, file.postId)}`;
  try {
    await downloadFile(file.url, name);
    return true;
  } catch (first) {
    log.warn("downloads: file failed, retrying once", file.postId, first);
  }
  await sleep(RETRY_DELAY_MS);
  try {
    await downloadFile(file.url, name);
    return true;
  } catch (second) {
    log.warn("downloads: file failed", file.postId, second);
    return false;
  }
}

async function run(): Promise<void> {
  const current = job;
  if (current === null) {
    return;
  }
  runToken += 1;
  const token = runToken;
  markRunningTab(true);
  emit(progress("running"));
  while (next < current.files.length) {
    const file = current.files[next];
    if (file === undefined) {
      break;
    }
    const saved = await saveOne(file, current.folder);
    if (token !== runToken) {
      // Paused or cancelled while this file was on its way: it is not counted.
      return;
    }
    if (!saved) {
      failed.push(file.postId);
    }
    next += 1;
    savePosition();
    emit(progress("running"));
    if (next < current.files.length) {
      await sleep(FILE_INTERVAL_MS);
      if (token !== runToken) {
        return;
      }
    }
  }
  clearStored();
  emit(progress("done"));
}

export function getDownloadState(): DownloadState {
  return state;
}

export function subscribeDownloads(listener: Listener): () => void {
  listeners.add(listener);
  return (): void => {
    listeners.delete(listener);
  };
}

/** True while a job is being collected, saved, or waits paused. */
export function isDownloadBusy(): boolean {
  return (
    state.phase === "collecting" || state.phase === "running" || state.phase === "paused"
  );
}

/**
 * Starts a job: asks the API for the files, then saves them into
 * the job's folder (see `downloadFolder`). Does nothing while another job is busy or when no API
 * key is stored.
 */
export async function startDownload(label: string, source: DownloadSource): Promise<void> {
  const credentials = getApiCredentials();
  if (credentials === null || isDownloadBusy()) {
    return;
  }
  runToken += 1;
  const token = runToken;
  job = null;
  next = 0;
  failed = [];
  emit({ ...IDLE, phase: "collecting", label });
  let files: PostFile[];
  try {
    files = await collectPostFiles(source, {
      credentials,
      onProgress: (found) => {
        if (token === runToken) {
          emit({ ...IDLE, phase: "collecting", label, total: found });
        }
      },
      isCancelled: () => token !== runToken,
    });
  } catch (error) {
    if (token !== runToken) {
      return;
    }
    const reason = error instanceof Error ? error.message : String(error);
    log.warn("downloads: collecting failed", reason);
    emit({ ...IDLE, phase: "error", label, message: reason });
    return;
  }
  if (token !== runToken) {
    return;
  }
  if (files.length === 0) {
    emit({ ...IDLE, phase: "error", label, message: NO_FILES_MESSAGE });
    return;
  }
  job = { label, folder: downloadFolder(label, getDownloadBaseFolder()), files };
  GM_setValue(DOWNLOADS_JOB_KEY, job);
  savePosition();
  await run();
}

/** Stops after the file in flight; the job stays stored. */
export function pauseDownload(): void {
  if (state.phase !== "running") {
    return;
  }
  runToken += 1;
  markRunningTab(false);
  emit(progress("paused"));
}

export function resumeDownload(): void {
  if (state.phase !== "paused" || job === null) {
    return;
  }
  void run();
}

/** Drops the job, or closes the finished one. Saved files stay. */
export function cancelDownload(): void {
  runToken += 1;
  job = null;
  next = 0;
  failed = [];
  clearStored();
  emit(IDLE);
}

/**
 * Call once per page load. Picks a stored job up: the tab that was running
 * it continues, any other tab shows it paused.
 */
export function restoreDownloads(): void {
  if (state.phase !== "idle") {
    return;
  }
  const storedJob = JobSchema.safeParse(GM_getValue(DOWNLOADS_JOB_KEY));
  if (!storedJob.success) {
    return;
  }
  const position = PositionSchema.safeParse(GM_getValue(DOWNLOADS_POSITION_KEY));
  job = storedJob.data;
  next = position.success ? Math.min(position.data.next, job.files.length) : 0;
  failed = position.success ? [...position.data.failed] : [];
  if (isRunningTab()) {
    void run();
    return;
  }
  emit(progress("paused"));
}

/** Forgets the in-memory job without touching storage (tests). */
export function resetDownloadsState(): void {
  runToken += 1;
  job = null;
  next = 0;
  failed = [];
  state = IDLE;
  listeners.clear();
}
