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

/**
 * Where a job's files go, relative to the browser's download folder: a folder
 * named after the job (a collection name or a search), made safe for a folder
 * name. Where that download folder is, is the browser's own setting.
 */
export function downloadFolder(label: string): string {
  const safe = label
    .replace(FOLDER_FORBIDDEN, " ")
    .replace(FOLDER_SPACES, " ")
    .slice(0, FOLDER_MAX_LENGTH)
    .replace(FOLDER_EDGE, "");
  return safe.length > 0 ? safe : FOLDER_FALLBACK;
}

/** The name a file gets when no mask is set: `rule34-<post id>`. */
export const DEFAULT_FILE_MASK = "rule34-[id]";
/** What a mask may hold, in square brackets. */
export const FILE_MASK_TOKENS = [
  "id",
  "md5",
  "rating",
  "score",
  "width",
  "height",
  "owner",
  "date",
] as const;
export type FileMaskToken = (typeof FILE_MASK_TOKENS)[number];

/** What is known about a file when it is named. Only the id and the address are always there. */
export type FileNameInfo = {
  readonly postId: number;
  readonly url: string;
  readonly rating?: string | undefined;
  readonly score?: number | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly owner?: string | undefined;
};

const MASK_TOKEN = /\[([a-z0-9]+)\]/gi;
const NAME_FORBIDDEN = /[\\/:*?"<>|\u0000-\u001f]+/g;
/** A run of separators left where a token had no value. */
const NAME_SEPARATOR_RUN = /([-_. ])[-_. ]+/g;
const NAME_EDGE = /^[-_. ]+|[-_. ]+$/g;
const NAME_MAX_LENGTH = 120;
const DATE_LENGTH = 10;
const PATH_TAIL = /([^/]+?)(?:\.[a-z0-9]{2,5})?$/i;

function isFileMaskToken(value: string): value is FileMaskToken {
  return FILE_MASK_TOKENS.some((token) => token === value);
}

function filePath(url: string): string {
  try {
    return new URL(url, window.location.href).pathname;
  } catch {
    return url;
  }
}

function fileExtension(url: string): string {
  return EXTENSION_PATTERN.exec(filePath(url))?.[1]?.toLowerCase() ?? DEFAULT_EXTENSION;
}

/** The site names a file by its MD5: the name in the address is the hash. */
function fileHash(url: string): string {
  return PATH_TAIL.exec(filePath(url))?.[1] ?? "";
}

function tokenValue(token: FileMaskToken, info: FileNameInfo, now: number): string {
  switch (token) {
    case "id":
      return String(info.postId);
    case "md5":
      return fileHash(info.url);
    case "rating":
      return info.rating ?? "";
    case "score":
      return info.score === undefined ? "" : String(info.score);
    case "width":
      return info.width === undefined ? "" : String(info.width);
    case "height":
      return info.height === undefined ? "" : String(info.height);
    case "owner":
      return info.owner ?? "";
    case "date":
      return new Date(now).toISOString().slice(0, DATE_LENGTH);
  }
}

/**
 * The file name a mask gives: every `[token]` is replaced by its value, what
 * a file system does not take is dropped, and the extension of the file is
 * added. A token without a value leaves nothing behind, not a stray
 * separator; an unknown one is dropped. A mask that comes out empty falls
 * back to the default name.
 */
export function buildFileName(mask: string, info: FileNameInfo, now: number = Date.now()): string {
  const fill = (text: string): string =>
    text
      .replace(MASK_TOKEN, (_whole, raw: string) => {
        const token = raw.toLowerCase();
        return isFileMaskToken(token) ? tokenValue(token, info, now) : "";
      })
      .replace(NAME_FORBIDDEN, " ")
      .replace(FOLDER_SPACES, " ")
      .replace(NAME_SEPARATOR_RUN, "$1")
      .replace(NAME_EDGE, "")
      .slice(0, NAME_MAX_LENGTH)
      .replace(NAME_EDGE, "");
  const base = fill(mask);
  return `${base.length > 0 ? base : fill(DEFAULT_FILE_MASK)}.${fileExtension(info.url)}`;
}

const MEDIA_EXTENSION = /\.(?:jpe?g|png|gif|webp|avif|bmp|mp4|webm|mov|m4v)$/i;

/** True when the address ends like a picture or a video, not like a page. */
export function isMediaFileUrl(url: string): boolean {
  return MEDIA_EXTENSION.test(filePath(url));
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
      // The picture host answers a request that does not come from the site
      // with a web page instead of the file: say where the request comes from.
      headers: { Referer: `${window.location.origin}/` },
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
