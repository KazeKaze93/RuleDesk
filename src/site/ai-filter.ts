import {
  SITE_AI_FILTER_COOKIE_HIDE,
  SITE_AI_FILTER_COOKIE_MAX_AGE_DAYS,
  SITE_AI_FILTER_COOKIE_NAME,
  SITE_AI_FILTER_COOKIE_PATH,
  SITE_AI_FILTER_COOKIE_SHOW,
} from "../config/constants";

/**
 * The site's switch for AI posts.
 *
 * The site keeps it in the cookie `filter_ai` (`1` hidden, `0` shown) and the
 * server leaves AI posts out of a list itself, so the pages stay full. Its own
 * checkbox writes the cookie and reloads the page. The script writes the same
 * cookie, with Kaze's consent (17.11.2026): it is the third cookie the script
 * touches, after `tag_blacklist` and `theme`, and the only way to hide AI
 * posts in one part of the site and show them in another.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COOKIE_PAIR_SEPARATOR = ";";
const COOKIE_NAME_VALUE_SEPARATOR = "=";

/** True when the site hides AI posts now, false when it shows them, null when it was never set. */
export function readSiteAiFilter(): boolean | null {
  const prefix = `${SITE_AI_FILTER_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}`;
  for (const pair of document.cookie.split(COOKIE_PAIR_SEPARATOR)) {
    const trimmed = pair.trim();
    if (!trimmed.startsWith(prefix)) {
      continue;
    }
    const value = trimmed.slice(prefix.length);
    if (value === SITE_AI_FILTER_COOKIE_HIDE) {
      return true;
    }
    if (value === SITE_AI_FILTER_COOKIE_SHOW) {
      return false;
    }
  }
  return null;
}

/** Tells the site to hide or to show AI posts from the next request on. */
export function writeSiteAiFilter(hide: boolean): void {
  const expires = new Date(Date.now() + SITE_AI_FILTER_COOKIE_MAX_AGE_DAYS * MS_PER_DAY);
  const value = hide ? SITE_AI_FILTER_COOKIE_HIDE : SITE_AI_FILTER_COOKIE_SHOW;
  document.cookie = [
    `${SITE_AI_FILTER_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}${value}`,
    `expires=${expires.toUTCString()}`,
    `path=${SITE_AI_FILTER_COOKIE_PATH}`,
  ].join("; ");
}
