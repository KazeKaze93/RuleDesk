/**
 * A way to open the settings page at one of its blocks: the caller names the
 * block before going to the page, and the page takes the name when it is
 * drawn, unfolds that block and scrolls to it. The name is kept for the tab
 * only and is used once.
 *
 * The settings page has one address; a block has none of its own.
 */

const FOCUS_KEY = "ruledesk-web.settings-focus";

/** The id of the Favorites block of the settings page. */
export const SETTINGS_SECTION_FAVORITES = "favorites";

export function requestSettingsSection(id: string): void {
  try {
    window.sessionStorage.setItem(FOCUS_KEY, id);
  } catch {
    // Without session storage the page opens at its top, as before.
  }
}

/** The block asked for, or null; asking again gives null. */
export function takeSettingsSection(): string | null {
  try {
    const id = window.sessionStorage.getItem(FOCUS_KEY);
    window.sessionStorage.removeItem(FOCUS_KEY);
    return id;
  } catch {
    return null;
  }
}
