/**
 * The id of the user whose favorites the menu item "Favorites" opens, kept in
 * the site's localStorage so that the menu can be built before the first paint.
 *
 * The site's own "My Favorites" link carries the id, but not every page of the
 * site has that link (Comments has none: seen on the site, 21.11.2026). There
 * the item was put in only after the paint, from the id kept with the
 * favorites sync, and pushed the items after it to the right.
 *
 * The id is not read from the site's cookies. It is the one the script took
 * from the site's menu link or from the address of the favorites page, and
 * keeps with the favorites sync as well.
 */

export const FAVORITES_USER_KEY = "ruledesk-web.favorites-user";
const POSITIVE_INT = /^[1-9]\d*$/;

/** The kept id as text, or null when none is kept or it is not a number. */
export function readFavoritesUser(): string | null {
  try {
    const raw = window.localStorage.getItem(FAVORITES_USER_KEY);
    return raw !== null && POSITIVE_INT.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function rememberFavoritesUser(userId: number): void {
  if (!Number.isInteger(userId) || userId <= 0) {
    return;
  }
  try {
    const text = String(userId);
    if (window.localStorage.getItem(FAVORITES_USER_KEY) !== text) {
      window.localStorage.setItem(FAVORITES_USER_KEY, text);
    }
  } catch {
    // No storage: the item comes after the paint, as before.
  }
}
