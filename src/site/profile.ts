import * as z from "zod/mini";

import {
  FETCH_CREDENTIALS,
  FETCH_METHOD_GET,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PATH,
} from "../config/constants";
import { getFeatureState, setFeatureState } from "../storage/store";

/**
 * The numbers of the user's own profile page on the site, for Statistics.
 *
 * Read only when the user presses "Refresh profile": two requests with a
 * pause. The first reads the My Account page for the address of the "My
 * Profile" link, the second reads that profile. The address holds the user's
 * id; it is used for the second request and kept nowhere. Only the numbers of
 * the table are stored. Cookies are not read.
 *
 * My Account: `div#user-index h4 > a`, the profile link has `s=profile`.
 * Profile: `table.highlightable tr > [td label, td value]`.
 */

export const PROFILE_STATE_ID = "profile-stats";
/** Pause between the two requests of one refresh. */
export const PROFILE_REQUEST_PAUSE_MS = 1500;

const ACCOUNT_PAGE = "account";
const ACCOUNT_HOME_SECTION = "home";
const PROFILE_SECTION = "profile";
const PROFILE_LINK_SELECTOR = 'div#user-index h4 > a[href*="s=profile"]';
const PROFILE_ROW_SELECTOR = "table.highlightable tr";
const CELL_SELECTOR = ":scope > td";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DIGITS_PATTERN = /^\d+$/;

const LABEL_JOIN_DATE = "Join Date";
const LABEL_LEVEL = "Level";
const LABEL_POSTS = "Posts";
const LABEL_DELETED_POSTS = "Deleted Posts";
const LABEL_COMMENTS = "Comments";
const LABEL_TAG_EDITS = "Tag Edits";
const LABEL_NOTE_EDITS = "Note Edits";
const LABEL_FORUM_POSTS = "Forum Posts";

export const NOT_LOGGED_IN_ERROR = "No profile link on My Account. Log in to the site first.";
export const NO_PROFILE_TABLE_ERROR = "The profile page has no table to read.";

const count = z.optional(z.int());

export const ProfileStatsSchema = z.object({
  /** `YYYY-MM-DD`, as the site writes it. */
  joinDate: z.optional(z.string()),
  level: z.optional(z.string()),
  posts: count,
  deletedPosts: count,
  comments: count,
  tagEdits: count,
  noteEdits: count,
  forumPosts: count,
  /** When the page was read, ms since epoch. */
  readAt: z.number(),
});

export type ProfileStats = z.infer<typeof ProfileStatsSchema>;

/** The stored profile numbers, or null when none were read yet. */
export function readStoredProfileStats(): ProfileStats | null {
  const parsed = ProfileStatsSchema.safeParse(getFeatureState(PROFILE_STATE_ID));
  return parsed.success ? parsed.data : null;
}

function accountHomeUrl(): string {
  return `${SEARCH_PATH}?${SEARCH_PARAM_PAGE}=${ACCOUNT_PAGE}&${SEARCH_PARAM_SECTION}=${ACCOUNT_HOME_SECTION}`;
}

/**
 * The address of the user's profile from the My Account page, or null when
 * the page has no such link (not logged in) or the link leads elsewhere.
 */
export function readProfileUrl(accountPage: ParentNode, base: string): string | null {
  const href = accountPage.querySelector(PROFILE_LINK_SELECTOR)?.getAttribute("href");
  if (href === null || href === undefined) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  if (
    url.origin !== new URL(base).origin ||
    url.searchParams.get(SEARCH_PARAM_PAGE) !== ACCOUNT_PAGE ||
    url.searchParams.get(SEARCH_PARAM_SECTION) !== PROFILE_SECTION
  ) {
    return null;
  }
  return url.href;
}

function readCount(text: string | undefined): number | undefined {
  return text !== undefined && DIGITS_PATTERN.test(text) ? Number(text) : undefined;
}

/** The numbers of a profile page, or null when it has no table rows. */
export function readProfileStats(profilePage: ParentNode, now: number): ProfileStats | null {
  const values = new Map<string, string>();
  for (const row of profilePage.querySelectorAll(PROFILE_ROW_SELECTOR)) {
    const cells = row.querySelectorAll(CELL_SELECTOR);
    const label = cells[0]?.textContent?.trim();
    const value = cells[1]?.textContent?.trim();
    if (label !== undefined && value !== undefined && label.length > 0) {
      values.set(label, value);
    }
  }
  if (values.size === 0) {
    return null;
  }
  const joinDate = values.get(LABEL_JOIN_DATE);
  const level = values.get(LABEL_LEVEL);
  const stats: ProfileStats = { readAt: now };
  if (joinDate !== undefined && DATE_PATTERN.test(joinDate)) {
    stats.joinDate = joinDate;
  }
  if (level !== undefined && level.length > 0) {
    stats.level = level;
  }
  const counts = {
    posts: readCount(values.get(LABEL_POSTS)),
    deletedPosts: readCount(values.get(LABEL_DELETED_POSTS)),
    comments: readCount(values.get(LABEL_COMMENTS)),
    tagEdits: readCount(values.get(LABEL_TAG_EDITS)),
    noteEdits: readCount(values.get(LABEL_NOTE_EDITS)),
    forumPosts: readCount(values.get(LABEL_FORUM_POSTS)),
  };
  return { ...stats, ...dropUndefined(counts) };
}

function dropUndefined(counts: Record<string, number | undefined>): Record<string, number> {
  const known: Record<string, number> = {};
  for (const [key, value] of Object.entries(counts)) {
    if (value !== undefined) {
      known[key] = value;
    }
  }
  return known;
}

async function fetchPage(url: string): Promise<Document> {
  const response = await fetch(url, {
    method: FETCH_METHOD_GET,
    credentials: FETCH_CREDENTIALS,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}`);
  }
  return new DOMParser().parseFromString(await response.text(), "text/html");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Reads the user's profile numbers and stores them. Two requests. Throws with
 * a readable reason on a network error, a non-OK status, a missing profile
 * link or a page without the table.
 */
export async function refreshProfileStats(): Promise<ProfileStats> {
  const base = window.location.href;
  const profileUrl = readProfileUrl(await fetchPage(accountHomeUrl()), base);
  if (profileUrl === null) {
    throw new Error(NOT_LOGGED_IN_ERROR);
  }
  await sleep(PROFILE_REQUEST_PAUSE_MS);
  const read = readProfileStats(await fetchPage(profileUrl), Date.now());
  const parsed = ProfileStatsSchema.safeParse(read);
  if (read === null || !parsed.success) {
    throw new Error(NO_PROFILE_TABLE_ERROR);
  }
  setFeatureState(PROFILE_STATE_ID, parsed.data);
  return parsed.data;
}
