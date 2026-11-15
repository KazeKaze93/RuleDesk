import { canDownload } from "../../site/download";
import { hasApiCredentials } from "../../storage/api-credentials";
import { getFeatureEnabled, getTweaksEnabled } from "../../storage/store";

/** Id of the download manager among the page tweaks. */
export const DOWNLOADS_FEATURE_ID = "downloads";

/**
 * True when download buttons may be shown: the manager is switched on, the
 * script manager can download, and the user has put an API key into settings. Without a key there is no download manager at all.
 */
export function downloadsAvailable(): boolean {
  return (
    getTweaksEnabled() &&
    getFeatureEnabled(DOWNLOADS_FEATURE_ID, true) &&
    canDownload() &&
    hasApiCredentials()
  );
}
