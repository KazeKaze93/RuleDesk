import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

import { log } from "../log";
import { collectPostDetails, type PostFile } from "../site/api";
import {
  FAVORITES_SYNC_MODE_FULL,
  FAVORITES_SYNC_MODE_INCREMENTAL,
  FAVORITES_SYNC_PAGE_PAUSE_MS,
  FAVORITES_SYNC_PID_STEP,
  runFavoritesSync,
  type FavoritesSyncMode,
  type FavoritesSyncProgress,
  type FavoritesSyncResult,
} from "../site/favorites-sync";
import { getApiCredentials, hasApiCredentials } from "../storage/api-credentials";
import {
  putFavoriteDetails,
  readFavoriteIndex,
  type FavoriteDetails,
  type FavoriteIndexEntry,
} from "../storage/favorites-index";
import { getSyncState, loadFavSet } from "../storage/favs";
import type { FavsSyncState } from "../storage/schema";
import { Button, ProgressBar, SectionLabel } from "../ui/kit";

const SECTION_CLASS = "rdw-favs-sync";
const STATUS_CLASS = "rdw-favs-sync-status";
const ACTIONS_CLASS = "rdw-favs-sync-actions";
const WARNING_CLASS = "rdw-favs-sync-warning";
const NOTE_CLASS = "rdw-favs-sync-note";

const HEADING = "Favorites sync";
const TEXT_SYNC = "Sync favorites";
const TEXT_FULL = "Full resync";
const TEXT_RESUME = "Resume";
const TEXT_STOP = "Stop";
const TEXT_WARNING =
  "Sync stops at the first page of already-known favorites (newest first). Full resync re-reads every page: use it to refresh tags changed on the site. One request per 1.5 s";
const TEXT_NOTE =
  "Sync only adds favorites. Posts removed on the site stay in the local set.";
const TEXT_IDLE_COUNT = (count: number): string =>
  `${String(count)} in local favorites set`;
const TEXT_LAST_SYNC = (iso: string): string =>
  `Last full sync: ${formatSyncDate(iso)}`;
const TEXT_PAUSED = (page: number, pages: number): string =>
  `Paused at page ${String(page)} of ${String(pages)}`;
const TEXT_PROGRESS = (p: FavoritesSyncProgress): string =>
  `Page ${String(p.page)} of ${String(p.pages)} · ${String(p.total)} ids`;
const TEXT_DONE = (total: number, pages: number): string =>
  `Synced ${String(total)} ids across ${String(pages)} pages`;
const TEXT_ABORTED = (page: number, pages: number, total: number): string =>
  `Stopped at page ${String(page)} of ${String(pages)} · ${String(total)} ids`;
const TEXT_STARTING = "Starting sync…";
const TEXT_DETAILS = "Read ratings and sizes";
const TEXT_DETAILS_TITLE =
  "Asks the site API for the rating, score and size of your favorites, a hundred posts a request";
const TEXT_DETAILS_HINT =
  "With an API key, Full resync then reads the rating, score and size of every favorite, for rating:, score:, width: and height: in the favorites search. \u201cRead ratings and sizes\u201d does only that.";
const TEXT_DETAILS_PROGRESS = (asked: number, total: number): string =>
  `Ratings and sizes: ${String(asked)} of ${String(total)}`;
const TEXT_DETAILS_DONE = (read: number, total: number): string =>
  `Ratings and sizes read for ${String(read)} of ${String(total)} favorites`;
const TEXT_DETAILS_NONE = "No favorites in the index yet: run Full resync first.";

const PAUSE_SECONDS = FAVORITES_SYNC_PAGE_PAUSE_MS / 1000;

export const FAVORITES_SYNC_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${SECTION_CLASS} .${STATUS_CLASS} {
  margin: 0;
  color: var(--rdw-text);
  font-size: 12px;
}
.${SECTION_CLASS} .${ACTIONS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.${SECTION_CLASS} .${WARNING_CLASS},
.${SECTION_CLASS} .${NOTE_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim();

export type FavoritesSyncSectionOptions = {
  readonly includeHeading?: boolean;
};

type ActiveSync = {
  controller: AbortController;
  listeners: Set<(progress: FavoritesSyncProgress) => void>;
};

type SyncUi = {
  status: string;
  progress: number | null;
  waiting: boolean;
  error: string;
  unfinished: boolean;
  busy: boolean;
};

let activeSync: ActiveSync | null = null;

function formatSyncDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) {
    return iso;
  }
  return new Date(parsed).toLocaleString();
}

function pageFromPid(pid: number): number {
  return Math.floor(pid / FAVORITES_SYNC_PID_STEP) + 1;
}

function pagesFromLastPid(lastPid: number): number {
  return Math.floor(lastPid / FAVORITES_SYNC_PID_STEP) + 1;
}

function isUnfinished(sync: FavsSyncState | undefined): boolean {
  return sync !== undefined && sync.finishedAt === undefined;
}

function ratioFromProgress(progress: FavoritesSyncProgress): number | null {
  if (progress.pages <= 0) {
    return null;
  }
  return progress.page / progress.pages;
}

function buildStatusText(): string {
  const count = loadFavSet().size;
  const sync = getSyncState();
  const parts = [TEXT_IDLE_COUNT(count)];
  if (sync !== undefined && sync.finishedAt === undefined) {
    const page = pageFromPid(sync.nextPid);
    const pages = Math.max(pagesFromLastPid(sync.lastPid), page);
    parts.push(TEXT_PAUSED(page, pages));
  } else if (sync?.finishedAt !== undefined) {
    parts.push(TEXT_LAST_SYNC(sync.finishedAt));
  }
  return parts.join(" · ");
}

function idleUi(): SyncUi {
  return {
    status: buildStatusText(),
    progress: null,
    waiting: false,
    error: "",
    unfinished: isUnfinished(getSyncState()),
    busy: activeSync !== null,
  };
}

function progressUi(progress: FavoritesSyncProgress): SyncUi {
  const ratio = ratioFromProgress(progress);
  return {
    status: TEXT_PROGRESS(progress),
    progress: ratio,
    waiting: ratio === null,
    error: "",
    unfinished: true,
    busy: true,
  };
}

function applyResult(result: FavoritesSyncResult): SyncUi {
  activeSync = null;
  if (result.status === "error") {
    return {
      ...idleUi(),
      error: result.message,
    };
  }
  if (result.status === "completed") {
    return {
      status: TEXT_DONE(result.total, result.pages),
      progress: result.pages > 0 ? 1 : null,
      waiting: false,
      error: "",
      unfinished: false,
      busy: false,
    };
  }
  return {
    status: TEXT_ABORTED(result.page, result.pages, result.total),
    progress: ratioFromProgress({
      page: result.page,
      pages: result.pages,
      total: result.total,
    }),
    waiting: false,
    error: "",
    unfinished: isUnfinished(getSyncState()),
    busy: false,
  };
}

async function startSync(
  setUi: (next: SyncUi) => void,
  mode?: FavoritesSyncMode,
): Promise<void> {
  if (activeSync !== null) {
    return;
  }

  const controller = new AbortController();
  const listeners = new Set<(progress: FavoritesSyncProgress) => void>();
  activeSync = { controller, listeners };

  listeners.add((progress) => {
    setUi(progressUi(progress));
  });

  setUi({
    status: TEXT_STARTING,
    progress: null,
    waiting: true,
    error: "",
    unfinished: true,
    busy: true,
  });

  try {
    const result = await runFavoritesSync({
      onProgress: (progress) => {
        for (const listener of listeners) {
          listener(progress);
        }
      },
      signal: controller.signal,
      ...(mode !== undefined ? { mode } : {}),
    });
    if (activeSync?.controller === controller) {
      setUi(applyResult(result));
      // A full walk has just written every entry anew; with a key the
      // ratings and sizes are read straight after it.
      if (
        result.status === "completed" &&
        mode === FAVORITES_SYNC_MODE_FULL &&
        hasApiCredentials()
      ) {
        await startDetails(setUi);
      }
    }
  } catch (error) {
    log.error("favorites sync section: unexpected failure", error);
    if (activeSync?.controller === controller) {
      activeSync = null;
      setUi({
        ...idleUi(),
        error: error instanceof Error ? error.message : "unexpected error",
      });
    }
  }
}

/** The posts the details are asked for: the indexed favorites, the newest post first. */
export function detailIds(
  entries: readonly FavoriteIndexEntry[],
  favorites: ReadonlySet<number>,
): number[] {
  return entries
    .map((entry) => entry.id)
    .filter((id) => favorites.has(id))
    .sort((a, b) => b - a);
}

function detailsOf(post: PostFile): FavoriteDetails {
  return {
    id: post.postId,
    rating: post.rating,
    score: post.score,
    width: post.width,
    height: post.height,
  };
}

/**
 * Reads the rating, score and size of the indexed favorites from the API and
 * lays them over the index. Shares the sync's Stop button and its "one at a
 * time" rule. Does nothing without a key.
 */
async function startDetails(setUi: (next: SyncUi) => void): Promise<void> {
  const credentials = getApiCredentials();
  if (activeSync !== null || credentials === null) {
    return;
  }
  const controller = new AbortController();
  activeSync = { controller, listeners: new Set() };
  const busyUi = (status: string, progress: number | null): SyncUi => ({
    status,
    progress,
    waiting: progress === null,
    error: "",
    unfinished: isUnfinished(getSyncState()),
    busy: true,
  });
  setUi(busyUi(TEXT_DETAILS, null));
  try {
    const ids = detailIds(await readFavoriteIndex(), loadFavSet());
    if (ids.length === 0) {
      activeSync = null;
      setUi({ ...idleUi(), status: TEXT_DETAILS_NONE });
      return;
    }
    let read = 0;
    await collectPostDetails(ids, {
      credentials,
      isCancelled: () => controller.signal.aborted,
      onBatch: async (posts, asked) => {
        await putFavoriteDetails(posts.map(detailsOf));
        read += posts.length;
        setUi(busyUi(TEXT_DETAILS_PROGRESS(asked, ids.length), asked / ids.length));
      },
    });
    activeSync = null;
    setUi({ ...idleUi(), status: TEXT_DETAILS_DONE(read, ids.length) });
  } catch (error) {
    log.error("favorites sync section: details failed", error);
    activeSync = null;
    setUi({
      ...idleUi(),
      error: error instanceof Error ? error.message : "unexpected error",
    });
  }
}

export function FavoritesSyncSection(
  props: FavoritesSyncSectionOptions = {},
): JSX.Element {
  const includeHeading = props.includeHeading !== false;
  const [ui, setUi] = useState<SyncUi>(() => idleUi());

  useEffect(() => {
    if (activeSync === null) {
      return;
    }
    const listener = (progress: FavoritesSyncProgress): void => {
      setUi(progressUi(progress));
    };
    activeSync.listeners.add(listener);
    setUi({
      status: TEXT_STARTING,
      progress: null,
      waiting: true,
      error: "",
      unfinished: true,
      busy: true,
    });
    return () => {
      activeSync?.listeners.delete(listener);
    };
  }, []);

  return (
    <>
      <style>{FAVORITES_SYNC_SECTION_CSS}</style>
      <section className={`rdw-section ${SECTION_CLASS}`}>
        {includeHeading ? <SectionLabel>{HEADING}</SectionLabel> : null}
        <p className={STATUS_CLASS}>{ui.status}</p>
        <ProgressBar
          value={ui.progress}
          waiting={ui.waiting}
          label="Favorites sync progress"
        />
        <div className={ACTIONS_CLASS}>
          {!ui.unfinished ? (
            <>
              <Button
                variant="primary"
                disabled={ui.busy}
                onClick={() => {
                  void startSync(setUi, FAVORITES_SYNC_MODE_INCREMENTAL);
                }}
              >
                {TEXT_SYNC}
              </Button>
              <Button
                variant="secondary"
                disabled={ui.busy}
                onClick={() => {
                  void startSync(setUi, FAVORITES_SYNC_MODE_FULL);
                }}
              >
                {TEXT_FULL}
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              disabled={ui.busy}
              onClick={() => {
                void startSync(setUi);
              }}
            >
              {TEXT_RESUME}
            </Button>
          )}
          {hasApiCredentials() ? (
            <Button
              variant="secondary"
              title={TEXT_DETAILS_TITLE}
              disabled={ui.busy}
              onClick={() => {
                void startDetails(setUi);
              }}
            >
              {TEXT_DETAILS}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            disabled={!ui.busy}
            onClick={() => {
              activeSync?.controller.abort();
            }}
          >
            {TEXT_STOP}
          </Button>
        </div>
        {ui.error.length > 0 ? <p className="rdw-error">{ui.error}</p> : null}
        <p className={WARNING_CLASS}>{TEXT_WARNING}</p>
        <p className={NOTE_CLASS}>{TEXT_NOTE}</p>
        <p className={NOTE_CLASS}>{TEXT_DETAILS_HINT}</p>
        <p className="rdw-hint">
          {`Pause between pages: ${String(PAUSE_SECONDS)} s`}
        </p>
      </section>
    </>
  );
}

