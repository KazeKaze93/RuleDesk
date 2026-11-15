/**
 * Saves one file through the script manager (`GM_download`). The files are on
 * the site's CDN, another origin, so a plain download link cannot name or
 * save them. The download manager calls this for one file at a time.
 */

const FILE_PREFIX = "rule34-";
const DEFAULT_EXTENSION = "jpg";
const EXTENSION_PATTERN = /\.([a-z0-9]{2,5})$/i;
const UNKNOWN_ERROR = "unknown error";
const TIMEOUT_ERROR = "timeout";
const FOLDER_ROOT = "RuleDesk";
const FOLDER_FALLBACK = "downloads";
const FOLDER_MAX_LENGTH = 60;
/** Characters a file system does not take in a folder name. */
const FOLDER_FORBIDDEN = /[\\/:*?"<>|]+/g;
const FOLDER_SPACES = /\s+/g;
const FOLDER_EDGE = /^[. ]+|[. ]+$/g;

/** `rule34-<postId>.<ext>`, the extension taken from the file address. */
export function downloadFileName(url: string, postId: number): string {
  let path = url;
  try {
    path = new URL(url, window.location.href).pathname;
  } catch {
    // Keep the raw text: the pattern below still finds an extension in it.
  }
  const extension = EXTENSION_PATTERN.exec(path)?.[1]?.toLowerCase() ?? DEFAULT_EXTENSION;
  return `${FILE_PREFIX}${String(postId)}.${extension}`;
}

/** `RuleDesk/<label>` with the label made safe for a folder name. */
export function downloadFolder(label: string): string {
  const safe = label
    .replace(FOLDER_FORBIDDEN, " ")
    .replace(FOLDER_SPACES, " ")
    .slice(0, FOLDER_MAX_LENGTH)
    .replace(FOLDER_EDGE, "");
  return `${FOLDER_ROOT}/${safe.length > 0 ? safe : FOLDER_FALLBACK}`;
}

/** False when the script manager gives no download function. */
export function canDownload(): boolean {
  return typeof GM_download === "function";
}

/**
 * Starts one download. Resolves when the manager reports the file saved,
 * rejects with a readable reason when it reports an error or a timeout.
 */
export function downloadFile(url: string, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    GM_download({
      url,
      name,
      onload: () => {
        resolve();
      },
      onerror: (event) => {
        const reason = typeof event.error === "string" ? event.error : UNKNOWN_ERROR;
        reject(new Error(reason));
      },
      ontimeout: () => {
        reject(new Error(TIMEOUT_ERROR));
      },
    });
  });
}
