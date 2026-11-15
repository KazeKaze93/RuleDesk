import {
  FETCH_CREDENTIALS,
  FETCH_METHOD_GET,
  TAG_TYPE_INCLUDE,
} from "../config/constants";
import { buildSearchUrl } from "../search/query";
import type { PostCount } from "../storage/schema";
import {
  readFirstThumbUrls,
  readNewestPostId,
  readResultCount,
} from "./result-page";

/** How many thumbs an artist card shows. */
export const ARTIST_COVER_SIZE = 4;

export type ArtistSnapshot = {
  readonly cover: string[];
  readonly postCount: PostCount | null;
  /** Newest post id on the artist's first results page, 0 when it has none. */
  readonly lastPostId: number;
};

/** What a results page of one artist tag tells about the artist. */
export function readArtistSnapshot(root: ParentNode, tag: string): ArtistSnapshot {
  return {
    cover: readFirstThumbUrls(root, ARTIST_COVER_SIZE),
    postCount: readResultCount(root, tag),
    lastPostId: readNewestPostId(root),
  };
}

/**
 * Reads the first results page of one artist tag. One request.
 * Only the "Refresh" run of the Following page calls it, started by the user,
 * one artist at a time with a pause. Throws on a network error or a non-OK
 * status (the site answers 429 when asked too often).
 */
export async function fetchArtistSnapshot(tag: string): Promise<ArtistSnapshot> {
  const url = buildSearchUrl([{ tag, type: TAG_TYPE_INCLUDE }]);
  const response = await fetch(url, {
    method: FETCH_METHOD_GET,
    credentials: FETCH_CREDENTIALS,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}`);
  }
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  return readArtistSnapshot(doc, tag);
}
