import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

import { log } from "../log";
import {
  FAVORITES_SYNC_MODE_FULL,
  FAVORITES_SYNC_MODE_INCREMENTAL,
  FAVORITES_SYNC_PAGE_PAUSE_MS,
  FAVORITES_SYNC_PID_STEP,
  readFavoritesSyncMode,
  runFavoritesSync,
  type FavoritesSyncMode,
  type FavoritesSyncProgress,
  type FavoritesSyncResult,
} from "../site/favorites-sync";
import { getSyncState, loadFavSet } from "../storage/favs";
import type { FavsSyncState } from "../storage/schema";
import { formatDayTime } from "../ui/format-date";
import { Button, ProgressBar, SectionLabel } from "../ui/kit";

const SECTION_CLASS = "rdw-favs-sync";
const STATUS_CLASS = "rdw-favs-sync-status";
const ACTIONS_CLASS = "rdw-favs-sync-actions";
const NOTE_CLASS = "rdw-favs-sync-note";

const HEADING = "Favorites sync";
const TEXT_SYNC = "Sync favorites";
const TEXT_FULL = "Full resync";
const TEXT_RESUME = "Resume";
const TEXT_STOP = "Stop";
const TEXT_STARTING = "Starting sync…";
const PROGRESS_LABEL = "Favorites sync progress";
const STATUS_SEPARATOR = " · ";
const LOCALE = "en-US";
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

const TEXT_COUNT = (count: number): string =>
  `${count.toLocaleString(LOCALE)} ${count === 1 ? "favorite" : "favorites"}`;
const TEXT_LAST_SYNC = (when: string): string => `last sync ${when}`;
const TEXT_LAST_FULL_SYNC = (when: string): string => `last full sync ${when}`;
const TEXT_PAGE = (page: number, pages: number | null): string =>
  pages === null
    ? `page ${page.toLocaleString(LOCALE)}`
    : `page ${page.toLocaleString(LOCALE)} of ${pages.toLocaleString(LOCALE)}`;
const TEXT_PAUSED = (page: number, pages: number | null): string =>
  `paused at ${TEXT_PAGE(page, pages)}`;
const TEXT_PROGRESS = (p: FavoritesSyncProgress): string =>
  `Page ${p.page.toLocaleString(LOCALE)} of ${p.pages.toLocaleString(LOCALE)}`;

const NOTE_SYNC =
  "Sync adds new favorites and stops at the first page where every favorite is already known.";
const NOTE_FULL_ALL = "Full resync re-reads every page to refresh tags.";
const NOTE_FULL = (pages: number, duration: string): string =>
  `Full resync re-reads all ${pages.toLocaleString(LOCALE)} pages (${duration}) to refresh tags.`;
const NOTE_REMOVED = "Posts you removed on the site stay here.";
const DURATION_SHORT = "under a minute";
const DURATION_MINUTES = (minutes: number): string => `about ${String(minutes)} min`;

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
  return Number.isFinite(parsed) ? formatDayTime(parsed) : iso;
}

function pageFromPid(pid: number): number {
  return Math.floor(pid / FAVORITES_SYNC_PID_STEP) + 1;
}

/**
 * How many pages the site's list had when it was last read, or null when
 * that is not known: nothing was read yet, or the run stopped before its
 * first page gave the number.
 */
function knownPages(sync: FavsSyncState | undefined): number | null {
  if (sync === undefined) {
    return null;
  }
  if (sync.lastPid === 0 && sync.finishedAt === undefined) {
    return null;
  }
  return pageFromPid(sync.lastPid);
}

/**
 * The time a Full resync takes, by the pause the sync keeps between pages.
 * The requests themselves come on top, hence "about".
 */
function fullResyncDuration(pages: number): string {
  const seconds = ((pages - 1) * FAVORITES_SYNC_PAGE_PAUSE_MS) / MS_PER_SECOND;
  if (seconds < SECONDS_PER_MINUTE) {
    return DURATION_SHORT;
  }
  return DURATION_MINUTES(Math.ceil(seconds / SECONDS_PER_MINUTE));
}

/** One explanation for the two buttons; the number of pages only when it is known. */
function buildNoteText(): string {
  const pages = knownPages(getSyncState());
  const full =
    pages === null || pages <= 1 ? NOTE_FULL_ALL : NOTE_FULL(pages, fullResyncDuration(pages));
  return [NOTE_SYNC, full, NOTE_REMOVED].join(" ");
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
  const sync = getSyncState();
  const parts = [TEXT_COUNT(loadFavSet().size)];
  if (sync !== undefined && sync.finishedAt === undefined) {
    const page = pageFromPid(sync.nextPid);
    const pages = knownPages(sync);
    parts.push(TEXT_PAUSED(page, pages === null ? null : Math.max(pages, page)));
  } else if (sync?.finishedAt !== undefined) {
    // "Sync" finishes a run as well, and a run that stopped at the first known
    // page is not a full one: the line says which of the two the last was.
    const when = formatSyncDate(sync.finishedAt);
    parts.push(
      readFavoritesSyncMode(sync) === FAVORITES_SYNC_MODE_FULL
        ? TEXT_LAST_FULL_SYNC(when)
        : TEXT_LAST_SYNC(when),
    );
  }
  return parts.join(STATUS_SEPARATOR);
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
  // Finished or stopped, the section is at rest again: the line of the stored
  // state says how many favorites there are and where the run ended.
  if (result.status === "error") {
    return {
      ...idleUi(),
      error: result.message,
    };
  }
  return idleUi();
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
        {/* Each state shows only its own parts: the bar and Stop belong to a
            run, the two ways to start to rest, Resume to a run that stopped. */}
        {ui.busy ? (
          <ProgressBar
            value={ui.progress}
            waiting={ui.waiting}
            label={PROGRESS_LABEL}
          />
        ) : null}
        <div className={ACTIONS_CLASS}>
          {ui.busy ? (
            <Button
              variant="secondary"
              onClick={() => {
                activeSync?.controller.abort();
              }}
            >
              {TEXT_STOP}
            </Button>
          ) : ui.unfinished ? (
            <Button
              variant="primary"
              onClick={() => {
                void startSync(setUi);
              }}
            >
              {TEXT_RESUME}
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  void startSync(setUi, FAVORITES_SYNC_MODE_INCREMENTAL);
                }}
              >
                {TEXT_SYNC}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  void startSync(setUi, FAVORITES_SYNC_MODE_FULL);
                }}
              >
                {TEXT_FULL}
              </Button>
            </>
          )}
        </div>
        {ui.error.length > 0 ? <p className="rdw-error">{ui.error}</p> : null}
        <p className={NOTE_CLASS}>{buildNoteText()}</p>
      </section>
    </>
  );
}

