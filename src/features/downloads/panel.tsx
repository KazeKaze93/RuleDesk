import { render } from "preact";
import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

import { log } from "../../log";
import { RDW_DOWNLOADS_PANEL_ID } from "../../pages/constants";
import { Button, IconButton, IconChevronDown, ProgressBar } from "../../ui/kit";
import type { Feature, FeatureContext } from "../types";
import { DOWNLOADS_FEATURE_ID } from "./available";
import { GRID_SELECT_CSS } from "./grid-select";
import {
  cancelDownload,
  getDownloadState,
  pauseDownload,
  restoreDownloads,
  resumeDownload,
  subscribeDownloads,
  type DownloadState,
} from "./queue";

/**
 * The download manager's panel: a small box in the corner of every page
 * while a job exists. It shows what is being saved and holds Pause, Resume
 * and Cancel. It can be minimised into a chip with the percent, so that it
 * does not lie over the last column of a grid for the whole of a long job.
 */

const FEATURE_ID = DOWNLOADS_FEATURE_ID;
const FEATURE_LABEL = "Download manager";
const FEATURE_PAGES = ["list", "post", "favorites", "other"] as const;

const DOWNLOADS_PANEL_ID = RDW_DOWNLOADS_PANEL_ID;
const HEAD_CLASS = "rdw-downloads-head";
const TITLE_CLASS = "rdw-downloads-title";
const TEXT_CLASS = "rdw-downloads-text";
const ACTIONS_CLASS = "rdw-downloads-actions";
/** On the host while the panel is a chip: the box around the chip is taken off. */
export const DOWNLOADS_MINIMISED_CLASS = "rdw-downloads-minimised";
const CHIP_CLASS = "rdw-downloads-chip";
/** The kit's parts of the progress bar, restyled inside the panel only. */
const PROGRESS_LABEL_CLASS = "rdw-progress__label";
const PROGRESS_WAITING_CLASS = "rdw-progress__fill--indeterminate";

/**
 * Kept for the tab, as the mark of the running tab is (queue.ts): the site
 * reloads the page on every navigation, and a panel minimised on one page
 * would be back over the grid on the next.
 */
export const DOWNLOADS_MINIMISED_KEY = "ruledesk-web.downloads.minimised";
const MINIMISED_VALUE = "1";

const PANEL_WIDTH_PX = 280;
const PANEL_INSET_PX = 16;
const PANEL_Z_INDEX = 30;
const MINIMISE_ICON_PX = 14;
const PERCENT = 100;

const TITLE_RUNNING = "Downloading";
const TITLE_DONE = "Downloaded";
const TITLE_ERROR = "Couldn’t download";
const QUOTE_OPEN = "“";
const QUOTE_CLOSE = "”";
const SELECTED_ONE = "selected post";
const SELECTED_MANY = "selected posts";
const TEXT_COLLECTING = "Looking up files…";
const TEXT_FOUND = "found";
const TEXT_OF = "of";
const TEXT_FILE = "file";
const TEXT_FILES = "files";
const TEXT_PAUSED = "Paused";
const TEXT_DONE = "Finished";
const TEXT_FAILED = "failed";
const TEXT_SEPARATOR = " · ";
const CHIP_COLLECTING = "Looking up…";
const CHIP_DONE = "Done";
const CHIP_ERROR = "Failed";
const LABEL_PAUSE = "Pause";
const LABEL_RESUME = "Resume";
const LABEL_CANCEL = "Cancel";
const LABEL_CLOSE = "Close";
const LABEL_MINIMISE = "Minimize";
const TITLE_EXPAND = "Show the download";
const WARN_SESSION = "downloads: session storage unavailable";

const FEATURE_CSS = `
#${DOWNLOADS_PANEL_ID} {
  position: fixed;
  right: ${String(PANEL_INSET_PX)}px;
  bottom: ${String(PANEL_INSET_PX)}px;
  z-index: ${String(PANEL_Z_INDEX)};
  width: ${String(PANEL_WIDTH_PX)}px;
  max-width: calc(100vw - ${String(PANEL_INSET_PX * 2)}px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12.5px/1.4 var(--rdw-font);
}
#${DOWNLOADS_PANEL_ID}:empty {
  display: none;
}
#${DOWNLOADS_PANEL_ID}.${DOWNLOADS_MINIMISED_CLASS} {
  width: auto;
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}
#${DOWNLOADS_PANEL_ID} .${CHIP_CLASS} {
  box-shadow: var(--rdw-shadow-2);
  font-variant-numeric: tabular-nums;
}
#${DOWNLOADS_PANEL_ID} .${HEAD_CLASS} {
  display: flex;
  align-items: center;
  gap: 8px;
}
#${DOWNLOADS_PANEL_ID} .${TITLE_CLASS} {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#${DOWNLOADS_PANEL_ID} .${TEXT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  word-break: break-word;
}
#${DOWNLOADS_PANEL_ID} .${PROGRESS_LABEL_CLASS} {
  font: 12.5px/1.4 var(--rdw-font);
  letter-spacing: 0;
  text-transform: none;
  word-break: break-word;
}
#${DOWNLOADS_PANEL_ID} .${ACTIONS_CLASS} {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
@media (prefers-reduced-motion: reduce) {
  #${DOWNLOADS_PANEL_ID} .${PROGRESS_WAITING_CLASS} {
    animation: none;
  }
}
`.trim();

function readMinimised(): boolean {
  try {
    return window.sessionStorage.getItem(DOWNLOADS_MINIMISED_KEY) === MINIMISED_VALUE;
  } catch {
    return false;
  }
}

function storeMinimised(minimised: boolean): void {
  try {
    if (minimised) {
      window.sessionStorage.setItem(DOWNLOADS_MINIMISED_KEY, MINIMISED_VALUE);
    } else {
      window.sessionStorage.removeItem(DOWNLOADS_MINIMISED_KEY);
    }
  } catch (error) {
    log.warn(WARN_SESSION, error);
  }
}

/**
 * What the job is, with a verb: "Downloading “test”", and for posts picked by
 * hand "Downloading 3 selected posts" instead of the name of their folder.
 */
export function downloadTitle(state: DownloadState): string {
  const verb =
    state.phase === "done" ? TITLE_DONE : state.phase === "error" ? TITLE_ERROR : TITLE_RUNNING;
  if (state.selected !== null) {
    const noun = state.selected === 1 ? SELECTED_ONE : SELECTED_MANY;
    return `${verb} ${String(state.selected)} ${noun}`;
  }
  return `${verb} ${QUOTE_OPEN}${state.label}${QUOTE_CLOSE}`;
}

/** "12 of 340 files" with ", 2 failed" when some files did not save. */
export function downloadCountText(state: DownloadState): string {
  const noun = state.total === 1 ? TEXT_FILE : TEXT_FILES;
  const counted = `${String(state.done)} ${TEXT_OF} ${String(state.total)} ${noun}`;
  return state.failed > 0 ? `${counted}, ${String(state.failed)} ${TEXT_FAILED}` : counted;
}

export function downloadStatusText(state: DownloadState): string {
  if (state.phase === "collecting") {
    // A search has no total until it is walked to the end: only what is found so far.
    return state.expected === null
      ? `${TEXT_COLLECTING} ${String(state.total)} ${TEXT_FOUND}`
      : `${TEXT_COLLECTING} ${String(state.total)} ${TEXT_OF} ${String(state.expected)}`;
  }
  if (state.phase === "error") {
    return state.message;
  }
  if (state.phase === "paused") {
    // A pause the user did not make says why; the one made with Pause needs no reason.
    const paused = state.message.length > 0 ? `${TEXT_PAUSED}: ${state.message}` : TEXT_PAUSED;
    return `${paused}${TEXT_SEPARATOR}${downloadCountText(state)}`;
  }
  if (state.phase === "done") {
    return `${TEXT_DONE}${TEXT_SEPARATOR}${downloadCountText(state)}`;
  }
  return downloadCountText(state);
}

/** The share of the files already gone through, saved or failed: 0–1. */
function savedShare(state: DownloadState): number {
  return state.total === 0 ? 0 : (state.done + state.failed) / state.total;
}

/** The few words of the minimised panel: the percent while there is one. */
export function downloadChipText(state: DownloadState): string {
  if (state.phase === "collecting") {
    return CHIP_COLLECTING;
  }
  if (state.phase === "error") {
    return CHIP_ERROR;
  }
  if (state.phase === "done") {
    return CHIP_DONE;
  }
  const percent = `${String(Math.round(savedShare(state) * PERCENT))}%`;
  return state.phase === "paused" ? `${TEXT_PAUSED}${TEXT_SEPARATOR}${percent}` : percent;
}

type DownloadsPanelProps = {
  /** The box in the corner the panel is drawn into: it is shrunk around the chip. */
  readonly host: HTMLElement;
};

function DownloadsPanel(props: DownloadsPanelProps): JSX.Element | null {
  const { host } = props;
  const [state, setState] = useState<DownloadState>(() => getDownloadState());
  const [minimised, setMinimised] = useState<boolean>(readMinimised);
  useEffect(() => {
    const unsubscribe = subscribeDownloads(setState);
    // A stored job is restored right after the first render, before this
    // effect runs: what was told meanwhile is read here, or a job waiting
    // paused from another tab would never be shown.
    setState(getDownloadState());
    return unsubscribe;
  }, []);

  const idle = state.phase === "idle";
  useEffect(() => {
    host.classList.toggle(DOWNLOADS_MINIMISED_CLASS, minimised && !idle);
  }, [host, minimised, idle]);

  const changeMinimised = (next: boolean): void => {
    storeMinimised(next);
    setMinimised(next);
  };

  if (idle) {
    return null;
  }
  const title = downloadTitle(state);
  const status = downloadStatusText(state);
  if (minimised) {
    return (
      <Button
        variant="secondary"
        size="s"
        className={CHIP_CLASS}
        title={`${TITLE_EXPAND}: ${title}${TEXT_SEPARATOR}${status}`}
        onClick={() => {
          changeMinimised(false);
        }}
      >
        {downloadChipText(state)}
      </Button>
    );
  }
  const finished = state.phase === "done" || state.phase === "error";
  return (
    <>
      <div className={HEAD_CLASS}>
        <p className={TITLE_CLASS} title={title}>
          {title}
        </p>
        <IconButton
          label={LABEL_MINIMISE}
          onClick={() => {
            changeMinimised(true);
          }}
        >
          <IconChevronDown size={MINIMISE_ICON_PX} />
        </IconButton>
      </div>
      {state.phase === "collecting" ? (
        state.expected === null ? (
          <ProgressBar waiting label={status} />
        ) : (
          <ProgressBar
            value={state.expected === 0 ? 0 : state.total / state.expected}
            label={status}
          />
        )
      ) : state.phase === "error" ? (
        <p className={TEXT_CLASS} role="alert">
          {status}
        </p>
      ) : (
        <ProgressBar value={savedShare(state)} label={status} />
      )}
      <div className={ACTIONS_CLASS}>
        {state.phase === "running" ? (
          <Button variant="secondary" size="s" onClick={pauseDownload}>
            {LABEL_PAUSE}
          </Button>
        ) : null}
        {state.phase === "paused" ? (
          <Button variant="primary" size="s" onClick={resumeDownload}>
            {LABEL_RESUME}
          </Button>
        ) : null}
        <Button variant="secondary" size="s" onClick={cancelDownload}>
          {finished ? LABEL_CLOSE : LABEL_CANCEL}
        </Button>
      </div>
    </>
  );
}

function mountDownloads(_ctx: FeatureContext): void {
  if (document.getElementById(DOWNLOADS_PANEL_ID) !== null) {
    return;
  }
  const host = document.createElement("div");
  host.id = DOWNLOADS_PANEL_ID;
  document.body.append(host);
  render(<DownloadsPanel host={host} />, host);
  restoreDownloads();
}

export const downloadsFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: `${FEATURE_CSS}
${GRID_SELECT_CSS}`,
  mount: mountDownloads,
};
