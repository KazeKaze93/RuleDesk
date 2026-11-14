import { THUMB_ANCHOR_NAME, THUMB_CLASS } from "../features/types";

export const BASE_GRID_CSS = `
.${THUMB_CLASS} {
  position: relative;
  anchor-scope: ${THUMB_ANCHOR_NAME};
}

.${THUMB_CLASS} img.preview {
  anchor-name: ${THUMB_ANCHOR_NAME};
}
`;

/** Grid thumbnail CDN host (rule34.xxx). */
export const THUMB_IMAGE_HOST = "wimg.rule34.xxx";

/**
 * Video CDN origin. Path after origin starts with `//images/` (verified double
 * slash on ws-cdn-video.rule34.xxx).
 */
export const VIDEO_CDN_ORIGIN = "https://ws-cdn-video.rule34.xxx";

const THUMB_PATH_PATTERN =
  /^\/thumbnails\/([^/]+)\/thumbnail_([^/]+)\.jpg$/i;

const HTTPS_PROTOCOL = "https:";
const THUMB_DIRECTORY = "thumbnails";
const THUMB_FILE_PREFIX = "thumbnail_";
const THUMB_FILE_EXT = "jpg";
const MIN_POST_ID = 0;

const VIDEO_CDN_HOST = new URL(VIDEO_CDN_ORIGIN).hostname;

/** `/samples/<dir>/sample_<hash>.<ext>` with repeated slashes allowed. */
const SAMPLE_MEDIA_PATTERN =
  /^\/+samples\/+([^/]+)\/+sample_([^/]+)\.[^/.]+$/i;

/** `/images/<dir>/<hash>.<ext>` with repeated slashes allowed. */
const IMAGE_MEDIA_PATTERN = /^\/+images\/+([^/]+)\/+([^/]+)\.[^/.]+$/i;

function normalizeMediaPostId(postId: number): number | null {
  if (!Number.isInteger(postId) || postId < MIN_POST_ID) {
    return null;
  }
  return postId;
}

function readMediaDirAndHash(pathname: string): { dir: string; hash: string } | null {
  const sample = SAMPLE_MEDIA_PATTERN.exec(pathname);
  const image = sample === null ? IMAGE_MEDIA_PATTERN.exec(pathname) : null;
  const match = sample ?? image;
  if (match === null) {
    return null;
  }
  const dir = match[1];
  const hash = match[2];
  if (
    dir === undefined ||
    hash === undefined ||
    dir.length === 0 ||
    hash.length === 0
  ) {
    return null;
  }
  return { dir, hash };
}

export function ensureThumbAnchor(thumb: HTMLElement): void {
  thumb.classList.add(THUMB_CLASS);
}

/**
 * Build the CDN mp4 URL from a grid webm thumb `img.preview` src.
 * Thumb: `https://wimg.rule34.xxx/thumbnails/<dir>/thumbnail_<hash>.jpg?<id>`
 * Video: `https://ws-cdn-video.rule34.xxx//images/<dir>/<hash>.mp4?<id>`
 * Unparseable input → null (no guessing).
 */
export function buildVideoUrlFromThumbUrl(thumbUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(thumbUrl);
  } catch {
    return null;
  }
  if (parsed.hostname !== THUMB_IMAGE_HOST) {
    return null;
  }
  const match = THUMB_PATH_PATTERN.exec(parsed.pathname);
  if (match === null) {
    return null;
  }
  const dir = match[1];
  const hash = match[2];
  if (dir === undefined || hash === undefined || dir.length === 0 || hash.length === 0) {
    return null;
  }
  return `${VIDEO_CDN_ORIGIN}//images/${dir}/${hash}.mp4${parsed.search}`;
}

/**
 * Thumb URL for a sample or full-media CDN URL.
 * Sample: `https://wimg.rule34.xxx//samples/<dir>/sample_<hash>.<ext>?<id>`
 * Image/video: `https://ws-cdn-video.rule34.xxx//images/<dir>/<hash>.<ext>?<id>`
 * Result: `https://wimg.rule34.xxx/thumbnails/<dir>/thumbnail_<hash>.jpg?<postId>`
 * Repeated slashes in the path are accepted. Unparseable input → null.
 * The query is `postId` (the caller’s post), not whatever query the media URL had.
 */
export function deriveThumbUrlFromMedia(
  mediaUrl: string,
  postId: number,
): string | null {
  const normalizedId = normalizeMediaPostId(postId);
  if (normalizedId === null) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(mediaUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== HTTPS_PROTOCOL) {
    return null;
  }
  if (
    parsed.hostname !== THUMB_IMAGE_HOST &&
    parsed.hostname !== VIDEO_CDN_HOST
  ) {
    return null;
  }
  const media = readMediaDirAndHash(parsed.pathname);
  if (media === null) {
    return null;
  }
  return `https://${THUMB_IMAGE_HOST}/${THUMB_DIRECTORY}/${media.dir}/${THUMB_FILE_PREFIX}${media.hash}.${THUMB_FILE_EXT}?${String(normalizedId)}`;
}
