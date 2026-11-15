import { render } from "preact";
import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

import { RDW_DOWNLOADS_PANEL_ID } from "../../pages/constants";
import { Button, ProgressBar } from "../../ui/kit";
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
 * and Cancel.
 */

const FEATURE_ID = DOWNLOADS_FEATURE_ID;
const FEATURE_LABEL = "Download manager";
const FEATURE_PAGES = ["list", "post", "favorites", "other"] as const;

const DOWNLOADS_PANEL_ID = RDW_DOWNLOADS_PANEL_ID;
const TITLE_CLASS = "rdw-downloads-title";
const TEXT_CLASS = "rdw-downloads-text";
const ACTIONS_CLASS = "rdw-downloads-actions";

const PANEL_WIDTH_PX = 280;
const PANEL_INSET_PX = 16;
const PANEL_Z_INDEX = 30;

const TEXT_COLLECTING = "Finding files: ";
const TEXT_PAUSED = "Paused";
const TEXT_DONE = "Finished";
const TEXT_FAILED_JOIN = ", failed ";
const LABEL_PAUSE = "Pause";
const LABEL_RESUME = "Resume";
const LABEL_CANCEL = "Cancel";
const LABEL_CLOSE = "Close";

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
#${DOWNLOADS_PANEL_ID} .${TITLE_CLASS} {
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
#${DOWNLOADS_PANEL_ID} .${ACTIONS_CLASS} {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
`.trim();

/** "12 / 340" with ", failed 2" when some files did not save. */
export function downloadCountText(state: DownloadState): string {
  const counted = `${String(state.done)} / ${String(state.total)}`;
  return state.failed > 0 ? `${counted}${TEXT_FAILED_JOIN}${String(state.failed)}` : counted;
}

function statusText(state: DownloadState): string {
  if (state.phase === "collecting") {
    return `${TEXT_COLLECTING}${String(state.total)}`;
  }
  if (state.phase === "error") {
    return state.message;
  }
  if (state.phase === "paused") {
    return `${TEXT_PAUSED} · ${downloadCountText(state)}`;
  }
  if (state.phase === "done") {
    return `${TEXT_DONE} · ${downloadCountText(state)}`;
  }
  return downloadCountText(state);
}

function DownloadsPanel(): JSX.Element | null {
  const [state, setState] = useState<DownloadState>(() => getDownloadState());
  useEffect(() => subscribeDownloads(setState), []);

  if (state.phase === "idle") {
    return null;
  }
  const finished = state.phase === "done" || state.phase === "error";
  const processed = state.done + state.failed;
  return (
    <>
      <p className={TITLE_CLASS} title={state.label}>
        {state.label}
      </p>
      {state.phase === "collecting" ? (
        <ProgressBar waiting label={statusText(state)} />
      ) : state.phase === "error" ? (
        <p className={TEXT_CLASS} role="alert">
          {statusText(state)}
        </p>
      ) : (
        <ProgressBar
          value={state.total === 0 ? 0 : processed / state.total}
          label={statusText(state)}
        />
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
  render(<DownloadsPanel />, host);
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
