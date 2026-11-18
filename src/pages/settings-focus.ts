import { RDW_HASH_SETTINGS } from "./constants";

/**
 * The settings page is opened at one of its sections. A section has an
 * address of its own, "#rdw/settings/video" (the designer, 19.11.2026), and
 * that is how the script's own links lead to it. The older way is kept for a
 * link that has only the address of the page: the caller names the section
 * before going there, and the page takes the name once when it is drawn.
 */

const FOCUS_KEY = "ruledesk-web.settings-focus";

/** The id of the Favorites block of the settings page. */
export const SETTINGS_SECTION_FAVORITES = "favorites";
/** The id of the AI posts section of the settings page. */
export const SETTINGS_SECTION_AI = "ai";

/** "#rdw/settings/video" */
export function settingsSectionHash(id: string): string {
  return `${RDW_HASH_SETTINGS}/${encodeURIComponent(id)}`;
}

/** The section an address of the settings page names, or null when it names none. */
export function settingsSectionFromHash(hash: string): string | null {
  const prefix = `${RDW_HASH_SETTINGS}/`;
  if (!hash.startsWith(prefix)) {
    return null;
  }
  const raw = hash.slice(prefix.length).split("/")[0] ?? "";
  if (raw.length === 0) {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

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

/** Opens the settings page at one of its blocks. */
export function openSettingsAt(id: string): void {
  window.location.hash = settingsSectionHash(id);
}
