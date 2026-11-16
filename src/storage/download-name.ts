import { DEFAULT_FILE_MASK } from "../site/download";
import { getFeatureState, setFeatureState } from "./store";

/**
 * The mask saved files are named by (RuleDesk → Downloads → File name), kept
 * with the settings. See `buildFileName` for what a mask may hold.
 */

export const FILE_MASK_STATE_ID = "download-name";

export function readFileMask(): string {
  const stored = getFeatureState(FILE_MASK_STATE_ID);
  return typeof stored === "string" && stored.trim().length > 0 ? stored : DEFAULT_FILE_MASK;
}

/** Saves the mask; an empty one returns to the default name. */
export function writeFileMask(mask: string): void {
  const clean = mask.trim();
  setFeatureState(FILE_MASK_STATE_ID, clean.length > 0 ? clean : DEFAULT_FILE_MASK);
}
