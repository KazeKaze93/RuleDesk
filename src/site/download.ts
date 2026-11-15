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

const PATH_SEPARATOR = /[\\/]+/;

function safeFolderName(name: string): string {
  return name
    .replace(FOLDER_FORBIDDEN, " ")
    .replace(FOLDER_SPACES, " ")
    .slice(0, FOLDER_MAX_LENGTH)
    .replace(FOLDER_EDGE, "");
}

/**
 * A folder path the user typed, made safe: each part cleaned, empty parts and
 * `.` / `..` dropped. The script manager saves only inside the browser's own
 * download folder, so the path is always relative to it.
 */
export function cleanBaseFolder(base: string): string {
  return base
    .split(PATH_SEPARATOR)
    .map(safeFolderName)
    .filter((part) => part.length > 0)
    .join("/");
}

/**
 * Where a job's files go, relative to the browser's download folder:
 * `<base>/<label>`, or just `<label>` without a base. The label (a collection
 * name or a search) is made safe for a folder name.
 */
export function downloadFolder(label: string, base = ""): string {
  const safe = safeFolderName(label);
  const folder = safe.length > 0 ? safe : FOLDER_FALLBACK;
  const cleanBase = cleanBaseFolder(base);
  return cleanBase.length > 0 ? `${cleanBase}/${folder}` : folder;
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
