import { cleanBaseFolder } from "../site/download";
import { getFeatureState, setFeatureState } from "./store";

/**
 * The download manager's own settings, kept with the other settings (and so
 * part of the Data export, unlike the API key).
 */

const STATE_ID = "downloads";

/** Folder inside the browser's download folder; empty means directly in it. */
export function getDownloadBaseFolder(): string {
  const raw = getFeatureState(STATE_ID);
  if (raw === null || typeof raw !== "object" || !("folder" in raw)) {
    return "";
  }
  return typeof raw.folder === "string" ? raw.folder : "";
}

/** Stores the cleaned path and returns it. */
export function setDownloadBaseFolder(folder: string): string {
  const clean = cleanBaseFolder(folder);
  setFeatureState(STATE_ID, { folder: clean });
  return clean;
}
