import {
  FETCH_CREDENTIALS,
  FETCH_METHOD_GET,
  SEARCH_PAGE,
  SEARCH_PARAM_ID,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PATH,
  SEARCH_SECTION_VIEW,
} from "../config/constants";

/**
 * Saves a post's original file through the script manager (`GM_download`).
 * The file is on the site's CDN, another origin, so a plain download link
 * cannot name or save it.
 *
 * On a post page the address of the original is on the page. For a post that
 * is not open (a collection download) its page is read first: one request per
 * post, made only by a run the user started and confirmed.
 */

const LINK_LIST_SELECTOR = "div.link-list";
const ORIGINAL_LINK_TEXT = "Original image";
const POST_IMAGE_SELECTOR = "img#image";
const POST_VIDEO_SOURCE_SELECTOR = "video#gelcomVideoPlayer source[src]";
const POST_VIDEO_SELECTOR = "video#gelcomVideoPlayer[src]";
const EMPTY_HREF = "#";
const NO_ORIGINAL_ERROR = "original file not found on the post page";

const FILE_PREFIX = "rule34-";
const DEFAULT_EXTENSION = "jpg";
const EXTENSION_PATTERN = /\.([a-z0-9]{2,5})$/i;
const UNKNOWN_ERROR = "unknown error";
const TIMEOUT_ERROR = "timeout";

/** `rule34-<postId>.<ext>`, the extension taken from the file address. */
export function downloadFileName(url: string, postId: string): string {
  let path = url;
  try {
    path = new URL(url, window.location.href).pathname;
  } catch {
    // Keep the raw text: the pattern below still finds an extension in it.
  }
  const extension = EXTENSION_PATTERN.exec(path)?.[1]?.toLowerCase() ?? DEFAULT_EXTENSION;
  return `${FILE_PREFIX}${postId}.${extension}`;
}

/** False when the script manager gives no download function. */
export function canDownload(): boolean {
  return typeof GM_download === "function";
}

/**
 * Starts the download. Resolves when the manager reports the file saved,
 * rejects with a readable reason when it reports an error or a timeout.
 */
export function downloadOriginal(url: string, postId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    GM_download({
      url,
      name: downloadFileName(url, postId),
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

function attribute(root: ParentNode, selector: string, name: string): string | null {
  const value = root.querySelector(selector)?.getAttribute(name)?.trim() ?? "";
  return value.length > 0 ? value : null;
}

/**
 * Address of the original file on a post page: the "Original image" link,
 * else the video source, else the image shown. Null when none is there.
 */
export function readOriginalUrl(root: ParentNode): string | null {
  const list = root.querySelector(LINK_LIST_SELECTOR) ?? root;
  for (const link of list.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href") ?? "";
    if (
      link.textContent?.trim() === ORIGINAL_LINK_TEXT &&
      href.length > 0 &&
      href !== EMPTY_HREF
    ) {
      return href;
    }
  }
  return (
    attribute(root, POST_VIDEO_SOURCE_SELECTOR, "src") ??
    attribute(root, POST_VIDEO_SELECTOR, "src") ??
    attribute(root, POST_IMAGE_SELECTOR, "src")
  );
}

/** Reads a post's page and returns the address of its original. One request. */
export async function fetchOriginalUrl(postId: number): Promise<string> {
  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_PAGE, SEARCH_PAGE);
  params.set(SEARCH_PARAM_SECTION, SEARCH_SECTION_VIEW);
  params.set(SEARCH_PARAM_ID, String(postId));
  const response = await fetch(`${SEARCH_PATH}?${params.toString()}`, {
    method: FETCH_METHOD_GET,
    credentials: FETCH_CREDENTIALS,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}`);
  }
  const doc = new DOMParser().parseFromString(await response.text(), "text/html");
  const url = readOriginalUrl(doc);
  if (url === null) {
    throw new Error(NO_ORIGINAL_ERROR);
  }
  return new URL(url, window.location.href).href;
}
